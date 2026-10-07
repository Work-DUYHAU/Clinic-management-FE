import React from "react";
import { Upload, ShieldCheck } from "lucide-react";
import { useFileDropzone } from "../../../hooks";
import type { ThemeColor, ExcelSheetInfo } from "./ExcelUploadStatsBar";
import { ExcelUploadStatsBar } from "./index";

/**
 * Giao diện màu theo theme cho dropzone (bổ sung cho ThemeColor của StatsBar).
 */
const dropzoneThemeStyles: Record<
  ThemeColor,
  {
    border: string;
    dragging: string;
    iconText: string;
    iconBorder: string;
    btn: string;
    btnShadow: string;
    xmlBtn: string;
  }
> = {
  blue: {
    border:
      "border-blue-300 hover:border-[#1677ff] bg-blue-50/50 hover:bg-blue-50",
    dragging:
      "border-[#1677ff] bg-blue-100/80 scale-[1.008] shadow-md shadow-blue-500/10",
    iconText: "text-[#1677ff]",
    iconBorder: "border-blue-100",
    btn: "bg-[#1677ff] hover:bg-blue-600",
    btnShadow: "shadow-blue-500/20",
    xmlBtn: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-[#1677ff]",
  },
  indigo: {
    border:
      "border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50",
    dragging:
      "border-indigo-600 bg-indigo-100/80 scale-[1.008] shadow-md shadow-indigo-500/10",
    iconText: "text-indigo-600",
    iconBorder: "border-indigo-100",
    btn: "bg-indigo-600 hover:bg-indigo-700",
    btnShadow: "shadow-indigo-500/20",
    xmlBtn: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700",
  },
  emerald: {
    border:
      "border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50",
    dragging:
      "border-emerald-600 bg-emerald-100/80 scale-[1.008] shadow-md shadow-emerald-500/10",
    iconText: "text-emerald-600",
    iconBorder: "border-emerald-100",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    btnShadow: "shadow-emerald-500/20",
    xmlBtn: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700",
  },
  cyan: {
    border:
      "border-cyan-300 hover:border-cyan-500 bg-cyan-50/50 hover:bg-cyan-50",
    dragging:
      "border-cyan-600 bg-cyan-100/80 scale-[1.008] shadow-md shadow-cyan-500/10",
    iconText: "text-cyan-600",
    iconBorder: "border-cyan-100",
    btn: "bg-cyan-600 hover:bg-cyan-700",
    btnShadow: "shadow-cyan-500/20",
    xmlBtn: "bg-slate-900 hover:bg-slate-800 text-white",
  },
  purple: {
    border:
      "border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50",
    dragging:
      "border-purple-600 bg-purple-100/80 scale-[1.008] shadow-md shadow-purple-500/10",
    iconText: "text-purple-600",
    iconBorder: "border-purple-100",
    btn: "bg-purple-600 hover:bg-purple-700",
    btnShadow: "shadow-purple-500/20",
    xmlBtn: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700",
  },
  amber: {
    border:
      "border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50",
    dragging:
      "border-amber-600 bg-amber-100/80 scale-[1.008] shadow-md shadow-amber-500/10",
    iconText: "text-amber-600",
    iconBorder: "border-amber-100",
    btn: "bg-amber-600 hover:bg-amber-700",
    btnShadow: "shadow-amber-500/20",
    xmlBtn: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900",
  },
};

export interface DanhMucDropzoneProps {
  /** Màu chủ đạo của tab danh mục */
  themeColor?: ThemeColor;
  /** Trạng thái đang đọc file Excel */
  isLoadingFile: boolean;
  /** Tiêu đề khi đang loading / khi bình thường */
  loadingTitle: string;
  /** Tiêu đề khi bình thường */
  title: string;
  /** Mô tả ngắn dưới tiêu đề (định dạng file, số trường chuẩn...) */
  description?: React.ReactNode;
  /** Thống kê file đã nạp (nếu có) */
  uploadStats?: {
    selectedSheet?: string;
    totalRows: number;
    rowUnitLabel?: string;
    matchedColumnsCount: number;
    totalColumnsCount: number;
    fileName?: string;
    availableSheets?: ExcelSheetInfo[];
    extraBadge?: React.ReactNode;
  };
  /** Số bản ghi hiện có */
  itemsCount?: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchSheet?: (sheetName: string) => void;
  onOpenSchemaModal?: () => void;
  onDownloadTemplate?: () => void;
  onClearData?: () => void;
  onOpenXmlModal: () => void;
  onOpenApiTab?: () => void;
  onAddNew?: () => void;
  // Nhãn toolbar
  templateLabel?: string;
  xmlLabel?: string;
  xmlTooltip?: string;
  apiLabel?: string;
  addNewLabel?: string;
  buttonLabel?: string;
}

/**
 * Dropzone dùng chung cho mọi tab Danh mục / Hồ sơ:
 * input file ẩn + kéo-thả + stats bar.
 */
export const DanhMucDropzone: React.FC<DanhMucDropzoneProps> = ({
  themeColor = "blue",
  isLoadingFile,
  loadingTitle,
  title,
  description,
  uploadStats,
  onFileUpload,
  onSwitchSheet,
  onOpenSchemaModal,
  onOpenXmlModal,
  xmlLabel,
  xmlTooltip,
  onClearData,
  buttonLabel = "Chọn Tệp Excel / XML",
}) => {
  const {
    fileInputRef,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFilePicker,
  } = useFileDropzone(isLoadingFile);

  const theme = dropzoneThemeStyles[themeColor] || dropzoneThemeStyles.blue;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
      {/* Upload Dropzone */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.xls,.csv,.xml,text/xml,application/xml"
          disabled={isLoadingFile}
          onChange={onFileUpload}
        />
        <div
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer transition-all duration-200 flex flex-col md:flex-row items-center justify-between gap-3.5 ${
            isLoadingFile
              ? "pointer-events-none opacity-60 cursor-not-allowed"
              : ""
          } ${isDragging ? theme.dragging : theme.border}`}
        >
          <div className="flex items-center gap-3 text-left">
            <div
              className={`w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0 border ${theme.iconText} ${theme.iconBorder}`}
            >
              <Upload size={18} />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {isLoadingFile ? loadingTitle : title}
              </h4>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 flex-wrap justify-end">
            <button
              type="button"
              disabled={isLoadingFile}
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className={`px-4 py-2 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${theme.btn} ${theme.btnShadow}`}
            >
              <Upload size={14} />
              <span>{isLoadingFile ? "Đang Xử Lý..." : buttonLabel}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenXmlModal();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs border cursor-pointer ${theme.xmlBtn}`}
              title={xmlTooltip}
            >
              <ShieldCheck size={14} />
              <span>{xmlLabel || "Ký Số & Gửi Cổng"}</span>
            </button>
          </div>
        </div>

        {/* Thống kê file đã nạp & chuyển sheet */}
        {uploadStats && (
          <div className="pt-2">
            <ExcelUploadStatsBar
              selectedSheet={uploadStats.selectedSheet || ""}
              totalRows={uploadStats.totalRows}
              rowUnitLabel={uploadStats.rowUnitLabel}
              matchedColumnsCount={uploadStats.matchedColumnsCount}
              totalColumnsCount={uploadStats.totalColumnsCount}
              fileName={uploadStats.fileName}
              availableSheets={uploadStats.availableSheets}
              themeColor={themeColor}
              onOpenSchemaModal={onOpenSchemaModal}
              onSwitchSheet={onSwitchSheet}
              extraBadge={uploadStats.extraBadge}
              onClearFile={onClearData}
            />
          </div>
        )}
      </div>
    </div>
  );
};
