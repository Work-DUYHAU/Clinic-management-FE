import * as XLSX from "xlsx";
import { BhxhChungTuService, BHXH_CONFIG } from "../../services/bhxh/bhxhChungTuService";
// 1. CHUẨN HÓA & SO KHỚP TÊN CỘT EXCEL
export function normalizeKey(str: string): string {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Chuẩn hóa tên cột in hoa [A-Z0-9] (tương thích ngược) */
export function normalizeHeaderKey(str: string): string {
  return normalizeKey(str).toUpperCase();
}

/** @deprecated dùng normalizeKey */
export const normalizeKeyword = normalizeKey;

export interface SharedSchemaField {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  desc?: string;
  aliases: string[];
}

export type SchemaKeyMatcher = (colHeader: string) => string | null;

export function createSchemaKeyMatcher(
  fields: SharedSchemaField[],
  heuristics: Array<[RegExp | string, string]>,
): SchemaKeyMatcher {
  const exactMap = new Map<string, string>();

  for (const field of fields) {
    const keyNorm = normalizeHeaderKey(field.key);
    if (keyNorm) exactMap.set(keyNorm, field.key);

    const labelNorm = normalizeHeaderKey(field.label);
    if (labelNorm) exactMap.set(labelNorm, field.key);

    for (const alias of field.aliases) {
      const aliasNorm = normalizeHeaderKey(alias);
      if (aliasNorm) exactMap.set(aliasNorm, field.key);
    }
  }

  return function matchSchemaKey(colHeader: string): string | null {
    const norm = normalizeHeaderKey(colHeader);
    if (!norm) return null;

    const exact = exactMap.get(norm);
    if (exact) return exact;

    for (const [pattern, key] of heuristics) {
      if (
        typeof pattern === "string"
          ? norm.includes(pattern)
          : pattern.test(norm)
      ) {
        return key;
      }
    }

    return null;
  };
}
// 2. PARSE GIÁ TRỊ Ô EXCEL
export function getRowCell(map: Map<string, any>, aliases: string[]): unknown {
  const isValidValue = (val: unknown) =>
    val !== undefined && val !== null && String(val).trim() !== "";

  const normalized = aliases.map(normalizeKey);

  for (const na of normalized) {
    const v = map.get(na);
    if (isValidValue(v)) return v;
  }

  return undefined;
}
export function getRowVal(
  map: Map<string, any>,
  aliases: string[],
  fallback = "",
): string {
  const cell = getRowCell(map, aliases);
  if (cell === undefined || cell === null) return fallback;
  if (cell instanceof Date && !isNaN(cell.getTime())) {
    return parseYmdDate(cell);
  }
  const str = String(cell).trim();
  return str === "" ? fallback : str;
}

const GENDER_MAP: Record<string, "1" | "2" | "3"> = {
  "2": "2",
  nu: "2",
  female: "2",
  f: "2",
  gai: "2",
  "0": "2",
  "1": "1",
  nam: "1",
  male: "1",
  m: "1",
  trai: "1",
  "3": "3",
  khac: "3",
  other: "3",
  unknown: "3",
  chuaxacdinh: "3",
};

function lookupGender(val: unknown): "1" | "2" | "3" | "" {
  if (val === null || val === undefined || String(val).trim() === "") return "";
  return GENDER_MAP[normalizeKey(String(val))] ?? "";
}

export const parseOptionalGender = (val: unknown): string => lookupGender(val);

export function parseGender(
  val: unknown,
  defaultVal: "1" | "2" | "3" = "1",
): "1" | "2" | "3" {
  return lookupGender(val) || defaultVal;
}

export const parseGioiTinh = (val: unknown): number =>
  parseInt(parseGender(val, "3"), 10);

export function resolveLoaiGiayTo(
  rawLoaiGiayTo: string,
  soCccd: string,
): string {
  const trimmed = rawLoaiGiayTo ? rawLoaiGiayTo.trim() : "";
  if (["0", "1", "2", "3", "4", "5", "6", "7"].includes(trimmed)) {
    return trimmed;
  }
  return soCccd && soCccd.trim() !== "" ? "1" : "";
}

export function parseExactBinaryFlag(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  const str = String(raw).trim();
  if (str === "") return "";
  const lower = str.toLowerCase();
  if (["1", "true", "co", "có", "x", "v"].includes(lower)) return "1";
  if (["0", "false", "khong", "không"].includes(lower)) return "0";
  return str;
}

export function parseNumberCell(val: unknown, defaultVal = 0): number {
  if (val === null || val === undefined || val === "") return defaultVal;
  if (typeof val === "number") return isNaN(val) ? defaultVal : val;

  let str = String(val).trim();
  if (!str) return defaultVal;

  const hasComma = str.includes(",");
  const hasDot = str.includes(".");

  if (hasComma && !hasDot) {
    str =
      (str.match(/,/g) || []).length === 1
        ? str.replace(",", ".")
        : str.replace(/,/g, "");
  } else if (hasComma && hasDot) {
    str = str.replace(/,/g, "");
  }

  const clean = str.replace(/[^0-9.-]/g, "");
  if (clean === "" || clean === "-" || clean === ".") return defaultVal;
  const num = Number(clean);
  return isNaN(num) ? defaultVal : num;
}
// 2b. NGÀY / NGÀY GIỜ
const pad2 = (x: string | number) => String(x).padStart(2, "0");

function isExcelSerial(v: unknown): boolean {
  if (typeof v === "number") return v > 20000 && v < 60000;
  const s = String(v ?? "").trim();
  const n = Number(s);
  return (
    s !== "" &&
    !isNaN(n) &&
    n > 20000 &&
    n < 60000 &&
    !s.includes("/") &&
    !s.includes("-")
  );
}

interface DateTimeParts {
  ymd: string; // YYYYMMDD
  h: string;
  mi: string;
  s: string;
  hasTime: boolean; // false nếu nguồn chỉ có ngày
}

/** Serial Excel -> các phần ngày giờ theo UTC (làm tròn đến giây) */
function excelSerialToParts(n: number): DateTimeParts {
  const d = new Date(Math.round((n - 25569) * 86400) * 1000);
  return {
    ymd: `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`,
    h: pad2(d.getUTCHours()),
    mi: pad2(d.getUTCMinutes()),
    s: pad2(d.getUTCSeconds()),
    hasTime: n % 1 !== 0,
  };
}

export function parseYmdDate(val: unknown, defaultVal = ""): string {
  if (val === null || val === undefined || val === "") return defaultVal;

  if (val instanceof Date && !isNaN(val.getTime())) {
    return `${val.getFullYear()}${pad2(val.getMonth() + 1)}${pad2(val.getDate())}`;
  }

  const str = String(val).trim();
  if (!str) return defaultVal;

  if (isExcelSerial(str)) return excelSerialToParts(Number(str)).ymd;

  if (/[a-zA-Z]/.test(str)) {
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return `${parsedDate.getFullYear()}${pad2(parsedDate.getMonth() + 1)}${pad2(parsedDate.getDate())}`;
    }
  }
  const dateToken = str.split(/[\sT]+/)[0];

  if (/[\/\-.]/.test(dateToken)) {
    const parts = dateToken.split(/[\/\-.]/).map((p) => p.trim());
    if (parts.length === 3) {
      const [a, b, c] = parts;
      const candidate =
        a.length === 4
          ? `${a}${pad2(b)}${pad2(c)}`
          : c.length === 4
            ? `${c}${pad2(b)}${pad2(a)}`
            : "";
      if (candidate && isValidYmdDate(candidate)) return candidate;
    }
  }

  if (/^\d{4}$/.test(str)) {
    const candidate = `${str}0101`;
    if (isValidYmdDate(candidate)) return candidate;
  }

  const cleaned = str.replace(/[^0-9]/g, "");
  if (cleaned.length === 8 && isValidYmdDate(cleaned)) {
    return cleaned;
  }

  return defaultVal;
}

/** @deprecated chỉ trả 8 ký tự. Dùng parseYmdDate / parseYmdHmDate / parseYmdHmsDate theo độ dài trường. */
export const parseExcelDate = parseYmdDate;

function parseDateTimeParts(val: unknown): DateTimeParts | null {
  if (val === null || val === undefined || val === "") return null;

  if (val instanceof Date && !isNaN(val.getTime())) {
    return {
      ymd: parseYmdDate(val),
      h: pad2(val.getHours()),
      mi: pad2(val.getMinutes()),
      s: pad2(val.getSeconds()),
      hasTime: true,
    };
  }

  const str = String(val).trim();
  if (!str) return null;

  if (isExcelSerial(str)) return excelSerialToParts(Number(str));

  if (/[a-zA-Z]/.test(str)) {
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return {
        ymd: parseYmdDate(parsedDate),
        h: pad2(parsedDate.getHours()),
        mi: pad2(parsedDate.getMinutes()),
        s: pad2(parsedDate.getSeconds()),
        hasTime: true,
      };
    }
  }

  // Chuỗi toàn chữ số: 8 / 12 / 14 ký tự
  if (/^\d+$/.test(str)) {
    if (str.length >= 12) {
      return {
        ymd: str.slice(0, 8),
        h: str.slice(8, 10),
        mi: str.slice(10, 12),
        s: str.length >= 14 ? str.slice(12, 14) : "00",
        hasTime: true,
      };
    }
    if (str.length === 8) {
      return { ymd: str, h: "00", mi: "00", s: "00", hasTime: false };
    }
  }

  // Chuỗi có phân cách: "dd/mm/yyyy hh:mm[:ss]" hoặc "yyyy-mm-ddThh:mm[:ss]"
  const [datePart, timePart] = str.split(/[\sT]+/);
  const ymd = parseYmdDate(datePart);
  if (ymd.length !== 8) return null;

  if (timePart) {
    const t = timePart.split(/[:.]/).map((x) => x.trim());
    if (t.length >= 2) {
      return {
        ymd,
        h: pad2(t[0]),
        mi: pad2(t[1]),
        s: pad2(t[2] ?? "00"),
        hasTime: true,
      };
    }
  }
  return { ymd, h: "00", mi: "00", s: "00", hasTime: false };
}

/**
 * Ngày giờ 12 ký tự YYYYMMDDHHmm: NGAY_VAO, NGAY_RA, NGAYGIO_VV, NGAY_TV,
 * NGAY_DINH_CHI_THAINGHEN...
 * Nguồn chỉ có ngày: nếu truyền defaultHourMinute (vd "0000") thì ghép vào,
 * không thì trả 8 ký tự.
 */
export function parseYmdHmDate(
  val: unknown,
  defaultHourMinute?: string,
): string {
  const t = parseDateTimeParts(val);
  if (!t) return "";
  if (t.hasTime) return `${t.ymd}${t.h}${t.mi}`;
  return defaultHourMinute !== undefined
    ? `${t.ymd}${defaultHourMinute}`
    : t.ymd;
}

/**
 * Ngày giờ 14 ký tự YYYYMMDDHHmmss: NGAY_SINH_CON của giấy chứng sinh.
 * Nguồn chỉ có ngày: nếu truyền defaultHms (vd "000000") thì ghép vào.
 */
export function parseYmdHmsDate(val: unknown, defaultHms?: string): string {
  const t = parseDateTimeParts(val);
  if (!t) return "";
  if (t.hasTime) return `${t.ymd}${t.h}${t.mi}${t.s}`;
  return defaultHms !== undefined ? `${t.ymd}${defaultHms}` : t.ymd;
}
// Kiểm tra chuỗi ngày giờ  (8 || 12 || 14 ký tự)
export function isValidYmdDateTime(str?: string | null): boolean {
  if (!str) return false;
  const clean = str.trim();
  if (!/^(\d{8}|\d{12}|\d{14})$/.test(clean)) return false;

  const y = parseInt(clean.slice(0, 4), 10);
  const m = parseInt(clean.slice(4, 6), 10);
  const d = parseInt(clean.slice(6, 8), 10);
  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > new Date(y, m, 0).getDate()) return false;

  if (clean.length >= 12) {
    const h = parseInt(clean.slice(8, 10), 10);
    const mi = parseInt(clean.slice(10, 12), 10);
    if (h < 0 || h > 23 || mi < 0 || mi > 59) return false;
  }
  if (clean.length === 14) {
    const s = parseInt(clean.slice(12, 14), 10);
    if (s < 0 || s > 59) return false;
  }
  return true;
}

/** @deprecated dùng isValidYmdDateTime */
export const isValidYmdDate = (str?: string | null) =>
  !!str && str.trim().length === 8 && isValidYmdDateTime(str);
/** @deprecated dùng isValidYmdDateTime */
export const isValidYmdHmDate = (str?: string | null) =>
  !!str && str.trim().length === 12 && isValidYmdDateTime(str);
/** @deprecated dùng isValidYmdDateTime */
export const isValidYmdHmsDate = (str?: string | null) =>
  !!str && str.trim().length === 14 && isValidYmdDateTime(str);

// format số tiền
export function formatCurrencyDecimals(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0.00";
  return val.toFixed(2);
}
// ĐỌC WORKBOOK EXCEL
export function readExcelFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const isXml =
      file.name.toLowerCase().endsWith(".xml") ||
      file.type === "application/xml" ||
      file.type === "text/xml";
    if (isXml) {
      reject(
        new Error(
          "Tệp bạn vừa chọn là tệp XML, không phải bảng tính Excel (.xlsx, .xls). Vui lòng nạp qua bộ đọc XML.",
        ),
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Tệp Excel không chứa bất kỳ sheet nào!");
        }
        resolve(workbook);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Định dạng tệp không hợp lệ";
        if (
          msg.includes("reading '0'") ||
          msg.includes("Cannot read properties of undefined")
        ) {
          reject(
            new Error(
              "Tệp không đúng định dạng bảng tính Excel (.xlsx, .xls) hoặc file bị lỗi cấu trúc!",
            ),
          );
        } else {
          reject(new Error(msg));
        }
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file từ thiết bị!"));
    reader.readAsArrayBuffer(file);
  });
}

export const DEFAULT_MA_CSKCB = (import.meta.env.VITE_MA_CSKCB as string) || "49939";
export const DEFAULT_MA_TINH = (import.meta.env.VITE_MA_TINH as string) || "48";
export const DEFAULT_CLINIC_NAME = (import.meta.env.VITE_CLINIC_NAME as string) || "Cơ sở Khám chữa bệnh";

export function pickBestSheetName(
  workbook: XLSX.WorkBook,
  matchSchemaKey: SchemaKeyMatcher,
  hintKeywords: string[] = [],
  minMatchCount = 2,
): string {
  const availableSheets = workbook.SheetNames;
  if (!availableSheets || availableSheets.length === 0) return "";
  if (availableSheets.length === 1) return availableSheets[0];

  let bestCandidate = "";
  let maxCandidateScore = -1;

  for (const s of availableSheets) {
    const ws = workbook.Sheets[s];
    if (!ws) continue;

    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
    });
    if (!rawRows || rawRows.length <= 1) continue;

    const { headerRowIndex, colMapping } = detectHeaderRow(
      rawRows,
      matchSchemaKey,
      minMatchCount,
      25,
      "best",
    );

    const matchedCount = Object.keys(colMapping).length;
    if (headerRowIndex !== -1 && matchedCount >= minMatchCount) {
      const norm = normalizeHeaderKey(s);
      const isHintMatch = hintKeywords.some((k) =>
        norm.includes(normalizeHeaderKey(k)),
      );
      const dataRowsCount = Math.max(0, rawRows.length - (headerRowIndex + 1));
      const score =
        matchedCount * 100 +
        (isHintMatch ? 50 : 0) +
        Math.min(dataRowsCount, 100);

      if (score > maxCandidateScore) {
        maxCandidateScore = score;
        bestCandidate = s;
      }
    }
  }

  if (bestCandidate) return bestCandidate;

  if (hintKeywords && hintKeywords.length > 0) {
    for (const s of availableSheets) {
      const norm = normalizeHeaderKey(s);
      if (hintKeywords.some((k) => norm.includes(normalizeHeaderKey(k)))) {
        return s;
      }
    }
  }

  return availableSheets[0];
}

export const HEADER_SCAN_ROWS = 25;

// Trả về -1 nếu không tìm thấy dòng nào đạt ngưỡng.
export function detectHeaderRow(
  rows: unknown[][],
  matchSchemaKey: SchemaKeyMatcher,
  minMatchCount = 3,
  maxScanRows = HEADER_SCAN_ROWS,
  strategy: "first" | "best" = "best",
): { headerRowIndex: number; colMapping: { [colIdx: number]: string } } {
  let headerRowIndex = -1;
  let maxMatches = 0;
  let bestColMapping: { [colIdx: number]: string } = {};

  for (let r = 0; r < Math.min(rows.length, maxScanRows); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    let matches = 0;
    const currentMapping: { [colIdx: number]: string } = {};
    const mappedKeys = new Set<string>();

    for (let c = 0; c < row.length; c++) {
      const matchedKey = matchSchemaKey(String(row[c] ?? "").trim());
      if (matchedKey && !mappedKeys.has(matchedKey)) {
        currentMapping[c] = matchedKey;
        mappedKeys.add(matchedKey);
        matches++;
      }
    }

    if (matches >= minMatchCount) {
      if (strategy === "first") {
        headerRowIndex = r;
        bestColMapping = currentMapping;
        break;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        headerRowIndex = r;
        bestColMapping = currentMapping;
      }
    }
  }

  return { headerRowIndex, colMapping: bestColMapping };
}

// XML & CHỮ SỐ
export function escapeXml(value: string | number | null | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
//Lấy ngày giờ theo giờ Việt Nam địa phương
export function getTimestampYmdHms(date: Date = new Date()): string {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
  );
}
export function getTodayYmd(date: Date = new Date()): string {
  return getTimestampYmdHms(date).slice(0, 8);
}

/** @deprecated dùng getTodayYmd */
export const todayYmd = getTodayYmd;

export function getTodayIsoDate(date: Date = new Date()): string {
  const ymd = getTodayYmd(date);
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

//Lấy đầu năm hiện tại
export function getCurrentYearStartYmd(): string {
  return `${new Date().getFullYear()}0101`;
}

//Định dạng thời điểm ký chuẩn XML ISO
export function formatXmlSigningTime(date: Date = new Date()): string {
  const ts = getTimestampYmdHms(date);
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}`;
}

/** @deprecated dùng formatXmlSigningTime */
export const getSigningTimeIso = formatXmlSigningTime;

/**
 * Sinh block chữ ký CHUKYDONVI (W3C XMLDSig) chuẩn BHYT / Quyết định 130.
 * Nếu có innerSignatureXml (<Signature>...</Signature>) thì bọc vào bên trong,
 * nếu chưa ký thì để placeholder tự đóng <CHUKYDONVI /> đồng nhất.
 */
export function buildSignatureBlock(
  innerSignatureXml?: string,
  _indent = "",
): string {
  if (innerSignatureXml && innerSignatureXml.trim()) {
    return `<CHUKYDONVI>${innerSignatureXml.trim()}</CHUKYDONVI>`;
  }
  return `<CHUKYDONVI></CHUKYDONVI>`;
}

export function buildHsDanhMucDocument(
  datasetContainerXml: string,
  signatureBlock: string,
): string {
  return `<?xml version="1.0" encoding="utf-8"?><HSDANHMUC xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${datasetContainerXml}${signatureBlock}</HSDANHMUC>`;
}

export function xmlToBase64(xmlString: string): string {
  try {
    const utf8Bytes = new TextEncoder().encode(xmlString);
    let binary = "";
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return window.btoa(binary);
  } catch (e) {
    return window.btoa(unescape(encodeURIComponent(xmlString)));
  }
}

// 5. TIỆN ÍCH CLIPBOARD DÙNG CHUNG
function fallbackCopyTextToClipboard(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error("Fallback clipboard copy failed: ", err);
    return false;
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return fallbackCopyTextToClipboard(text);
  } catch {
    return fallbackCopyTextToClipboard(text);
  }
}
//Tải file XML xuống máy người dùng.
export function downloadXmlFile(xmlContent: string, fileName: string): void {
  const safeFileName = fileName.toLowerCase().endsWith(".xml")
    ? fileName
    : `${fileName}.xml`;
  const blob = new Blob([xmlContent], {
    type: "application/xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// CỔNG EGW BHXH & ĐỊNH DẠNG HIỂN THỊ UI
export interface GatewaySendResult {
  maKetQua: string;
  maGiaoDich: string;
  thongDiep: string;
  thoiGianTiepNhan: string;
  totalRecords: number;
  loaiHs?: string;
}

export function formatCurrencyVnd(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0 đ";
  return `${Math.round(val).toLocaleString("vi-VN")} đ`;
}

//Định dạng chuỗi ngày giờ YYYYMMDDHHmm hoặc YYYYMMDD thành dạng dễ đọc DD/MM/YYYY HH:mm
export function formatYmdHmDisplay(str?: string): string {
  if (!str) return "-";
  const clean = String(str).replace(/[^0-9]/g, "");
  if (clean.length === 12) {
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    const h = clean.slice(8, 10);
    const mi = clean.slice(10, 12);
    return `${d}/${m}/${y} ${h}:${mi}`;
  }
  if (clean.length === 8) {
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    return `${d}/${m}/${y}`;
  }
  return str;
}

/** @deprecated dùng getTimestampYmdHms */
export const getThoiGianTiepNhan = getTimestampYmdHms;

export async function sendDanhMucToBhxhGateway(
  loaiHs: string,
  recordCount: number,
  recordLabel: string,
  maCskcb: string = DEFAULT_MA_CSKCB,
  maTinh: string = DEFAULT_MA_TINH,
  fileBase64Str?: string,
): Promise<GatewaySendResult> {
  const tokenRes = await BhxhChungTuService.takeToken();
  const token = tokenRes.apiToken || tokenRes.APIKey?.access_token;
  if (String(tokenRes.maKetQua) !== "200" || !token) {
    return {
      maKetQua: String(tokenRes.maKetQua || "401"),
      maGiaoDich: "",
      thongDiep: tokenRes.thongDiep || tokenRes.message || "Chưa cấu hình tài khoản kết nối Cổng BHXH hoặc lỗi xác thực Token",
      thoiGianTiepNhan: getTimestampYmdHms(),
      totalRecords: recordCount,
      loaiHs,
    };
  }

  try {
    const LOAI_HS_NORMALIZED: Record<string, string> = {
      "DANHMUC01": "70",
      "DM01": "70",
      "70": "70",
      "DANHMUC02": "71",
      "DM02": "71",
      "71": "71",
      "DANHMUC03": "10",
      "DM03": "10",
      "10": "10",
      "DANHMUC04": "11",
      "DM04": "11",
      "11": "11",
      "DANHMUC05": "12",
      "DM05": "12",
      "12": "12",
      "DANHMUC06": "72",
      "DM06": "72",
      "72": "72",
    };
    const officialLoaiHs = LOAI_HS_NORMALIZED[loaiHs] || loaiHs;

    const endpointMap: Record<string, string> = {
      "70": BHXH_CONFIG.ENDPOINTS.GUI_DANH_MUC_01_BPCMKBCB,
      "71": BHXH_CONFIG.ENDPOINTS.GUI_DANH_MUC_02_NLKCB,
      "10": BHXH_CONFIG.ENDPOINTS.GUI_DANH_MUC_03_DMTHUOC,
      "11": BHXH_CONFIG.ENDPOINTS.GUI_DANH_MUC_04_DMVTYT,
      "12": BHXH_CONFIG.ENDPOINTS.GUI_DANH_MUC_05_DVKT,
      "72": BHXH_CONFIG.ENDPOINTS.GUI_DANH_MUC_06_DMTBYT,
    };
    const endpoint = endpointMap[officialLoaiHs] || '/api/DanhMucGW';

    const params = new URLSearchParams();
    params.append("username", BHXH_CONFIG.USERNAME || `${maCskcb}_BV`);
    params.append("loaiHs", officialLoaiHs);
    params.append("maTinh", maTinh);
    params.append("maCskcb", maCskcb);
    params.append("maCơ sở KCB", maCskcb); // Alias theo curl example tài liệu
    if (fileBase64Str) {
      params.append("fileHsBase64", fileBase64Str);
      params.append("fileBase64Str", fileBase64Str); // Fallback
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "accessToken": token,
      "tokenId": tokenRes.idToken || tokenRes.APIKey?.id_token || "",
      "passwordHash": tokenRes.passwordHash || "",
    };

    const baseUrl = BhxhChungTuService.getBaseUrl();
    const response = await BhxhChungTuService.fetchGateway(`${baseUrl}${endpoint}`, {
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
          text.slice(0, 150) || `Máy chủ Cổng BHXH phản hồi HTTP ${response.status}`,
      };
    }

    const isOk = String(data.maKetQua ?? (response.ok ? "200" : "500")) === "200";
    return {
      maKetQua: String(data.maKetQua ?? (response.ok ? "200" : "500")),
      maGiaoDich: data.maGiaoDich || (isOk ? `${loaiHs}_T${maTinh}_${maCskcb}_${Date.now().toString().slice(-6)}` : ""),
      thongDiep:
        data.thongDiep ||
        data.ghiChu ||
        (isOk
          ? `Tiếp nhận thành công ${recordCount} bản ghi ${recordLabel} vào Cổng BHXH`
          : `Cổng BHXH phản hồi mã kết quả: ${data.maKetQua ?? response.status}`),
      thoiGianTiepNhan: data.thoiGianTiepNhan || getTimestampYmdHms(),
      totalRecords: recordCount,
      loaiHs,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Lỗi kết nối Cổng BHXH";
    return {
      maKetQua: "500",
      maGiaoDich: "",
      thongDiep: errorMsg,
      thoiGianTiepNhan: getTimestampYmdHms(),
      totalRecords: recordCount,
      loaiHs,
    };
  }
}
