import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  Stethoscope,
  FileText,
  ArrowRight,
  Server,
  Zap,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  DEFAULT_MA_CSKCB,
  DEFAULT_MA_TINH,
  DEFAULT_CLINIC_NAME,
} from "../utils/shared/excelXmlShared";

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("clinic_remembered_user") || "";
  });

  // Mật khẩu thật lưu trong Ref (không đưa vào DOM hay React State để F12/React DevTools không soi được)
  const passwordRealRef = useRef<string>("");
  // DOM value chỉ chứa chuỗi mặt nạ Unicode '*'
  const [displayMask, setDisplayMask] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    "/danh-muc/01_bpcm";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Xử lý nhập liệu mật khẩu: chỉ lưu giá trị thật vào Ref, DOM chỉ hiển thị ký tự '*'
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const prevReal = passwordRealRef.current;
    const prevMask = displayMask;

    if (val.length === 0) {
      passwordRealRef.current = "";
      setDisplayMask("");
      return;
    }

    if (val.length > prevMask.length) {
      const addedLen = val.length - prevMask.length;
      const target = e.target;
      const cursorPos = target.selectionStart ?? val.length;
      const insertIdx = Math.max(0, cursorPos - addedLen);
      const insertedChars = val.slice(insertIdx, cursorPos);
      const nextReal =
        prevReal.slice(0, insertIdx) +
        insertedChars +
        prevReal.slice(insertIdx);
      passwordRealRef.current = nextReal;
      setDisplayMask("*".repeat(nextReal.length));
    } else if (val.length < prevMask.length) {
      const removedLen = prevMask.length - val.length;
      const target = e.target;
      const cursorPos = target.selectionStart ?? 0;
      const nextReal =
        prevReal.slice(0, cursorPos) + prevReal.slice(cursorPos + removedLen);
      passwordRealRef.current = nextReal;
      setDisplayMask("*".repeat(nextReal.length));
    }
  };

  const handlePasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    const target = e.currentTarget;
    const start = target.selectionStart ?? passwordRealRef.current.length;
    const end = target.selectionEnd ?? passwordRealRef.current.length;
    const prevReal = passwordRealRef.current;

    const nextReal =
      prevReal.slice(0, start) + pastedText + prevReal.slice(end);
    passwordRealRef.current = nextReal;
    setDisplayMask("*".repeat(nextReal.length));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim()) {
      setErrorMessage("Vui lòng nhập mã người dùng / tài khoản");
      return;
    }
    const realPassword = passwordRealRef.current;
    if (!realPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        username: username.trim(),
        password: realPassword,
        rememberMe,
      });

      if (rememberMe) {
        localStorage.setItem("clinic_remembered_user", username.trim());
      } else {
        localStorage.removeItem("clinic_remembered_user");
      }

      success(
        "Đăng nhập thành công vào hệ thống phòng khám!",
        "Xác thực hợp lệ",
      );
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.";
      setErrorMessage(msg);
      error(msg, "Lỗi đăng nhập");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] text-slate-800 antialiased font-sans select-none overflow-hidden">
      {/* ===================== CỘT TRÁI: BRANDING & TÍNH NĂNG ===================== */}
      <div className="hidden lg:flex lg:w-7/12 xl:w-3/5 bg-gradient-to-br from-slate-950 via-[#0a192f] to-[#06203d] text-white p-10 xl:p-14 flex-col justify-between relative overflow-hidden">
        {/* Subtle Background Glows & Medical Circuit Grid */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Header / Facility Info */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/10">
              <Stethoscope className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">
                  {DEFAULT_CLINIC_NAME}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                  BHYT
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Hệ thống Quản lý KCB & Cổng Giám định Điện tử Quốc gia
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 backdrop-blur-md">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Mã CSKCB:</span>
            <span className="font-mono font-semibold text-cyan-300">
              {DEFAULT_MA_CSKCB}
            </span>
            <span className="text-slate-600">•</span>
            <span>Tỉnh {DEFAULT_MA_TINH}</span>
          </div>
        </div>

        {/* Middle: Hero Title & Enterprise Cards */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold mb-5 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Cổng Tiếp Nhận BHXH 2026 • Chuẩn QĐ 130 & TT 25
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Nền tảng Quản lý Hồ sơ, <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              Giám định Chi phí & Ký số
            </span>
          </h1>

          <p className="text-sm text-slate-300 mt-4 leading-relaxed font-normal">
            Giải pháp đồng bộ liên thông dữ liệu khám chữa bệnh BHYT, kiểm soát
            xuất toán Mẫu 09/BH, tổng hợp Mẫu 01/BH và ký số tập trung VNPT
            SmartCA an toàn tuyệt đối.
          </p>

          {/* 3 Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8">
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-all">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                Giám định BHYT
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Tự động đối soát dữ liệu XML 130, Mẫu 01 và 09 xuất toán.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-all">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2.5">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                VNPT SmartCA
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Ký số Cloud HSM tốc độ cao cho toàn bộ chứng từ y tế.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-all">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                Bảo mật Cấp 3
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Đáp ứng tiêu chuẩn an toàn thông tin Y tế & chứng thực CA.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Status Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-300 font-medium">
              Cổng BHXH & Dịch vụ CA: Hoạt động bình thường
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            v2.6.0-PROD
          </span>
        </div>
      </div>

      {/* ===================== CỘT PHẢI: FORM ĐĂNG NHẬP ===================== */}
      <div className="w-full lg:w-5/12 xl:w-2/5 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-white relative overflow-y-auto">
        {/* Mobile Header (hiển thị khi màn hình nhỏ) */}
        <div className="flex lg:hidden items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 leading-tight">
                {DEFAULT_CLINIC_NAME}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Cổng Giám định KCB & Ký số
              </div>
            </div>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
            CSKCB {DEFAULT_MA_CSKCB}
          </span>
        </div>

        {/* Center Login Container */}
        <div className="my-auto py-6 max-w-sm w-full mx-auto">
          {/* Welcome Title */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Cổng Xác Thực Bác Sĩ & Quản Trị</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Đăng nhập hệ thống
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Vui lòng nhập tài khoản được cấp quyền để truy cập vào hệ thống
              quản lý khám chữa bệnh.
            </p>
          </div>


          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700"
              >
                Mã tài khoản / Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập mã tài khoản..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-500/15 transition-all shadow-2xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={displayMask}
                  onChange={handlePasswordChange}
                  onPaste={handlePasswordPaste}
                  placeholder="Nhập mật khẩu xác thực..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-500/15 transition-all shadow-2xs font-medium font-mono"
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Ghi nhớ tài khoản này</span>
              </label>

              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Bảo mật SSL/TLS
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang kết nối xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Support / Contact */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Máy chủ Cổng BHXH 48</span>
            </span>
            <span className="text-slate-400">Hỗ trợ: 1900 6868</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-[11px] text-slate-400">
          <p>© 2026 {DEFAULT_CLINIC_NAME}. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </div>
  );
};
