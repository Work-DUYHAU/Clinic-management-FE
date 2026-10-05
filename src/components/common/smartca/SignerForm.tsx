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
import type { SmartCaPersistentConfig } from "../../../services/smartca/smartcaConfig";
import {
  type IdentityType,
  IDENTITY_LIMITS,
  IDENTITY_PLACEHOLDERS,
  IDENTITY_DESCRIPTIONS,
  validateIdentity,
} from "../../../utils/validators";

export interface SignerFormProps {
  config: SmartCaPersistentConfig;
  signerName: string;
  setSignerName: (name: string) => void;
  signerEmail: string;
  setSignerEmail: (email: string) => void;
  idType: IdentityType;
  identityValue: string;
  onIdentityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectIdType: (type: IdentityType) => void;
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
}

export const SignerForm: React.FC<SignerFormProps> = ({
  config,
  signerName,
  setSignerName,
  signerEmail,
  setSignerEmail,
  idType,
  identityValue,
  onIdentityChange,
  onSelectIdType,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isInitiating,
  onInitiateSign,
  onCancelSign,
  authMethodLabel = "Ứng dụng VNPT SmartCA (Q1)",
  buttonLabel = "Gửi Yêu Cầu Ký Số Lên App SmartCA",
  loadingLabel = "Đang Khởi Tạo Ký Q1...",
  signMode = "Q2",
}) => {
  const identityStatus = useMemo(() => {
    if (!identityValue.trim()) return null;
    return validateIdentity(identityValue, idType);
  }, [identityValue, idType]);

  return (
    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-base font-extrabold text-slate-900">
            {signMode === "Q2" ? (
              <span className="flex items-center gap-1.5 text-blue-700">
                <Zap size={18} className="fill-blue-600 text-blue-600" />
                <span>Ký Số Tự Động VNPT SmartCA (Smart OTP qua Secret Key)</span>
              </span>
            ) : (
              "Ký Số Phê Duyệt Qua App VNPT SmartCA (Q1)"
            )}
          </h4>
          <p className="text-xs text-slate-500">
            {signMode === "Q2"
              ? "Tự động sinh mã Smart OTP từ Secret Key & hoàn tất ký số trong 1 click, không cần mở app điện thoại"
              : "Nhập thông tin người ký & tài khoản SmartCA nhận thông báo phê duyệt"}
          </p>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${
            config.env === "production"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {config.env === "production" ? "VNPT Production" : "VNPT Demo/Test"}
        </span>
      </div>

      {/* HỌ TÊN NGƯỜI KÝ & EMAIL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Họ và Tên Người Ký:{" "}
            {idType !== "mst" && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder={
              idType === "mst" ? "Optional" : "Bắt buộc (VD: BS. NGUYỄN VĂN AN)"
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Email Người Ký:
            {idType !== "mst" && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder={
              idType === "mst"
                ? "Optional"
                : "Bắt buộc (VD: bacsi.an@hospital.vn)"
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* TÀI KHOẢN SMARTCA NHẬN THÔNG BÁO */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">
            Tài Khoản SmartCA Nhận Thông Báo (Push App):{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => onSelectIdType("phone")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                idType === "phone"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Số Điện Thoại
            </button>
            <button
              type="button"
              onClick={() => onSelectIdType("cccd")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                idType === "cccd"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Số CCCD
            </button>
            <button
              type="button"
              onClick={() => onSelectIdType("mst")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                idType === "mst"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mã Số Thuế (MST)
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            maxLength={IDENTITY_LIMITS[idType]}
            value={identityValue}
            onChange={onIdentityChange}
            placeholder={IDENTITY_PLACEHOLDERS[idType]}
            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm font-mono font-semibold text-slate-900 focus:outline-none transition-all shadow-2xs pr-16 ${
              identityStatus === null
                ? "border-slate-300 focus:ring-2 focus:ring-blue-500"
                : identityStatus.isValid
                  ? "border-emerald-400 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20"
                  : "border-amber-300 focus:ring-2 focus:ring-amber-500"
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400 pointer-events-none select-none">
            {identityValue.length}/{IDENTITY_LIMITS[idType]}
          </div>
        </div>

        {/* GỢI Ý & TRẠNG THÁI KIỂM TRA ĐỊNH DANH */}
        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="text-slate-500">
            {IDENTITY_DESCRIPTIONS[idType]}
          </span>
          {identityStatus && (
            <span
              className={`flex items-center gap-1 font-semibold ${
                identityStatus.isValid ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {identityStatus.isValid ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Định dạng hợp lệ</span>
                </>
              ) : (
                <>
                  <AlertCircle size={13} className="text-amber-500" />
                  <span>
                    Chưa đúng định dạng ({identityValue.length}/
                    {IDENTITY_LIMITS[idType]})
                  </span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* MẬT KHẨU TÀI KHOẢN SMARTCA */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>
            Mật Khẩu Tài Khoản SmartCA: <span className="text-rose-500">*</span>
          </span>
          <span className="text-xs text-slate-400 font-normal">
            (Xác thực API VNPT)
          </span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu tài khoản VNPT SmartCA"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 transition-all shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* NÚT GỬI YÊU CẦU KÝ SỐ & NÚT HỦY BỎ */}
      <div className="flex items-center justify-between pt-2">
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
            disabled={isInitiating}
            onClick={onInitiateSign}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer ${
              isInitiating
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95"
            }`}
          >
            {isInitiating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{loadingLabel}</span>
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
    </div>
  );
};
