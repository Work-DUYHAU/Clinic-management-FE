export type SmartCaEnv = "demo" | "production";

/** Endpoint gốc theo môi trường (Mục 2 - Giao thức API) */
export interface SmartCaEndpoints {
  authorize: string;
  token: string;
  resource: string;
  sp769: string;
}

const isDev = import.meta.env.DEV;

export const SMARTCA_ENDPOINTS: Record<SmartCaEnv, SmartCaEndpoints> = {
  demo: {
    authorize: isDev
      ? "/api-smartca-demo/auth/authorize"
      : "https://rmgateway.vnptit.vn/auth/authorize",
    token: isDev
      ? "/api-smartca-demo/auth/token"
      : "https://rmgateway.vnptit.vn/auth/token",
    resource: isDev ? "/api-smartca-demo" : "https://rmgateway.vnptit.vn",
    sp769: isDev ? "/api-smartca-sp769" : "https://rmgateway.vnptit.vn/sca/sp769",
  },
  production: {
    authorize: isDev
      ? "/api-smartca-prod/auth/authorize"
      : "https://gwsca.vnpt.vn/auth/authorize",
    token: isDev
      ? "/api-smartca-prod/auth/token"
      : "https://gwsca.vnpt.vn/auth/token",
    resource: isDev ? "/api-smartca-prod" : "https://gwsca.vnpt.vn",
    sp769: isDev ? "/api-smartca-sp769" : "https://gwsca.vnpt.vn/sca/sp769",
  },
};

// ------------------------------------------------------------
// OAuth2 Token (Mục 3 - Token Authorization)
// ------------------------------------------------------------

export interface SmartCaTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // giây
  scope: string;
}

export interface SmartCaTokenPair {
  accessToken: string;
  refreshToken: string;
  /** Unix ms khi access_token hết hạn (trừ biên an toàn 60s) */
  accessTokenExpiresAt: number;
}

// ------------------------------------------------------------
// Thông tin người dùng (5.1.1 Userinfo)
// ------------------------------------------------------------

export interface SmartCaUserInfo {
  accType: number; // 0 cá nhân, 1 doanh nghiệp, 2 cá nhân trong DN, 3 Onetime CA
  uid: string;
  uidPre?: string;
  email?: string;
  phone?: string;
}

// ------------------------------------------------------------
// Credential (5.2.1 List credential / 5.2.2 Credential Info)
// ------------------------------------------------------------

export interface SmartCaCredentialKeyInfo {
  status: string;
  alg: string[];
  len: number;
}

export interface SmartCaCredentialCertInfo {
  status: string;
  serialNumber: string;
  subjectDN: string;
  issuerDN: string;
  certificates: string[]; // base64 DER chain
  validFrom: string;
  validTo: string;
  rsaModulus?: string;
  rsaExponent?: string;
}

export interface SmartCaServicePack {
  servicePackId: string;
  name: string;
  type: number;
  status: number;
  admin?: {
    uid: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface SmartCaCredential {
  credentialId: string;
  key?: SmartCaCredentialKeyInfo;
  cert?: SmartCaCredentialCertInfo;
  authMode?: string;
  scal?: string;
  multisign?: number;
  status?: string;
  servicePacks?: SmartCaServicePack[];
  defaultServicePackId?: string;
  signType?: number;
}

// ------------------------------------------------------------
// Ký & Giao dịch (5.2.3 Sign / 5.2.4 Sign hash / 5.2.5 Get tran info)
// ------------------------------------------------------------

export interface SmartCaSignHashItem {
  name: string;
  /** SHA-256 digest, base64 chuẩn (vd: y4ahlQA4RZxb1Fh7V6dfK84ga3nnEecSdroDx1LmLGE=) */
  hash: string;
}

export interface SmartCaSignFileItem {
  name: string;
  dataBase64: string;
}

export interface SmartCaSignHashRequest {
  credentialId: string;
  refTranId?: string;
  notifyUrl?: string;
  description?: string;
  datas: SmartCaSignHashItem[]; // tối đa 50
}

export interface SmartCaSignFileRequest {
  credentialId: string;
  refTranId?: string;
  notifyUrl?: string;
  description?: string;
  datas: SmartCaSignFileItem[]; // tối đa 10
}

export interface SmartCaSignResponse {
  tranId: string;
}

/** Trạng thái giao dịch ký số (Mục 5.2.5) */
export const SMARTCA_TRAN_STATUS = {
  SUCCESS: 1,
  WAITING_FOR_SIGNER_CONFIRM: 4000,
  EXPIRED: 4001,
  SIGNER_REJECTED: 4002,
  AUTHORIZE_KEY_FAILED: 4003,
  SIGN_FAILED: 4004,
} as const;

export type SmartCaTranStatus =
  (typeof SMARTCA_TRAN_STATUS)[keyof typeof SMARTCA_TRAN_STATUS];

/** Nhãn hiển thị tiếng Việt theo mã trạng thái giao dịch */
export const SMARTCA_TRAN_STATUS_VI: Record<number, string> = {
  1: "Ký số thành công",
  4000: "Chờ người dùng xác nhận OTP trên app SmartCA",
  4001: "Giao dịch đã hết hạn",
  4002: "Người dùng từ chối xác nhận",
  4003: "Xác thực khóa authorize thất bại",
  4004: "Ký số thất bại",
};

export interface SmartCaSignedDocument {
  name: string;
  type?: string;
  size?: string;
  data?: string;
  hash?: string;
  sig?: string | null;
  dataSigned?: string | null;
  url?: string | null;
}

export interface SmartCaTransactionInfo {
  refTranId?: string;
  documents: SmartCaSignedDocument[];
  tranId: string;
  sub: string;
  credentialId: string;
  tranType: number;
  tranTypeDesc: string;
  tranStatus: number;
  tranStatusDesc: string;
  reqTime: string;
}

// ------------------------------------------------------------
// Envelope phản hồi chuẩn (Mục 4.2 Response)
// ------------------------------------------------------------

export interface SmartCaEnvelope<T = unknown> {
  code: number; // 0 = SUCCESS
  codeDesc: string | null;
  message: string | null;
  content: T | null;
}

// ------------------------------------------------------------
// Lỗi ứng dụng
// ------------------------------------------------------------

export class SmartCaError extends Error {
  /** Mã lỗi SmartCA (envelope code) hoặc mã OAuth2 (invalid_client, invalid_grant...) */
  readonly code: string | number;
  readonly codeDesc: string | null;

  constructor(
    message: string,
    code: string | number,
    codeDesc: string | null = null,
  ) {
    super(message);
    this.name = "SmartCaError";
    this.code = code;
    this.codeDesc = codeDesc;
  }
}

/** Ánh xạ lỗi OAuth2 400 -> thông điệp tiếng Việt */
export const SMARTCA_OAUTH_ERROR_VI: Record<string, string> = {
  invalid_client:
    "Sai thông tin App client (client_id / client_secret không đúng)",
  invalid_grant: "Sai thông tin tài khoản SmartCA (username hoặc password)",
  invalid_scope: 'Scope API không hợp lệ - cần phạm vi "sign offline_access"',
};

// ------------------------------------------------------------
// Kết quả ký ứng dụng (đính kèm hồ sơ khi gửi Cổng BHXH)
// ------------------------------------------------------------

export interface SmartCaSignatureResult {
  tranId: string;
  credentialId: string;
  serialNumber: string;
  subjectDN: string;
  signedAt: string; // ISO 8601
  signatures: Array<{ name: string; sig: string }>;
}

// ------------------------------------------------------------
// Client interface dùng cho VNPT SmartCA Client
// ------------------------------------------------------------

export interface SmartCaClient {
  login(username: string, password: string): Promise<SmartCaTokenPair>;
  refresh(refreshToken: string): Promise<SmartCaTokenPair>;
  getUserInfo(accessToken: string): Promise<SmartCaUserInfo>;
  listCredentials(accessToken: string): Promise<string[]>;
  getCredentialInfo(
    accessToken: string,
    credentialId: string,
  ): Promise<SmartCaCredential>;
  signHash(
    accessToken: string,
    request: SmartCaSignHashRequest,
  ): Promise<SmartCaSignResponse>;
  sign?(
    accessToken: string,
    request: SmartCaSignFileRequest,
  ): Promise<SmartCaSignResponse>;
  getTransactionInfo(
    accessToken: string,
    tranId: string,
  ): Promise<SmartCaTransactionInfo>;
}

// ------------------------------------------------------------
// Ký Số Theo Chức Danh / Từng Thành Viên Đơn Vị (Cách 2)
// ------------------------------------------------------------

export type SignerRole =
  | "BAC_SI"
  | "NGUOI_LAP"
  | "TRUONG_KHOA"
  | "THU_TRUONG"
  | "DON_VI";

export interface SignerProfile {
  id: string;
  name: string;
  role: SignerRole;
  roleTitle: string; // "Bác sĩ điều trị", "Kế toán viện phí", "Giám đốc phòng khám", "Chữ ký đơn vị"
  cchn?: string; // Mã chứng chỉ hành nghề (nếu là bác sĩ)
  cccd: string; // Số CCCD / Định danh nhận SmartCA
  phone: string; // Số điện thoại nhận OTP / Push App SmartCA
  mst?: string; // Mã số thuế (nếu ký với tư cách Đơn vị / Cơ sở KCB / Doanh nghiệp)
  email?: string;
  department?: string; // Khoa / Phòng ban
  subjectDN: string;
  serialNumber: string;
}

export const DEFAULT_CLINIC_SIGNERS: SignerProfile[] = [];
