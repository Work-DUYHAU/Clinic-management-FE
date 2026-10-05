import type { SignerProfile } from "../../../types/smartcaTypes";
import type { SmartCaSignResponse } from "../smartcaHandlers";

export interface WaitingQ2Transaction {
  transactionId: string; /** Mã giao dịch SmartCA cấp cho phiên ký */
  documentDigest: string; /** Chuỗi DigestValue SHA-256 của khối dữ liệu XML gốc (DÙNG ĐỂ INJECT VÀO REFERENCE) */
  signedInfoDigest: string; /** Chuỗi mã băm SHA-256 của thẻ SignedInfo (ĐÃ GỬI LÊN SMARTCA ĐỂ KÝ BẰNG PRIVATE KEY) */
  rawXml: string; /** Nội dung XML gốc chưa ký */
  fileName?: string; /** Tên file XML (nếu có) */
  /** Thông tin chứng thư số công khai từ SmartCA */
  certInfo: {
    subjectDN: string;
    serialNumber: string;
    issuerDN: string;
    x509Certificate: string;
    rsaModulus?: string;
    rsaExponent?: string;
  };
  signer?: SignerProfile; /** Thông tin người ký số */
  accessToken?: string; /** Access Token dùng cho các API tiếp theo */
  credentialId?: string; /** Credential ID của chứng thư số */
  userId?: string; /** Mã định danh người ký (V2) */
  password?: string; /** Mật khẩu người ký (V2) */
  signedInfoHex?: string; /** Chuỗi Hex 64 ký tự của SignedInfo Digest (V2) */
  initiatedAt: number; /** Thời điểm khởi tạo giao dịch (timestamp ms) */
  expiresInSeconds?: number; /** Thời gian sống của giao dịch (giây) */
}

/**
 * Tham số yêu cầu khởi tạo giao dịch ký số Q2
 */
export interface SmartCaQ2InitiateRequest {
  rawXml: string;
  documentDigest?: string;
  fileName?: string;
  signer?: SignerProfile;
  idType?: "phone" | "cccd" | "mst";
  identityValue?: string;
  password?: string;
  totpSecret?: string;
  otp?: string;
  abortSignal?: AbortSignal;
}

/**
 * Kết quả sau khi khởi tạo giao dịch ký số Q2
 */
export interface SmartCaQ2InitiateResult {
  success: boolean;
  waitingTx?: WaitingQ2Transaction;
  error?: string;
}

/**
 * Tham số ủy quyền ký bằng mã TOTP Smart OTP (Bước 4)
 */
export interface SmartCaQ2AuthorizeRequest {
  transactionId: string;
  totpCode: string;
  accessToken?: string;
  credentialId?: string;
  signedInfoDigest?: string;
  fileName?: string;
  userId?: string;
  password?: string;
  serialNumber?: string;
  signedInfoHex?: string;
}

/**
 * Kết quả phản hồi từ Cổng SmartCA khi xác nhận mã TOTP
 */
export interface SmartCaQ2AuthorizeResult {
  success: boolean;
  signatures?: string[]; /** Danh sách chữ ký (theo chuẩn CSC signatures array) */
  signatureValue?: string; /** Chữ ký đơn (SignatureValue base64) */
  x509Certificate?: string; /** Chứng thư số công khai kèm theo */
  error?: string; /** Thông báo lỗi nếu thất bại */
  errorCode?: string; /** Mã lỗi chi tiết từ VNPT SmartCA */
  canRetryOtp?: boolean; /** Cho biết có thể thử lại OTP trên cùng transaction này hay không */
  isExpired?: boolean; /** Cho biết giao dịch đã hết hạn hoàn toàn, cần tạo lại giao dịch mới */
}

/**
 * Kết quả hoàn chỉnh sau khi ký và nhúng chữ ký vào XML (Q2)
 */
export interface SmartCaQ2SignAndInjectResult {
  success: boolean;
  signedXml: string;
  signResponse: SmartCaSignResponse;
  error?: string;
}

export interface SmartCaV2UserCert {
  service_type?: string;
  service_name?: string;
  cert_id: string;
  cert_data: string; // Chứng thư X.509 Base64
  serial_number: string;
  cert_subject?: string;
  cert_valid_from?: string;
  cert_valid_to?: string;
  cert_status?: string | number;
}

export interface SmartCaV2GetCertResponse {
  status_code: number;
  message: string;
  data?: {
    user_certificates?: SmartCaV2UserCert[];
  };
}

export interface SmartCaV2SignItem {
  file_type: "xml" | "json" | "word" | "pdf";
  data_to_be_signed: string; // HEX STRING đối với hash (64 ký tự) theo tài liệu V2
  doc_id: string;
  sign_type: "hash" | "file";
}

export interface SmartCaV2SignResponse {
  status_code: number;
  message: string;
  data?: {
    transaction_id: string;
    tran_code?: string;
    sad: string; // JWT token Signature Activation Data
    expired_in?: number;
  };
}

export interface SmartCaV2ConfirmResponse {
  status_code: number;
  message: string;
  data?: {
    transaction_id: string;
    expired_in?: number;
    signatures?: Array<{
      doc_id: string;
      signature_value: string; // Base64 signature
      timestamp_signature?: string | null;
    }>;
  };
}
