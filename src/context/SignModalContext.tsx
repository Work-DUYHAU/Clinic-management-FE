import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';

export type SignModalHandler = () => void;

export interface SignModalContextValue {
  openSignModal: () => void;
  registerSignHandler: (handler: SignModalHandler) => () => void;
}

const SignModalContext = createContext<SignModalContextValue | null>(null);

export const SignModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeHandlerRef = useRef<SignModalHandler | null>(null);

  const registerSignHandler = useCallback((handler: SignModalHandler) => {
    activeHandlerRef.current = handler;
    return () => {
      if (activeHandlerRef.current === handler) {
        activeHandlerRef.current = null;
      }
    };
  }, []);

  const openSignModal = useCallback(() => {
    if (activeHandlerRef.current) {
      activeHandlerRef.current();
    } else {
      console.warn('[SignModalContext] Không tìm thấy modal ký số cho màn hình hiện tại.');
    }
  }, []);

  return (
    <SignModalContext.Provider value={{ openSignModal, registerSignHandler }}>
      {children}
    </SignModalContext.Provider>
  );
};

export const useSignModal = (): SignModalContextValue => {
  const context = useContext(SignModalContext);
  if (!context) {
    throw new Error('useSignModal must be used within a SignModalProvider');
  }
  return context;
};

/**
 * Hook đăng ký modal ký số cho màn hình/tab đang active.
 * Tự động đăng ký khi `isActive` = true và dọn dẹp khi unmount hoặc `isActive` = false.
 */
export const useRegisterSignModal = (isActive: boolean, onOpen: SignModalHandler) => {
  const { registerSignHandler } = useSignModal();
  const handlerRef = useRef(onOpen);

  useEffect(() => {
    handlerRef.current = onOpen;
  });

  useEffect(() => {
    if (isActive) {
      return registerSignHandler(() => {
        handlerRef.current();
      });
    }
  }, [isActive, registerSignHandler]);
};
