import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { BACKEND_BASE_URL } from "./client";

export const httpClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getStoredToken(): string | null {
  return (
    localStorage.getItem("clinic_access_token") ||
    sessionStorage.getItem("clinic_access_token")
  );
}

export function clearStoredAuth(): void {
  localStorage.removeItem("clinic_access_token");
  localStorage.removeItem("clinic_user_info");
  localStorage.removeItem("clinic_token_expires_at");
  sessionStorage.removeItem("clinic_access_token");
  sessionStorage.removeItem("clinic_user_info");
  sessionStorage.removeItem("clinic_token_expires_at");
}

// Tự động gắn token xác thực Bearer nếu người dùng đã đăng nhập (kiểm tra cả local & session storage)
httpClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableConfig extends AxiosRequestConfig {
  _retryCount?: number;
}

const RETRY_DELAYS_MS = [1200, 2500]; // exponential backoff: 1.2s → 2.5s

httpClient.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{ message?: string | string[]; error?: string }>,
  ) => {
    const config = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401) {
      clearStoredAuth();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("clinic_auth_expired", {
            detail: {
              message:
                error.response?.data?.message ||
                "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
            },
          }),
        );
      }
    }

    const isNetworkOrServerUnavailable =
      !error.response ||
      error.response.status === 503 ||
      error.response.status === 504;

    const retryCount = config?._retryCount ?? 0;

    if (
      config &&
      isNetworkOrServerUnavailable &&
      retryCount < RETRY_DELAYS_MS.length
    ) {
      config._retryCount = retryCount + 1;
      const delayMs = RETRY_DELAYS_MS[retryCount];
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return httpClient(config);
    }

    // Trích xuất thông báo lỗi chuẩn hóa
    const serverMessage = error.response?.data?.message;
    const formattedError = Array.isArray(serverMessage)
      ? serverMessage.join("; ")
      : serverMessage || error.message || "Lỗi giao tiếp máy chủ";

    error.message = formattedError;

    return Promise.reject(error);
  },
);

export async function httpGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.get<T>(url, config);
  return res.data;
}

export async function httpPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.post<T>(url, data, config);
  return res.data;
}

export async function httpPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.put<T>(url, data, config);
  return res.data;
}

export async function httpPostForm<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.post<T>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function httpDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.delete<T>(url, config);
  return res.data;
}
