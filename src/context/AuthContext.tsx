import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { AuthUser, LoginCredentials } from "../types/authTypes";
import { loginApi, getProfileApi, logoutApi } from "../services/api/authApi";
import {
  getStoredToken,
  clearStoredAuth,
} from "../services/http/httpClient";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: (reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "clinic_access_token";
const USER_KEY = "clinic_user_info";
const EXPIRES_AT_KEY = "clinic_token_expires_at";

// Thời gian tự động đăng xuất khi không thao tác (30 phút = 1800000 ms)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

function getStoredUser(): AuthUser | null {
  try {
    const raw =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredExpiresAt(): number {
  const raw =
    localStorage.getItem(EXPIRES_AT_KEY) ||
    sessionStorage.getItem(EXPIRES_AT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

function saveAuthData(
  token: string,
  user: AuthUser,
  expiresInSeconds: number,
  rememberMe: boolean = true,
) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const storage = rememberMe ? localStorage : sessionStorage;

  // Dọn sạch storage đối diện để tránh dữ liệu chéo
  clearStoredAuth();

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(EXPIRES_AT_KEY, String(expiresAt));
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const expTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (expTimerRef.current) {
      clearTimeout(expTimerRef.current);
      expTimerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(
    async (reason?: string) => {
      clearTimers();
      try {
        await logoutApi();
      } catch (err) {
        console.warn("Lỗi khi gọi API đăng xuất:", err);
      } finally {
        clearStoredAuth();
        setToken(null);
        setUser(null);

        if (reason && typeof window !== "undefined") {
          console.info(`[Auth] Đã đăng xuất tự động: ${reason}`);
        }
      }
    },
    [clearTimers],
  );

  // Đặt lịch tự hủy token khi đến hạn hết hạn (Token Expiration Timer)
  const scheduleTokenExpiration = useCallback(
    (expiresAt: number) => {
      if (expTimerRef.current) {
        clearTimeout(expTimerRef.current);
      }

      const remainingMs = expiresAt - Date.now();
      if (remainingMs <= 0) {
        console.warn("[Auth] Token đã hết hạn, tự động xóa phiên đăng nhập.");
        logout("Hết hạn token");
        return;
      }

      expTimerRef.current = setTimeout(() => {
        console.info("[Auth] Token vừa đến hạn hết hạn. Tự động xóa token.");
        logout("Hết hạn token");
      }, remainingMs);
    },
    [logout],
  );

  // Cơ chế Inactivity Timer: Tự động khóa & xóa phiên sau 30 phút không di chuột/gõ phím
  const resetInactivityTimer = useCallback(() => {
    if (!token) return;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.info(
        "[Auth] Người dùng không hoạt động trong 30 phút. Tự động xóa phiên làm việc.",
      );
      logout("Không hoạt động trong 30 phút");
    }, INACTIVITY_TIMEOUT_MS);
  }, [token, logout]);

  // Lắng nghe sự kiện thao tác người dùng (User activity)
  useEffect(() => {
    if (!token) return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((ev) =>
      window.addEventListener(ev, handleUserActivity, { passive: true }),
    );
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, handleUserActivity),
      );
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [token, resetInactivityTimer]);

  // Lắng nghe sự kiện 401 Unauthorized từ httpClient
  useEffect(() => {
    const handleAuthExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      logout(customEvent.detail?.message || "Máy chủ từ chối xác thực 401");
    };

    window.addEventListener("clinic_auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("clinic_auth_expired", handleAuthExpired);
    };
  }, [logout]);

  // Khởi động ứng dụng: Kiểm tra tính hợp lệ của token và hạn dùng
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = getStoredToken();
      const expiresAt = getStoredExpiresAt();

      // Kiểm tra hạn dùng lưu ở client trước: nếu quá hạn thì tự xóa ngay lập tức
      if (expiresAt > 0 && Date.now() >= expiresAt) {
        console.warn("[Auth] Token đã hết hạn tại client. Đang xóa tự động...");
        clearStoredAuth();
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await getProfileApi(storedToken);
        if (isMounted) {
          if (response?.data?.user) {
            setUser(response.data.user);
            setToken(storedToken);

            if (expiresAt > 0) {
              scheduleTokenExpiration(expiresAt);
            }
          } else {
            throw new Error("Không lấy được thông tin người dùng");
          }
        }
      } catch (err) {
        console.warn("Phiên đăng nhập không hợp lệ hoặc đã hết hạn trên server:", err);
        if (isMounted) {
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
      clearTimers();
    };
  }, [scheduleTokenExpiration, clearTimers]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const res = await loginApi(credentials);
      const { accessToken, user: loggedUser, expiresIn } = res.data;
      const rememberMe = credentials.rememberMe ?? true;

      // Lưu vào localStorage nếu rememberMe = true, hoặc sessionStorage nếu rememberMe = false
      saveAuthData(accessToken, loggedUser, expiresIn, rememberMe);

      const expiresAt = Date.now() + expiresIn * 1000;
      scheduleTokenExpiration(expiresAt);

      setToken(accessToken);
      setUser(loggedUser);
    },
    [scheduleTokenExpiration],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
