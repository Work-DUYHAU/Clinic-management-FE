import { BACKEND_BASE_URL } from "./client";

export interface SendBhxhHoSo01Params {
  fileBase64Str?: string;
  xmlContent?: string;
  loaiHs?: string;
  kyQT?: string;
  maCskcb?: string;
  maTinh?: string;
  tranId?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo01Result {
  success: boolean;
  statusCode: number;
  maKetQua: string;
  thongDiep: string;
  ghiChu?: string;
  maGiaoDich?: string;
  data?: any;
}

export async function sendBhxhHoSo01WithBackend(
  params: SendBhxhHoSo01Params,
): Promise<SendBhxhHoSo01Result> {
  const {
    fileBase64Str,
    xmlContent,
    loaiHs = "5",
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

  const endpoint = `${BACKEND_BASE_URL}/bhxh/gui-ho-so-tong-hop-01`;
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
