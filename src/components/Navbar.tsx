import React from "react";
import {
  Calendar,
  Bell,
  ShieldAlert,
  FileText,
  FileSignature,
  Building2,
  Users,
  Pill,
  Cpu,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import type { MainTabType, HoSoTabType } from "./Sidebar";
import type { CatalogTab } from "../pages/DanhMucPage";

const CATALOG_CONFIG: Record<
  CatalogTab,
  {
    title: string;
    sub: string;
    badge: string;
    icon: React.ElementType;
  }
> = {
  "01_bpcm": {
    title: "01/DM: Bộ Phận Chuyên Môn",
    sub: "Khoa phòng, bàn khám & giường bệnh (Loại 70)",
    badge: "Loại 70",
    icon: Building2,
  },
  "02_nhanluc": {
    title: "02/DM: Nhân Lực KCB BHYT",
    sub: "Bác sỹ, CCHN, thời gian ĐK (Loại 71)",
    badge: "Loại 71",
    icon: Users,
  },
  "03_thuoc": {
    title: "03/DM: Thuốc & Sinh Phẩm",
    sub: "Danh mục thuốc, hoạt chất & đơn giá BHYT",
    badge: "Loại 10",
    icon: Pill,
  },
  "04_thietbi": {
    title: "04/DM: Thiết Bị Y Tế",
    sub: "Trang thiết bị y tế thanh toán BHYT (Loại 11)",
    badge: "Loại 11",
    icon: Cpu,
  },
  "05_dichvu": {
    title: "05/DM: Dịch Vụ Kỹ Thuật",
    sub: "DVKT, giá BHYT & viện phí phê duyệt (Loại 12)",
    badge: "Loại 12",
    icon: Stethoscope,
  },
  "06_tbdvkt": {
    title: "06/DM: TBYT Thực Hiện DVKT",
    sub: "TBYT thực hiện DVKT theo QĐ 3176 & NĐ 07 (Loại 05)",
    badge: "Loại 05",
    icon: Wrench,
  },
};

interface NavbarProps {
  activeTab?: MainTabType;
  hoSoTab?: HoSoTabType;
  catalogTab?: CatalogTab;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = "ho-so",
  hoSoTab = "01_tonghop",
  catalogTab = "01_bpcm",
}) => {
  const toast = useToast();

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Module Title & Breadcrumbs */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {activeTab === "danh-muc" ? (
          (() => {
            const currentCatalog =
              CATALOG_CONFIG[catalogTab] || CATALOG_CONFIG["01_bpcm"];
            const CatalogIcon = currentCatalog.icon;
            return (
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-[#1677ff] border border-blue-100 flex-shrink-0">
                  <CatalogIcon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-800">
                      {currentCatalog.title}
                    </span>
                    <span className="text-[10px] font-bold bg-blue-50 text-[#1677ff] border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      {currentCatalog.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap block">
                    {currentCatalog.sub}
                  </span>
                </div>
              </div>
            );
          })()
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
        ) : activeTab === "chung-tu" ? (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex-shrink-0">
              <FileSignature size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-bold text-slate-800">
                  3. Hồ Sơ Chứng Từ Điện Tử
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex-shrink-0">
                  TT 25 & BHXH 2025
                </span>
              </div>
              <span className="text-[11px] text-slate-500 whitespace-nowrap block">
                Nộp hồ sơ CT01, CT07, Giấy báo tử, Giấy chứng sinh chuẩn liên thông Cổng BHXH
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
