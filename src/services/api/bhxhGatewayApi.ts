import { httpPost, httpGet } from "./httpClient";

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
  data?: unknown;
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
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    base64 = btoa(binary);
  }

  if (!base64) {
    throw new Error("Không có dữ liệu tệp PDF để gửi lên Cổng BHXH.");
  }

  return await httpPost<SendBhxhGiayToDienTuResult>(
    "/bhxh/gui-giay-to-dien-tu",
    {
      fileBase64Str: base64,
      loaiHs,
      maLienThong,
      maCskcb,
    },
  );
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
    return await httpGet<BhxhGatewayStatusInfo>("/bhxh/status");
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
