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
  Activity,
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

  const isDanhMucActive = activeTab === "danh-muc";
  const isHoSo01Active = activeTab === "ho-so" && hoSoTab === "01_tonghop";
  const isHoSo09Active = activeTab === "ho-so" && hoSoTab === "09_xuattoan";
  const isChungTuActive = activeTab === "chung-tu";

  return (
    <aside className="w-68 bg-[#0a1120] text-slate-300 flex flex-col flex-shrink-0 h-full z-40 border-r border-slate-800/90 shadow-2xl select-none font-sans">
      {/* 1. Header Thương Hiệu - Thiết kế góc cạnh, vững chãi */}
      <div className="px-4 py-4.5 border-b border-slate-800/80 bg-[#070d18] flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-inner">
          <Stethoscope size={20} className="stroke-[2.2]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-100 tracking-tight truncate leading-tight">
              {DEFAULT_CLINIC_NAME}
            </span>
            <span className="text-[10px] font-semibold uppercase px-1 py-0.2 rounded-sm bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono flex-shrink-0">
              BHYT
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
            Cổng Giám Định & Dữ Liệu XML
          </span>
        </div>
      </div>

      {/* 2. Menu Điều Hướng Nghiệp Vụ */}
      <nav className="px-2.5 py-3 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        {/* Nhóm 1: Danh Mục KCB */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>QUẢN LÝ DANH MỤC</span>
            <span className="text-[10px] text-slate-400 font-mono">QĐ 130</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("danh-muc")}
            className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors duration-150 border text-xs ${
              isDanhMucActive
                ? "bg-blue-600/15 text-blue-300 font-semibold border-blue-500/40 border-l-[3px] border-l-blue-500 shadow-sm"
                : "bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800/60"
            }`}
          >
            <Database
              size={16}
              className={`flex-shrink-0 ${isDanhMucActive ? "text-blue-400" : "text-slate-400"}`}
            />
            <span className="flex-1 truncate">Danh Mục KCB</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium font-mono ${
                isDanhMucActive
                  ? "bg-blue-500/25 text-blue-200 border border-blue-400/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700/50"
              }`}
            >
              6 Biểu Mẫu
            </span>
            {isDanhMucActive && <ChevronRight size={14} className="text-blue-400 flex-shrink-0" />}
          </button>
        </div>

        {/* Nhóm 2: Hồ Sơ Khám Chữa Bệnh */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            HỒ SƠ KHÁM CHỮA BỆNH
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Bộ 1: Bảng tổng hợp KCB (01/BH) */}
            <button
              type="button"
              onClick={() => onNavigate("ho-so", "01_tonghop")}
              className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors duration-150 border text-xs ${
                isHoSo01Active
                  ? "bg-blue-600/15 text-blue-300 font-semibold border-blue-500/40 border-l-[3px] border-l-blue-500 shadow-sm"
                  : "bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800/60"
              }`}
            >
              <FileText
                size={16}
                className={`flex-shrink-0 ${isHoSo01Active ? "text-blue-400" : "text-slate-400"}`}
              />
              <span className="flex-1 truncate">Bảng Tổng Hợp KCB</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium font-mono ${
                  isHoSo01Active
                    ? "bg-blue-500/25 text-blue-200 border border-blue-400/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700/50"
                }`}
              >
                01/BH
              </span>
              {isHoSo01Active && <ChevronRight size={14} className="text-blue-400 flex-shrink-0" />}
            </button>

            {/* Bộ 2: Xử lý xuất toán (09/BH) */}
            <button
              type="button"
              onClick={() => onNavigate("ho-so", "09_xuattoan")}
              className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors duration-150 border text-xs ${
                isHoSo09Active
                  ? "bg-amber-500/15 text-amber-300 font-semibold border-amber-500/40 border-l-[3px] border-l-amber-500 shadow-sm"
                  : "bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800/60"
              }`}
            >
              <ShieldAlert
                size={16}
                className={`flex-shrink-0 ${isHoSo09Active ? "text-amber-400" : "text-slate-400"}`}
              />
              <span className="flex-1 truncate">Hồ Sơ Điều Chỉnh</span>
              {pendingXuattoanCount > 0 ? (
                <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded-sm font-mono animate-pulse">
                  {pendingXuattoanCount}
                </span>
              ) : (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium font-mono ${
                    isHoSo09Active
                      ? "bg-amber-500/25 text-amber-200 border border-amber-400/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700/50"
                  }`}
                >
                  09/BH
                </span>
              )}
              {isHoSo09Active && <ChevronRight size={14} className="text-amber-400 flex-shrink-0" />}
            </button>
          </div>
        </div>

        {/* Nhóm 3: Chứng Từ Điện Tử */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>CHỨNG TỪ ĐIỆN TỬ</span>
            <span className="text-[10px] text-slate-400 font-mono">TT 25</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("chung-tu")}
            className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors duration-150 border text-xs ${
              isChungTuActive
                ? "bg-blue-600/15 text-blue-300 font-semibold border-blue-500/40 border-l-[3px] border-l-blue-500 shadow-sm"
                : "bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800/60"
            }`}
          >
            <FileSignature
              size={16}
              className={`flex-shrink-0 ${isChungTuActive ? "text-blue-400" : "text-slate-400"}`}
            />
            <span className="flex-1 truncate">Chứng Từ KCB</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium font-mono ${
                isChungTuActive
                  ? "bg-blue-500/25 text-blue-200 border border-blue-400/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700/50"
              }`}
            >
              TT 25
            </span>
            {isChungTuActive && <ChevronRight size={14} className="text-blue-400 flex-shrink-0" />}
          </button>
        </div>

        {/* 3. Panel Thông Tin Cơ Sở - Góc cạnh, súc tích */}
        <div className="mt-auto pt-2">
          <div className="p-3 bg-slate-900/80 rounded-md border border-slate-800/80 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between font-semibold text-slate-200 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Building2 size={13} className="text-blue-400" /> CSKCB {DEFAULT_MA_CSKCB}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/60 px-1.5 py-0.2 rounded-sm font-mono">
                Tỉnh {DEFAULT_MA_TINH}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-400" /> Cổng BHXH:
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Kết nối ổn định
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* 4. Footer Người Dùng / Đăng Xuất */}
      <div className="px-3 py-3 border-t border-slate-800/80 bg-[#070d18] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 flex-shrink-0">
          <User size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200 truncate">
            Chuyên Viên CNTT
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            QuanTriVien@cskcb
          </div>
        </div>
        <button
          type="button"
          title="Đăng xuất"
          onClick={() => {
            toast.showConfirm({
              title: "Đăng Xuất Hệ Thống",
              content: "Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại?",
              okText: "Đăng Xuất",
              cancelText: "Ở Lại",
              danger: true,
              onOk: () => {
                toast.success(
                  "Đã đăng xuất khỏi phiên làm việc an toàn.",
                  "Đăng Xuất Thành Công"
                );
              },
            });
          }}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-md transition-colors"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
};
