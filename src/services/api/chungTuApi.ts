import { BACKEND_BASE_URL } from "./client";

export interface SendBhxhChungTu2025Params {
  fileBase64Str: string;
  loaiHs?: string;
  xmlContent?: string;
  username?: string;
}

export interface SendBhxhChungTu2025Result {
  success: boolean;
  statusCode: number;
  maKetQua: string;
  thongDiep: string;
  ghiChu?: string;
  maGiaoDich?: string;
  data?: any;
}

export async function sendBhxhChungTu2025WithBackend(
  params: SendBhxhChungTu2025Params,
): Promise<SendBhxhChungTu2025Result> {
  const { fileBase64Str, loaiHs = "39", xmlContent, username } = params;

  if (!fileBase64Str && !xmlContent) {
    throw new Error("Không có nội dung tệp chứng từ để gửi lên Cổng BHXH.");
  }

  const endpoint = `${BACKEND_BASE_URL}/ho-so/chung-tu-tt25/gui-cong`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileBase64Str,
      loaiHs,
      xmlContent,
      username,
    }),
  });

  const resJson = await response.json();
  if (!response.ok) {
    return {
      success: false,
      statusCode: response.status,
      maKetQua: String(resJson.maKetQua || response.status),
      thongDiep:
        resJson.thongDiep ||
        resJson.message ||
        `Lỗi gửi Cổng BHXH (Mã ${response.status})`,
      ghiChu: resJson.ghiChu,
      maGiaoDich: resJson.maGiaoDich,
    };
  }

  return resJson;
}
