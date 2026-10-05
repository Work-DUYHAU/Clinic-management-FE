import type { SmartCaEnv } from "../../types/smartcaTypes";

export const SMARTCA_STORAGE_KEY = "smartca-config:v1";

export interface SmartCaPersistentConfig {
  env: SmartCaEnv;
  clientId: string;
  username: string;
}

// Nạp các giá trị cấu hình tập trung từ biến môi trường (.env)
export const SMARTCA_ENV: SmartCaEnv =
  (import.meta.env.VITE_SMARTCA_ENV as SmartCaEnv) || "production";
export const SMARTCA_CLIENT_ID: string =
  (import.meta.env.VITE_SMARTCA_CLIENT_ID as string) || "";
export const SMARTCA_CLIENT_SECRET: string =
  (import.meta.env.VITE_SMARTCA_CLIENT_SECRET as string) || "";
export const SMARTCA_DEFAULT_MST: string =
  (import.meta.env.VITE_SMARTCA_DEFAULT_MST as string) || "";
export const SMARTCA_DEFAULT_CCCD: string =
  (import.meta.env.VITE_SMARTCA_DEFAULT_CCCD as string) || "";
export const SMARTCA_DEFAULT_PASSWORD: string =
  (import.meta.env.VITE_SMARTCA_PASSWORD as string) ||
  (import.meta.env.VITE_SMARTCA_DEFAULT_PASSWORD as string) ||
  "";
export const SMARTCA_TOTP_SECRET: string =
  (import.meta.env.VITE_SMARTCA_TOTP_SECRET as string) || "";

// Hằng số tham số chuẩn V2 SmartCA-TH (QĐ 769)
export const SMARTCA_SP_ID: string =
  (import.meta.env.VITE_SMARTCA_SP_ID as string) ||
  SMARTCA_CLIENT_ID;
export const SMARTCA_SP_PASSWORD: string =
  (import.meta.env.VITE_SMARTCA_SP_PASSWORD as string) ||
  SMARTCA_CLIENT_SECRET;
export const SMARTCA_USER_ID: string =
  (import.meta.env.VITE_SMARTCA_USER_ID as string) ||
  SMARTCA_DEFAULT_MST ||
  SMARTCA_DEFAULT_CCCD;

export const SMARTCA_DEFAULT_CONFIG: SmartCaPersistentConfig = {
  env: SMARTCA_ENV,
  clientId: SMARTCA_CLIENT_ID,
  username: SMARTCA_DEFAULT_MST,
};

export function loadSmartCaConfig(): SmartCaPersistentConfig {
  try {
    localStorage.removeItem(SMARTCA_STORAGE_KEY);
  } catch {
    // bỏ qua nếu storage disabled
  }
  return SMARTCA_DEFAULT_CONFIG;
}
