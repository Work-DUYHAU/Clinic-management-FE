import React from "react";
import {
  Database,
  FileText,
  ShieldAlert,
  FileSignature,
  LogOut,
  Stethoscope,
  Building2,
  ChevronRight,
  User,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { DEFAULT_MA_CSKCB, DEFAULT_MA_TINH, DEFAULT_CLINIC_NAME } from "../utils/shared/excelXmlShared";

export type MainTabType = "danh-muc" | "ho-so" | "chung-tu";
export type HoSoTabType = "01_tonghop" | "09_xuattoan";

interface SidebarProps {
  activeTab: MainTabType;
  hoSoTab: HoSoTabType;
  onNavigate: (tab: MainTabType, subTab?: HoSoTabType) => void;
  pendingXuattoanCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  hoSoTab,
  onNavigate,
  pendingXuattoanCount = 0,
}) => {
  const toast = useToast();

  return (
    <aside className="w-72 bg-[#001529] text-slate-300 flex flex-col flex-shrink-0 h-full z-40 border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3.5 border-b border-slate-800/80 bg-[#001122]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
          <Stethoscope size={22} className="stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 leading-tight truncate">
            {DEFAULT_CLINIC_NAME}{" "}
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30 flex-shrink-0">
              BHYT
            </span>
          </h2>
          <span className="text-[11px] text-slate-400 block truncate font-medium">
            Hệ Thống KCB & Giám Định
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
          <span>PHÂN HỆ NGHIỆP VỤ</span>
          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">
            QĐ 130
          </span>
        </div>

        {/* ============================================================
            1. PHÂN HỆ DANH MỤC (Gọn gàng, không để cả mớ sub-items)
        ============================================================ */}
        <button
          type="button"
          onClick={() => onNavigate("danh-muc")}
          className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group relative ${
            activeTab === "danh-muc"
              ? "bg-[#1677ff] text-white font-semibold shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40"
              : "hover:bg-slate-800/70 text-slate-300 hover:text-white bg-slate-900/30 border border-slate-800/60"
          }`}
        >
          <div
            className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
              activeTab === "danh-muc"
                ? "bg-white/20 text-white"
                : "bg-slate-800 text-blue-400 group-hover:bg-slate-700"
            }`}
          >
            <Database size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold flex items-center justify-between gap-1">
              <span className="truncate">1. Danh Mục KCB</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex-shrink-0 ${
                  activeTab === "danh-muc"
                    ? "bg-white/20 text-white"
                    : "bg-blue-950 text-blue-300 border border-blue-800/50"
                }`}
              >
                6 Biểu Mẫu
              </span>
            </div>
            <span
              className={`text-[11px] block truncate mt-0.5 ${activeTab === "danh-muc" ? "text-blue-100" : "text-slate-400"}`}
            >
              BPCM, Thuốc, TBYT, DVKT...
            </span>
          </div>
          {activeTab === "danh-muc" && (
            <ChevronRight size={15} className="text-white flex-shrink-0" />
          )}
        </button>

        {/* ============================================================
            2. PHÂN HỆ HỒ SƠ BHYT (Với 2 bộ hồ sơ chính)
        ============================================================ */}
        <div className="mt-2 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
            2. HỒ SƠ KHÁM CHỮA BỆNH
          </div>

          {/* Bộ 1: Bảng Tổng Hợp KCB (01/BH) */}
          <button
            type="button"
            onClick={() => onNavigate("ho-so", "01_tonghop")}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 group relative ${
              activeTab === "ho-so" && hoSoTab === "01_tonghop"
                ? "bg-[#1677ff] text-white font-semibold shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40"
                : "hover:bg-slate-800/70 text-slate-300 hover:text-white bg-slate-900/30 border border-slate-800/60"
            }`}
          >
            <div
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                activeTab === "ho-so" && hoSoTab === "01_tonghop"
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-cyan-400 group-hover:bg-slate-700"
              }`}
            >
              <FileText size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold flex items-center justify-between gap-1">
                <span className="truncate">Bộ 1: Bảng Tổng Hợp</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex-shrink-0 ${
                    activeTab === "ho-so" && hoSoTab === "01_tonghop"
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  01/BH
                </span>
              </div>
              <span
                className={`text-[11px] block truncate mt-0.5 ${activeTab === "ho-so" && hoSoTab === "01_tonghop" ? "text-blue-100" : "text-slate-400"}`}
              >
                Chi phí KCB & XML 130
              </span>
            </div>
            {activeTab === "ho-so" && hoSoTab === "01_tonghop" && (
              <ChevronRight size={14} className="text-white flex-shrink-0" />
            )}
          </button>

          {/* Bộ 2: Xử Lý Xuất Toán (09/BH) */}
          <button
            type="button"
            onClick={() => onNavigate("ho-so", "09_xuattoan")}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 group relative ${
              activeTab === "ho-so" && hoSoTab === "09_xuattoan"
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40"
                : "hover:bg-slate-800/70 text-slate-300 hover:text-white bg-slate-900/30 border border-slate-800/60"
            }`}
          >
            <div
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                activeTab === "ho-so" && hoSoTab === "09_xuattoan"
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-amber-400 group-hover:bg-slate-700"
              }`}
            >
              <ShieldAlert size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold flex items-center justify-between gap-1">
                <span className="truncate">Bộ 2: Xử Lý Xuất Toán</span>
                {pendingXuattoanCount > 0 ? (
                  <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full animate-pulse whitespace-nowrap flex-shrink-0">
                    {pendingXuattoanCount}
                  </span>
                ) : (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex-shrink-0 ${
                      activeTab === "ho-so" && hoSoTab === "09_xuattoan"
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    09/BH
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] block truncate mt-0.5 ${activeTab === "ho-so" && hoSoTab === "09_xuattoan" ? "text-amber-100" : "text-slate-400"}`}
              >
                Giải trình & thu hồi
              </span>
            </div>
            {activeTab === "ho-so" && hoSoTab === "09_xuattoan" && (
              <ChevronRight size={14} className="text-white flex-shrink-0" />
            )}
          </button>
        </div>

        {/* ============================================================
            3. PHÂN HỆ HỒ SƠ CHỨNG TỪ ĐIỆN TỬ (TT 25 & BHXH 2025)
        ============================================================ */}
        <div className="mt-2 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
            <span>3. CHỨNG TỪ ĐIỆN TỬ</span>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono">
              TT 25
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("chung-tu")}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 group relative ${
              activeTab === "chung-tu"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40"
                : "hover:bg-slate-800/70 text-slate-300 hover:text-white bg-slate-900/30 border border-slate-800/60"
            }`}
          >
            <div
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                activeTab === "chung-tu"
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-indigo-400 group-hover:bg-slate-700"
              }`}
            >
              <FileSignature size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold flex items-center justify-between gap-1">
                <span className="truncate">Hồ Sơ Chứng Từ</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex-shrink-0 ${
                    activeTab === "chung-tu"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-950 text-indigo-300 border border-indigo-800/50"
                  }`}
                >
                  TT 25
                </span>
              </div>
              <span
                className={`text-[11px] block truncate mt-0.5 ${
                  activeTab === "chung-tu" ? "text-indigo-100" : "text-slate-400"
                }`}
              >
                CT01, CT07, GBT, GCS...
              </span>
            </div>
            {activeTab === "chung-tu" && (
              <ChevronRight size={14} className="text-white flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Hospital Meta Card */}
        <div className="mt-auto pt-4">
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between font-semibold text-slate-200 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Building2 size={14} /> CSKCB {DEFAULT_MA_CSKCB}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                Tỉnh {DEFAULT_MA_TINH}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug truncate">
              {DEFAULT_CLINIC_NAME}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Trạng thái Cổng:</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>{" "}
                Sẵn sàng
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-[#001122] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
          <User size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white truncate">
            Ban Chuyên Viên CNTT
          </div>
        </div>
        <button
          type="button"
          title="Đăng xuất"
          onClick={() => {
            toast.showConfirm({
              title: "Đăng Xuất Hệ Thống",
              content:
                "Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại?",
              okText: "Đăng Xuất",
              cancelText: "Ở Lại",
              danger: true,
              onOk: () => {
                toast.success(
                  "Đã đăng xuất khỏi phiên làm việc an toàn.",
                  "Đăng Xuất Thành Công",
                );
              },
            });
          }}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
