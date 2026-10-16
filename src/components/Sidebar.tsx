import React from "react";
import {
  Database,
  FileText,
  ShieldAlert,
  FileSignature,
  ShieldCheck,
  LogOut,
  Stethoscope,
  Building2,
  ChevronRight,
  User,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import {
  DEFAULT_MA_CSKCB,
  DEFAULT_MA_TINH,
  DEFAULT_CLINIC_NAME,
} from "../utils/shared/excelXmlShared";
import { Badge, IconButton } from "../shared/components";
import { useAuth } from "../context/AuthContext";

export type MainTabType = "danh-muc" | "ho-so" | "chung-tu" | "ky-so";
export type HoSoTabType = "01_tonghop" | "09_xuattoan";

interface SidebarProps {
  activeTab: MainTabType;
  hoSoTab: HoSoTabType;
  onNavigate: (tab: MainTabType, subTab?: HoSoTabType) => void;
  pendingXuattoanCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  code: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  badgeCount?: number;
  accent: "blue" | "amber";
}

interface NavSection {
  title: string;
  tag?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  hoSoTab,
  onNavigate,
  pendingXuattoanCount = 0,
}) => {
  const toast = useToast();
  const { user, logout } = useAuth();

  const isDanhMucActive = activeTab === "danh-muc";
  const isHoSo01Active = activeTab === "ho-so" && hoSoTab === "01_tonghop";
  const isHoSo09Active = activeTab === "ho-so" && hoSoTab === "09_xuattoan";
  const isChungTuActive = activeTab === "chung-tu";
  const isKySoActive = activeTab === "ky-so";

  const navSections: NavSection[] = [
    {
      title: "QUẢN LÝ DANH MỤC",
      tag: "QĐ 130",
      items: [
        {
          id: "danh-muc",
          label: "Danh Mục KCB",
          code: "6 Biểu Mẫu",
          icon: Database,
          isActive: isDanhMucActive,
          onClick: () => onNavigate("danh-muc"),
          accent: "blue",
        },
      ],
    },
    {
      title: "HỒ SƠ KHÁM CHỮA BỆNH",
      items: [
        {
          id: "01_tonghop",
          label: "Bảng Tổng Hợp KCB",
          code: "01/BH",
          icon: FileText,
          isActive: isHoSo01Active,
          onClick: () => onNavigate("ho-so", "01_tonghop"),
          accent: "blue",
        },
        {
          id: "09_xuattoan",
          label: "Hồ Sơ Điều Chỉnh",
          code: "09/BH",
          icon: ShieldAlert,
          isActive: isHoSo09Active,
          onClick: () => onNavigate("ho-so", "09_xuattoan"),
          badgeCount: pendingXuattoanCount,
          accent: "amber",
        },
      ],
    },
    {
      title: "CHỨNG TỪ ĐIỆN TỬ",
      tag: "TT 25",
      items: [
        {
          id: "chung-tu",
          label: "Chứng Từ KCB",
          code: "TT 25",
          icon: FileSignature,
          isActive: isChungTuActive,
          onClick: () => onNavigate("chung-tu"),
          accent: "blue",
        },
      ],
    },
    {
      title: "KÝ SỐ & GỬI BHXH",
      items: [
        {
          id: "ky-so",
          label: "Ký Hồ Sơ Tổng Hợp",
          code: "PDF",
          icon: ShieldCheck,
          isActive: isKySoActive,
          onClick: () => onNavigate("ky-so"),
          accent: "blue",
        },
      ],
    },
  ];

  const handleLogout = () => {
    toast.showConfirm({
      title: "Đăng Xuất Hệ Thống",
      content: "Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại?",
      okText: "Đăng Xuất",
      cancelText: "Ở Lại",
      danger: true,
      onOk: async () => {
        await logout();
        toast.success(
          "Đã đăng xuất khỏi phiên làm việc an toàn.",
          "Đăng Xuất Thành Công",
        );
      },
    });
  };

  return (
    <aside className="w-68 bg-[#0a1120] text-slate-300 flex flex-col flex-shrink-0 h-full z-40 border-r border-slate-800/90 shadow-2xl select-none font-sans">
      {/* 1. Header Thương Hiệu */}
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
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{section.title}</span>
              {section.tag && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {section.tag}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {section.items.map((item) => {
                const ItemIcon = item.icon;
                const isAmber = item.accent === "amber";

                const activeClasses = isAmber
                  ? "bg-amber-500/15 text-amber-300 font-semibold border-amber-500/40 border-l-[3px] border-l-amber-500 shadow-sm"
                  : "bg-blue-600/15 text-blue-300 font-semibold border-blue-500/40 border-l-[3px] border-l-blue-500 shadow-sm";

                const iconActiveColor = isAmber
                  ? "text-amber-400"
                  : "text-blue-400";
                const chevronActiveColor = isAmber
                  ? "text-amber-400"
                  : "text-blue-400";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors duration-150 border text-xs cursor-pointer ${
                      item.isActive
                        ? activeClasses
                        : "bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800/60"
                    }`}
                  >
                    <ItemIcon
                      size={16}
                      className={`flex-shrink-0 ${
                        item.isActive ? iconActiveColor : "text-slate-400"
                      }`}
                    />
                    <span className="flex-1 truncate">{item.label}</span>

                    {/* Badge / Count */}
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <Badge
                        count={item.badgeCount}
                        overflowCount={99}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium font-mono ${
                          item.isActive
                            ? isAmber
                              ? "bg-amber-500/25 text-amber-200 border border-amber-400/30"
                              : item.id === "ky-so"
                              ? "bg-blue-600 text-white font-bold border-blue-500"
                              : "bg-blue-500/25 text-blue-200 border border-blue-400/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {item.code}
                      </span>
                    )}
                    {item.isActive && (
                      <ChevronRight
                        size={14}
                        className={`${chevronActiveColor} flex-shrink-0`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* 3. Panel Thông Tin Cơ Sở */}
        <div className="mt-auto pt-2">
          <div className="p-3 bg-slate-900/80 rounded-md border border-slate-800/80 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between font-semibold text-slate-200 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Building2 size={13} className="text-blue-400" /> CSKCB{" "}
                {DEFAULT_MA_CSKCB}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/60 px-1.5 py-0.2 rounded-sm font-mono">
                Tỉnh {DEFAULT_MA_TINH}
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
          <div
            className="text-xs font-semibold text-slate-200 truncate"
            title={user?.fullName || "Chuyên Viên CNTT"}
          >
            {user?.fullName || "Chuyên Viên CNTT"}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {user?.username ? `ID: ${user.username}` : "QuanTriVien@cskcb"}
          </div>
        </div>
        <IconButton
          icon={<LogOut size={15} />}
          tooltip="Đăng xuất khỏi phiên làm việc"
          tooltipPlacement="top"
          type="text"
          danger
          className="!text-slate-400 hover:!text-rose-400 hover:!bg-slate-800/80 !w-8 !h-8 !p-0 !inline-flex !items-center !justify-center !rounded-md !border-0 cursor-pointer transition-colors"
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
};
