export interface AuthUser {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginApiResponse {
  statusCode: number;
  message: string;
  data: LoginResponseData;
}
