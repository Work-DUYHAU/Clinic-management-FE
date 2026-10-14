import { httpPost } from "./httpClient";

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
  data?: unknown;
}

export async function sendBhxhChungTu2025WithBackend(
  params: SendBhxhChungTu2025Params,
): Promise<SendBhxhChungTu2025Result> {
  const { fileBase64Str, loaiHs = "39", xmlContent, username } = params;

  if (!fileBase64Str && !xmlContent) {
    throw new Error("Không có nội dung tệp chứng từ để gửi lên Cổng BHXH.");
  }

  try {
    return await httpPost<SendBhxhChungTu2025Result>(
      "/ho-so/chung-tu-tt25/gui-cong",
      {
        fileBase64Str,
        loaiHs,
        xmlContent,
        username,
      },
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Lỗi kết nối gửi chứng từ TT25 lên Cổng BHXH";
    return {
      success: false,
      statusCode: 500,
      maKetQua: "500",
      thongDiep: errorMsg,
    };
  }
}

