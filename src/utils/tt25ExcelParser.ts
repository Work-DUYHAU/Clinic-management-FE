import * as XLSX from "xlsx";
import {
  buildCt03Xml,
  buildCt04Xml,
  buildCt06Xml,
  buildCt07Xml,
  buildGiayDieuTriNoiTruXml,
  buildGiayDieuTriVoSinhXml,
  buildGiaySucKhoeMeXml,
  buildGiayBaoTuXml,
  buildGiayChungSinhXml,
  buildHsChungTuXmlPackage,
} from "./tt25XmlEngine";
import {
  DEFAULT_MA_CSKCB,
  normalizeKey,
  detectHeaderRow,
  HEADER_SCAN_ROWS,
} from "./shared/excelXmlShared";
import { detectDocTypeFromHeader } from "./shared/docDetectionRules";
import type { DocSignOptionType } from "../types/tt25ChungTuTypes";
import {
  getRowVal,
  parseCt07Row,
  parseCt03Row,
  parseCt04Row,
  parseCt06Row,
  parseGiayDieuTriNoiTruRow,
  parseGiayDieuTriVoSinhRow,
  parseGiaySucKhoeMeRow,
  parseGiayChungSinhRow,
  parseGiayBaoTuRow,
} from "./parsers";

export { getRowVal };

export interface ParsedUniversalExcelResult {
  success: boolean;
  detectedType: DocSignOptionType | "MULTI";
  totalRows: number;
  breakdown: Record<string, number>;
  fileName: string;
  xmlPackage: string;
  error?: string;
}

// ============================================================
// BẢNG QUY TẮC DỰNG XML THEO LOẠI CHỨNG TỪ (LOOKUP TABLE)
// ============================================================

type RowXmlBuilder = (
  map: Map<string, any>,
  idx: number,
) => { xml: string; loaiHoSo?: string };

const DOC_ROW_BUILDERS: Partial<Record<DocSignOptionType, RowXmlBuilder>> = {
  CT07: (m, i) => ({ xml: buildCt07Xml(parseCt07Row(m, i)), loaiHoSo: "CT07" }),
  CT03: (m, i) => ({ xml: buildCt03Xml(parseCt03Row(m, i)), loaiHoSo: "CT03" }),
  CT04: (m, i) => ({ xml: buildCt04Xml(parseCt04Row(m, i)), loaiHoSo: "CT04" }),
  CT06: (m, i) => ({ xml: buildCt06Xml(parseCt06Row(m, i)), loaiHoSo: "CT06" }),
  GIAYDIEUTRINOITRU: (m, i) => ({
    xml: buildGiayDieuTriNoiTruXml(parseGiayDieuTriNoiTruRow(m, i)),
    loaiHoSo: "GIAYDIEUTRINOITRU",
  }),
  GIAYDIEUTRIVOSINH: (m, i) => ({
    xml: buildGiayDieuTriVoSinhXml(parseGiayDieuTriVoSinhRow(m, i)),
    loaiHoSo: "GIAYDIEUTRIVOSINH",
  }),
  GIAYSUCKHOEME: (m, i) => ({
    xml: buildGiaySucKhoeMeXml(parseGiaySucKhoeMeRow(m, i)),
    loaiHoSo: "GIAYSUCKHOEME",
  }),
  GIAYCHUNGSINH: (m, i) => ({
    xml: buildGiayChungSinhXml(parseGiayChungSinhRow(m, i)),
    loaiHoSo: "61",
  }),
  GIAYBAOTU: (m, i) => ({
    xml: buildGiayBaoTuXml(parseGiayBaoTuRow(m, i)),
    loaiHoSo: "60",
  }),
};

const COMMON_HEADER_HINTS = [
  "stt",
  "soluutru",
  "so_luu_tru",
  "mayte",
  "ma_yte",
  "makhoa",
  "ma_khoa",
  "mabhxh",
  "ma_bhxh",
  "mathe",
  "ma_the",
  "mathebhyt",
  "sothe",
  "hoten",
  "ho_ten",
  "hovaten",
  "ngaysinh",
  "ngay_sinh",
  "gioitinh",
  "gioi_tinh",
  "diachi",
  "dia_chi",
  "ngayvao",
  "ngay_vao",
  "ngayra",
  "ngay_ra",
  "chandoan",
  "chan_doan",
  "ppdieutri",
  "pp_dieutri",
  "thutruong",
  "thutruongdvi",
  "macchn",
  "ma_cchn",
  "socccd",
  "so_cccd",
  "cccd",
  "mact",
  "ma_ct",
  "sochungtu",
  "soseri",
  "so_seri",
  "sokcb",
  "so_kcb",
  "donvi",
  "don_vi",
  "tungay",
  "tu_ngay",
  "denngay",
  "den_ngay",
  "ngayct",
  "ngaykcb",
  "icd10",
  "maicd",
  "magbt",
  "magcs",
  "tencon",
  "cannangcon",
  "noisinh",
  "ngaychet",
  "giochet",
  "nguyennhanchet",
  "islaogiaidoannang",
  "isxogangiaidoanmatbu",
];

/**
 * Trích xuất toàn diện tệp Excel chứng từ TT25 (hỗ trợ nhiều sheet, tự nhận diện mẫu & dòng tiêu đề)
 */
export async function parseUniversalChungTuExcelFile(
  file: File,
  currentSelectType: DocSignOptionType = "CURRENT",
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): Promise<ParsedUniversalExcelResult> {
  if (!file || file.size === 0) {
    throw new Error("Tệp rỗng (0 bytes). Vui lòng chọn tệp bảng tính Excel hợp lệ.");
  }

  const MAX_EXCEL_SIZE = 25 * 1024 * 1024; // 25MB
  if (file.size > MAX_EXCEL_SIZE) {
    throw new Error(
      `Dung lượng tệp (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn 25MB cho phép xử lý trên trình duyệt. Vui lòng chia nhỏ tệp.`,
    );
  }

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, {
      type: "array",
      cellDates: true,
      raw: false,
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Tệp Excel không chứa trang tính (sheet) nào.");
    }

    const allChildXmls: { loaiHoSo: string; rawXmlContent: string }[] = [];
    const breakdown: Record<string, number> = {};
    const detectedTypesSet = new Set<DocSignOptionType>();

    const fallbackType =
      currentSelectType === "CURRENT" ? null : currentSelectType;

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;

      // Đọc bảng dạng lưới 2D (header: 1) để quét và tìm dòng header thực sự
      const grid: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
      });
      if (!grid || grid.length === 0) continue;

      // 1. Quét tìm dòng Header thực sự bằng detectHeaderRow chuẩn dùng chung (chiến lược best)
      const matchCommonHeader = (cell: string): string | null => {
        const norm = normalizeKey(cell);
        if (!norm) return null;
        return COMMON_HEADER_HINTS.some(
          (h) => norm.includes(normalizeKey(h)) || normalizeKey(h).includes(norm),
        )
          ? norm
          : null;
      };

      const { headerRowIndex: headerRowIdx } = detectHeaderRow(
        grid,
        matchCommonHeader,
        2,
        HEADER_SCAN_ROWS,
        "best",
      );

      if (headerRowIdx === -1) continue;

      const headerRow = grid[headerRowIdx] || [];
      const headerKeys = headerRow.map((c) => String(c ?? "").trim());
      const sheetDocType = detectDocTypeFromHeader(
        headerKeys,
        sheetName,
        fallbackType,
      );
      if (!sheetDocType) continue;

      const builder = DOC_ROW_BUILDERS[sheetDocType];
      if (!builder) continue;

      detectedTypesSet.add(sheetDocType);

      // Tiền chuẩn hóa tên cột theo vị trí cột (colIdx)
      const colNormList = headerKeys
        .map((k, colIdx) => ({
          colIdx,
          raw: k,
          norm: normalizeKey(k),
        }))
        .filter((c) => c.norm !== "");

      // 2. Đọc các dòng dữ liệu (bắt đầu sau dòng header)
      const dataRows = grid.slice(headerRowIdx + 1);
      for (let i = 0; i < dataRows.length; i++) {
        const rowArr = dataRows[i];
        if (!rowArr || !Array.isArray(rowArr)) continue;
        // Bỏ qua dòng trống trơn
        if (rowArr.every((c) => c === "" || c === null || c === undefined))
          continue;

        const normMap = new Map<string, any>();
        for (const col of colNormList) {
          const val = rowArr[col.colIdx];
          normMap.set(col.norm, val !== undefined ? val : "");
        }

        const { xml: childXml, loaiHoSo = sheetDocType } = builder(normMap, i);
        if (childXml) {
          allChildXmls.push({ loaiHoSo, rawXmlContent: childXml });
          breakdown[sheetDocType] = (breakdown[sheetDocType] || 0) + 1;
        }
      }
    }

    if (allChildXmls.length === 0) {
      throw new Error("Không trích xuất được bản ghi hợp lệ nào từ tệp Excel.");
    }

    const packageResult = buildHsChungTuXmlPackage({
      maCskcb: defaultMaCskcb,
      items: allChildXmls,
    });

    const detectedTypesArr = Array.from(detectedTypesSet);
    const finalDetectedType: DocSignOptionType | "MULTI" =
      detectedTypesArr.length === 1 ? detectedTypesArr[0] : "MULTI";

    return {
      success: true,
      detectedType: finalDetectedType,
      totalRows: allChildXmls.length,
      breakdown,
      fileName: file.name,
      xmlPackage: packageResult.xml,
    };
  } catch (err: any) {
    return {
      success: false,
      detectedType: "CT07",
      totalRows: 0,
      breakdown: {},
      fileName: file.name,
      xmlPackage: "",
      error: err.message || "Không thể đọc và xử lý tệp Excel.",
    };
  }
}

/** Giữ lại hàm tương thích ngược */
export async function parseCt07ExcelFile(
  file: File,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
) {
  const res = await parseUniversalChungTuExcelFile(
    file,
    "CT07",
    defaultMaCskcb,
  );
  return {
    success: res.success,
    loaiChungTu: "CT07" as const,
    fileName: res.fileName,
    totalRows: res.totalRows,
    items: [],
    xmlPackage: res.xmlPackage,
    error: res.error,
  };
}
