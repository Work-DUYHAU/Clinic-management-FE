import React, { useMemo } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  X,
} from "lucide-react";
import {
  type IdentityType,
  IDENTITY_LIMITS,
  validateIdentity,
} from "../../../utils/validators";

export interface SignerFormProps {
  config?: { env?: string };
  idType: IdentityType;
  identityValue: string;
  onIdentityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  password: string;
  setPassword: (pwd: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isInitiating: boolean;
  onInitiateSign: () => void;
  onCancelSign?: () => void;
  authMethodLabel?: string;
  buttonLabel?: string;
  loadingLabel?: string;
  signMode?: "Q1" | "Q2";
  autoSendOnSign?: boolean;
  onToggleAutoSend?: (val: boolean) => void;
  hideSubmitButton?: boolean;
  hideAutoSendCheckbox?: boolean;
  isDigestComputing?: boolean;
}

export const SignerForm: React.FC<SignerFormProps> = ({
  config,
  idType,
  identityValue,
  onIdentityChange,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isInitiating,
  isDigestComputing = false,
  onInitiateSign,
  onCancelSign,
  authMethodLabel = "Ứng dụng VNPT SmartCA (Q1)",
  buttonLabel = "Gửi Yêu Cầu Ký Số Lên App SmartCA",
  loadingLabel = "Đang Khởi Tạo Ký Q1...",
  signMode = "Q2",
  autoSendOnSign = true,
  onToggleAutoSend,
  hideSubmitButton = false,
  hideAutoSendCheckbox = false,
}) => {
  const identityStatus = useMemo(() => {
    if (!identityValue.trim()) return null;
    return validateIdentity(identityValue, idType);
  }, [identityValue, idType]);

  return (
    <div className="p-3 sm:p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            {signMode === "Q2" ? (
              <>
                <Zap size={16} className="fill-blue-600 text-blue-600" />
                <span>Ký số tự động VNPT SmartCA</span>
              </>
            ) : (
              <span>Ký số duyệt qua App SmartCA</span>
            )}
          </h4>
        </div>

        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-sm border ${
            config?.env === "production"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {config?.env === "production" ? "VNPT Production" : "VNPT Demo"}
        </span>
      </div>

      {/* 2 Ô NHẬP LIỆU: TÀI KHOẢN & MẬT KHẨU TRÊN CÙNG 1 HÀNG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start pt-1">
        {/* TÀI KHOẢN SMARTCA */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>
              Tài khoản (MST / CCCD) <span className="text-rose-500">*</span>
            </span>
            {identityStatus && (
              <span
                className={`text-[11px] flex items-center gap-1 font-semibold ${
                  identityStatus.isValid ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {identityStatus.isValid ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>Hợp lệ</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} className="text-amber-500" />
                    <span>Sai định dạng</span>
                  </>
                )}
              </span>
            )}
          </label>

          <div className="relative">
            <input
              type="text"
              maxLength={IDENTITY_LIMITS[idType] || 20}
              value={identityValue}
              onChange={onIdentityChange}
              placeholder="Nhập Mã số thuế / CCCD"
              className={`w-full px-3 py-2 rounded-sm border bg-white text-sm font-mono font-semibold text-slate-900 focus:outline-none transition-all shadow-2xs pr-14 ${
                identityStatus === null
                  ? "border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20"
                  : identityStatus.isValid
                    ? "border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20"
                    : "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              }`}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-slate-400 pointer-events-none select-none">
              {identityValue.length}/{IDENTITY_LIMITS[idType] || 14}
            </div>
          </div>
        </div>

        {/* MẬT KHẨU TÀI KHOẢN SMARTCA */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Mật khẩu SmartCA <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu SmartCA"
              className="w-full px-3 py-2 rounded-sm border border-slate-300 bg-white text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 pr-10 transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* TÙY CHỌN GỘP QUY TRÌNH: TỰ ĐỘNG GỬI CỔNG BHXH */}
      {!hideAutoSendCheckbox && (
        <div className="p-2.5 bg-blue-50/60 border border-blue-200/70 rounded-sm flex items-center justify-between transition-all select-none">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(autoSendOnSign)}
              onChange={(e) => onToggleAutoSend?.(e.target.checked)}
              className="w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span className="text-xs font-semibold text-slate-800">
              Tự động gửi lên Cổng BHXH ngay sau khi ký số thành công
            </span>
          </label>
        </div>
      )}

      {/* NÚT THỰC HIỆN KÝ SỐ (CHỈ HIỆN KHI KHÔNG CÓ NÚT Ở FOOTER MODAL) */}
      {!hideSubmitButton && (
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-500">
            Phương thức xác thực: <b>{authMethodLabel}</b>
          </div>
          <div className="flex items-center gap-2">
            {isInitiating && onCancelSign && (
              <button
                type="button"
                onClick={onCancelSign}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 animate-fadeIn"
              >
                <X size={15} />
                <span>Hủy Bỏ</span>
              </button>
            )}
            <button
              type="button"
              disabled={isInitiating || isDigestComputing}
              onClick={onInitiateSign}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer ${
                isInitiating || isDigestComputing
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95"
              }`}
            >
              {isInitiating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{loadingLabel}</span>
                </>
              ) : isDigestComputing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang tính mã băm...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>{buttonLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
