import { BACKEND_BASE_URL } from "./client";

export interface SendBhxhGiayToDienTuParams {
  pdfBlobOrFile?: Blob | File;
  fileBase64Str?: string;
  loaiHs?: string;
  maLienThong?: string;
  maCskcb?: string;
}

export interface SendBhxhGiayToDienTuResult {
  success: boolean;
  statusCode: number;
  maKetQua: string;
  thongDiep: string;
  ghiChu?: string;
  maGiaoDich?: string;
  data?: any;
}

export async function sendBhxhGiayToDienTuWithBackend(
  params: SendBhxhGiayToDienTuParams,
): Promise<SendBhxhGiayToDienTuResult> {
  const {
    pdfBlobOrFile,
    fileBase64Str,
    loaiHs = "60",
    maLienThong,
    maCskcb,
  } = params;

  let base64 = fileBase64Str || "";
  if (!base64 && pdfBlobOrFile) {
    const arrayBuffer = await pdfBlobOrFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }

  if (!base64) {
    throw new Error("Không có dữ liệu tệp PDF để gửi lên Cổng BHXH.");
  }

  const endpoint = `${BACKEND_BASE_URL}/bhxh/gui-giay-to-dien-tu`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileBase64Str: base64,
      loaiHs,
      maLienThong,
      maCskcb,
    }),
  });

  const resJson = await response.json();
  return resJson;
}

export interface BhxhGatewayStatusInfo {
  connected: boolean;
  message: string;
  env?: string;
  baseUrl?: string;
  username?: string;
  maCskcb?: string;
  maTinh?: string;
  hasToken?: boolean;
}

export async function getBhxhGatewayStatusInfo(): Promise<BhxhGatewayStatusInfo> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/bhxh/status`);
    if (!res.ok) {
      return {
        connected: false,
        message: `Lỗi kết nối Backend (Mã ${res.status})`,
      };
    }
    return await res.json();
  } catch (err) {
    return {
      connected: false,
      message:
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến máy chủ Backend",
    };
  }
}
