import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  Copy,
  Check,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { copyTextToClipboard } from '../../utils/shared/excelXmlShared';

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mã lỗi hiển thị (vd: 401, 403, 404, 500, 'AUTH_FAILED',...). Mặc định là 'ERROR' */
  errorCode?: string | number;
  /** Tiêu đề modal (tùy chỉnh). Nếu không truyền sẽ lấy theo mã lỗi */
  title?: string;
  /** Mô tả ngắn về lỗi */
  subtitle?: string;
  /** Chi tiết lỗi (chuỗi hoặc ReactNode) */
  errorMessage?: string | React.ReactNode;
  /** Các thông số metadata (vd: URL endpoint, method, params,...) */
  metaInfo?: Record<string, string | number | undefined | null>;
  /** Danh sách nguyên nhân và hướng dẫn xử lý */
  reasons?: string[];
  /** Tên nút chính (mặc định: 'Đã Hiểu & Đóng') */
  primaryButtonText?: string;
  onPrimaryAction?: () => void;
  /** Tên nút phụ (vd: 'Thử lại') */
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
  /** Hiển thị nút sao chép log lỗi (mặc định: true) */
  showCopyError?: boolean;
}

/** Tự động gợi ý tiêu đề theo mã lỗi chuẩn HTTP */
function getDefaultTitle(code?: string | number): string {
  if (!code) return 'Thông Báo Lỗi';
  const strCode = String(code).toUpperCase();
  switch (strCode) {
    case '400':
      return 'Yêu Cầu Không Hợp Lệ (400 Bad Request)';
    case '401':
      return 'Lỗi Xác Thực / Chưa Đăng Nhập (401 Unauthorized)';
    case '403':
      return 'Truy Cập Bị Từ Chối (403 Forbidden)';
    case '404':
      return 'Không Tìm Thấy Tài Nguyên (404 Not Found)';
    case '408':
      return 'Hết Thời Gian Chờ (408 Request Timeout)';
    case '422':
      return 'Dữ Liệu Không Thể Xử Lý (422 Unprocessable)';
    case '500':
      return 'Lỗi Máy Chủ Nội Bộ (500 Internal Server Error)';
    case '502':
      return 'Cổng Kết Nối Lỗi (502 Bad Gateway)';
    case '503':
      return 'Dịch Vụ Tạm Thời Không Khả Dụng (503 Service Unavailable)';
    default:
      return `Lỗi Hệ Thống (${strCode})`;
  }
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  errorCode = 'ERROR',
  title,
  subtitle,
  errorMessage,
  metaInfo,
  reasons,
  primaryButtonText = 'Đã Hiểu & Đóng',
  onPrimaryAction,
  secondaryButtonText,
  onSecondaryAction,
  showCopyError = true,
}) => {
  const [copied, setCopied] = useState(false);

  const {
    handleBackdropMouseDown,
    handleBackdropClick,
    handleStopPropagation,
  } = useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const displayTitle = title || getDefaultTitle(errorCode);
  const displaySubtitle =
    subtitle || 'Đã xảy ra sự cố trong quá trình thực hiện yêu cầu.';

  const handleCopyError = () => {
    let logText = `[System Error Log]\nError Code: ${errorCode}\nTitle: ${displayTitle}\nDescription: ${displaySubtitle}\nTimestamp: ${new Date().toISOString()}\n`;
    if (typeof errorMessage === 'string') {
      logText += `Error Message: ${errorMessage}\n`;
    }
    if (metaInfo) {
      logText += `Meta Details:\n`;
      Object.entries(metaInfo).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          logText += `  - ${k}: ${v}\n`;
        }
      });
    }
    if (reasons && reasons.length > 0) {
      logText += `Suggested Actions:\n`;
      reasons.forEach((r, idx) => {
        logText += `  ${idx + 1}. ${r}\n`;
      });
    }
    copyTextToClipboard(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 ant-modal-anim"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-md max-w-xl w-full shadow-2xl overflow-hidden border border-rose-200 select-none animate-in fade-in zoom-in-95 duration-200"
        onMouseDown={handleStopPropagation}
        onClick={handleStopPropagation}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-rose-50 via-rose-100/50 to-white border-b border-rose-200 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900">
                  {displayTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-sm bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-extrabold uppercase font-mono">
                  {String(errorCode)}
                </span>
              </div>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                {displaySubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-sm hover:bg-rose-200/60 active:scale-95 text-slate-400 hover:text-slate-800 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors shrink-0"
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
          {/* 1. Hộp thông tin lỗi chi tiết */}
          {(errorMessage || metaInfo) && (
            <div className="p-4 bg-slate-900 text-slate-200 rounded-sm border border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-rose-400 font-bold border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  CHI TIẾT LỖI HỆ THỐNG
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Mã lỗi: {String(errorCode)}
                </span>
              </div>

              {metaInfo && Object.keys(metaInfo).length > 0 && (
                <div className="space-y-1 text-slate-300 border-b border-slate-800 pb-2">
                  {Object.entries(metaInfo).map(([key, val]) => {
                    if (val === undefined || val === null) return null;
                    return (
                      <div key={key}>
                        <span className="text-slate-500">{key}:</span>{' '}
                        <span className="text-slate-200">{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {errorMessage && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-0.5">Nội dung lỗi:</span>
                  <div className="text-rose-300 break-words leading-relaxed font-sans text-xs">
                    {errorMessage}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Nguyên nhân & Hướng dẫn khắc phục */}
          {reasons && reasons.length > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm space-y-2 text-amber-900">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-950">
                <Terminal size={14} className="text-amber-700" />
                Nguyên nhân có thể xảy ra & Hướng dẫn xử lý:
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                {reasons.map((reason, idx) => (
                  <li key={idx} className="text-amber-900">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {showCopyError ? (
            <button
              type="button"
              onClick={handleCopyError}
              className="px-3.5 py-2 rounded-sm bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
              <span>{copied ? 'Đã sao chép lỗi' : 'Sao chép thông tin lỗi'}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {secondaryButtonText && onSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="px-4 py-2 rounded-sm bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>{secondaryButtonText}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onPrimaryAction || onClose}
              className="px-5 py-2 rounded-sm bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              {primaryButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Tương thích ngược: Alias SmartCaErrorModal trỏ sang ErrorModal dùng chung
 */
export const SmartCaErrorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  env: string;
  errorMessage: string;
  clientId?: string;
  username?: string;
}> = ({ isOpen, onClose, env, errorMessage, clientId, username }) => {
  const isGrantError = errorMessage.toLowerCase().includes("invalid_grant") || errorMessage.toLowerCase().includes("mật khẩu");
  const errorCode = isGrantError ? "INVALID_GRANT" : errorMessage.includes("400") ? "400" : errorMessage.includes("403") ? "403" : "401";

  return (
    <ErrorModal
      isOpen={isOpen}
      onClose={onClose}
      errorCode={errorCode}
      title="Không Thể Kết Nối VNPT SmartCA"
      subtitle="Xác thực tài khoản hoặc kết nối tới máy chủ VNPT không thành công"
      errorMessage={errorMessage}
      metaInfo={{
        'Môi trường (.env)': env.toUpperCase(),
        'Cổng Gateway':
          env === 'production'
            ? 'https://gwsca.vnpt.vn (Production Gateway)'
            : 'https://rmgateway.vnptit.vn (Demo Gateway)',
        'Client ID': clientId || 'Chưa cung cấp',
        'Tài khoản ký (MST / CCCD)': username || 'Chưa cung cấp',
      }}
      reasons={[
        'Sai Mật khẩu hoặc Tài khoản: Vui lòng kiểm tra lại mật khẩu đăng nhập SmartCA của tài khoản MST.',
        'Chứng thư số: Đảm bảo tài khoản MST này đã được kích hoạt gói chứng thư số ký số trên hệ thống VNPT SmartCA.',
        `Cấu hình ứng dụng: File .env đang bật VITE_SMARTCA_ENV=${env}. Đảm bảo Client ID và Client Secret đã được VNPT kích hoạt quyền gọi API.`,
      ]}
    />
  );
};
