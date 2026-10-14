import { BACKEND_BASE_URL } from "./client";

export interface SendBhxhHoSo09Params {
  fileBase64Str?: string;
  xmlContent?: string;
  loaiHs?: string;
  kyQT?: string;
  maCskcb?: string;
  maTinh?: string;
  tranId?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo09Result {
  success: boolean;
  statusCode: number;
  maKetQua: string;
  thongDiep: string;
  ghiChu?: string;
  maGiaoDich?: string;
  data?: any;
}

/**
 * Gửi 1 hồ sơ điều chỉnh 09 (Mẫu 09/BH - Loại HS 73) lên Cổng BHXH qua Backend API
 */
export async function sendBhxhHoSo09WithBackend(
  params: SendBhxhHoSo09Params,
): Promise<SendBhxhHoSo09Result> {
  const {
    fileBase64Str,
    xmlContent,
    loaiHs = "73",
    kyQT,
    maCskcb,
    maTinh,
    tranId,
    signal,
  } = params;

  let base64 = fileBase64Str || "";
  if (!base64 && xmlContent) {
    base64 = btoa(unescape(encodeURIComponent(xmlContent)));
  }

  if (!base64) {
    throw new Error("Không có dữ liệu tệp XML / Base64 để gửi lên Cổng BHXH.");
  }

  const endpoint = `${BACKEND_BASE_URL}/bhxh/gui-ho-so-dieu-chinh-09`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      fileBase64Str: base64,
      loaiHs,
      kyQT,
      maCskcb,
      maTinh,
      tranId,
    }),
  });

  const resJson = await response.json();
  return resJson;
}

export interface SendBhxhHoSo09HangLoatItem {
  id?: string;
  maLk?: string;
  hoTen?: string;
  fileBase64Str?: string;
  xmlContent?: string;
  kyQT?: string;
  tranId?: string;
  ghiChu?: string;
}

export interface SendBhxhHoSo09HangLoatParams {
  items: SendBhxhHoSo09HangLoatItem[];
  maCskcb?: string;
  maTinh?: string;
  kyQT?: string;
  loaiHs?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo09HangLoatResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  thongDiep: string;
  items: Array<{
    id?: string;
    maLk?: string;
    hoTen?: string;
    maKetQua: string;
    maGiaoDich: string;
    thongDiep: string;
    thoiGianTiepNhan: string;
    kyQT?: string;
  }>;
}

/**
 * Gửi Hàng Loạt danh sách hồ sơ điều chỉnh 09 lên Cổng BHXH qua Backend Dispatching
 */
export async function sendBhxhHoSo09HangLoatWithBackend(
  params: SendBhxhHoSo09HangLoatParams,
): Promise<SendBhxhHoSo09HangLoatResult> {
  const { items, maCskcb, maTinh, kyQT, loaiHs = "73", signal } = params;

  const endpoint = `${BACKEND_BASE_URL}/bhxh/gui-ho-so-dieu-chinh-09-hang-loat`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      items,
      maCskcb,
      maTinh,
      kyQT,
      loaiHs,
    }),
  });

  const resJson = await response.json();
  return resJson;
}

export interface Hs09AuditLogEntry {
  id: string;
  timestamp: string;
  maCskcb: string;
  maTinh: string;
  loaiHs: string;
  kyQT?: string;
  maLk?: string;
  hoTen?: string;
  tranId?: string;
  maKetQua: string;
  maGiaoDich?: string;
  thongDiep: string;
  success: boolean;
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
  type: "single" | "batch";
}

/**
 * Lấy lịch sử giao dịch Cổng BHXH của Hồ sơ 09 từ máy chủ Backend
 */
export async function getHs09AuditLogsWithBackend(params?: {
  limit?: number;
  maCskcb?: string;
  signal?: AbortSignal;
}): Promise<Hs09AuditLogEntry[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.maCskcb) searchParams.append("maCskcb", params.maCskcb);

    const endpoint = `${BACKEND_BASE_URL}/ho-so/09/audit-logs?${searchParams.toString()}`;
    const response = await fetch(endpoint, {
      method: "GET",
      signal: params?.signal,
    });

    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (err) {
    console.warn("Lỗi khi lấy audit log HS09 từ Backend:", err);
    return [];
  }
}
