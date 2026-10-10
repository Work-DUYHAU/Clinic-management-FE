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
  USERNAME: import.meta.env.VITE_BHXH_USERNAME || "",
  PASSWORD: import.meta.env.VITE_BHXH_PASSWORD || "",
  ENDPOINTS: {
    TAKE_TOKEN: "/api/token/take",
    GUI_HO_SO_CHUNG_TU_2025: "/api/chungtugw/GuiHoSoChungTu2025", // Mã 39
    GUI_GIAY_TO_DIEN_TU: "/api/hososuckhoe/guiGiayToDienTu", // Mã 60, 61
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
  private static inFlightTokenPromise: Promise<BhxhTokenResponse> | null = null;

  static clearTokenCache(): void {
    BhxhChungTuService.cachedToken = null;
  }

  static getCachedToken(): BhxhTokenResponse | null {
    if (
      BhxhChungTuService.cachedToken &&
      Date.now() < BhxhChungTuService.cachedToken.expiresAt - 60000
    ) {
      return { ...BhxhChungTuService.cachedToken.tokenResponse };
    }
    return null;
  }

  static getBaseUrl(env?: BhxhEnv): string {
    const targetEnv = env || BHXH_CONFIG.ENV;
    if (import.meta.env.VITE_BHXH_BASE_URL) {
      return import.meta.env.VITE_BHXH_BASE_URL;
    }
    return targetEnv === "sandbox"
      ? "https://gdbhyt.baohiemxahoi.gov.vn"
      : "https://egw.baohiemxahoi.gov.vn";
  }

  static async fetchGateway(
    url: string,
    options: RequestInit,
    maxRetries = 2,
  ): Promise<Response> {
    let lastResponse: Response | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await fetch(url, options);
        lastResponse = response;

        // Nếu Cổng BHXH hoặc proxy trả về 502/503/504 (lỗi tạm thời hoặc socket bị WAF reset)
        if (
          (response.status === 502 ||
            response.status === 503 ||
            response.status === 504) &&
          attempt <= maxRetries
        ) {
          console.warn(
            `[BHXH fetchGateway] HTTP ${response.status} tại ${url} (lần ${attempt}/${maxRetries + 1}), tự động kết nối lại sau ${attempt * 500}ms...`,
          );
          await new Promise((r) => setTimeout(r, attempt * 500));
          continue;
        }

        return response;
      } catch (err: unknown) {
        lastError = err;
        if (attempt <= maxRetries) {
          console.warn(
            `[BHXH fetchGateway] Ngoại lệ kết nối (${err instanceof Error ? err.message : String(err)}, lần ${attempt}), thử lại sau ${attempt * 500}ms...`,
          );
          await new Promise((r) => setTimeout(r, attempt * 500));
          continue;
        }
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new Error("Không thể kết nối đến máy chủ Cổng BHXH");
  }

  static async takeToken(
    req?: Partial<BhxhTokenRequest>,
    env: BhxhEnv = BHXH_CONFIG.ENV,
    forceRefresh = false,
  ): Promise<BhxhTokenResponse> {
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

    // 1. Kiểm tra bộ nhớ đệm: Nếu còn hạn và cùng tài khoản/môi trường thì tái sử dụng ngay
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

    // 2. Nếu đang có request lấy token đang chạy ngầm (in-flight), tái sử dụng Promise để tránh gửi kép
    if (BhxhChungTuService.inFlightTokenPromise && !forceRefresh) {
      return BhxhChungTuService.inFlightTokenPromise;
    }

    // 3. Thực hiện lấy token với cơ chế Tự động Thử lại (Auto-Retry) cho các mã lỗi tạm thời 502/503/504
    BhxhChungTuService.inFlightTokenPromise = (async () => {
      const maxRetries = 2; // Tối đa 3 lần thử (lần đầu + 2 lần retry)
      let lastResult: BhxhTokenResponse = {
        maKetQua: "500",
        thongDiep: "Lỗi kết nối Cổng BHXH",
      };

      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
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

          // Nếu Cổng BHXH hoặc proxy trả về 502/503/504 (lỗi bắt tay tạm thời)
          if (
            (response.status === 502 ||
              response.status === 503 ||
              response.status === 504) &&
            attempt <= maxRetries
          ) {
            console.warn(
              `[BHXH takeToken] Lỗi tạm thời HTTP ${response.status} (lần ${attempt}/${maxRetries + 1}), tự động kết nối lại sau ${attempt * 400}ms...`,
            );
            await new Promise((r) => setTimeout(r, attempt * 400));
            continue;
          }

          const text = await response.text();
          let data: BhxhTokenResponse;
          try {
            data = JSON.parse(text);
          } catch {
            if (
              (response.status === 502 || response.status === 500) &&
              attempt <= maxRetries
            ) {
              console.warn(
                `[BHXH takeToken] Không parse được JSON từ Cổng (HTTP ${response.status}, lần ${attempt}), thử lại...`,
              );
              await new Promise((r) => setTimeout(r, attempt * 400));
              continue;
            }
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
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Không thể kết nối đến máy chủ Cổng BHXH Việt Nam";
          lastResult = {
            maKetQua: "500",
            thongDiep: errorMsg,
          };
          if (attempt <= maxRetries) {
            console.warn(
              `[BHXH takeToken] Ngoại lệ kết nối (${errorMsg}, lần ${attempt}), tự động thử lại...`,
            );
            await new Promise((r) => setTimeout(r, attempt * 400));
            continue;
          }
          BhxhChungTuService.clearTokenCache();
          console.error("Lỗi takeToken BHXH:", err);
          return lastResult;
        }
      }
      return lastResult;
    })().finally(() => {
      BhxhChungTuService.inFlightTokenPromise = null;
    });

    return BhxhChungTuService.inFlightTokenPromise;
  }
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
      const response = await BhxhChungTuService.fetchGateway(
        `${baseUrl}${BHXH_CONFIG.ENDPOINTS.GUI_HO_SO_CHUNG_TU_2025}`,
        {
          method: "POST",
          headers,
          body: params.toString(),
        },
      );

      let data: BhxhSendChungTuResponse;
      try {
        data = await response.json();
      } catch {
        data = {
          maKetQua: String(response.status),
          ghiChu: `Máy chủ Cổng BHXH phản hồi HTTP ${response.status}`,
        };
      }
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
      const response = await BhxhChungTuService.fetchGateway(
        `${baseUrl}${BHXH_CONFIG.ENDPOINTS.GUI_GIAY_TO_DIEN_TU}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );

      let data: BhxhSendGiayToDienTuResponse;
      try {
        data = await response.json();
      } catch {
        data = {
          maKetQua: String(response.status),
          ghiChu: `Máy chủ Cổng BHXH phản hồi HTTP ${response.status}`,
        };
      }
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
