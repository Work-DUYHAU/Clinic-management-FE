import React from "react";
import {
  Calendar,
  Bell,
  ShieldAlert,
  FileText,
  Database,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useSignModal } from "../context/SignModalContext";
import type { MainTabType, HoSoTabType } from "./Sidebar";

interface NavbarProps {
  activeTab?: MainTabType;
  hoSoTab?: HoSoTabType;
  onOpenSignModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = "ho-so",
  hoSoTab = "01_tonghop",
  onOpenSignModal,
}) => {
  const toast = useToast();
  const { openSignModal } = useSignModal();

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleOpenSign = () => {
    if (onOpenSignModal) {
      onOpenSignModal();
    } else {
      openSignModal();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Module Title & Breadcrumbs */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {activeTab === "danh-muc" ? (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-[#1677ff] border border-blue-100 flex-shrink-0">
              <Database size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-bold text-slate-800">
                  1. Quản Lý Danh Mục KCB BHYT
                </span>
                <span className="text-[10px] font-bold bg-blue-50 text-[#1677ff] border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                  6 Biểu Mẫu DM
                </span>
              </div>
              <span className="text-[11px] text-slate-500 whitespace-nowrap block">
                Chuẩn hóa dữ liệu dùng chung Bộ Y tế & Cổng Giám định BHYT
              </span>
            </div>
          </div>
        ) : hoSoTab === "01_tonghop" ? (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-[#1677ff] border border-blue-100 flex-shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-bold text-slate-800">
                  Bộ 1: Bảng Tổng Hợp Chi Phí KCB
                </span>
                <span className="text-[10px] font-bold bg-blue-50 text-[#1677ff] border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                  Mẫu 01/BH
                </span>
              </div>
              <span className="text-[11px] text-slate-500 whitespace-nowrap block">
                Giám sát tổng hợp chi phí KCB BHYT, kiểm tra thẻ và kết xuất XML
                130
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-bold text-slate-800">
                  Bộ 2: Xử Lý Xuất Toán BHYT
                </span>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
                  Mẫu 09/BH
                </span>
              </div>
              <span className="text-[11px] text-slate-500 whitespace-nowrap block">
                Tiếp nhận thông báo xuất toán từ Cổng BHXH, lập giải trình và
                theo dõi thu hồi
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Gateway Status & Actions */}
      <div className="flex items-center gap-3">
        {/* Calendar Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 font-medium">
          <Calendar size={14} className="text-emerald-600" />
          <span>{today}</span>
        </div>

        {/* Nút Mở Ký Số SmartCA Nhanh */}
        <button
          type="button"
          onClick={handleOpenSign}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/80 hover:bg-blue-100/80 text-[#1677ff] border border-blue-200 hover:border-blue-400 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          title="Mở Bảng Ký Số SmartCA & Liên Thông BHXH"
        >
          <ShieldCheck size={16} className="text-[#1677ff]" />
          <span>Ký Số</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Cổng BHXH</span>
        </div>

        <button
          type="button"
          onClick={() =>
            toast.info(
              "Hệ thống kiểm tra định kỳ: Không phát hiện cảnh báo lỗi mới từ Cổng Giám định BHYT.",
              "Cổng Tiếp Nhận BHXH",
            )
          }
          className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          title="Thông báo Cổng Giám định"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>
      </div>
    </header>
  );
};
