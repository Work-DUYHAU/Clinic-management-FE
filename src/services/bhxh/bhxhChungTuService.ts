import type {
  BhxhTokenRequest,
  BhxhTokenResponse,
  BhxhSendChungTuRequest,
  BhxhSendChungTuResponse,
  BhxhSendGiayToDienTuRequest,
  BhxhSendGiayToDienTuResponse,
} from "../../types/tt25ChungTuTypes";

export type BhxhEnv = "sandbox" | "production";

// Config endpoints theo Phụ lục 02 (2025) & biến môi trường .env
export const BHXH_CONFIG = {
  ENV: (import.meta.env.VITE_BHXH_ENV || "production") as BhxhEnv,
  BASE_URL:
    import.meta.env.VITE_BHXH_BASE_URL || "https://egw.baohiemxahoi.gov.vn",
  USERNAME: import.meta.env.VITE_BHXH_USERNAME || "49939_BV",
  PASSWORD: import.meta.env.VITE_BHXH_PASSWORD || "",
  ENDPOINTS: {
    TAKE_TOKEN: "/api/token/take",
    GUI_HO_SO_CHUNG_TU_2025: "/api/chungtugw/GuiHoSoChungTu2025", // Mã 39
    GUI_GIAY_TO_DIEN_TU: "/api/hososuckhoe/guiGiayToDienTu", // Mã 60, 61
    // Các endpoint danh mục và hồ sơ chuẩn theo QĐ-BHXH (2026):
    GUI_DANH_MUC_01_BPCMKBCB: "/api/DanhMucGW/GuiDanhMuc01_BPCMKBCB", // Loại HS 70
    GUI_DANH_MUC_02_NLKCB: "/api/DanhMucGW/GuiDanhMuc02_NLKCB", // Loại HS 71
    GUI_DANH_MUC_03_DMTHUOC: "/api/DanhMucGW/GuiDanhMuc03_DMTHUOC", // Loại HS 10
    GUI_DANH_MUC_04_DMVTYT: "/api/DanhMucGW/GuiDanhMuc04_DMVTYT", // Loại HS 11
    GUI_DANH_MUC_05_DVKT: "/api/DanhMucGW/GuiDanhMuc05_DVKT", // Loại HS 12
    GUI_DANH_MUC_06_DMTBYT: "/api/DanhMucGW/GuiDanhMuc06_DMTBYT", // Loại HS 72
    GUI_HO_SO_TONG_HOP_01BH: "/api/HoSoTongHop7980/GuiHoSoTongHop01BH", // Loại HS 5
    GUI_HO_SO_DIEU_CHINH_09BH: "/api/HSDCTT12/GuiHoSoDieuChinh09BH", // Loại HS 73
  },
};

import { formatBhxhPassword } from "../../utils/crypto/md5";

interface CachedBhxhToken {
  tokenResponse: BhxhTokenResponse;
  fetchedAt: number;
  expiresAt: number;
  username: string;
  passwordHash: string;
  env: BhxhEnv;
}

export class BhxhChungTuService {
  private static cachedToken: CachedBhxhToken | null = null;
  private static lastTokenRequestTime = 0;

  /**
   * Xóa bộ nhớ đệm Token phiên làm việc (khi đổi tài khoản hoặc token bị hết hạn)
   */
  static clearTokenCache(): void {
    BhxhChungTuService.cachedToken = null;
  }

  /**
   * Lấy Token phiên làm việc đang có hiệu lực trong bộ nhớ đệm (nếu có)
   */
  static getCachedToken(): BhxhTokenResponse | null {
    if (
      BhxhChungTuService.cachedToken &&
      Date.now() < BhxhChungTuService.cachedToken.expiresAt - 60000
    ) {
      return { ...BhxhChungTuService.cachedToken.tokenResponse };
    }
    return null;
  }

  /**
   * Xác định URL cổng BHXH dựa trên môi trường được yêu cầu:
   * - Nếu cấu hình VITE_BHXH_BASE_URL (proxy hoặc URL tùy chỉnh) thì ưu tiên sử dụng
   * - Ngược lại: 'sandbox' -> Cổng Test (https://gdbhyt.baohiemxahoi.gov.vn), 'production' -> Cổng Thật (https://egw.baohiemxahoi.gov.vn)
   */
  static getBaseUrl(env?: BhxhEnv): string {
    const targetEnv = env || BHXH_CONFIG.ENV;
    if (import.meta.env.VITE_BHXH_BASE_URL) {
      return import.meta.env.VITE_BHXH_BASE_URL;
    }
    return targetEnv === "sandbox"
      ? "https://gdbhyt.baohiemxahoi.gov.vn"
      : "https://egw.baohiemxahoi.gov.vn";
  }

  static async takeToken(
    req?: Partial<BhxhTokenRequest>,
    env: BhxhEnv = BHXH_CONFIG.ENV,
    forceRefresh = false,
  ): Promise<BhxhTokenResponse> {
    try {
      const username = (req?.username || "").trim() || BHXH_CONFIG.USERNAME;
      const rawPassword = (req?.password || "").trim() || BHXH_CONFIG.PASSWORD;

      if (!username || !rawPassword) {
        return {
          maKetQua: "401",
          thongDiep:
            "Chưa cấu hình VITE_BHXH_USERNAME hoặc VITE_BHXH_PASSWORD trong file .env",
        };
      }

      const password = formatBhxhPassword(rawPassword);
      const now = Date.now();

      // Kiểm tra bộ nhớ đệm: Nếu còn hạn và cùng tài khoản/môi trường thì tái sử dụng ngay
      if (
        !forceRefresh &&
        BhxhChungTuService.cachedToken &&
        BhxhChungTuService.cachedToken.username === username &&
        BhxhChungTuService.cachedToken.passwordHash === password &&
        BhxhChungTuService.cachedToken.env === env &&
        now < BhxhChungTuService.cachedToken.expiresAt - 60000
      ) {
        return { ...BhxhChungTuService.cachedToken.tokenResponse };
      }
      if (
        forceRefresh &&
        BhxhChungTuService.cachedToken &&
        now - BhxhChungTuService.lastTokenRequestTime < 60000 &&
        BhxhChungTuService.cachedToken.username === username &&
        BhxhChungTuService.cachedToken.passwordHash === password &&
        now < BhxhChungTuService.cachedToken.expiresAt - 60000
      ) {
        return { ...BhxhChungTuService.cachedToken.tokenResponse };
      }

      BhxhChungTuService.lastTokenRequestTime = now;

      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const baseUrl = BhxhChungTuService.getBaseUrl(env);
      const response = await fetch(
        `${baseUrl}${BHXH_CONFIG.ENDPOINTS.TAKE_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );

      if (!response.ok && response.status === 401) {
        BhxhChungTuService.clearTokenCache();
        return {
          maKetQua: "401",
          thongDiep:
            "Xác thực tài khoản Cổng BHXH không thành công (HTTP 401 Unauthorized)",
        };
      }

      const text = await response.text();
      let data: BhxhTokenResponse;
      try {
        data = JSON.parse(text);
      } catch {
        BhxhChungTuService.clearTokenCache();
        return {
          maKetQua: String(response.status),
          thongDiep: `Máy chủ Cổng BHXH phản hồi: ${text.slice(0, 150) || "Lỗi không xác định"}`,
        };
      }

      if (!data.apiToken && data.APIKey?.access_token) {
        data.apiToken = data.APIKey.access_token;
      }
      data.idToken = data.APIKey?.id_token || "";
      data.passwordHash = password;

      if (String(data.maKetQua) === "401" && !data.thongDiep) {
        BhxhChungTuService.clearTokenCache();
        data.thongDiep =
          "Tài khoản hoặc mật khẩu kết nối Cổng BHXH không chính xác hoặc chưa được cấp quyền API (Mã 401).";
      }

      // Lưu bộ nhớ đệm khi lấy token thành công (mặc định 25 phút nếu Cổng không chỉ định)
      if (
        String(data.maKetQua) === "200" &&
        (data.apiToken || data.APIKey?.access_token)
      ) {
        const expiresInSeconds = Number(data.APIKey?.expires_in) || 1500;
        BhxhChungTuService.cachedToken = {
          tokenResponse: { ...data },
          fetchedAt: Date.now(),
          expiresAt: Date.now() + expiresInSeconds * 1000,
          username,
          passwordHash: password,
          env,
        };
      }

      return data;
    } catch (err: unknown) {
      BhxhChungTuService.clearTokenCache();
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến máy chủ Cổng BHXH Việt Nam";
      console.error("Lỗi takeToken BHXH:", err);
      return {
        maKetQua: "500",
        thongDiep: errorMsg,
      };
    }
  }

  /**
   * 2. API Gửi Hồ Sơ Chứng Từ TT25 (Loại 39 - HSCHUNGTU)
   */
  static async guiHoSoChungTu2025(
    req: BhxhSendChungTuRequest,
    env: BhxhEnv = BHXH_CONFIG.ENV,
  ): Promise<BhxhSendChungTuResponse> {
    try {
      if (!req.fileBase64Str) {
        return {
          maKetQua: "400",
          ghiChu: "Nội dung tệp gửi lên (fileBase64Str) rỗng",
        };
      }

      const params = new URLSearchParams();
      params.append("token", req.token);
      params.append("loaiHs", req.loaiHs || "39");
      params.append("fileBase64Str", req.fileBase64Str);
      params.append("fileHsBase64", req.fileBase64Str);
      if (BHXH_CONFIG.USERNAME) {
        params.append("username", BHXH_CONFIG.USERNAME);
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        accessToken: req.token,
      };

      const baseUrl = BhxhChungTuService.getBaseUrl(env);
      const response = await fetch(
        `${baseUrl}${BHXH_CONFIG.ENDPOINTS.GUI_HO_SO_CHUNG_TU_2025}`,
        {
          method: "POST",
          headers,
          body: params.toString(),
        },
      );

      const data: BhxhSendChungTuResponse = await response.json();
      return data;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Lỗi truyền nhận dữ liệu Cổng BHXH";
      console.error("Lỗi guiHoSoChungTu2025:", err);
      return {
        maKetQua: "500",
        ghiChu: errorMsg,
      };
    }
  }

  /**
   * 3. API Gửi Giấy Tờ Điện Tử (Loại 60 - Giấy Báo Tử, Loại 61 - Giấy Chứng Sinh)
   */
  static async guiGiayToDienTu(
    req: BhxhSendGiayToDienTuRequest,
    env: BhxhEnv = BHXH_CONFIG.ENV,
  ): Promise<BhxhSendGiayToDienTuResponse> {
    try {
      if (!req.fileBase64Str) {
        return {
          maKetQua: "400",
          ghiChu: "Nội dung tệp gửi lên (fileBase64Str) rỗng",
        };
      }

      const params = new URLSearchParams();
      params.append("token", req.token);
      params.append("loaiHs", req.loaiHs);
      params.append("fileBase64Str", req.fileBase64Str);

      const baseUrl = BhxhChungTuService.getBaseUrl(env);
      const response = await fetch(
        `${baseUrl}${BHXH_CONFIG.ENDPOINTS.GUI_GIAY_TO_DIEN_TU}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );

      const data: BhxhSendGiayToDienTuResponse = await response.json();
      return data;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Lỗi truyền nhận dữ liệu Giấy tờ điện tử Cổng BHXH";
      console.error("Lỗi guiGiayToDienTu:", err);
      return {
        maKetQua: "500",
        ghiChu: errorMsg,
      };
    }
  }
}
