import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Check,
} from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  themeColor?: "indigo" | "blue";
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "hồ sơ",
  themeColor = "blue",
  className = "",
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = (validCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(validCurrentPage * pageSize, totalItems);

  const getPaginationPages = (): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (validCurrentPage > 3) pages.push("...");
    const start = Math.max(2, validCurrentPage - 1);
    const end = Math.min(totalPages - 1, validCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (validCurrentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const activeColorClasses = themeColor ? "bg-blue-600 text-white shadow-xs" : "bg-blue-600 text-white shadow-xs";

  return (
    <div
      className={`p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      {/* Left: Summary & Custom Page Size Dropdown */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-slate-600">
          Hiển thị{" "}
          <strong className="text-slate-900 font-bold">{startIdx}</strong> -{" "}
          <strong className="text-slate-900 font-bold">{endIdx}</strong> trong số{" "}
          <strong className="text-slate-900 font-bold">{totalItems}</strong>{" "}
          {itemLabel}
        </span>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200/80">
          <span className="text-slate-400 text-[11px] font-medium">Số dòng:</span>
          
          {/* Custom Styled Dropdown */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="inline-flex items-center justify-between gap-1.5 pl-2.5 pr-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-sm text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-2xs transition-all cursor-pointer"
            >
              <span>{pageSize} / trang</span>
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {/* Custom Options Menu (opens upwards from bottom bar) */}
            {isDropdownOpen && (
              <div className="absolute bottom-full mb-1.5 left-0 z-50 min-w-[125px] bg-white border border-slate-200 rounded-sm shadow-md py-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
                  Chọn số dòng
                </div>
                {pageSizeOptions.map((opt) => {
                  const isSelected = opt === pageSize;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onPageSizeChange(opt);
                        onPageChange(1);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/80 text-blue-700 font-bold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{opt} / trang</span>
                      {isSelected && (
                        <Check size={13} className="text-blue-600 font-bold stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          type="button"
          disabled={validCurrentPage <= 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          title="Trang đầu tiên"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Prev */}
        <button
          type="button"
          disabled={validCurrentPage <= 1}
          onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
          className="p-1.5 rounded-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPaginationPages().map((page, pIdx) =>
            page === "..." ? (
              <span
                key={`dots-${pIdx}`}
                className="px-1.5 text-slate-400 font-bold"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(Number(page))}
                className={`min-w-[28px] h-7 px-2 rounded-sm text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  validCurrentPage === page
                    ? activeColorClasses
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          disabled={validCurrentPage >= totalPages}
          onClick={() =>
            onPageChange(Math.min(totalPages, validCurrentPage + 1))
          }
          className="p-1.5 rounded-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          title="Trang tiếp theo"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last */}
        <button
          type="button"
          disabled={validCurrentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          title="Trang cuối"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};
