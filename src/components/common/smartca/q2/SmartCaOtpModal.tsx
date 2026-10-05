import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { WaitingQ2Transaction } from '../../../../services/smartca/q2/smartcaQ2Types';

export interface SmartCaOtpModalProps {
  isOpen: boolean;
  waitingTx: WaitingQ2Transaction | null;
  isAuthorizing: boolean;
  isReinitiating?: boolean;
  otpError: string | null;
  attemptsLeft: number;
  canRetryOtp: boolean;
  isExpired: boolean;
  onConfirm: (otpCode: string) => void;
  onReinitiate: () => void;
  onClose: () => void;
}

export const SmartCaOtpModal: React.FC<SmartCaOtpModalProps> = ({
  isOpen,
  waitingTx,
  isAuthorizing,
  isReinitiating = false,
  otpError,
  attemptsLeft,
  canRetryOtp,
  isExpired,
  onConfirm,
  onReinitiate,
  onClose,
}) => {
  // 6 ô số OTP
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Tính thời gian đếm lùi chuẩn RFC 6238 TOTP theo modulo 30 giây của đồng hồ hệ thống
  const calculateRemainingSeconds = () => 30 - (Math.floor(Date.now() / 1000) % 30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds());
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Focus ô đầu tiên khi mở modal
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, waitingTx?.transactionId]);

  const handleDigitChange = (index: number, value: string) => {
    if (isAuthorizing || isExpired) return;

    const cleanNumbers = value.replace(/\D/g, '');
    if (!cleanNumbers) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Nếu gõ đè làm chuỗi có 2 ký tự (vd: "62" hoặc "26"):
    // Lấy ký tự mới khác với ký tự hiện tại
    const currentVal = digits[index];
    let newChar = cleanNumbers.slice(-1);
    if (cleanNumbers.length > 1 && currentVal) {
      const diffChar = cleanNumbers.split('').find((c) => c !== currentVal);
      if (diffChar) newChar = diffChar;
    }

    const newDigits = [...digits];
    newDigits[index] = newChar;
    setDigits(newDigits);

    // Tự động nhảy sang ô tiếp theo và bôi đen nếu đã nhập số
    if (newChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Nếu người dùng gõ số 0-9: Xử lý trực tiếp và ghi đè ngay, tránh lỗi con trỏ bị kẹt bên trái
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[index] = e.key;
      setDigits(newDigits);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
      return;
    }

    // 2. Phím Backspace: Xóa số ô hiện tại hoặc lùi về ô trước
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
      return;
    }

    // 3. Phím Delete
    if (e.key === 'Delete') {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // 4. Phím mũi tên trái: Ngăn trình duyệt nhảy con trỏ về trước số
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
      return;
    }

    // 5. Phím mũi tên phải
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
      return;
    }

    // 6. Phím Enter để xác nhận ký
    if (e.key === 'Enter') {
      const fullOtp = digits.join('');
      if (fullOtp.length === 6 && !isAuthorizing && !isExpired) {
        onConfirm(fullOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (isAuthorizing || isExpired) return;

    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    // Focus vào ô tiếp theo hoặc ô cuối cùng
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const fullOtp = digits.join('');
  const isSubmitDisabled = fullOtp.length !== 6 || isAuthorizing || isExpired;

  const handleSubmit = useCallback(() => {
    if (!isSubmitDisabled) {
      onConfirm(fullOtp);
    }
  }, [isSubmitDisabled, fullOtp, onConfirm]);

  if (!isOpen) return null;

  // Tính % tiến trình đếm ngược 30 giây
  const progressPercent = (remainingSeconds / 30) * 100;
  const isUrgent = remainingSeconds <= 5;
  const isWarning = remainingSeconds <= 10 && remainingSeconds > 5;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 ant-modal-anim"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAuthorizing) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 text-base">Xác Thực Ký Số Smart OTP</h3>
                <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Cấp Độ Q2
                </span>
              </div>
              <p className="text-xs text-slate-500">Ký số an toàn chuẩn VNPT SmartCA</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isAuthorizing}
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Đóng modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Hướng dẫn người dùng */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
            <span className="text-blue-500 font-bold text-sm shrink-0">💡</span>
            <div>
              Mở ứng dụng <strong className="text-slate-800">VNPT SmartCA</strong> trên điện thoại, chọn{' '}
              <strong className="text-blue-700">Smart OTP</strong> và nhập mã <strong className="text-slate-800">6 chữ số</strong> vào các ô bên dưới:
            </div>
          </div>

          {/* Ô nhập mã OTP 6 số */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-medium text-slate-600">Nhập mã Smart OTP</span>
              <span className="text-[11px] text-slate-400">
                {attemptsLeft < 3 ? `Còn lại: ${attemptsLeft} lần thử` : 'Tự động đổi mã'}
              </span>
            </div>

            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={digit}
                  disabled={isAuthorizing || isExpired}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    (e.target as HTMLInputElement).select();
                  }}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-150 outline-hidden ${
                    digit
                      ? 'border-blue-600 bg-blue-50/30 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                  } focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                />
              ))}
            </div>
          </div>

          {/* Đồng hồ chu kỳ RFC 6238 TOTP (30s) */}
          <div className="space-y-1.5 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-400 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chu kỳ đổi mã OTP:
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  isUrgent ? 'text-rose-600 font-bold animate-pulse' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {remainingSeconds}s
              </span>
            </div>
            {/* Thanh tiến trình thời gian thực */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {isUrgent && (
              <p className="text-[11px] text-rose-500 text-right italic">
                Mã trên ứng dụng sắp đổi sang mã mới!
              </p>
            )}
          </div>

          {/* Vùng hiển thị lỗi hoặc Hết hạn */}
          {otpError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{otpError}</span>
              </div>

              {/* Nút Tạo lại giao dịch ký mới ngay trên Modal */}
              {(isExpired || attemptsLeft === 0 || !canRetryOtp) && (
                <button
                  type="button"
                  disabled={isReinitiating}
                  onClick={onReinitiate}
                  className="w-full mt-1.5 py-2 px-3 bg-white hover:bg-rose-100/50 border border-rose-300 rounded-lg text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60"
                >
                  {isReinitiating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tạo lại giao dịch mới...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>🔄 Tạo Lại Giao Dịch Ký Mới</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Chi tiết giao dịch thu nhỏ */}
          {waitingTx && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-2 px-1">
              <span>Mã giao dịch:</span>
              <span className="font-mono text-slate-500 font-medium">
                {waitingTx.transactionId.length > 20
                  ? `${waitingTx.transactionId.slice(0, 8)}...${waitingTx.transactionId.slice(-6)}`
                  : waitingTx.transactionId}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isAuthorizing}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isAuthorizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xác thực & ký...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Xác Nhận Ký Số</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
