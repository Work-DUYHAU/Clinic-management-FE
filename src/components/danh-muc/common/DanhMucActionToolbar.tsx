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

const unifiedActionTheme = {
  xmlBtn:
    "bg-white hover:bg-blue-50/80 border border-blue-200 text-blue-700",
  addBtn:
    "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
};

const themePrimaryStyles: Record<
  ThemeColor,
  {
    xmlBtn: string;
    addBtn: string;
  }
> = {
  blue: unifiedActionTheme,
  cyan: unifiedActionTheme,
  indigo: unifiedActionTheme,
  emerald: unifiedActionTheme,
  purple: unifiedActionTheme,
  amber: unifiedActionTheme,
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
