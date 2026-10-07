import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import type { SchemaFieldDef } from "./SchemaMappingModal";

interface SchemaMappingCardProps {
  title?: string;
  loaiHsBadge?: string;
  schemaFields: readonly SchemaFieldDef[];
  matchedKeys: string[];
  matchedColumnsMap?: { [schemaKey: string]: string };
  sheetName?: string;
  fileName?: string;
  totalRows?: number;
  defaultExpanded?: boolean;
}

export const SchemaMappingCard: React.FC<SchemaMappingCardProps> = ({
  title = "Bảng Đối Soát & Ánh Xạ Cột Chuẩn BHXH",
  loaiHsBadge,
  schemaFields,
  matchedKeys = [],
  matchedColumnsMap = {},
  sheetName,
  fileName,
  totalRows,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "matched" | "missing">(
    "all",
  );

  const matchedSet = new Set(matchedKeys);
  const matchedCount = schemaFields.filter((f) => matchedSet.has(f.key)).length;
  const requiredFields = schemaFields.filter((f) => f.required);
  const matchedRequiredCount = requiredFields.filter((f) =>
    matchedSet.has(f.key),
  ).length;
  const isFullyMatched = matchedRequiredCount === requiredFields.length;

  const filteredFields = schemaFields.filter((f) => {
    const isMatched = matchedSet.has(f.key);
    if (filterType === "matched" && !isMatched) return false;
    if (filterType === "missing" && isMatched) return false;

    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.key.toLowerCase().includes(q) ||
      f.label.toLowerCase().includes(q) ||
      (f.desc && f.desc.toLowerCase().includes(q)) ||
      (matchedColumnsMap[f.key] &&
        matchedColumnsMap[f.key].toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-150">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-slate-50/90 hover:bg-slate-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 select-none border-b border-slate-200/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {title}
              </h3>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {matchedCount}/{schemaFields.length} Cột Khớp
              </span>
              {loaiHsBadge && (
                <span className="hidden sm:inline-block text-[9.5px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  {loaiHsBadge}
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium">
              {fileName ? `File: "${fileName}"` : "Tệp dữ liệu"}{" "}
              {sheetName ? `• Sheet: "${sheetName}"` : ""}{" "}
              {totalRows !== undefined ? `• ${totalRows} dòng trích xuất` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-sm text-[10px] ${
              isFullyMatched
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {isFullyMatched ? (
              <CheckCircle2 size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            <span>
              {isFullyMatched
                ? "Cấu trúc 100% hợp lệ"
                : `Thiếu ${requiredFields.length - matchedRequiredCount} trường bắt buộc`}
            </span>
          </span>

          <button
            type="button"
            className="w-6 h-6 rounded-sm bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:text-slate-800 shadow-2xs"
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded Compact Grid */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-3 bg-slate-50/40">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Lọc trường (vd: MA_KHOA, Tên...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-sm text-[11px] text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-0.5 rounded-sm text-[11px] font-semibold border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-2 py-0.5 rounded-sm transition-all ${
                  filterType === "all"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({schemaFields.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("matched")}
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${
                  filterType === "matched"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Check size={11} />
                <span>Đã khớp ({matchedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType("missing")}
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${
                  filterType === "missing"
                    ? "bg-rose-600 text-white font-bold"
                    : "text-rose-700 hover:bg-rose-50"
                }`}
              >
                <X size={11} />
                <span>Chưa khớp ({schemaFields.length - matchedCount})</span>
              </button>
            </div>
          </div>

          {/* Connected Flow Boxes / Chip Cards Grid (6 cols on xl, 5 cols on lg) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredFields.map((field, index) => {
              const isMatched = matchedSet.has(field.key);
              const excelCol = matchedColumnsMap[field.key];
              const isRequired = field.required;

              let cardBg = "";
              let borderClass = "";
              let badgeBg = "";
              let statusText = "";
              let statusIcon = null;

              if (isMatched) {
                cardBg = "bg-white hover:bg-emerald-50/40";
                borderClass =
                  "border-emerald-300 shadow-2xs ring-1 ring-emerald-400/20";
                badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
                statusText =
                  excelCol && excelCol !== field.key
                    ? `Khớp: "${excelCol}"`
                    : "Đã khớp chuẩn";
                statusIcon = (
                  <Check size={10} className="text-emerald-600 flex-shrink-0" />
                );
              } else if (isRequired) {
                cardBg = "bg-rose-50/40 hover:bg-rose-50/80";
                borderClass =
                  "border-rose-300 shadow-2xs ring-1 ring-rose-400/20";
                badgeBg = "bg-rose-100/70 text-rose-800 border-rose-200";
                statusText = "Thiếu bắt buộc";
                statusIcon = (
                  <X size={10} className="text-rose-600 flex-shrink-0" />
                );
              } else {
                cardBg = "bg-white/70 hover:bg-slate-100/60 opacity-75";
                borderClass = "border-slate-200 border-dashed";
                badgeBg = "bg-slate-100 text-slate-500 border-slate-200";
                statusText = "Tùy chọn";
                statusIcon = (
                  <span className="w-1 h-1 rounded-full bg-slate-400 inline-block flex-shrink-0" />
                );
              }

              return (
                <div
                  key={field.key}
                  className={`p-2 rounded-sm border ${borderClass} ${cardBg} transition-all duration-150 flex flex-col justify-between gap-1 relative group`}
                  title={`${field.key}: ${field.label}${field.desc ? ` (${field.desc})` : ""}`}
                >
                  {/* Top Bar: Key & Required Tag */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 font-mono flex-shrink-0">
                        #{index + 1}
                      </span>
                      <span
                        className="font-mono font-black text-[10.5px] text-slate-900 group-hover:text-blue-600 transition-colors truncate"
                        title={field.key}
                      >
                        {field.key}
                      </span>
                    </div>

                    {isRequired ? (
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded-sm bg-rose-50 text-rose-700 border border-rose-200 uppercase flex-shrink-0">
                        Bắt buộc
                      </span>
                    ) : (
                      <span className="text-[8px] font-medium px-1 py-0.2 rounded-sm bg-slate-100 text-slate-500 flex-shrink-0">
                        Tùy chọn
                      </span>
                    )}
                  </div>

                  {/* Label & Description */}
                  <div className="flex flex-col justify-center min-w-0">
                    <h4
                      className="text-[10.5px] font-bold text-slate-800 leading-tight truncate"
                      title={field.label}
                    >
                      {field.label}
                    </h4>
                  </div>

                  {/* Bottom Status Pill */}
                  <div
                    className={`pt-1 mt-0.5 border-t ${isMatched ? "border-emerald-100" : isRequired ? "border-rose-200" : "border-slate-100"}`}
                  >
                    <div
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-medium truncate ${badgeBg}`}
                    >
                      {statusIcon}
                      <span className="truncate" title={statusText}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Legend */}
          <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <strong className="text-emerald-700 font-semibold">
                  Xanh lá
                </strong>
                : Khớp chuẩn
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <strong className="text-rose-700 font-semibold">Đỏ</strong>:
                Thiếu bắt buộc
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                <strong className="text-slate-600 font-semibold">Xám</strong>:
                Tùy chọn
              </span>
            </div>

            <span className="text-[10px] text-slate-400">
              Tự động chuẩn hóa dấu & alias cột
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
