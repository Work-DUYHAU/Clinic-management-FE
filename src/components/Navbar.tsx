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
import { Badge, IconButton } from "../shared/components";

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

type ColorScheme = "blue" | "indigo" | "amber";

interface HeaderMeta {
  title: string;
  sub: string;
  badge: string;
  icon: React.ElementType;
  colorScheme: ColorScheme;
}

const COLOR_STYLES: Record<
  ColorScheme,
  {
    iconWrap: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  blue: {
    iconWrap: "bg-blue-50/80 text-blue-600 border-blue-200/80",
    badgeBg: "#eff6ff",
    badgeText: "#1d4ed8",
    badgeBorder: "#bfdbfe",
  },
  indigo: {
    iconWrap: "bg-indigo-50/80 text-indigo-600 border-indigo-200/80",
    badgeBg: "#eef2ff",
    badgeText: "#4338ca",
    badgeBorder: "#c7d2fe",
  },
  amber: {
    iconWrap: "bg-amber-50/80 text-amber-600 border-amber-200/80",
    badgeBg: "#fffbeb",
    badgeText: "#b45309",
    badgeBorder: "#fde68a",
  },
};

function getHeaderMeta(
  activeTab: MainTabType,
  hoSoTab: HoSoTabType,
  catalogTab: CatalogTab,
): HeaderMeta {
  if (activeTab === "danh-muc") {
    const catalog = CATALOG_CONFIG[catalogTab] || CATALOG_CONFIG["01_bpcm"];
    return {
      title: catalog.title,
      sub: catalog.sub,
      badge: catalog.badge,
      icon: catalog.icon,
      colorScheme: "blue",
    };
  }

  if (activeTab === "chung-tu") {
    return {
      title: "Phân Hệ: Hồ Sơ Chứng Từ Điện Tử",
      sub: "Nộp hồ sơ CT01, CT07, Giấy báo tử, Giấy chứng sinh chuẩn liên thông Cổng BHXH",
      badge: "TT 25 & BHXH 2025",
      icon: FileSignature,
      colorScheme: "indigo",
    };
  }

  if (hoSoTab === "01_tonghop") {
    return {
      title: "Bộ 1: Bảng Tổng Hợp Chi Phí KCB",
      sub: "Giám sát tổng hợp chi phí KCB BHYT, kiểm tra thẻ và kết xuất XML 130",
      badge: "Mẫu 01/BH",
      icon: FileText,
      colorScheme: "blue",
    };
  }

  return {
    title: "Bộ 2: Xử Lý Xuất Toán BHYT",
    sub: "Tiếp nhận thông báo xuất toán từ Cổng BHXH, lập giải trình và theo dõi thu hồi",
    badge: "Mẫu 09/BH",
    icon: ShieldAlert,
    colorScheme: "amber",
  };
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

  const meta = getHeaderMeta(activeTab, hoSoTab, catalogTab);
  const colorStyle = COLOR_STYLES[meta.colorScheme];
  const IconComponent = meta.icon;
  const handleNotificationClick = () => {
    toast.info(
      "Hệ thống kiểm tra định kỳ: Không phát hiện cảnh báo lỗi mới từ Cổng Giám định BHYT.",
      "Cổng Tiếp Nhận BHXH",
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Module Title & Breadcrumbs */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-md border flex-shrink-0 ${colorStyle.iconWrap}`}
          >
            <IconComponent size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                {meta.title}
              </span>
              <Badge
                count={meta.badge}
                style={{
                  backgroundColor: colorStyle.badgeBg,
                  color: colorStyle.badgeText,
                  border: `1px solid ${colorStyle.badgeBorder}`,
                  fontSize: "10px",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  padding: "0 6px",
                  height: "20px",
                  lineHeight: "18px",
                  borderRadius: "3px",
                }}
              />
            </div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap block mt-0.5 font-medium">
              {meta.sub}
            </span>
          </div>
        </div>
      </div>

      {/* Right Gateway Status & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Calendar Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-md text-xs text-slate-600 font-medium">
          <Calendar size={13} className="text-slate-500" />
          <span>{today}</span>
        </div>
        {/* Notification Bell */}
        <Badge dot offset={[-3, 3]} color="#f43f5e">
          <IconButton
            icon={<Bell size={16} />}
            tooltip="Thông báo Cổng Giám định BHYT"
            tooltipPlacement="bottom"
            type="default"
            className="!w-9 !h-9 !p-0 !inline-flex !items-center !justify-center !rounded-md !border-slate-200 hover:!bg-slate-50 !text-slate-600 hover:!text-slate-900 shadow-xs cursor-pointer"
            onClick={handleNotificationClick}
          />
        </Badge>
      </div>
    </header>
  );
};
