import type { DmBpcmItem } from "../types";
import type { ParseExcelResult } from "../types/bpcmTypes";
import {
  BPCM_SCHEMA_FIELDS,
  BPCM_EXCEL_TEMPLATE_HEADERS,
  BPCM_EXCEL_TEMPLATE_LABELS,
  BPCM_EXCEL_TEMPLATE_COLS,
  BPCM_EXCEL_TEMPLATE_SAMPLES,
  BPCM_FIELD_HEURISTICS,
} from "./constants/bpcmConstants";
import { parseBpcmRow, renderBpcmItemXml } from "./parsers";
import {
  createDanhMucEngine,
  normalizeHeaderKey,
  xmlToBase64,
  downloadXmlFile,
} from "./shared";

// Re-export để giữ nguyên API công khai cũ
export {
  normalizeHeaderKey,
  xmlToBase64,
  downloadXmlFile,
  parseBpcmRow,
  renderBpcmItemXml,
};

export const bpcmEngine = createDanhMucEngine<DmBpcmItem>({
  catalogCode: "DANHMUC01",
  catalogName: "Danh mục BPCM (Loại 70)",
  containerTag: "DANHSACH_DMBOPHANCHUYENMON",
  defaultFileNamePrefix: "DanhMuc01_BPCMKBCB",
  templateFileName: "Mau_01_DM_BoPhanChuyenMon_Loai70.xlsx",
  templateSheetName: "DM_BPCM_Loai70",
  schemaFields: BPCM_SCHEMA_FIELDS,
  fieldHeuristics: BPCM_FIELD_HEURISTICS,
  hintKeywords: ["01BPCM", "BPCM", "BOPHAN", "KHOA", "PHONG", "BANKHAM"],
  excelTemplate: {
    headers: BPCM_EXCEL_TEMPLATE_HEADERS,
    labels: BPCM_EXCEL_TEMPLATE_LABELS,
    cols: BPCM_EXCEL_TEMPLATE_COLS,
    samples: BPCM_EXCEL_TEMPLATE_SAMPLES,
  },
  parseRow: parseBpcmRow,
  renderItemXml: renderBpcmItemXml,
});

export const matchBpcmSchemaKey = bpcmEngine.matchSchemaKey;
export const findMatchingBpcmSchemaKey = bpcmEngine.findMatchingSchemaKey;

export const parseWorksheet = (
  workbook: import("xlsx").WorkBook,
  sheetName: string,
  fileName?: string,
  defaultMaCskcb?: string,
): ParseExcelResult => {
  const ws = workbook.Sheets[sheetName];
  return bpcmEngine.parseWorksheet(
    ws,
    sheetName,
    workbook.SheetNames || [sheetName],
    fileName,
    workbook,
    defaultMaCskcb,
  );
};

export const parseBpcmExcelFile = (
  file: File,
  defaultMaCskcb?: string,
  preferredSheet?: string,
): Promise<ParseExcelResult> => {
  return bpcmEngine.parseExcelFile(file, defaultMaCskcb, preferredSheet);
};

export const generateBpcmXml = bpcmEngine.generateXml;
export const downloadBpcmXmlFile = bpcmEngine.downloadXmlFile;
export const downloadBpcmExcelTemplate = bpcmEngine.downloadExcelTemplate;
export const sendBpcmToBhxhGateway = bpcmEngine.sendToBhxhGateway;
