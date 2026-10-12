import React from 'react';
import { FileSpreadsheet, Check, Trash2 } from 'lucide-react';

export type ThemeColor = 'cyan' | 'indigo' | 'emerald' | 'blue' | 'purple' | 'amber';

export type ExcelSheetInfo = string | { name: string; rowCount?: number };

export interface ExcelUploadStatsBarProps {
  selectedSheet: string;
  totalRows: number;
  rowUnitLabel?: string;
  matchedColumnsCount: number;
  totalColumnsCount: number;
  fileName?: string;
  availableSheets?: ExcelSheetInfo[];
  themeColor?: ThemeColor;
  onSwitchSheet?: (sheetName: string) => void;
  extraBadge?: React.ReactNode;
  onClearFile?: () => void;
}

const unifiedBlueStatsTheme = {
  btnHoverText: 'hover:text-blue-700',
  btnBg: 'bg-blue-50 hover:bg-blue-100/80',
  btnBorder: 'border-blue-200',
  textStrong: 'text-blue-700',
  badgeBg: 'bg-blue-600',
  iconColor: 'text-blue-600',
  sheetActiveBg: 'bg-blue-600',
};

const themeStyles: Record<
  ThemeColor,
  {
    btnHoverText: string;
    btnBg: string;
    btnBorder: string;
    textStrong: string;
    badgeBg: string;
    iconColor: string;
    sheetActiveBg: string;
  }
> = {
  blue: unifiedBlueStatsTheme,
  cyan: unifiedBlueStatsTheme,
  indigo: unifiedBlueStatsTheme,
  emerald: unifiedBlueStatsTheme,
  purple: unifiedBlueStatsTheme,
  amber: unifiedBlueStatsTheme,
};

export const ExcelUploadStatsBar: React.FC<ExcelUploadStatsBarProps> = ({
  selectedSheet,
  totalRows,
  rowUnitLabel = 'dòng',
  matchedColumnsCount,
  totalColumnsCount,
  fileName,
  availableSheets = [],
  themeColor = 'blue',
  onSwitchSheet,
  extraBadge,
  onClearFile,
}) => {
  const currentTheme = themeStyles[themeColor] || themeStyles.cyan;

  return (
    <div className="mt-3 p-3.5 bg-slate-50/90 rounded-md border border-slate-200/90 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="text-slate-500">
            Sheet đã nạp:{' '}
            <strong className="text-slate-900 font-bold">
              {selectedSheet === '__ALL__' ? 'Toàn bộ File (Tất cả sheets)' : selectedSheet}
            </strong>
          </span>

          <span className="text-slate-500">
            Dòng trích xuất:{' '}
            <strong className="text-emerald-700 font-bold">
              {totalRows} {rowUnitLabel}
            </strong>
          </span>

          {matchedColumnsCount !== undefined && totalColumnsCount !== undefined && (
            <span className="text-slate-500">
              Cột khớp:{' '}
              <strong className="text-emerald-700 font-bold">
                {matchedColumnsCount}/{totalColumnsCount} trường
              </strong>
            </span>
          )}

          {extraBadge}
        </div>

        {fileName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">File nguồn:</span>
            <span
              className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded-sm border border-slate-200 text-xs truncate max-w-[220px]"
              title={fileName}
            >
              {fileName}
            </span>
            {onClearFile && (
              <button
                type="button"
                onClick={onClearFile}
                className="flex items-center gap-1 px-2.5 py-0.5 text-xs text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Xóa tệp và dữ liệu đã nạp"
              >
                <Trash2 size={12} />
                <span>Xóa file</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Switch sheet buttons if workbook contains multiple sheets */}
      {availableSheets && availableSheets.length > 1 && onSwitchSheet && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 shrink-0">
            <FileSpreadsheet size={13} className={currentTheme.iconColor} />
            Chọn Sheet ({availableSheets.length} sheets):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tùy chọn nạp Full File (tất cả các sheets gộp lại) */}
            <button
              type="button"
              onClick={() => onSwitchSheet('__ALL__')}
              className={`text-xs px-2.5 py-1 rounded-sm font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                selectedSheet === '__ALL__'
                  ? `${currentTheme.sheetActiveBg} text-white shadow-xs font-bold border-transparent`
                  : 'bg-white hover:bg-slate-200/80 text-blue-700 border-blue-200 hover:border-blue-300 font-semibold'
              }`}
              title="Đọc và gộp toàn bộ dữ liệu từ tất cả các sheet trong file"
            >
              <span>Toàn bộ File (Tất cả sheets)</span>
              {selectedSheet === '__ALL__' && <Check size={11} className="inline ml-0.5" />}
            </button>

            {availableSheets.map((item) => {
              const name = typeof item === 'string' ? item : item.name;
              const rowCount = typeof item === 'object' ? item.rowCount : undefined;
              const isSelected = name === selectedSheet;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSwitchSheet(name)}
                  className={`text-xs px-2.5 py-1 rounded-sm font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? `${currentTheme.sheetActiveBg} text-white shadow-xs font-bold border-transparent`
                      : 'bg-white hover:bg-slate-200/80 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{name}</span>
                  {rowCount !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-sm font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rowCount} dòng
                    </span>
                  )}
                  {isSelected && <Check size={11} className="inline ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
