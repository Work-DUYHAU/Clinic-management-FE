import { SMARTCA_ENDPOINTS } from "../../../types/smartcaTypes";
import {
  SMARTCA_ENV,
  SMARTCA_SP_ID,
  SMARTCA_SP_PASSWORD,
  SMARTCA_USER_ID,
  SMARTCA_DEFAULT_PASSWORD,
} from "../smartcaConfig";
import type {
  SmartCaV2GetCertResponse,
  SmartCaV2SignResponse,
  SmartCaV2ConfirmResponse,
  SmartCaV2UserCert,
} from "./smartcaQ2Types";

export interface SmartCaThClientConfig {
  spId?: string;
  spPassword?: string;
  env?: "demo" | "production";
}

export class SmartCaThError extends Error {
  statusCode?: number;
  httpStatus?: number;

  constructor(message: string, statusCode?: number, httpStatus?: number) {
    const codePrefix = statusCode ? `[SMARTCA-TH ${statusCode}] ` : "";
    super(`${codePrefix}${message}`);
    this.name = "SmartCaThError";
    this.statusCode = statusCode;
    this.httpStatus = httpStatus;
  }
}

export class SmartCaThClient {
  private spId: string;
  private spPassword: string;
  private baseUrl: string;

  constructor(config?: SmartCaThClientConfig) {
    const env = config?.env || SMARTCA_ENV;
    this.spId = config?.spId || SMARTCA_SP_ID;
    this.spPassword = config?.spPassword || SMARTCA_SP_PASSWORD;
    this.baseUrl = SMARTCA_ENDPOINTS[env].sp769;
  }

  //Bước 1: Lấy thông tin chứng thư số và số serial của thuê bao
  async getCertificate(
    userId?: string,
    serialNumber?: string,
  ): Promise<{
    userCert: SmartCaV2UserCert;
    allCerts: SmartCaV2UserCert[];
  }> {
    const finalUserId = (userId || SMARTCA_USER_ID).trim();
    if (!finalUserId) {
      throw new SmartCaThError(
        "Chưa cung cấp mã định danh người ký (user_id / MST / CCCD).",
      );
    }

    const payload = {
      sp_id: this.spId,
      sp_password: this.spPassword,
      user_id: finalUserId,
      serial_number: serialNumber || "",
      transaction_id: `SP_CA_${crypto.randomUUID()}`,
    };

    const res = await fetch(`${this.baseUrl}/v1/credentials/get_certificate`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    let data: SmartCaV2GetCertResponse;
    try {
      data = await res.json();
    } catch {
      throw new SmartCaThError(
        `Lỗi kết nối cổng get_certificate (HTTP ${res.status}).`,
        undefined,
        res.status,
      );
    }

    if (data.status_code !== 200 || !data.data?.user_certificates?.length) {
      throw new SmartCaThError(
        data.message || "Không tìm thấy chứng thư số hợp lệ của thuê bao.",
        data.status_code,
        res.status,
      );
    }

    const allCerts = data.data.user_certificates;
    // Ưu tiên chứng thư đang hoạt động
    const activeCert =
      allCerts.find(
        (c) =>
          !c.cert_status ||
          String(c.cert_status).toLowerCase().includes("hoạt động") ||
          String(c.cert_status) === "1",
      ) || allCerts[0];

    return {
      userCert: activeCert,
      allCerts,
    };
  }

  // Bước 2: Gửi yêu cầu ký số dữ liệu kèm mã OTP để lấy chuỗi SAD
  async signHash(params: {
    userId?: string;
    password?: string;
    otp: string;
    serialNumber: string;
    hashHex: string;
    fileName?: string;
    docId?: string;
    transactionDesc?: string;
    abortSignal?: AbortSignal;
  }): Promise<{
    transactionId: string;
    sad: string;
  }> {
    const finalUserId = (params.userId || SMARTCA_USER_ID).trim();
    const finalPassword = params.password || SMARTCA_DEFAULT_PASSWORD;
    const finalDocId = params.docId || `doc-${crypto.randomUUID()}`;
    const txId = crypto.randomUUID();

    const payload = {
      sp_id: this.spId,
      sp_password: this.spPassword,
      user_id: finalUserId,
      password: finalPassword,
      otp: params.otp.trim(),
      transaction_id: txId,
      transaction_desc:
        params.transactionDesc ||
        `Ký số Q2 XML - ${params.fileName || "HoSo.xml"}`,
      serial_number: params.serialNumber,
      sign_files: [
        {
          file_type: "xml",
          data_to_be_signed: params.hashHex.trim(), // CHUỖI HEX 64 KÝ TỰ
          doc_id: finalDocId,
          sign_type: "hash",
        },
      ],
    };

    const res = await fetch(`${this.baseUrl}/v2/signatures/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: params.abortSignal,
    });

    let data: SmartCaV2SignResponse;
    try {
      data = await res.json();
    } catch {
      throw new SmartCaThError(
        `Lỗi kết nối cổng v2/signatures/sign (HTTP ${res.status}).`,
        undefined,
        res.status,
      );
    }

    if (data.status_code !== 200 || !data.data?.sad) {
      throw new SmartCaThError(
        data.message ||
          "Khởi tạo chữ ký số V2 không thành công (thiếu SAD token).",
        data.status_code,
        res.status,
      );
    }

    return {
      transactionId: data.data.transaction_id || txId,
      sad: data.data.sad,
    };
  }

  //Bước 3: Xác nhận giao dịch ký số bằng chuỗi SAD để nhận chữ ký số ngay lập tức
  async confirmSign(params: {
    userId?: string;
    password?: string;
    transactionId: string;
    sad: string;
    abortSignal?: AbortSignal;
  }): Promise<{
    signatureValue: string;
    docId?: string;
  }> {
    const finalUserId = (params.userId || SMARTCA_USER_ID).trim();
    const finalPassword = params.password || SMARTCA_DEFAULT_PASSWORD;

    const payload = {
      sp_id: this.spId,
      sp_password: this.spPassword,
      user_id: finalUserId,
      password: finalPassword,
      transaction_id: params.transactionId,
      sad: params.sad,
    };

    const res = await fetch(`${this.baseUrl}/v2/signatures/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: params.abortSignal,
    });

    let data: SmartCaV2ConfirmResponse;
    try {
      data = await res.json();
    } catch {
      throw new SmartCaThError(
        `Lỗi kết nối cổng v2/signatures/confirm (HTTP ${res.status}).`,
        undefined,
        res.status,
      );
    }

    if (
      data.status_code !== 200 ||
      !data.data?.signatures ||
      data.data.signatures.length === 0
    ) {
      throw new SmartCaThError(
        data.message ||
          "Xác nhận chữ ký số V2 thất bại (không nhận được signatures).",
        data.status_code,
        res.status,
      );
    }

    const firstSig = data.data.signatures[0];
    if (!firstSig.signature_value) {
      throw new Error("Chuỗi signature_value trả về rỗng.");
    }

    return {
      signatureValue: firstSig.signature_value,
      docId: firstSig.doc_id,
    };
  }
}
