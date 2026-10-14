import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  SmartCaCredential,
  SmartCaTokenPair,
  SmartCaUserInfo,
} from '../types/smartcaTypes';

export interface SmartCaPersistentConfig {
  env: 'demo' | 'production';
  clientId: string;
  username: string;
}

export const SMARTCA_DEFAULT_CONFIG: SmartCaPersistentConfig = {
  env:
    (import.meta.env.VITE_SMARTCA_ENV as 'demo' | 'production') ||
    'production',
  clientId:
    import.meta.env.VITE_SMARTCA_CLIENT_ID ||
    import.meta.env.VITE_SMARTCA_SP_ID ||
    '',
  username:
    import.meta.env.VITE_SMARTCA_DEFAULT_MST ||
    import.meta.env.VITE_SMARTCA_USER_ID ||
    '',
};

interface SmartCaContextValue {
  config: SmartCaPersistentConfig;
  tokenPair: SmartCaTokenPair | null;
  uid: string | null;
  userInfo: SmartCaUserInfo | null;
  credential: SmartCaCredential | null;
  isLoggedIn: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
  saveConfig: (config: SmartCaPersistentConfig) => void;
}

const SmartCaContext = createContext<SmartCaContextValue | null>(null);

export const SmartCaProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] =
    useState<SmartCaPersistentConfig>(SMARTCA_DEFAULT_CONFIG);
  const [tokenPair, setTokenPair] = useState<SmartCaTokenPair | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<SmartCaUserInfo | null>(null);
  const [credential, setCredential] = useState<SmartCaCredential | null>(null);

  const login = useCallback(async (_password: string) => {
    // Toàn bộ logic xác thực và ký số SmartCA hiện được ủy quyền xử lý an toàn tại Backend
  }, []);

  const logout = useCallback(() => {
    setTokenPair(null);
    setUid(null);
    setUserInfo(null);
    setCredential(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string> => {
    return tokenPair?.accessToken || '';
  }, [tokenPair]);

  const saveConfig = useCallback((next: SmartCaPersistentConfig) => {
    setConfig(next);
  }, []);

  const value = useMemo<SmartCaContextValue>(
    () => ({
      config,
      tokenPair,
      uid,
      userInfo,
      credential,
      isLoggedIn: tokenPair !== null,
      login,
      logout,
      getAccessToken,
      saveConfig,
    }),
    [
      config,
      tokenPair,
      uid,
      userInfo,
      credential,
      login,
      logout,
      getAccessToken,
      saveConfig,
    ],
  );

  return (
    <SmartCaContext.Provider value={value}>{children}</SmartCaContext.Provider>
  );
};

export function useSmartCa(): SmartCaContextValue {
  const ctx = useContext(SmartCaContext);
  if (!ctx) {
    throw new Error('useSmartCa must be used within a SmartCaProvider');
  }
  return ctx;
}
