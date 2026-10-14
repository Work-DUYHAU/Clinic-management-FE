import type {
  SignaturePosition,
  KyHoSoSignatureMeta,
} from "../../components/ky-ho-so/types";
import { BACKEND_BASE_URL, urlToDataUrl } from "./client";

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

export interface SignXmlWithBackendParams {
  rawXml: string;
  fileName?: string;
  signatureFormat?: "standard" | "compact" | "enveloped" | "q2-vnpt";
  targetDataId?: string;
  userId?: string;
  signal?: AbortSignal;
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

export async function signXmlWithBackend(
  params: SignXmlWithBackendParams,
): Promise<SignXmlWithBackendResult> {
  const {
    rawXml,
    fileName = "HSTH01BH.xml",
    signatureFormat = "standard",
    targetDataId,
    userId,
    signal,
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
    signal,
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

export interface SmartCaCertificateInfo {
  serialNumber: string;
  issuer: string;
  signerName: string;
  certSubject: string;
  x509Certificate?: string;
  validFrom?: string;
  validTo?: string;
}

export interface SmartCaSignResponse {
  success: boolean;
  tranId: string;
  tranCode?: string;
  status?: number;
  signatureValue: string;
  subjectDN: string;
  serialNumber: string;
  issuerDN: string;
  x509Certificate: string;
  rsaModulus?: string;
  rsaExponent?: string;
  signedAt: string;
  digestValue: string;
  signedXml?: string;
  signer?: any;
  error?: string;
}

export interface SmartCaQ1InitiateResponse {
  success: boolean;
  tranId: string;
  accessToken?: string;
  credentialId?: string;
  status: number;
  subjectDN: string;
  serialNumber: string;
  issuerDN: string;
  x509Certificate: string;
  rsaModulus?: string;
  rsaExponent?: string;
  digestValue: string;
  signedInfoDigest?: string;
  signer?: any;
  error?: string;
}

export async function getSmartCaCertificateWithBackend(
  userId?: string,
): Promise<SmartCaCertificateInfo> {
  const url = new URL(`${BACKEND_BASE_URL}/smart-ca/certificate`);
  if (userId) url.searchParams.set("userId", userId);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Không thể lấy thông tin chứng thư số.");
  }
  return data;
}

export interface InitiateSignQ1Params {
  rawXml: string;
  fileName?: string;
  username?: string;
  password?: string;
  signer?: any;
  signal?: AbortSignal;
}

export async function initiateSignQ1WithBackend(
  params: InitiateSignQ1Params,
): Promise<SmartCaQ1InitiateResponse> {
  const {
    rawXml,
    fileName = "document.xml",
    username,
    password,
    signer,
    signal,
  } = params;

  const endpoint = `${BACKEND_BASE_URL}/smart-ca/q1/initiate`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      rawXml,
      fileName,
      username,
      password,
      signer,
    }),
  });

  const resJson = await response.json();
  if (!response.ok || !resJson.success) {
    return {
      success: false,
      tranId: "",
      status: 0,
      subjectDN: "",
      serialNumber: "",
      issuerDN: "",
      x509Certificate: "",
      digestValue: "",
      error: resJson.message || `Lỗi khởi tạo ký số Q1 (Mã ${response.status})`,
    };
  }

  return {
    success: true,
    tranId: resJson.tranId,
    status: resJson.status,
    subjectDN: resJson.subjectDN,
    serialNumber: resJson.serialNumber,
    issuerDN: resJson.issuerDN,
    x509Certificate: resJson.x509Certificate,
    digestValue: resJson.digestValue,
    signedInfoDigest: resJson.signedInfoDigest,
    signer: resJson.signer,
  };
}

export interface CheckSignStatusQ1Params {
  tranId: string;
  rawXml?: string;
  signal?: AbortSignal;
}

export async function checkSignStatusQ1WithBackend(
  params: CheckSignStatusQ1Params,
): Promise<SmartCaSignResponse> {
  const { tranId, rawXml, signal } = params;

  const endpoint = `${BACKEND_BASE_URL}/smart-ca/q1/check-status`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      tranId,
      rawXml,
    }),
  });

  const resJson = await response.json();
  if (!response.ok) {
    throw new Error(
      resJson.message ||
        `Lỗi kiểm tra trạng thái ký số (Mã ${response.status})`,
    );
  }

  if (resJson.success && resJson.signedXml) {
    return {
      success: true,
      tranId: resJson.tranId || tranId,
      tranCode: "00",
      status: resJson.status,
      signatureValue: resJson.signatureValue || "",
      subjectDN: resJson.meta?.signerName || "",
      serialNumber: resJson.meta?.certSerial || "",
      issuerDN: resJson.meta?.caProvider || "VNPT-CA",
      x509Certificate: "",
      signedAt: resJson.meta?.signTime || new Date().toISOString(),
      digestValue: resJson.meta?.digestValue || "",
      signedXml: resJson.signedXml,
      signer: resJson.meta,
    };
  }

  return {
    success: false,
    status: resJson.status ?? 4000,
    tranId,
    signatureValue: "",
    subjectDN: "",
    serialNumber: "",
    issuerDN: "",
    x509Certificate: "",
    signedAt: "",
    digestValue: "",
    error: resJson.error || resJson.message,
  };
}
