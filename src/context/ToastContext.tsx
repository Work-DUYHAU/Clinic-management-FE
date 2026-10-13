import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  content: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  onOk: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    setToasts(prev => {
      // Ngăn chặn duplicate toast: Nếu đang có toast cùng loại, cùng tiêu đề và cùng nội dung thì không thêm mới
      const isDuplicate = prev.some(
        t => t.type === type && t.message === message && t.title === title
      );
      if (isDuplicate) {
        return prev;
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return [...prev, newToast];
    });
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    showToast('success', message, title || 'Thành Công');
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast('error', message, title || 'Có Lỗi Xảy Ra');
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast('warning', message, title || 'Cảnh Báo');
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast('info', message, title || 'Thông Báo');
  }, [showToast]);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmModal(options);
  }, []);

  const handleConfirmOk = async () => {
    if (!confirmModal) return;
    try {
      setIsConfirmLoading(true);
      await confirmModal.onOk();
      setConfirmModal(null);
    } catch (err: any) {
      error(err.message || 'Lỗi xử lý thao tác!');
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleConfirmCancel = () => {
    if (confirmModal?.onCancel) confirmModal.onCancel();
    setConfirmModal(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, showConfirm }}>
      {children}

      {/* Floating Toast Notification Container (Top Right) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => {
          let icon = <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />;
          let borderClass = 'border-emerald-200 bg-white';
          let shadowClass = 'shadow-lg shadow-emerald-500/10';
          let titleColor = 'text-emerald-950';

          if (toast.type === 'error') {
            icon = <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />;
            borderClass = 'border-rose-200 bg-white';
            shadowClass = 'shadow-lg shadow-rose-500/10';
            titleColor = 'text-rose-950';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />;
            borderClass = 'border-amber-200 bg-white';
            shadowClass = 'shadow-lg shadow-amber-500/10';
            titleColor = 'text-amber-950';
          } else if (toast.type === 'info') {
            icon = <Info size={18} className="text-blue-500 flex-shrink-0" />;
            borderClass = 'border-blue-200 bg-white';
            shadowClass = 'shadow-lg shadow-blue-500/10';
            titleColor = 'text-blue-950';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-md border ${borderClass} ${shadowClass} transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 backdrop-blur-md relative overflow-hidden`}
              style={{ animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 pr-4">
                {toast.title && (
                  <h4 className={`text-xs font-extrabold ${titleColor} mb-0.5`}>
                    {toast.title}
                  </h4>
                )}
                <div className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-sm hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
              </button>

              {/* Subtle bottom progress animation bar */}
              <div
                className={`absolute bottom-0 left-0 h-0.5 ${
                  toast.type === 'success'
                    ? 'bg-emerald-500'
                    : toast.type === 'error'
                    ? 'bg-rose-500'
                    : toast.type === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                } w-full opacity-60`}
                style={{
                  animation: `shrinkWidth ${toast.duration || 4000}ms linear forwards`
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Modern Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                  confirmModal.danger
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-blue-50 text-[#1677ff] border border-blue-100'
                }`}
              >
                {confirmModal.danger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {confirmModal.title || 'Xác Nhận Thao Tác'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmModal.content}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isConfirmLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold transition-colors cursor-pointer"
              >
                {confirmModal.cancelText || 'Hủy Bỏ'}
              </button>
              <button
                type="button"
                onClick={handleConfirmOk}
                disabled={isConfirmLoading}
                className={`px-4 py-2 rounded-sm text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                  confirmModal.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#1677ff] hover:bg-blue-600'
                }`}
              >
                {isConfirmLoading ? 'Đang Xử Lý...' : confirmModal.okText || 'Đồng Ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
