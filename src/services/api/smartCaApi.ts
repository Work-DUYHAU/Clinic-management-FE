import type {
  SignaturePosition,
  KyHoSoSignatureMeta,
} from "../../components/ky-ho-so/types";
import { urlToDataUrl, httpPost, httpPostForm, httpGet } from "../http";

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

  return await httpPostForm<SignPdfWithBackendResult>(
    "/smart-ca/sign",
    formData,
  );
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

  return await httpPost<SignXmlWithBackendResult>(
    "/smart-ca/sign-xml",
    {
      rawXml,
      fileName,
      signatureFormat,
      targetDataId,
      userId,
    },
    { signal },
  );
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
  signer?: unknown;
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
  signer?: unknown;
  error?: string;
}

export async function getSmartCaCertificateWithBackend(
  userId?: string,
): Promise<SmartCaCertificateInfo> {
  const endpoint = `/smart-ca/certificate${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;
  return await httpGet<SmartCaCertificateInfo>(endpoint);
}

export interface InitiateSignQ1Params {
  rawXml: string;
  fileName?: string;
  username?: string;
  password?: string;
  signer?: unknown;
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

  try {
    const resJson = await httpPost<SmartCaQ1InitiateResponse>(
      "/smart-ca/q1/initiate",
      {
        rawXml,
        fileName,
        username,
        password,
        signer,
      },
      { signal },
    );

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
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Lỗi khởi tạo ký số Q1";
    return {
      success: false,
      tranId: "",
      status: 0,
      subjectDN: "",
      serialNumber: "",
      issuerDN: "",
      x509Certificate: "",
      digestValue: "",
      error: errorMsg,
    };
  }
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

  const resJson = await httpPost<
    SmartCaSignResponse & {
      meta?: KyHoSoSignatureMeta & { digestValue?: string };
      message?: string;
    }
  >(
    "/smart-ca/q1/check-status",
    {
      tranId,
      rawXml,
    },
    { signal },
  );

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
