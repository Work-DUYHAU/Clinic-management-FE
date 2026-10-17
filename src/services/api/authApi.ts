import { httpPost, httpGet } from "../http/httpClient";
import type {
  LoginCredentials,
  LoginApiResponse,
  AuthUser,
} from "../../types/authTypes";

export async function loginApi(
  credentials: LoginCredentials,
): Promise<LoginApiResponse> {
  return httpPost<LoginApiResponse>("/auth/login", credentials);
}

export async function getProfileApi(
  token?: string,
): Promise<{ statusCode: number; data: { user: AuthUser } }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  return httpGet<{ statusCode: number; data: { user: AuthUser } }>(
    "/auth/me",
    { headers },
  );
}

export async function logoutApi(): Promise<{
  statusCode: number;
  message: string;
}> {
  return httpPost<{ statusCode: number; message: string }>("/auth/logout");
}
