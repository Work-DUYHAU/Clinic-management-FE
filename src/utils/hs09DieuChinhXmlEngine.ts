import * as XLSX from "xlsx";
import {
  BhxhChungTuService,
  BHXH_CONFIG,
} from "../services/bhxh/bhxhChungTuService";
import type {
  HoSoDieuChinh09Item,
  ParseHs09ExcelResult,
  SendHs09GatewayResult,
  Hs09GatewayCredentials,
} from "../types/hs09DieuChinhTypes";
import {
  HS09_SCHEMA_FIELDS,
  HS09_FIELD_HEURISTICS,
  HS09_EXCEL_TEMPLATE_HEADERS,
  HS09_EXCEL_TEMPLATE_COLS,
  HS09_EXCEL_TEMPLATE_SAMPLES,
} from "./constants/hs09DieuChinhConstants";
import {
  createSchemaKeyMatcher,
  readExcelFile,
  pickBestSheetName,
  detectHeaderRow,
  buildSignatureBlock,
  xmlToBase64,
  downloadXmlFile,
  getThoiGianTiepNhan,
  getTodayYmd,
  DEFAULT_MA_CSKCB,
} from "./shared/excelXmlShared";
import { parseHs09Row, renderHs09ItemXml } from "./parsers/hs09RowParser";
import type { SmartCaSignatureResult } from "../types/smartcaTypes";

export { xmlToBase64, downloadXmlFile };

/**
 * Phân loại kịch bản sinh XML của một hồ sơ 09/BH theo QD 326:
 * - DCHanhChinh_Only: chỉ có danh sách XML1 điều chỉnh (hành chính)
 * - DCChiPhi_Only: chỉ có danh sách chi phí điều chỉnh
 * - DC_Mixed: có cả hai danh sách
 * - ThuHoi_Hoac_XinYK: cả hai rỗng → thu hồi (TRANGTHAI=1) hoặc xin ý kiến (TRANGTHAI=4)
 */
export function detectScenario(
  item: HoSoDieuChinh09Item,
): 'DCHanhChinh_Only' | 'DCChiPhi_Only' | 'DC_Mixed' | 'ThuHoi_Hoac_XinYK' {
  const hasXml1 = (item.dsXml1DieuChinh?.length ?? 0) > 0;
  const hasCp = (item.dsChiPhiDieuChinh?.length ?? 0) > 0;
  if (hasXml1 && hasCp) return 'DC_Mixed';
  if (hasXml1) return 'DCHanhChinh_Only';
  if (hasCp) return 'DCChiPhi_Only';
  return 'ThuHoi_Hoac_XinYK';
}

export const matchHs09SchemaKey = createSchemaKeyMatcher(
  HS09_SCHEMA_FIELDS,
  HS09_FIELD_HEURISTICS,
);

/**
 * Parse một sheet Excel thành danh sách HoSoDieuChinh09Item
 */
export function parseHs09Worksheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string,
  availableSheets: string[],
  fileName: string,
  workbook?: XLSX.WorkBook,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): ParseHs09ExcelResult {
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (!rawRows || rawRows.length === 0) {
    return {
      items: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedHeaders: {},
      missingRequiredFields: HS09_SCHEMA_FIELDS.filter((f) => f.required).map(
        (f) => f.key,
      ),
      availableSheets,
      selectedSheet: sheetName,
      fileName,
      workbook,
    };
  }

  const { headerRowIndex, colMapping } = detectHeaderRow(
    rawRows,
    matchHs09SchemaKey,
    3,
    25,
    "best",
  );

  let effectiveHeaderRow = headerRowIndex;
  const effectiveColMapping: { [colIdx: number]: string } = { ...colMapping };

  if (effectiveHeaderRow === -1 && rawRows.length > 0) {
    effectiveHeaderRow = 0;
    const row0 = rawRows[0];

    if (Array.isArray(row0)) {
      row0.forEach((cell, idx) => {
        const key = matchHs09SchemaKey(String(cell ?? "").trim());
        if (key && !Object.values(effectiveColMapping).includes(key)) {
          effectiveColMapping[idx] = key;
        }
      });
    }
  }

  const detectedHeaders = effectiveColMapping;

  const matchedFieldKeys = new Set(Object.values(effectiveColMapping));
  const missingRequiredFields = HS09_SCHEMA_FIELDS.filter(
    (f) => f.required && !matchedFieldKeys.has(f.key),
  ).map((f) => f.key);

  const items: HoSoDieuChinh09Item[] = [];
  let validRows = 0;
  let invalidRows = 0;

  for (let r = effectiveHeaderRow + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (
      !Array.isArray(row) ||
      row.every((c) => c === "" || c === null || c === undefined)
    ) {
      continue;
    }

    const rowObj: Record<string, unknown> = {};
    Object.entries(effectiveColMapping).forEach(([colIdx, key]) => {
      rowObj[key] = row[Number(colIdx)];
    });

    const item = parseHs09Row(rowObj, r, items.length + 1, defaultMaCskcb);

    if (!item) {
      continue;
    }

    if (item.isValid) {
      validRows++;
    } else {
      invalidRows++;
    }

    items.push(item);
  }

  return {
    items,
    totalRows: items.length,
    validRows,
    invalidRows,
    detectedHeaders,
    missingRequiredFields,
    availableSheets,
    selectedSheet: sheetName,
    fileName,
    workbook,
  };
}

/**
 * Đọc file Excel tải đúng sheet nếu trong file nhiều sheet
 */
/**
 * Parse trực tiếp tệp XML Mẫu 09/BH (<HOSO_DIEUCHINH_GD>) thành danh sách HoSoDieuChinh09Item
 */
export function parseHs09XmlText(
  xmlText: string,
  fileName: string,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): ParseHs09ExcelResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      "Tệp XML không hợp lệ hoặc cấu trúc bị lỗi: " +
        parserError.textContent?.slice(0, 100),
    );
  }

  let detailNodes = Array.from(xmlDoc.querySelectorAll("CHITIET_HSDC09"));
  if (detailNodes.length === 0) {
    detailNodes = Array.from(xmlDoc.querySelectorAll("DS_CHITIET > *"));
  }
  if (detailNodes.length === 0) {
    const root = xmlDoc.firstElementChild;
    if (root) {
      detailNodes = Array.from(root.children).filter(
        (c) =>
          !["CHUKYDONVI", "SIGNATURE", "DS_CHITIET"].includes(
            c.tagName.toUpperCase(),
          ),
      );
    }
  }

  if (detailNodes.length === 0) {
    throw new Error(
      `Không tìm thấy bản ghi hồ sơ <CHITIET_HSDC09> nào trong tệp XML [${fileName}]!`,
    );
  }

  const items: HoSoDieuChinh09Item[] = [];
  let validRows = 0;
  let invalidRows = 0;
  const detectedHeaders: { [colIdx: number]: string } = {};

  detailNodes.forEach((node, idx) => {
    const rowObj: Record<string, unknown> = {};
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const tagUpper = child.tagName.toUpperCase();
      rowObj[tagUpper] = child.textContent?.trim() || "";
      if (idx === 0) {
        detectedHeaders[i] = tagUpper;
      }
    }

    const item = parseHs09Row(rowObj, idx, idx + 1, defaultMaCskcb);
    if (item) {
      if (item.isValid) {
        validRows++;
      } else {
        invalidRows++;
      }
      items.push(item);
    }
  });

  const matchedFieldKeys = new Set(Object.values(detectedHeaders));
  const missingRequiredFields = HS09_SCHEMA_FIELDS.filter(
    (f) => f.required && !matchedFieldKeys.has(f.key),
  ).map((f) => f.key);

  return {
    items,
    totalRows: items.length,
    validRows,
    invalidRows,
    detectedHeaders,
    missingRequiredFields,
    availableSheets: ["Dữ liệu XML"],
    selectedSheet: "Tệp XML (" + fileName + ")",
    fileName,
  };
}

/**
 * Đọc file Excel hoặc XML Hồ sơ điều chỉnh Mẫu 09/BH
 */
export async function parseHs09ExcelFile(
  file: File,
  selectedSheetName?: string,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): Promise<ParseHs09ExcelResult> {
  // 1. Kiểm tra nếu là file XML
  const isXml =
    file.name.toLowerCase().endsWith(".xml") ||
    file.type === "application/xml" ||
    file.type === "text/xml";

  if (isXml) {
    const text = await file.text();
    return parseHs09XmlText(text, file.name, defaultMaCskcb);
  }

  try {
    const sample = await file.slice(0, 300).text();
    if (sample.includes("<?xml") || sample.includes("<HOSO_DIEUCHINH")) {
      const text = await file.text();
      return parseHs09XmlText(text, file.name, defaultMaCskcb);
    }
  } catch {
    // Tiếp tục đọc Excel
  }

  // 2. Đọc file Excel (.xlsx, .xls)
  const workbook = await readExcelFile(file);
  const availableSheets = workbook.SheetNames;

  const hintKeywords = [
    "HSDC09",
    "09BH",
    "DieuChinh",
    "XuatToan",
    "Mẫu 09",
    "HS09",
  ];

  let sheetName = selectedSheetName;
  if (!sheetName || !availableSheets.includes(sheetName)) {
    sheetName = pickBestSheetName(workbook, matchHs09SchemaKey, hintKeywords);
  }

  const worksheet = workbook.Sheets[sheetName];
  return parseHs09Worksheet(
    worksheet,
    sheetName,
    availableSheets,
    file.name,
    workbook,
    defaultMaCskcb,
  );
}

/**
 * Sinh cấu trúc XML chuẩn <HOSO_DIEUCHINH_GD> cho Mẫu 09/BH (Loại HS 73)
 */
export function generateHs09Xml(
  items: HoSoDieuChinh09Item[],
  maCskcb = DEFAULT_MA_CSKCB,
): string {
  const recordsXml = items
    .map((item) => renderHs09ItemXml(item, maCskcb))
    .join("");

  const signatureXml = buildSignatureBlock();

  return `<?xml version="1.0" encoding="utf-8"?><HOSO_DIEUCHINH_GD xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${recordsXml}${signatureXml}</HOSO_DIEUCHINH_GD>`;
}

/**
 * Tạo Base64 từ danh sách HoSoDieuChinh09Item
 */
export function generateHs09Base64(
  items: HoSoDieuChinh09Item[],
  maCskcb = DEFAULT_MA_CSKCB,
): string {
  const xml = generateHs09Xml(items, maCskcb);
  return xmlToBase64(xml);
}

/**
 * Tải file XML Mẫu 09/BH xuống máy
 */
export function downloadHs09XmlFile(
  itemsOrXml: HoSoDieuChinh09Item[] | string,
  maCskcb = DEFAULT_MA_CSKCB,
  customFileName?: string,
): void {
  const xml =
    typeof itemsOrXml === "string"
      ? itemsOrXml
      : generateHs09Xml(itemsOrXml, maCskcb);
  const fileName =
    customFileName ||
    `HSDC09BH_${maCskcb}_${getTodayYmd()}_${Date.now().toString().slice(-4)}.xml`;
  downloadXmlFile(xml, fileName);
}

/**
 * Tạo & Tải file Excel Mẫu 09/BH chuẩn 22 cột
 */
export function downloadHs09ExcelTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    HS09_EXCEL_TEMPLATE_HEADERS,
    ...HS09_EXCEL_TEMPLATE_SAMPLES,
  ]);
  ws["!cols"] = HS09_EXCEL_TEMPLATE_COLS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HSDC09BH");
  XLSX.writeFile(wb, "Mau_09BH_HoSoDieuChinh_Chuan_22Cot.xlsx");
}

export async function sendHs09ToBhxhGateway(
  items: HoSoDieuChinh09Item[],
  credentials?: Partial<Hs09GatewayCredentials>,
  signature?: SmartCaSignatureResult,
  customFileBase64?: string,
): Promise<SendHs09GatewayResult> {
  const maCskcb =
    credentials?.maCskcb || items[0]?.ttMau?.maCskcb || DEFAULT_MA_CSKCB;

  const tokenRes = await BhxhChungTuService.takeToken();
  const token = tokenRes.apiToken || tokenRes.APIKey?.access_token;
  if (String(tokenRes.maKetQua) !== "200" || !token) {
    return {
      maKetQua: String(tokenRes.maKetQua || "401"),
      maGiaoDich: "",
      thongDiep:
        tokenRes.thongDiep ||
        tokenRes.message ||
        "Chưa cấu hình tài khoản kết nối Cổng BHXH hoặc lỗi xác thực Token",
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      loaiHs: "73",
    };
  }

  try {
    // Ưu tiên tệp XML Base64 đã ký số thực tế để bảo toàn 100% chữ ký điện tử
    const signedXmlFromSig = (signature as any)?.signedXml;
    const base64 =
      signedXmlFromSig
        ? xmlToBase64(signedXmlFromSig)
        : customFileBase64 || xmlToBase64(generateHs09Xml(items, maCskcb));

    // Trích xuất kỳ quyết toán kyQT (yêu cầu định dạng AAAAMM: YYYYMM, năm từ 2000, tháng 01-12)
    let rawKyQt = items[0]?.ttXml1?.kyQt?.trim() || "";
    if (!rawKyQt && signedXmlFromSig) {
      const match = signedXmlFromSig.match(/<KY_QT>([^<]+)<\/KY_QT>/i);
      if (match) rawKyQt = match[1].trim();
    }
    if (!rawKyQt && customFileBase64) {
      try {
        const decoded = atob(customFileBase64);
        const match = decoded.match(/<KY_QT>([^<]+)<\/KY_QT>/i);
        if (match) rawKyQt = match[1].trim();
      } catch {
        // Ignore decode error
      }
    }

    let finalKyQt = rawKyQt.replace(/[^0-9]/g, "");
    if (finalKyQt.length === 6) {
      const first2 = Number(finalKyQt.slice(0, 2));
      const last4 = Number(finalKyQt.slice(2));
      // Nếu dạng MMYYYY -> đảo về YYYYMM
      if (first2 >= 1 && first2 <= 12 && last4 >= 2000) {
        finalKyQt = `${last4}${String(first2).padStart(2, "0")}`;
      }
    } else {
      // Mặc định tháng năm hiện tại nếu không tìm thấy
      finalKyQt = getTodayYmd().slice(0, 6);
    }

    // Form-Data Payload chuẩn 4 trường theo Mục IX QĐ 326 (Thông tư 12/2026/TT-BTC)
    const params = new URLSearchParams();
    params.append("username", BHXH_CONFIG.USERNAME || `${maCskcb}_BV`);
    params.append("loaiHs", "73");
    params.append("maCskcb", maCskcb);
    params.append("fileHsBase64", base64);

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      accessToken: token,
      tokenId: tokenRes.idToken || tokenRes.APIKey?.id_token || "",
      passwordHash: tokenRes.passwordHash || "",
    };

    const baseUrl = BhxhChungTuService.getBaseUrl();
    const url = `${baseUrl}${BHXH_CONFIG.ENDPOINTS.GUI_HO_SO_DIEU_CHINH_09BH}`;

    // Retry logic: tối đa 3 lần với exponential backoff
    let response: Response | null = null;
    let lastFetchError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await BhxhChungTuService.fetchGateway(url, {
          method: "POST",
          headers,
          body: params.toString(),
        });
        if (response) break;
      } catch (e) {
        lastFetchError = e;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!response) {
      throw (
        lastFetchError ||
        new Error("Không thể kết nối đến máy chủ Cổng BHXH sau 3 lần thử")
      );
    }

    let data: any = {};
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        maKetQua: String(response.status),
        thongDiep:
          text.slice(0, 150) || `Máy chủ Cổng BHXH phản hồi HTTP ${response.status}`,
      };
    }
    const isOk =
      String(data.maKetQua ?? (response.ok ? "200" : "500")) === "200";

    const result: SendHs09GatewayResult = {
      maKetQua: String(data.maKetQua ?? (response.ok ? "200" : "500")),
      maGiaoDich:
        data.maGiaoDich ||
        (isOk
          ? `HSDC09BH_${maCskcb}_${finalKyQt}_${Date.now().toString().slice(-6)}`
          : ""),
      thongDiep:
        data.thongDiep ||
        data.ghiChu ||
        (isOk
          ? `Tiếp nhận thành công ${items.length} hồ sơ điều chỉnh Mẫu 09/BH (Kỳ QT: ${finalKyQt.slice(4)}/${finalKyQt.slice(0, 4)}) vào Hệ thống Giám định BHYT`
          : `Cổng BHXH phản hồi mã kết quả: ${data.maKetQua ?? response.status}`),
      thoiGianTiepNhan: data.thoiGianTiepNhan || getThoiGianTiepNhan(),
      totalRecords: items.length,
      loaiHs: "73",
      kyQT: data.kyQT || finalKyQt,
    };

    // Audit log giao dịch vào localStorage
    try {
      const auditEntry = {
        id: `audit-hs09-${Date.now()}`,
        timestamp: new Date().toISOString(),
        loaiHs: "73",
        maCskcb,
        maGiaoDich: result.maGiaoDich,
        maKetQua: result.maKetQua,
        thongDiep: result.thongDiep,
        totalRecords: items.length,
        kyQT: finalKyQt,
      };
      const savedLogs = JSON.parse(
        localStorage.getItem("BHXH_GATEWAY_AUDIT_LOGS") || "[]",
      );
      savedLogs.unshift(auditEntry);
      localStorage.setItem(
        "BHXH_GATEWAY_AUDIT_LOGS",
        JSON.stringify(savedLogs.slice(0, 100)),
      );
    } catch {
      // Ignore localStorage error
    }

    return result;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Lỗi kết nối Cổng BHXH";
    return {
      maKetQua: "500",
      maGiaoDich: "",
      thongDiep: errorMsg,
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      loaiHs: "73",
    };
  }
}
