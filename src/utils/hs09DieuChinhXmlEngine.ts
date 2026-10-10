import * as XLSX from "xlsx";
import {
  BhxhChungTuService,
  BHXH_CONFIG,
} from "../services/bhxh/bhxhChungTuService";
import type {
  HoSoDieuChinh09Item,
  ParseHs09ExcelResult,
  SendHs09GatewayResult,
  SendHs09BatchItemResult,
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
import {
  parseHs09Row,
  parseHs09XmlRecord,
  renderHs09ItemXml,
} from "./parsers/hs09RowParser";
import { detectScenario } from "./hs09Scenario";
import type { SmartCaSignatureResult } from "../types/smartcaTypes";
import { extractXmlSignature, injectSignatureToXml } from "./xmlDsigEngine";
import { signAutoQ2 } from "../services/smartca/q2/smartcaQ2Handlers";
import { SMARTCA_TOTP_SECRET } from "../services/smartca/smartcaConfig";

export { xmlToBase64, downloadXmlFile };
export { detectScenario };
export const matchHs09SchemaKey = createSchemaKeyMatcher(
  HS09_SCHEMA_FIELDS,
  HS09_FIELD_HEURISTICS,
);

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
export function sanitizeXmlString(rawXml: string): string {
  if (!rawXml) return "";
  let xml = rawXml.replace(/^\uFEFF/, "").trim();

  // Kiểm tra gói truyền nhận có <NOIDUNGFILE> Base64
  const noidungMatch = xml.match(/<NOIDUNGFILE>([\s\S]*?)<\/NOIDUNGFILE>/i);
  if (noidungMatch && noidungMatch[1]) {
    try {
      const base64Clean = noidungMatch[1].replace(/\s+/g, "");
      const decoded = atob(base64Clean);
      if (decoded && (decoded.includes("<") || decoded.includes("<?xml"))) {
        xml = decoded.replace(/^\uFEFF/, "").trim();
      }
    } catch {
      // nếu không decode được thì giữ nguyên
    }
  }

  // Khắc phục lỗi encoding windows-1258 làm crash DOMParser
  xml = xml.replace(/encoding=["'][^"']*["']/i, 'encoding="utf-8"');

  // Fix unescaped '&' trong XML content (chỉ escape những '&' không phải là entity hợp lệ)
  xml = xml.replace(
    /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g,
    "&amp;",
  );

  return xml;
}
export function parseHs09XmlText(
  rawXmlText: string,
  fileName: string,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): ParseHs09ExcelResult {
  const xmlText = sanitizeXmlString(rawXmlText);

  // Kiểm tra chữ ký số có trong tài liệu
  const sigInfo = extractXmlSignature(xmlText);
  const isSigned = sigInfo.hasSignature;

  const parser = new DOMParser();
  let xmlDoc = parser.parseFromString(xmlText, "application/xml");

  let parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    try {
      const fallbackDoc = parser.parseFromString(xmlText, "text/xml");
      if (!fallbackDoc.querySelector("parsererror")) {
        xmlDoc = fallbackDoc;
        parserError = null;
      }
    } catch {
      // ignore
    }
  }

  if (parserError) {
    throw new Error(
      "Tệp XML không hợp lệ hoặc cấu trúc bị lỗi: " +
        parserError.textContent?.slice(0, 100),
    );
  }

  // 1. Tìm bản ghi có cấu trúc lồng TT12 (TT_HOSO) hoặc các tên thẻ tương đương
  const candidateTags = [
    "TT_HOSO",
    "TTHOSO",
    "HO_SO",
    "HOSO",
    "CHITIET_HSDC09",
    "CHITIET",
    "ROW",
    "BANG_09",
    "BANG09",
  ];
  let officialRecords: Element[] = [];

  for (const tag of candidateTags) {
    const foundNs = Array.from(xmlDoc.getElementsByTagNameNS("*", tag));
    if (foundNs.length > 0) {
      officialRecords = foundNs;
      break;
    }
    const foundTag = Array.from(xmlDoc.getElementsByTagName(tag));
    if (foundTag.length > 0) {
      officialRecords = foundTag;
      break;
    }
  }

  // Nếu tìm thấy theo tên thẻ hồ sơ
  if (officialRecords.length > 0) {
    const items = officialRecords.map((record, idx) =>
      parseHs09XmlRecord(record, idx, defaultMaCskcb, {
        isSigned,
        signedXml: isSigned ? rawXmlText : undefined,
      }),
    );

    const detectedHeaders: { [colIdx: number]: string } = {};
    HS09_SCHEMA_FIELDS.forEach((field, i) => {
      detectedHeaders[i] = field.key;
    });

    return {
      items,
      totalRows: items.length,
      validRows: items.filter((item) => item.isValid).length,
      invalidRows: items.filter((item) => !item.isValid).length,
      detectedHeaders,
      missingRequiredFields: [],
      availableSheets: ["Dữ liệu XML"],
      selectedSheet: `Tệp XML (${fileName})${isSigned ? " [ĐÃ KÝ SỐ]" : ""}`,
      fileName,
    };
  }

  // 2. Fallback: Lấy danh sách con từ DS_CHITIET hoặc root.children
  let detailNodes = Array.from(xmlDoc.querySelectorAll("DS_CHITIET > *"));
  if (detailNodes.length === 0) {
    const root = xmlDoc.firstElementChild;
    if (root) {
      detailNodes = Array.from(root.children).filter((c) => {
        const name = (c.localName || c.tagName || "").toUpperCase();
        return ![
          "CHUKYDONVI",
          "SIGNATURE",
          "DS_CHITIET",
          "THONGTINCHUNGTU",
        ].includes(name);
      });
    }
  }

  if (detailNodes.length === 0) {
    throw new Error(
      `Không tìm thấy bản ghi hồ sơ nào trong tệp XML [${fileName}]! Vui lòng kiểm tra cấu trúc thẻ hồ sơ.`,
    );
  }

  const items: HoSoDieuChinh09Item[] = [];
  let validRows = 0;
  let invalidRows = 0;
  const detectedHeaders: { [colIdx: number]: string } = {};

  detailNodes.forEach((node, idx) => {
    // Kiểm tra xem node con này có lồng TT_XML1 hay không
    const hasNestedXml1 = Array.from(node.children).some(
      (c) => (c.localName || c.tagName || "").toUpperCase() === "TT_XML1",
    );

    if (hasNestedXml1) {
      const item = parseHs09XmlRecord(node, idx, defaultMaCskcb, {
        isSigned,
        signedXml: isSigned ? rawXmlText : undefined,
      });
      if (item) {
        if (item.isValid) validRows++;
        else invalidRows++;
        items.push(item);
      }
    } else {
      // Đọc dạng phẳng (quét đệ quy tất cả các trường hậu duệ)
      const rowObj: Record<string, unknown> = {};
      const allElements = Array.from(node.getElementsByTagName("*"));
      if (allElements.length > 0) {
        allElements.forEach((el) => {
          const tagUpper = (el.localName || el.tagName || "").toUpperCase();
          if (!rowObj[tagUpper] && el.children.length === 0) {
            rowObj[tagUpper] = el.textContent?.trim() || "";
          }
        });
      } else {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const tagUpper = (
            child.localName ||
            child.tagName ||
            ""
          ).toUpperCase();
          rowObj[tagUpper] = child.textContent?.trim() || "";
        }
      }

      if (idx === 0) {
        Object.keys(rowObj).forEach((k, colI) => {
          detectedHeaders[colI] = k;
        });
      }

      const item = parseHs09Row(rowObj, idx, idx + 1, defaultMaCskcb);
      if (item) {
        if (isSigned) {
          item.ttKySo = 2;
          item.trangThai = "da_ky_so";
          item.signedXml = rawXmlText;
        }
        if (item.isValid) {
          validRows++;
        } else {
          invalidRows++;
        }
        items.push(item);
      }
    }
  });

  if (items.length === 0) {
    throw new Error(
      `Không trích xuất được bản ghi hồ sơ hợp lệ nào từ tệp XML [${fileName}]!`,
    );
  }

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
    selectedSheet: `Tệp XML (${fileName})${isSigned ? " [ĐÃ KÝ SỐ]" : ""}`,
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
    const sample = await file.slice(0, 500).text();
    const sampleUpper = sample.toUpperCase();
    if (
      sampleUpper.includes("<?XML") ||
      sampleUpper.includes("<HOSO") ||
      sampleUpper.includes("<GIAMDINH") ||
      sampleUpper.includes("<FILEHOSO") ||
      sampleUpper.includes("<HSCHUNGTU") ||
      sampleUpper.includes("<TT_HOSO")
    ) {
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

export function generateHs09SingleXml(
  item: HoSoDieuChinh09Item,
  maCskcb = DEFAULT_MA_CSKCB,
): string {
  const recordXml = renderHs09ItemXml(item, maCskcb);
  const signatureXml = buildSignatureBlock();

  return `<?xml version="1.0" encoding="utf-8"?><HOSO_DIEUCHINH_GD xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${recordXml}${signatureXml}</HOSO_DIEUCHINH_GD>`;
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

/**
 * Xuất danh sách hồ sơ điều chỉnh Mẫu 09/BH ra file Excel (Mục 9 TT 12/2026/TT-BTC)
 */
export function exportHs09ToExcel(
  items: HoSoDieuChinh09Item[],
  customFileName?: string,
): void {
  const headers = [
    "STT",
    "XML1_ID",
    "Mã liên kết",
    "Mã bệnh nhân",
    "Họ và tên",
    "Mã thẻ BHYT",
    "Ngày vào",
    "Ngày ra",
    "Kỳ quyết toán",
    "Trạng thái yêu cầu",
    "Trạng thái ký số",
    "Kết quả GĐ duyệt",
    "Loại thao tác",
    "Khoa điều trị",
    "Nhóm lỗi",
    "Tiền xuất toán (VNĐ)",
    "Tiền đề nghị lại (VNĐ)",
    "Số mục XML1 điều chỉnh",
    "Số chi phí điều chỉnh",
    "Lý do điều chỉnh chính",
    "Tài liệu chứng minh",
  ];

  const rows = items.map((item, idx) => {
    const trangThaiLabel =
      item.ttXml1.trangThai === 1
        ? "1 - Thu hồi ĐNTT"
        : item.ttXml1.trangThai === 4
          ? "4 - Xin ý kiến cấp có thẩm quyền"
          : "2 - Điều chỉnh dữ liệu gốc";

    const kySoLabel = item.ttKySo === 2 ? "Đã ký số (2)" : "Chưa ký số (0)";
    const gdDuyetLabel =
      item.gdDuyet === 1
        ? "1 - Đang xử lý"
        : item.gdDuyet === 2
          ? "2 - Đã xử lý"
          : "0 - Chưa xử lý";

    const loaiThaoTacLabel =
      item.loaiThaoTac === "tong_hop_moi" ? "Tổng hợp mới" : "Đang thao tác";

    const lyDoChinh =
      item.dsXml1DieuChinh?.[0]?.lyDoDieuChinh ||
      item.dsChiPhiDieuChinh?.[0]?.lyDoDieuChinh ||
      "";

    const filesCount = item.taiLieuDinhKem?.length || 0;

    return [
      idx + 1,
      String(item.ttXml1.xml1Id || ""),
      item.ttXml1.maLk || "",
      item.ttXml1.maBn || "",
      item.ttXml1.hoTen || "",
      item.ttXml1.maThe || "",
      item.ttXml1.ngayVao || "",
      item.ttXml1.ngayRa || "",
      item.ttXml1.kyQt || "",
      trangThaiLabel,
      kySoLabel,
      gdDuyetLabel,
      loaiThaoTacLabel,
      item.khoaDieuTri || "",
      item.nhomLoi || "",
      item.tienXuatToan || 0,
      item.tienDeNghiThanhToanLai || 0,
      item.dsXml1DieuChinh?.length || 0,
      item.dsChiPhiDieuChinh?.length || 0,
      lyDoChinh,
      filesCount > 0 ? `${filesCount} tệp đính kèm` : "Chưa đính kèm",
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DanhSach_HS09_DieuChinh");

  const fileName =
    customFileName ||
    `BangKe_DieuChinh_Mau09BH_${getTodayYmd()}_${Date.now().toString().slice(-4)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function extractSignatureBlockFromXml(xml: string): string | null {
  if (!xml) return null;
  const match = xml.match(/<CHUKYDONVI>([\s\S]*?)<\/CHUKYDONVI>/i);
  if (match && match[1] && match[1].includes("<Signature")) {
    return match[1].trim();
  }
  const sigMatch = xml.match(/<Signature[\s\S]*?<\/Signature>/i);
  if (sigMatch) return sigMatch[0].trim();
  return null;
}

function resolveItemKyQt(
  item: HoSoDieuChinh09Item,
  fallbackKyQt?: string,
): string {
  const rawKyQt = fallbackKyQt?.trim() || item?.ttXml1?.kyQt?.trim() || "";
  let finalKyQt = rawKyQt.replace(/[^0-9]/g, "");
  if (finalKyQt.length === 6) {
    const first2 = Number(finalKyQt.slice(0, 2));
    const last4 = Number(finalKyQt.slice(2));
    if (first2 >= 1 && first2 <= 12 && last4 >= 2000) {
      finalKyQt = `${last4}${String(first2).padStart(2, "0")}`;
    }
    return finalKyQt;
  }
  return getTodayYmd().slice(0, 6);
}

function saveGatewayAuditLog(entry: {
  loaiHs: string;
  maCskcb: string;
  maGiaoDich: string;
  maKetQua: string;
  thongDiep: string;
  totalRecords: number;
  kyQT?: string;
}): void {
  try {
    const auditEntry = {
      id: `audit-hs09-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
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
}

interface SendSingleItemParams {
  item: HoSoDieuChinh09Item;
  maCskcb: string;
  token: string;
  tokenId: string;
  passwordHash: string;
  baseUrl: string;
  isSingleItem?: boolean;
  signatureBlock?: string | null;
  signatureTranId?: string;
  credentialsKyQt?: string;
  maTinh?: string;
  customFileBase64?: string;
  smartCaOptions?: {
    identityValue?: string;
    password?: string;
    totpSecret?: string;
  };
}

async function sendSingleHs09ItemRequest({
  item,
  maCskcb,
  token,
  tokenId,
  passwordHash,
  baseUrl,
  isSingleItem = true,
  signatureBlock,
  signatureTranId,
  credentialsKyQt,
  maTinh,
  customFileBase64,
  smartCaOptions,
}: SendSingleItemParams): Promise<SendHs09BatchItemResult> {
  const finalKyQt = resolveItemKyQt(item, credentialsKyQt);

  // Kiểm tra xem chuỗi XML có đúng chuẩn đơn lẻ 1 TT_HOSO không
  const isSingleValidXml = (xmlStr?: string): boolean => {
    if (!xmlStr) return false;
    const matches = xmlStr.match(/<TT_HOSO[\s>]/gi);
    return matches !== null && matches.length === 1;
  };

  let base64 = "";
  let finalTranId = signatureTranId;
  // 1. Trường hợp gửi 1 hồ sơ duy nhất có customFileBase64 hợp lệ
  if (isSingleItem && customFileBase64) {
    try {
      const decoded = atob(customFileBase64);
      if (isSingleValidXml(decoded)) {
        base64 = customFileBase64;
      }
    } catch {
      // ignore
    }
  }

  // 2. Trường hợp hồ sơ đã có sẵn chữ ký số đơn lẻ hợp lệ
  if (
    !base64 &&
    item.signedXml &&
    isSingleValidXml(item.signedXml) &&
    extractSignatureBlockFromXml(item.signedXml)
  ) {
    base64 = xmlToBase64(item.signedXml);
  }

  // 3. Trường hợp gửi 1 hồ sơ duy nhất và đã có khối chữ ký số hợp lệ từ modal
  if (!base64 && isSingleItem && signatureBlock) {
    let singleXml = generateHs09SingleXml(item, maCskcb);
    singleXml = injectSignatureToXml(singleXml, signatureBlock);
    base64 = xmlToBase64(singleXml);
  }

  // 4. Trường hợp chưa có chữ ký số hợp lệ (đặc biệt là Batch 2-10 records)
  // BẮT BUỘC ký số riêng cho từng hồ sơ đơn lẻ bằng SmartCA Q2 để đảm bảo SHA-256 DigestValue khớp tuyệt đối
  if (!base64) {
    const singleXml = generateHs09SingleXml(item, maCskcb);
    const secretKey = (
      smartCaOptions?.totpSecret ||
      localStorage.getItem("smartca_q2_totp_secret") ||
      SMARTCA_TOTP_SECRET ||
      ""
    ).trim();

    try {
      const signRes = await signAutoQ2({
        rawXml: singleXml,
        fileName: `HSDC09BH_${maCskcb}_${item.ttXml1.maLk}.xml`,
        identityValue: smartCaOptions?.identityValue,
        password: smartCaOptions?.password,
        totpSecret: secretKey,
      });

      if (signRes.success && signRes.signedXml) {
        item.signedXml = signRes.signedXml;
        item.signedAt =
          signRes.signResponse?.signedAt || new Date().toISOString();
        item.ttKySo = 2;
        if (signRes.signResponse?.tranId) {
          finalTranId = signRes.signResponse.tranId;
        }
        base64 = xmlToBase64(signRes.signedXml);
      } else {
        throw new Error(
          signRes.error || "Không nhận được phản hồi chữ ký số từ SmartCA",
        );
      }
    } catch (signErr: unknown) {
      // Nếu là hồ sơ duy nhất và có signatureBlock sẵn, fallback về signatureBlock
      if (isSingleItem && signatureBlock) {
        let singleXmlFallback = generateHs09SingleXml(item, maCskcb);
        singleXmlFallback = injectSignatureToXml(
          singleXmlFallback,
          signatureBlock,
        );
        base64 = xmlToBase64(singleXmlFallback);
      } else {
        const signMsg =
          signErr instanceof Error ? signErr.message : "Lỗi ký số tự động";
        throw new Error(
          `Ký số hồ sơ LK ${item.ttXml1.maLk} thất bại: ${signMsg}`,
        );
      }
    }
  }

  const params = new URLSearchParams();
  params.append("username", BHXH_CONFIG.USERNAME || `${maCskcb}_BV`);
  params.append("loaiHs", "73");
  if (maTinh) {
    params.append("maTinh", maTinh);
  }
  params.append("maCskcb", maCskcb);
  params.append("kyQT", finalKyQt);
  params.append("fileHsBase64", base64);
  if (finalTranId) {
    params.append("tranId", finalTranId);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    accessToken: token,
    tokenId,
    passwordHash,
  };

  const url = `${baseUrl}${BHXH_CONFIG.ENDPOINTS.GUI_HO_SO_DIEU_CHINH_09BH}`;
  const response = await BhxhChungTuService.fetchGateway(url, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  let data: any = {};
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = {
      maKetQua: String(response.status),
      thongDiep:
        text.slice(0, 150) ||
        `Máy chủ Cổng BHXH phản hồi HTTP ${response.status}`,
    };
  }

  const isOk = String(data.maKetQua ?? (response.ok ? "200" : "500")) === "200";

  return {
    id: item.id,
    maLk: item.ttXml1.maLk,
    hoTen: item.ttXml1.hoTen,
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
        ? `Tiếp nhận thành công hồ sơ điều chỉnh LK ${item.ttXml1.maLk}`
        : `Cổng BHXH phản hồi mã: ${data.maKetQua ?? response.status}`),
    thoiGianTiepNhan: data.thoiGianTiepNhan || getThoiGianTiepNhan(),
    kyQT: data.kyQT || finalKyQt,
  };
}

export async function sendHs09ToBhxhGateway(
  items: HoSoDieuChinh09Item[],
  credentials?: Partial<Hs09GatewayCredentials>,
  signature?: SmartCaSignatureResult,
  customFileBase64?: string,
  onProgress?: (
    current: number,
    total: number,
    currentItem: HoSoDieuChinh09Item,
  ) => void,
): Promise<SendHs09GatewayResult> {
  if (items.length === 0) {
    return {
      maKetQua: "400",
      maGiaoDich: "",
      thongDiep: "Không có hồ sơ nào để gửi",
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: 0,
      loaiHs: "73",
      successCount: 0,
      failureCount: 0,
    };
  }

  const maCskcb =
    credentials?.maCskcb || items[0]?.ttMau?.maCskcb || DEFAULT_MA_CSKCB;

  // Lấy token duy nhất 1 lần cho cả phiên (kể cả gửi 10 hồ sơ)
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
      successCount: 0,
      failureCount: items.length,
    };
  }

  const tokenId = tokenRes.idToken || tokenRes.APIKey?.id_token || "";
  const passwordHash = tokenRes.passwordHash || "";
  const baseUrl = BhxhChungTuService.getBaseUrl();

  // Trích xuất khối chữ ký số nếu có (từ chữ ký SmartCA hoặc tệp XML đã ký)
  const signedXmlFromSig =
    (signature as any)?.signedXml ||
    items.find((i) => (i as any).signedXml)?.signedXml;
  let signatureBlock = extractSignatureBlockFromXml(signedXmlFromSig || "");
  if (!signatureBlock && customFileBase64) {
    try {
      const decoded = atob(customFileBase64);
      signatureBlock = extractSignatureBlockFromXml(decoded);
    } catch {
      // ignore
    }
  }

  try {
    // 1. Trường hợp 1 hồ sơ duy nhất
    if (items.length === 1) {
      onProgress?.(1, 1, items[0]);
      const singleRes = await sendSingleHs09ItemRequest({
        item: items[0],
        maCskcb,
        token,
        tokenId,
        passwordHash,
        baseUrl,
        isSingleItem: true,
        signatureBlock,
        signatureTranId: signature?.tranId,
        credentialsKyQt: credentials?.kyQT,
        maTinh: credentials?.maTinh,
        customFileBase64,
        smartCaOptions: credentials?.smartCaOptions,
      });

      const isOk = singleRes.maKetQua === "200";
      const result: SendHs09GatewayResult = {
        maKetQua: singleRes.maKetQua,
        maGiaoDich: singleRes.maGiaoDich || "",
        thongDiep:
          singleRes.thongDiep ||
          (isOk
            ? "Tiếp nhận thành công hồ sơ điều chỉnh Mẫu 09/BH vào Hệ thống Giám định BHYT"
            : "Cổng BHXH từ chối tiếp nhận"),
        thoiGianTiepNhan: singleRes.thoiGianTiepNhan || getThoiGianTiepNhan(),
        totalRecords: 1,
        loaiHs: "73",
        kyQT: singleRes.kyQT,
        batchResults: [singleRes],
        successCount: isOk ? 1 : 0,
        failureCount: isOk ? 0 : 1,
      };

      saveGatewayAuditLog({
        loaiHs: "73",
        maCskcb,
        maGiaoDich: result.maGiaoDich,
        maKetQua: result.maKetQua,
        thongDiep: result.thongDiep,
        totalRecords: 1,
        kyQT: result.kyQT,
      });

      return result;
    }

    // 2. Trường hợp gửi nhiều hồ sơ (Batch Sending tuần tự - chuẩn XSD 1 TT_HOSO)
    const batchResults: SendHs09BatchItemResult[] = [];
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      onProgress?.(i + 1, items.length, currentItem);

      try {
        const itemRes = await sendSingleHs09ItemRequest({
          item: currentItem,
          maCskcb,
          token,
          tokenId,
          passwordHash,
          baseUrl,
          isSingleItem: false,
          // KHÔNG dùng signatureBlock gộp để tránh sai SHA-256 DigestValue trong XML đơn lẻ
          signatureBlock: null,
          signatureTranId: signature?.tranId,
          credentialsKyQt: credentials?.kyQT,
          maTinh: credentials?.maTinh,
          smartCaOptions: credentials?.smartCaOptions,
        });
        batchResults.push(itemRes);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Lỗi gửi hồ sơ";
        batchResults.push({
          id: currentItem.id,
          maLk: currentItem.ttXml1.maLk,
          hoTen: currentItem.ttXml1.hoTen,
          maKetQua: "500",
          thongDiep: errMsg,
          thoiGianTiepNhan: getThoiGianTiepNhan(),
          kyQT: resolveItemKyQt(currentItem, credentials?.kyQT),
        });
      }
    }

    const successCount = batchResults.filter(
      (r) => r.maKetQua === "200",
    ).length;
    const failureCount = items.length - successCount;
    const allSuccess = successCount === items.length;
    const allFailed = successCount === 0;

    const overallMaKetQua = allSuccess
      ? "200"
      : allFailed
        ? batchResults[0]?.maKetQua || "500"
        : "207";
    const primaryGiaoDich =
      batchResults.find((r) => r.maGiaoDich)?.maGiaoDich || "";
    const overallKyQt =
      batchResults[0]?.kyQT || resolveItemKyQt(items[0], credentials?.kyQT);

    let summaryMessage = "";
    if (allSuccess) {
      summaryMessage = `Tiếp nhận thành công toàn bộ ${items.length}/${items.length} hồ sơ điều chỉnh Mẫu 09/BH vào Hệ thống Giám định BHYT`;
    } else if (allFailed) {
      summaryMessage = `Toàn bộ ${items.length} hồ sơ bị Cổng BHXH từ chối: ${batchResults[0]?.thongDiep || "Lỗi tiếp nhận"}`;
    } else {
      summaryMessage = `Tiếp nhận thành công ${successCount}/${items.length} hồ sơ. Có ${failureCount} hồ sơ bị từ chối`;
    }

    const result: SendHs09GatewayResult = {
      maKetQua: overallMaKetQua,
      maGiaoDich: primaryGiaoDich,
      thongDiep: summaryMessage,
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      loaiHs: "73",
      kyQT: overallKyQt,
      batchResults,
      successCount,
      failureCount,
    };

    saveGatewayAuditLog({
      loaiHs: "73",
      maCskcb,
      maGiaoDich: result.maGiaoDich,
      maKetQua: result.maKetQua,
      thongDiep: result.thongDiep,
      totalRecords: items.length,
      kyQT: overallKyQt,
    });

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
      failureCount: items.length,
      successCount: 0,
    };
  }
}
