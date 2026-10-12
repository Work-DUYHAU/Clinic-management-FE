import React, { useState } from "react";
import {
  Building2,
  Users,
  Pill,
  Cpu,
  Stethoscope,
  Wrench,
} from "lucide-react";
import {
  DmBpcmTab,
  DmNhanLucTab,
  DmThuocTab,
  DmThietBiTab,
  DmDichVuTab,
  DmTbDvktTab,
} from "../components/danh-muc";

export type CatalogTab =
  | "01_bpcm"
  | "02_nhanluc"
  | "03_thuoc"
  | "04_thietbi"
  | "05_dichvu"
  | "06_tbdvkt";

interface TabItem {
  id: CatalogTab;
  label: string;
  sub: string;
  badge: string;
  icon: React.ElementType;
  featured?: boolean;
}

export interface DanhMucPageProps {
  isActive?: boolean;
  activeCatalogTab?: CatalogTab;
  onCatalogTabChange?: (tab: CatalogTab) => void;
}

export const DanhMucPage: React.FC<DanhMucPageProps> = ({
  isActive = true,
  activeCatalogTab: externalTab,
  onCatalogTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<CatalogTab>("01_bpcm");
  const activeCatalogTab = externalTab ?? internalTab;

  const handleTabChange = (tabId: CatalogTab) => {
    if (onCatalogTabChange) {
      onCatalogTabChange(tabId);
    } else {
      setInternalTab(tabId);
    }
  };

  const catalogTabs: TabItem[] = [
    {
      id: "01_bpcm",
      label: "01/DM: Bộ Phận Chuyên Môn",
      sub: "Khoa phòng, bàn khám & giường bệnh (Loại 70)",
      badge: "Loại 70",
      icon: Building2,
      featured: true,
    },
    {
      id: "02_nhanluc",
      label: "02/DM: Nhân Lực KCB BHYT",
      sub: "Bác sỹ, CCHN, thời gian ĐK (Loại 71)",
      badge: "Loại 71",
      icon: Users,
      featured: true,
    },
    {
      id: "03_thuoc",
      label: "03/DM: Thuốc & Sinh Phẩm",
      sub: "Danh mục thuốc, hoạt chất & đơn giá BHYT",
      badge: "Loại 10",
      icon: Pill,
    },
    {
      id: "04_thietbi",
      label: "04/DM: Thiết Bị Y Tế",
      sub: "Trang thiết bị y tế thanh toán BHYT (Loại 11)",
      badge: "Loại 11",
      icon: Cpu,
      featured: true,
    },
    {
      id: "05_dichvu",
      label: "05/DM: Dịch Vụ Kỹ Thuật",
      sub: "DVKT, giá BHYT & viện phí phê duyệt (Loại 12)",
      badge: "Loại 12",
      icon: Stethoscope,
    },
    {
      id: "06_tbdvkt",
      label: "06/DM: TBYT Thực Hiện DVKT",
      sub: "TBYT thực hiện DVKT theo QĐ 3176 & NĐ 07 (Loại 05)",
      badge: "Loại 05",
      icon: Wrench,
      featured: true,
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* 6 Tab Switcher Grid - Phong cách góc cạnh, chuyên nghiệp */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {catalogTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCatalogTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`p-2 sm:p-2.5 rounded-md border text-left transition-all duration-150 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                isActive
                  ? "bg-white border-blue-600 shadow-sm border-t-[3px] border-t-blue-600 ring-1 ring-blue-500/20"
                  : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1 rounded-sm ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200/60"
                      : "bg-slate-100 text-slate-500 border border-slate-200/60"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm font-mono ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200/60"
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <div>
                <div
                  className={`text-xs font-bold leading-tight ${
                    isActive ? "text-blue-600" : "text-slate-800"
                  }`}
                >
                  {tab.label}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-0.5 font-normal line-clamp-1 leading-tight">
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content - Keep mounted to preserve individual Excel imports and sheet states */}
      <div className="transition-all duration-200">
        <div className={activeCatalogTab === "01_bpcm" ? "block" : "hidden"}>
          <DmBpcmTab isActive={isActive && activeCatalogTab === "01_bpcm"} />
        </div>
        <div className={activeCatalogTab === "02_nhanluc" ? "block" : "hidden"}>
          <DmNhanLucTab isActive={isActive && activeCatalogTab === "02_nhanluc"} />
        </div>
        <div className={activeCatalogTab === "03_thuoc" ? "block" : "hidden"}>
          <DmThuocTab isActive={isActive && activeCatalogTab === "03_thuoc"} />
        </div>
        <div className={activeCatalogTab === "04_thietbi" ? "block" : "hidden"}>
          <DmThietBiTab isActive={isActive && activeCatalogTab === "04_thietbi"} />
        </div>
        <div className={activeCatalogTab === "05_dichvu" ? "block" : "hidden"}>
          <DmDichVuTab isActive={isActive && activeCatalogTab === "05_dichvu"} />
        </div>
        <div className={activeCatalogTab === "06_tbdvkt" ? "block" : "hidden"}>
          <DmTbDvktTab isActive={isActive && activeCatalogTab === "06_tbdvkt"} />
        </div>
      </div>
    </div>
  );
};
