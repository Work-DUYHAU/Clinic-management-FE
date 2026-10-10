import type {
  HoSoDieuChinh09Item,
  TaiLieuDinhKemItem,
} from "../types/hs09DieuChinhTypes";
import { toUnaccentedUpper } from "./shared/excelXmlShared";

/** Quy định Mục 8 Phụ lục I Thông tư 12/2026/TT-BTC */
export const ATTACHMENT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
export const ATTACHMENT_ALLOWED_EXTS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "jpg",
  "jpeg",
  "png",
];

export function isHs09Locked(item: HoSoDieuChinh09Item): boolean {
  return item.tinhTrangGui === 2 || item.ttKySo === 2;
}

export function validateAttachmentFile(file: File): void {
  if (file.size > ATTACHMENT_MAX_SIZE) {
    throw new Error(
      "Kích thước tệp đính kèm không được vượt quá 5 MB (Quy định Phụ lục I BHXH Mục 8)!",
    );
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ATTACHMENT_ALLOWED_EXTS.includes(ext)) {
    throw new Error(
      "Định dạng tệp không được hỗ trợ! Chỉ chấp nhận: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG.",
    );
  }
}

/** Đọc nội dung tệp thành Data URL (Base64) để lưu trữ và tải xuống là file thật. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Không đọc được nội dung tệp."));
      }
    };
    reader.onerror = () =>
      reject(new Error("Không đọc được nội dung tệp. Vui lòng thử lại!"));
    reader.readAsDataURL(file);
  });
}

export async function readAttachmentRecord(
  file: File,
  maLyDo = "LD_CHUNG",
): Promise<TaiLieuDinhKemItem> {
  validateAttachmentFile(file);
  const url = await readFileAsDataUrl(file);
  return {
    tenFile: file.name,
    maLyDo,
    kichThuoc: file.size,
    ngayTao: new Date().toLocaleDateString("vi-VN"),
    url,
  };
}

export function handleTuChoiValue(val: string): string {
  return toUnaccentedUpper(val);
}
