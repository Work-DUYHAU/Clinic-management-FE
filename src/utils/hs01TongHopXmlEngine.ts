import * as XLSX from "xlsx";
import type {
  Hs01TongHopItem,
  ParseHs01ExcelResult,
  SendHs01GatewayResult,
} from "../types/hs01TongHopTypes";
import { sendBhxhHoSo01WithBackend } from "../services/api";
import {
  HS01_SCHEMA_FIELDS,
  HS01_FIELD_HEURISTICS,
  HS01_EXCEL_TEMPLATE_HEADERS,
  HS01_EXCEL_TEMPLATE_COLS,
  HS01_EXCEL_TEMPLATE_SAMPLES,
} from "./constants/hs01TongHopConstants";
import {
  createSchemaKeyMatcher,
  parseYmdHmDate,
  isValidYmdHmDate,
  formatCurrencyDecimals,
  readExcelFile,
  pickBestSheetName,
  detectHeaderRow,
  generateUUID,
  xmlToBase64,
  downloadXmlFile,
  getThoiGianTiepNhan,
  DEFAULT_MA_CSKCB,
  DEFAULT_MA_TINH,
} from "./shared/excelXmlShared";
import { validateHs01Data } from "./validators/hs01Validator";
import {
  parseHs01Row,
  renderHs01ItemXml,
} from "./parsers/hs01TongHopRowParser";
import type { SmartCaSignatureResult } from "../types/smartcaTypes";

export {
  xmlToBase64,
  downloadXmlFile,
  parseYmdHmDate,
  isValidYmdHmDate,
  formatCurrencyDecimals,
  validateHs01Data,
};

export const matchHs01SchemaKey = createSchemaKeyMatcher(
  HS01_SCHEMA_FIELDS,
  HS01_FIELD_HEURISTICS,
);

export function parseHs01Worksheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string,
  availableSheets: string[],
  fileName: string,
  workbook?: XLSX.WorkBook,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): ParseHs01ExcelResult {
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
      missingRequiredFields: HS01_SCHEMA_FIELDS.filter((f) => f.required).map(
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
    matchHs01SchemaKey,
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
        const key = matchHs01SchemaKey(String(cell ?? "").trim());
        if (key && !Object.values(effectiveColMapping).includes(key)) {
          effectiveColMapping[idx] = key;
        }
      });
    }
  }

  const detectedHeaders = effectiveColMapping;
  const matchedFieldKeys = new Set(Object.values(effectiveColMapping));
  const missingRequiredFields = HS01_SCHEMA_FIELDS.filter(
    (f) => f.required && !matchedFieldKeys.has(f.key),
  ).map((f) => f.key);

  const items: Hs01TongHopItem[] = [];
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

    const item = parseHs01Row(rowObj, r, items.length + 1, defaultMaCskcb);

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

export function parseHs01AllSheets(
  workbook: XLSX.WorkBook,
  fileName: string,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): ParseHs01ExcelResult {
  const availableSheets = workbook.SheetNames || [];
  const combinedItems: Hs01TongHopItem[] = [];
  let combinedValid = 0;
  let combinedInvalid = 0;
  let masterDetectedHeaders: { [colIdx: number]: string } = {};

  availableSheets.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;
    const res = parseHs01Worksheet(
      ws,
      sheetName,
      availableSheets,
      fileName,
      workbook,
      defaultMaCskcb,
    );

    if (res.items.length > 0) {
      if (Object.keys(masterDetectedHeaders).length === 0) {
        masterDetectedHeaders = res.detectedHeaders;
      }
      res.items.forEach((item) => {
        // Cập nhật lại stt nối tiếp liên tục
        combinedItems.push({
          ...item,
          id: `${sheetName}-${item.id}`,
          stt: combinedItems.length + 1,
        });
        if (item.isValid) combinedValid++;
        else combinedInvalid++;
      });
    }
  });

  const matchedKeys = new Set(Object.values(masterDetectedHeaders));
  const missingRequired = HS01_SCHEMA_FIELDS.filter(
    (f) => f.required && !matchedKeys.has(f.key),
  ).map((f) => f.key);

  return {
    items: combinedItems,
    totalRows: combinedItems.length,
    validRows: combinedValid,
    invalidRows: combinedInvalid,
    detectedHeaders: masterDetectedHeaders,
    missingRequiredFields: missingRequired,
    availableSheets,
    selectedSheet: "__ALL__",
    fileName,
    workbook,
  };
}

export function parseHs01XmlText(
  xmlText: string,
  fileName: string,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): ParseHs01ExcelResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      "Tệp XML không hợp lệ hoặc cấu trúc bị lỗi: " +
        parserError.textContent?.slice(0, 100),
    );
  }

  const isBhxhXml =
    xmlDoc.querySelector("HSTH01BH") ||
    xmlDoc.querySelector("CHITIET_HS01BH") ||
    xmlDoc.querySelector("DS_CHITIET") ||
    xmlDoc.querySelector("HO_TEN") ||
    xmlDoc.querySelector("MA_THE_BHYT");

  if (!isBhxhXml) {
    if (
      xmlDoc.querySelector("Canvas") ||
      xmlDoc.querySelector("PolyLine") ||
      xmlDoc.querySelector("Path")
    ) {
      throw new Error(
        "Tệp bạn nạp là tệp đồ họa trang in/bản vẽ (XAML/XPS Canvas), không phải tệp dữ liệu chi phí KCB của BHXH. Vui lòng nạp tệp Excel mẫu hoặc tệp XML dữ liệu chuẩn chứa thẻ <CHITIET_HS01BH>.",
      );
    }
    throw new Error(
      "Tệp XML không đúng định dạng Hồ sơ 01/BH (thiếu thẻ <HSTH01BH> hoặc <CHITIET_HS01BH>).",
    );
  }

  let detailNodes = Array.from(xmlDoc.querySelectorAll("CHITIET_HS01BH"));
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
      `Không tìm thấy bản ghi hồ sơ <CHITIET_HS01BH> nào trong tệp XML [${fileName}]!`,
    );
  }

  const items: Hs01TongHopItem[] = [];
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

    const item = parseHs01Row(rowObj, idx, idx + 1, defaultMaCskcb);
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
  const missingRequiredFields = HS01_SCHEMA_FIELDS.filter(
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

export async function parseHs01ExcelFile(
  file: File,
  selectedSheetName?: string,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): Promise<ParseHs01ExcelResult> {
  // 1. Kiểm tra nếu là file XML
  const isXml =
    file.name.toLowerCase().endsWith(".xml") ||
    file.type === "application/xml" ||
    file.type === "text/xml";

  if (isXml) {
    const text = await file.text();
    return parseHs01XmlText(text, file.name, defaultMaCskcb);
  }

  // Dự phòng: Kiểm tra nội dung text đầu nếu file XML bị lưu nhầm không có đuôi
  try {
    const sample = await file.slice(0, 300).text();
    if (sample.includes("<?xml") || sample.includes("<HSTH01BH")) {
      const text = await file.text();
      return parseHs01XmlText(text, file.name, defaultMaCskcb);
    }
  } catch {
    // Tiếp tục xử lý Excel bình thường
  }

  // 2. Xử lý tệp Excel (.xlsx, .xls)
  const workbook = await readExcelFile(file);
  const availableSheets = workbook.SheetNames;

  if (selectedSheetName === "__ALL__") {
    return parseHs01AllSheets(workbook, file.name, defaultMaCskcb);
  }

  const hintKeywords = ["HSTH01", "01BH", "TongHop", "Mẫu 01", "Hồ sơ"];

  let sheetName = selectedSheetName;
  if (!sheetName || !availableSheets.includes(sheetName)) {
    sheetName = pickBestSheetName(workbook, matchHs01SchemaKey, hintKeywords);
  }

  const worksheet = workbook.Sheets[sheetName];
  return parseHs01Worksheet(
    worksheet,
    sheetName,
    availableSheets,
    file.name,
    workbook,
    defaultMaCskcb,
  );
}

export function generateHs01Xml(
  items: Hs01TongHopItem[],
  maCskcb = DEFAULT_MA_CSKCB,
): string {
  const containerGuid = `Id-${generateUUID()}`;
  const rowsXml = items
    .map((item) => renderHs01ItemXml(item, maCskcb))
    .join("");

  const datasetXml = `<DS_CHITIET Id="${containerGuid}">${rowsXml}</DS_CHITIET>`;
  const signatureXml = `<CHUKYDONVI></CHUKYDONVI>`;

  return `<?xml version="1.0" encoding="utf-8"?><HSTH01BH xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${datasetXml}${signatureXml}</HSTH01BH>`;
}

export function downloadHs01XmlFile(
  items: Hs01TongHopItem[],
  maCskcb = DEFAULT_MA_CSKCB,
  customFileName?: string,
): void {
  const xml = generateHs01Xml(items, maCskcb);
  const firstItem = items[0];
  const namQt = firstItem?.namQt || new Date().getFullYear();
  const thangQt = String(
    firstItem?.thangQt || new Date().getMonth() + 1,
  ).padStart(2, "0");
  const kyQT = `${namQt}${thangQt}`;
  const fileName = customFileName || `HSTH01BH_${maCskcb}_${kyQT}.xml`;
  downloadXmlFile(xml, fileName);
}
export function downloadHs01ExcelTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    HS01_EXCEL_TEMPLATE_HEADERS,
    ...HS01_EXCEL_TEMPLATE_SAMPLES,
  ]);
  ws["!cols"] = HS01_EXCEL_TEMPLATE_COLS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HSTH01BH");
  XLSX.writeFile(wb, "Mau_01BH_HoSoTongHop_Chuan_20Cot.xlsx");
}

export async function sendHs01ToBhxhGateway(
  items: Hs01TongHopItem[],
  credentials?: Partial<{
    maCskcb: string;
    username: string;
    passwordHash: string;
    accessToken: string;
    tokenId: string;
    maTinh: string;
    kyQT: string;
  }>,
  signature?: SmartCaSignatureResult,
  customFileBase64?: string,
): Promise<SendHs01GatewayResult> {
  const maCskcb = credentials?.maCskcb || DEFAULT_MA_CSKCB;

  // 1. Trích xuất kỳ quyết toán từ dữ liệu hồ sơ thực tế (NAM_QT & THANG_QT từ file Excel)
  const firstItem = items[0];
  let namQt = firstItem?.namQt;
  let thangQt = firstItem?.thangQt
    ? String(firstItem.thangQt).padStart(2, "0")
    : undefined;

  // 2. Nếu tệp nạp từ XML máy tính, quét trực tiếp thẻ <NAM_QT> và <THANG_QT> trong XML
  if (!namQt || !thangQt) {
    const signedXmlFromSig = (signature as any)?.signedXml;
    let xmlContent = signedXmlFromSig || "";
    if (!xmlContent && customFileBase64) {
      try {
        xmlContent = atob(customFileBase64);
      } catch {
        // bỏ qua
      }
    }
    if (xmlContent) {
      const matchNam = xmlContent.match(/<NAM_QT>(\d{4})<\/NAM_QT>/);
      const matchThang = xmlContent.match(/<THANG_QT>(\d{1,2})<\/THANG_QT>/);
      if (matchNam) namQt = Number(matchNam[1]);
      if (matchThang) thangQt = String(matchThang[1]).padStart(2, "0");
    }
  }

  const finalNamQt = namQt || new Date().getFullYear();
  const finalThangQt =
    thangQt || String(new Date().getMonth() + 1).padStart(2, "0");
  const dataKyQt = `${finalNamQt}${finalThangQt}`;
  const kyQT = credentials?.kyQT || dataKyQt;

  // Ưu tiên tệp XML Base64 đã ký số thực tế để bảo toàn 100% chữ ký điện tử
  const signedXmlFromSig = (signature as any)?.signedXml;
  const base64 = signedXmlFromSig
    ? xmlToBase64(signedXmlFromSig)
    : customFileBase64 || xmlToBase64(generateHs01Xml(items, maCskcb));

  // 1. ƯU TIÊN: Gửi qua Backend API (Server-side Cổng BHXH, bảo mật token & xử lý retry tập trung)
  try {
    const beRes = await sendBhxhHoSo01WithBackend({
      fileBase64Str: base64,
      loaiHs: "5",
      kyQT,
      maCskcb,
      maTinh: credentials?.maTinh || DEFAULT_MA_TINH,
      tranId: signature?.tranId,
    });

    const isOk =
      String(beRes.maKetQua) === "200" ||
      String(beRes.maKetQua) === "0" ||
      beRes.success;

    return {
      maKetQua: String(beRes.maKetQua || (isOk ? "200" : "500")),
      maGiaoDich:
        beRes.maGiaoDich ||
        (isOk
          ? `HS01BH_${maCskcb}_${kyQT}_${Date.now().toString().slice(-6)}`
          : ""),
      thongDiep:
        beRes.thongDiep ||
        beRes.ghiChu ||
        (isOk
          ? `Tiếp nhận thành công ${items.length} hồ sơ tổng hợp Mẫu 01/BH (Kỳ QT: ${finalThangQt}/${finalNamQt}) lên Cổng BHXH qua Backend` +
            (signature ? ` (đã ký số SmartCA)` : "")
          : `Cổng BHXH phản hồi mã: ${beRes.maKetQua}`),
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      kyQT,
      loaiHs: "5",
    };
  } catch (backendErr: unknown) {
    const errorMsg =
      backendErr instanceof Error
        ? backendErr.message
        : "Không thể kết nối đến máy chủ Backend hoặc Cổng BHXH";
    console.error("[HS01] Lỗi gửi hồ sơ qua Backend:", backendErr);
    return {
      maKetQua: "500",
      maGiaoDich: "",
      thongDiep: `Lỗi kết nối Backend: ${errorMsg}`,
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      kyQT,
      loaiHs: "5",
    };
  }
}
