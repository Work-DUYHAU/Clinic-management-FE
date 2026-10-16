import * as XLSX from "xlsx";
import type {
  HoSoDieuChinh09Item,
  ParseHs09ExcelResult,
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
  getTodayYmd,
  DEFAULT_MA_CSKCB,
} from "./shared/excelXmlShared";
import {
  parseHs09Row,
  parseHs09XmlRecord,
  renderHs09ItemXml,
} from "./parsers/hs09RowParser";
import { detectScenario } from "./hs09Scenario";
import { extractXmlSignature } from "./xmlDsigEngine";

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

  xml = xml.replace(/encoding=["'][^"']*["']/i, 'encoding="utf-8"');

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

export async function parseHs09ExcelFile(
  file: File,
  selectedSheetName?: string,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): Promise<ParseHs09ExcelResult> {
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

export function generateHs09Base64(
  items: HoSoDieuChinh09Item[],
  maCskcb = DEFAULT_MA_CSKCB,
): string {
  const xml = generateHs09Xml(items, maCskcb);
  return xmlToBase64(xml);
}

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

export {
  extractSignatureBlockFromXml,
  resolveItemKyQt,
  sendSingleHs09ItemRequest,
  sendHs09ToBhxhGateway,
  getHs09DraftsApi,
  syncHs09DraftsApi,
  deleteHs09DraftApi,
  clearHs09DraftsApi,
  getHs09AuditLogsApi,
  type SendHs09Options,
  type BatchSendHs09Progress,
  type SendSingleItemParams,
} from "../services/api/hs09Api";
