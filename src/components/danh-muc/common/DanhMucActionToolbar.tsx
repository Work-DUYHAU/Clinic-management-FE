import React from "react";
import { ShieldCheck } from "lucide-react";
import type { ThemeColor } from "./ExcelUploadStatsBar";

export interface DanhMucActionToolbarProps {
  itemsCount?: number;
  templateLabel?: string;
  templateTooltip?: string;
  xmlLabel?: string;
  xmlTooltip?: string;
  apiLabel?: string;
  apiTooltip?: string;
  addNewLabel?: string;
  themeColor?: ThemeColor;
  onDownloadTemplate?: () => void;
  onClearData?: () => void;
  onOpenXmlModal: () => void;
  onOpenApiTab?: () => void;
  onAddNew?: () => void;
}

const themePrimaryStyles: Record<
  ThemeColor,
  {
    xmlBtn: string;
    addBtn: string;
  }
> = {
  cyan: {
    xmlBtn: "bg-slate-900 hover:bg-slate-800 text-white",
    addBtn:
      "bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20",
  },
  indigo: {
    xmlBtn:
      "bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700",
    addBtn:
      "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20",
  },
  emerald: {
    xmlBtn:
      "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700",
    addBtn:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20",
  },
  blue: {
    xmlBtn:
      "bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1677ff]",
    addBtn:
      "bg-[#1677ff] hover:bg-blue-600 text-white shadow-md shadow-blue-500/20",
  },
  purple: {
    xmlBtn:
      "bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700",
    addBtn:
      "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20",
  },
  amber: {
    xmlBtn:
      "bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900",
    addBtn:
      "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20",
  },
};

export const DanhMucActionToolbar: React.FC<DanhMucActionToolbarProps> = ({
  xmlLabel = "Ký Số & Gửi Cổng",
  xmlTooltip,
  themeColor = "blue",
  onOpenXmlModal,
}) => {
  const currentTheme =
    themePrimaryStyles[themeColor] || themePrimaryStyles.blue;

  return (
    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
      <button
        type="button"
        onClick={onOpenXmlModal}
        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${currentTheme.xmlBtn}`}
        title={xmlTooltip}
      >
        <ShieldCheck
          size={14}
          className={themeColor === "cyan" ? "text-cyan-400" : undefined}
        />
        <span>{xmlLabel}</span>
      </button>
    </div>
  );
};
