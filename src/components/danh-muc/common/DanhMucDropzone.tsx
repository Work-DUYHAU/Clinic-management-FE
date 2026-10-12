import React from "react";
import { Upload, ShieldCheck } from "lucide-react";
import { useFileDropzone } from "../../../hooks";
import type { ThemeColor, ExcelSheetInfo } from "./ExcelUploadStatsBar";
import { ExcelUploadStatsBar } from "./index";

/**
 * Giao diện màu theo theme cho dropzone (bổ sung cho ThemeColor của StatsBar).
 */
const unifiedBlueTheme = {
  border:
    "border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70",
  dragging:
    "border-blue-600 bg-blue-100/80 scale-[1.005] shadow-md shadow-blue-500/10",
  iconText: "text-blue-600",
  iconBorder: "border-blue-200",
  btn: "bg-blue-600 hover:bg-blue-700",
  btnShadow: "shadow-blue-600/15",
  xmlBtn: "bg-white hover:bg-blue-50/80 border-blue-300 text-blue-700 font-semibold",
};

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
  blue: unifiedBlueTheme,
  indigo: unifiedBlueTheme,
  emerald: unifiedBlueTheme,
  cyan: unifiedBlueTheme,
  purple: unifiedBlueTheme,
  amber: unifiedBlueTheme,
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
    <div className="bg-white rounded-md p-2.5 sm:p-3 border border-slate-200/90 shadow-sm space-y-2">
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
          className={`border-2 border-dashed rounded-md p-2.5 sm:p-3 text-center cursor-pointer transition-all duration-150 flex flex-col md:flex-row items-center justify-between gap-2.5 ${
            isLoadingFile
              ? "pointer-events-none opacity-60 cursor-not-allowed"
              : ""
          } ${isDragging ? theme.dragging : theme.border}`}
        >
          <div className="flex items-center gap-2.5 text-left">
            <div
              className={`w-8 h-8 rounded-md bg-white shadow-2xs flex items-center justify-center shrink-0 border ${theme.iconText} ${theme.iconBorder}`}
            >
              <Upload size={16} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                {isLoadingFile ? loadingTitle : title}
              </h4>
              {description && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{description}</p>
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
              className={`px-3 py-1.5 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-xs ${theme.btn}`}
            >
              <Upload size={13} />
              <span>{isLoadingFile ? "Đang Xử Lý..." : buttonLabel}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenXmlModal();
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${theme.xmlBtn}`}
              title={xmlTooltip}
            >
              <ShieldCheck size={13} />
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
