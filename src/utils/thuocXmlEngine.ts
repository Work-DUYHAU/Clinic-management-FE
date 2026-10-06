import type {
  DmThuocItem,
  ParseThuocExcelResult,
  SendThuocGatewayResult,
} from "../types/thuocTypes";
import {
  THUOC_SCHEMA_FIELDS,
  THUOC_EXCEL_TEMPLATE_HEADERS,
  THUOC_EXCEL_TEMPLATE_LABELS,
  THUOC_EXCEL_TEMPLATE_COLS,
  THUOC_EXCEL_TEMPLATE_SAMPLES,
  THUOC_FIELD_HEURISTICS,
} from "./constants/thuocConstants";
import { parseThuocRow, parseLoaiThuoc, renderThuocItemXml } from "./parsers";
import {
  createDanhMucEngine,
  xmlToBase64,
  downloadXmlFile,
} from "./shared";

export { xmlToBase64, downloadXmlFile, parseLoaiThuoc, parseThuocRow, renderThuocItemXml };

export const thuocEngine = createDanhMucEngine<DmThuocItem>({
  catalogCode: "DANHMUC03",
  catalogName: "Danh mục Thuốc, Máu & Chế phẩm máu (Loại 10)",
  containerTag: "DANHSACH_DMTHUOCMAUCHEPHAMMAU",
  defaultFileNamePrefix: "DanhMuc03_DMTHUOC",
  templateFileName: "Mau_03_DM_Thuoc_ChePhamMau_BHYT.xlsx",
  templateSheetName: "03_DM_THUOC",
  schemaFields: THUOC_SCHEMA_FIELDS,
  fieldHeuristics: THUOC_FIELD_HEURISTICS,
  hintKeywords: ["03", "THUOC", "DUOC", "MAU", "CHEPHAM", "CHE_PHAM"],
  excelTemplate: {
    headers: THUOC_EXCEL_TEMPLATE_HEADERS,
    labels: THUOC_EXCEL_TEMPLATE_LABELS,
    cols: THUOC_EXCEL_TEMPLATE_COLS,
    samples: THUOC_EXCEL_TEMPLATE_SAMPLES,
  },
  parseRow: parseThuocRow,
  renderItemXml: renderThuocItemXml,
});

export const matchThuocSchemaKey = thuocEngine.matchSchemaKey;
export const findMatchingThuocSchemaKey = thuocEngine.findMatchingSchemaKey;

export const parseThuocWorksheet = (
  workbook: import("xlsx").WorkBook,
  sheetName: string,
  fileName?: string,
  defaultMaCskcb?: string,
): ParseThuocExcelResult => {
  const ws = workbook.Sheets[sheetName];
  return thuocEngine.parseWorksheet(
    ws,
    sheetName,
    workbook.SheetNames || [sheetName],
    fileName,
    workbook,
    defaultMaCskcb,
  );
};

export const parseThuocExcelFile = (
  file: File,
  defaultMaCskcb?: string,
  selectedSheetName?: string,
): Promise<ParseThuocExcelResult> => {
  return thuocEngine.parseExcelFile(file, defaultMaCskcb, selectedSheetName);
};

export const generateThuocXml = thuocEngine.generateXml;
export const downloadThuocXmlFile = thuocEngine.downloadXmlFile;
export const downloadThuocExcelTemplate = thuocEngine.downloadExcelTemplate;
export const sendThuocToBhxhGateway = (
  items: DmThuocItem[],
  maCskcb?: string,
  maTinh?: string,
): Promise<SendThuocGatewayResult> => {
  return thuocEngine.sendToBhxhGateway(items, maCskcb, maTinh);
};
