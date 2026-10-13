import type { SignaturePosition, KyHoSoSignatureMeta } from "../components/ky-ho-so/types";

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api";

/**
 * Chuyển đổi URL hình ảnh (ảnh tĩnh / assets / blob) sang DataURL Base64
 */
export async function urlToDataUrl(url?: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Không thể chuyển đổi URL sang DataURL:", url, err);
    return "";
  }
}

export interface SignPdfWithBackendParams {
  pdfBlobOrFile: Blob | File;
  fileName?: string;
  positions: SignaturePosition[];
  stampImageUrl?: string;
  signatureImageUrl?: string;
  userId?: string;
}

export interface SignPdfWithBackendResult {
  success: boolean;
  statusCode: number;
  message: string;
  meta: KyHoSoSignatureMeta;
  signedPdfBase64: string;
}

/**
 * 1. Gọi Backend để thực hiện Ký số SmartCA và dán con dấu + chữ ký vào PDF
 */
export async function signPdfWithBackend(
  params: SignPdfWithBackendParams,
): Promise<SignPdfWithBackendResult> {
  const {
    pdfBlobOrFile,
    fileName = "document.pdf",
    positions,
    stampImageUrl,
    signatureImageUrl,
    userId,
  } = params;

  // 1. Chuyển đổi con dấu và chữ ký sang Base64 nếu có
  const [stampBase64, signatureBase64] = await Promise.all([
    urlToDataUrl(stampImageUrl),
    urlToDataUrl(signatureImageUrl),
  ]);

  const formData = new FormData();
  formData.append("file", pdfBlobOrFile, fileName);
  formData.append("positions", JSON.stringify(positions || []));

  if (stampBase64) formData.append("stampBase64", stampBase64);
  if (signatureBase64) formData.append("signatureBase64", signatureBase64);
  if (userId) formData.append("userId", userId);

  const endpoint = `${BACKEND_BASE_URL}/smart-ca/sign`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const resJson = await response.json();
  if (!response.ok || !resJson.success) {
    throw new Error(
      resJson.message || `Lỗi ký số Backend (Mã lỗi ${response.status})`,
    );
  }

  return resJson;
}

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

/**
 * 2. Gọi Backend gửi Giấy tờ điện tử / Hồ sơ PDF đã ký lên Cổng BHXH (Mã loại HS 60, 61)
 */
export async function sendBhxhGiayToDienTuWithBackend(
  params: SendBhxhGiayToDienTuParams,
): Promise<SendBhxhGiayToDienTuResult> {
  const { pdfBlobOrFile, fileBase64Str, loaiHs = "60", maLienThong, maCskcb } = params;

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

export interface SignXmlWithBackendParams {
  rawXml: string;
  fileName?: string;
  signatureFormat?: "standard" | "compact" | "enveloped" | "q2-vnpt";
  targetDataId?: string;
  userId?: string;
}

export interface SignXmlWithBackendResult {
  success: boolean;
  statusCode: number;
  message: string;
  signedXml: string;
  meta: KyHoSoSignatureMeta & {
    signatureValue?: string;
    digestValue?: string;
    isXmlSigned?: boolean;
  };
  signatureId?: string;
}

/**
 * 3. Gọi Backend để thực hiện Ký số XML SmartCA (Chuẩn W3C XMLDSig / QĐ 130 / Phụ lục 02)
 */
export async function signXmlWithBackend(
  params: SignXmlWithBackendParams,
): Promise<SignXmlWithBackendResult> {
  const {
    rawXml,
    fileName = "HSTH01BH.xml",
    signatureFormat = "standard",
    targetDataId,
    userId,
  } = params;

  if (!rawXml || !rawXml.trim()) {
    throw new Error("Không có nội dung XML để thực hiện ký số.");
  }

  const endpoint = `${BACKEND_BASE_URL}/smart-ca/sign-xml`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rawXml,
      fileName,
      signatureFormat,
      targetDataId,
      userId,
    }),
  });

  const resJson = await response.json();
  if (!response.ok || !resJson.success) {
    throw new Error(
      resJson.message || `Lỗi ký số XML Backend (Mã lỗi ${response.status})`,
    );
  }

  return resJson;
}

export interface SendBhxhHoSo01Params {
  fileBase64Str?: string;
  xmlContent?: string;
  loaiHs?: string;
  kyQT?: string;
  maCskcb?: string;
  maTinh?: string;
  tranId?: string;
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

/**
 * 4. Gọi Backend gửi Hồ sơ tổng hợp 01/BH lên Cổng BHXH (Loại HS 5: GuiHoSoTongHop01BH)
 */
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
