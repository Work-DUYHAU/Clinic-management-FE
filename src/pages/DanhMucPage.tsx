import React, { useState } from "react";
import {
  Building2,
  Users,
  Pill,
  Cpu,
  Stethoscope,
  Wrench,
  ShieldCheck,
  Database,
} from "lucide-react";
import {
  DmBpcmTab,
  DmNhanLucTab,
  DmThuocTab,
  DmThietBiTab,
  DmDichVuTab,
  DmTbDvktTab,
} from "../components/danh-muc";
import { DEFAULT_MA_CSKCB, DEFAULT_CLINIC_NAME } from "../utils/shared/excelXmlShared";

type CatalogTab =
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

interface DanhMucPageProps {
  isActive?: boolean;
}

export const DanhMucPage: React.FC<DanhMucPageProps> = ({ isActive = true }) => {
  const [activeCatalogTab, setActiveCatalogTab] =
    useState<CatalogTab>("01_bpcm");

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
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1677ff] font-bold text-xs border border-blue-200 flex items-center gap-1">
              <Database size={12} />
              <span>Hệ Thống Danh Mục Chuẩn BHXH Việt Nam</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Sẵn Sàng Ký Số Trực Tuyến</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            Quản Lý Danh Mục BHYT & Đồng Bộ Cổng EGW
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mã CSKCB:{" "}
            <strong className="text-slate-800 font-mono font-bold">
              {DEFAULT_MA_CSKCB}
            </strong>{" "}
            • Cơ sở:{" "}
            <strong className="text-slate-800 font-bold">
              {DEFAULT_CLINIC_NAME}
            </strong>{" "}
            • Phiên bản API Gateway:{" "}
            <strong className="text-[#1677ff] font-bold">DanhMucGW 2026</strong>
          </p>
        </div>
      </div>

      {/* 6 Tab Switcher Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {catalogTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCatalogTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCatalogTab(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? "bg-white border-[#1677ff] shadow-sm ring-2 ring-blue-500/10"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-lg ${isActive ? "bg-blue-50 text-[#1677ff]" : "bg-slate-100 text-slate-600"}`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-blue-100 text-[#1677ff]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <div>
                <div
                  className={`text-xs font-bold leading-snug ${isActive ? "text-[#1677ff]" : "text-slate-800"}`}
                >
                  {tab.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-medium line-clamp-2 leading-tight">
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
