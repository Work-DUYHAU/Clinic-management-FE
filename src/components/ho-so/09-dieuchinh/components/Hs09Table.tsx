import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  FileCheck2,
  Lock,
  RotateCcw,
  Send,
  Paperclip,
  Printer,
  Building,
  FileSpreadsheet,
  X,
} from "lucide-react";
import type { HoSoDieuChinh09Item } from "../../../../types/hs09DieuChinhTypes";
import {
  formatYmdHmDisplay,
  DEFAULT_MA_CSKCB,
} from "../../../../utils/shared/excelXmlShared";
import { getEffectiveHs09TrangThai } from "../../../../utils/hs09RequestTypeResolver";
import { Pagination } from "../../../common";
import {
  Select,
  DatePicker,
  Button,
  IconButton,
  Checkbox,
} from "../../../../shared/components";
import dayjs from "dayjs";
import { useToast } from "../../../../context/ToastContext";

const MAX_KY_SO = 10;

interface Hs09TableProps {
  items: HoSoDieuChinh09Item[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterNhomLoi?: string;
  onFilterNhomLoiChange?: (val: string) => void;
  filterSoBangXml?: string;
  onFilterSoBangXmlChange?: (val: string) => void;
  filterTrangThai?: string;
  onFilterTrangThaiChange?: (val: string) => void;

  // Extra standard filters (Mục 2.1)
  filterTinhTrangGui?: string;
  onFilterTinhTrangGuiChange?: (val: string) => void;
  filterLoaiThaoTac?: string;
  onFilterLoaiThaoTacChange?: (val: string) => void;
  filterKyQt?: string;
  onFilterKyQtChange?: (val: string) => void;
  filterTuNgay?: string;
  onFilterTuNgayChange?: (val: string) => void;
  filterDenNgay?: string;
  onFilterDenNgayChange?: (val: string) => void;

  onAddNew: () => void;
  onEdit: (item: HoSoDieuChinh09Item) => void;
  onDelete: (item: HoSoDieuChinh09Item) => void;
  onViewDetail: (item: HoSoDieuChinh09Item) => void;
  onSelectionChange?: (selectedItems: HoSoDieuChinh09Item[]) => void;
  onBulkSign?: (selectedItems: HoSoDieuChinh09Item[]) => void;
  onUnsign?: (itemsToUnsign: HoSoDieuChinh09Item[]) => void;
  onClearSelection?: () => void;

  // New features according to Phụ lục I Thông tư 12/2026/TT-BTC
  onOpenHanhChinh?: (item: HoSoDieuChinh09Item) => void;
  onOpenChiPhi?: (item: HoSoDieuChinh09Item) => void;
  onOpenAttachment?: (item: HoSoDieuChinh09Item) => void;
  onPrintPdf?: (item: HoSoDieuChinh09Item) => void;
  onSendGiamDinh?: (selectedItems: HoSoDieuChinh09Item[]) => void;
  onExportExcel?: (itemsToExport?: HoSoDieuChinh09Item[]) => void;
  onHuyPhien?: (selectedItems: HoSoDieuChinh09Item[]) => void;
}

export const Hs09Table: React.FC<Hs09TableProps> = ({
  items,
  searchTerm,
  onSearchChange,
  filterTinhTrangGui = "all",
  onFilterTinhTrangGuiChange,
  filterLoaiThaoTac = "all",
  onFilterLoaiThaoTacChange,
  filterKyQt = "all",
  onFilterKyQtChange,
  filterTuNgay = "",
  onFilterTuNgayChange,
  filterDenNgay = "",
  onFilterDenNgayChange,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail,
  onSelectionChange,
  onBulkSign,
  onUnsign,
  onClearSelection,
  onOpenHanhChinh,
  onOpenChiPhi,
  onOpenAttachment,
  onPrintPdf,
  onSendGiamDinh,
  onExportExcel,
  onHuyPhien,
}) => {
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Scroll and Drag-to-scroll logic
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.tagName === "SELECT" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a")
    ) {
      return;
    }
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeftPos(tableContainerRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftPos - walk;
  };

  // Gridview Column Quick Filters (Mục 2.1)
  const [colFilters, setColFilters] = useState({
    xml1Id: "",
    maThe: "",
    maBn: "",
    hoTen: "",
    maLk: "",
    ngayVao: "",
    trangThai: "all",
    kySo: "all",
    gdDuyet: "all",
  });

  const handleColFilter = (field: string) => (e: unknown) => {
    const val =
      typeof e === "object" && e && "target" in e
        ? (e as React.ChangeEvent<HTMLInputElement>).target.value
        : String(e ?? "");
    setColFilters((prev) => ({ ...prev, [field]: val }));
  };

  const clearColumnFilters = () => {
    setColFilters({
      xml1Id: "",
      maThe: "",
      maBn: "",
      hoTen: "",
      maLk: "",
      ngayVao: "",
      trangThai: "all",
      kySo: "all",
      gdDuyet: "all",
    });
  };

  useEffect(() => {
    const visibleIds = new Set(items.map((item) => item.id));
    setSelectedIds((previous) => {
      const next = new Set(
        Array.from(previous).filter((id) => visibleIds.has(id)),
      );
      if (next.size !== previous.size) {
        onSelectionChange?.(items.filter((i) => next.has(i.id)));
      }
      return next.size === previous.size ? previous : next;
    });

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [items, pageSize]);

  const toggleSelect = (item: HoSoDieuChinh09Item) => {
    if (item.tinhTrangGui === 2) return;
    const next = new Set(selectedIds);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    setSelectedIds(next);
    onSelectionChange?.(items.filter((i) => next.has(i.id)));
  };

  const getItemDateString = (item: HoSoDieuChinh09Item): string => {
    if (item.ngayThongBaoLoi) {
      if (item.ngayThongBaoLoi.includes("/")) {
        const parts = item.ngayThongBaoLoi.split("/");
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
      if (item.ngayThongBaoLoi.includes("-")) return item.ngayThongBaoLoi;
    }
    if (item.ttXml1.ngayVao && item.ttXml1.ngayVao.length >= 8) {
      const y = item.ttXml1.ngayVao.slice(0, 4);
      const m = item.ttXml1.ngayVao.slice(4, 6);
      const d = item.ttXml1.ngayVao.slice(6, 8);
      return `${y}-${m}-${d}`;
    }
    return "";
  };

  const availableKyQtOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.ttXml1.kyQt) set.add(item.ttXml1.kyQt);
    });
    return Array.from(set).sort().reverse();
  }, [items]);

  // Filter items based on both global filters and column filters
  const filteredGridItems = useMemo(() => {
    // 1. Chỉ lấy các trường tìm kiếm text đang có giá trị (toLowerCase sẵn 1 lần)
    const textFilters = (
      ["xml1Id", "maThe", "maBn", "hoTen", "maLk", "ngayVao"] as const
    )
      .filter((k) => !!colFilters[k])
      .map((k) => ({
        key: k,
        val: colFilters[k].trim().toLowerCase(),
      }));

    // 2. Chỉ lấy các dropdown lọc đang chọn khác 'all'
    type ExactRule = [string, (it: HoSoDieuChinh09Item) => string];
    const rawExactRules: ExactRule[] = [
      [colFilters.trangThai, (it) => String(getEffectiveHs09TrangThai(it))],
      [colFilters.kySo, (it) => String(it.ttKySo)],
      [colFilters.gdDuyet, (it) => String(it.gdDuyet ?? 0)],
      [filterTinhTrangGui, (it) => String(it.tinhTrangGui)],
      [filterLoaiThaoTac, (it) => it.loaiThaoTac || "dang_thao_tac"],
      [filterKyQt, (it) => it.ttXml1.kyQt || ""],
    ];
    const exactFilters = rawExactRules.filter(([val]) => Boolean(val && val !== "all"));

    // 3. Lọc dữ liệu qua các điều kiện đã kích hoạt
    return items.filter((item) => {
      const matchText = textFilters.every(({ key, val }) =>
        String(item.ttXml1[key] || "").toLowerCase().includes(val)
      );
      if (!matchText) return false;

      const matchExact = exactFilters.every(([val, getValue]) => getValue(item) === val);
      if (!matchExact) return false;

      const itemDate = getItemDateString(item);
      return (
        (!filterTuNgay || !itemDate || itemDate >= filterTuNgay) &&
        (!filterDenNgay || !itemDate || itemDate <= filterDenNgay)
      );
    });
  }, [
    items,
    colFilters,
    filterTinhTrangGui,
    filterLoaiThaoTac,
    filterKyQt,
    filterTuNgay,
    filterDenNgay,
  ]);

  const selectableItems = useMemo(
    () => filteredGridItems.filter((i) => i.tinhTrangGui !== 2),
    [filteredGridItems],
  );

  const isAllSelectableChecked = useMemo(() => {
    if (selectableItems.length === 0) return false;
    const effectiveTargetCount = Math.min(selectableItems.length, MAX_KY_SO);
    const selectedSelectableCount = selectableItems.filter((i) =>
      selectedIds.has(i.id),
    ).length;
    return (
      selectedSelectableCount > 0 &&
      selectedSelectableCount >= effectiveTargetCount
    );
  }, [selectableItems, selectedIds]);

  const toggleSelectAll = () => {
    if (selectedIds.size > 0) {
      // Đang có hồ sơ được chọn -> HỦY CHỌN TẤT CẢ
      setSelectedIds(new Set());
      onSelectionChange?.([]);
      onClearSelection?.();
    } else {
      // Chưa chọn gì -> Chọn tối đa 10 hồ sơ
      const toSelect = selectableItems.slice(0, MAX_KY_SO);
      const newSet = new Set(toSelect.map((i) => i.id));
      setSelectedIds(newSet);
      onSelectionChange?.(toSelect);
    }
  };

  const selectedCount = selectedIds.size;
  const overLimit = selectedCount > MAX_KY_SO;
  const selectedItemsList = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );
  const selectedSignedList = useMemo(
    () =>
      selectedItemsList.filter((i) => i.ttKySo === 2 && i.tinhTrangGui === 0),
    [selectedItemsList],
  );

  const handleClearSelected = () => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
    onClearSelection?.();
  };

  const paginatedItems = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredGridItems.length / pageSize),
    );
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (validCurrentPage - 1) * pageSize;
    return filteredGridItems.slice(start, start + pageSize);
  }, [filteredGridItems, currentPage, pageSize]);

  // Handle Bulk Sign according to Mục 4.2 TT 12/2026/TT-BTC
  const handleTriggerBulkSign = () => {
    if (selectedCount === 0 || overLimit) return;
    const alreadySigned = selectedItemsList.filter((i) => i.ttKySo === 2);
    if (alreadySigned.length > 0) {
      toast.warning(
        "Chỉ được ký số cho các hồ sơ chưa ký (TT_KYSO = 0)! Vui lòng bỏ chọn các hồ sơ đã ký.",
        "Thông báo",
      );
      return;
    }
    onBulkSign?.(selectedItemsList);
  };

  // Handle Send Giam Dinh according to Mục 6 TT 12/2026/TT-BTC
  const handleTriggerSendGiamDinh = () => {
    if (selectedCount === 0) {
      toast.warning("Chưa chọn bản ghi nào!", "Thông báo");
      return;
    }

    const hasUnsignedOrSent = selectedItemsList.some(
      (item) => item.ttKySo !== 2 || item.tinhTrangGui === 2,
    );
    if (hasUnsignedOrSent) {
      toast.error(
        "Có hồ sơ chưa ký số hoặc hồ sơ đã gửi giám định!",
        "Không thể gửi",
      );
      return;
    }

    onSendGiamDinh?.(selectedItemsList);
  };

  // Handle Cancel Session (Hủy phiên làm việc) according to Mục 7 TT 12/2026/TT-BTC
  const handleTriggerHuyPhien = () => {
    if (selectedCount === 0) {
      toast.warning("Chưa chọn bản ghi nào!", "Thông báo");
      return;
    }

    // Điều kiện: Tất cả hồ sơ được chọn bắt buộc phải có TT_KYSO = 0
    const hasSigned = selectedItemsList.some((item) => item.ttKySo === 2);
    if (hasSigned) {
      toast.error(
        "Tất cả hồ sơ được chọn bắt buộc phải có TT_KYSO = 0 (Chưa ký số)! Vui lòng bỏ chọn các hồ sơ đã ký.",
        "Lỗi hủy phiên",
      );
      return;
    }

    onHuyPhien?.(selectedItemsList);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
    setCurrentPage(1);
  };

  const handleKyQtFilterChange = (val: unknown) => {
    onFilterKyQtChange?.(val as string);
  };

  const handleTinhTrangGuiFilterChange = (val: unknown) => {
    onFilterTinhTrangGuiChange?.(val as string);
  };

  const handleDateRangeFilterChange = (dates: any) => {
    if (!dates || !dates[0] || !dates[1]) {
      onFilterTuNgayChange?.("");
      onFilterDenNgayChange?.("");
    } else {
      onFilterTuNgayChange?.(dates[0].format("YYYY-MM-DD"));
      onFilterDenNgayChange?.(dates[1].format("YYYY-MM-DD"));
    }
  };

  const handleLoaiThaoTacFilterChange = (val: unknown) => {
    onFilterLoaiThaoTacChange?.(val as string);
  };

  const handleResetMainFilters = () => {
    onFilterKyQtChange?.("all");
    onFilterTinhTrangGuiChange?.("all");
    onFilterTuNgayChange?.("");
    onFilterDenNgayChange?.("");
    onFilterLoaiThaoTacChange?.("all");
  };

  const handleAttachmentClick = () => {
    const target = selectedItemsList[0] || items[0];
    if (target) onOpenAttachment?.(target);
    else toast.warning("Chưa có hồ sơ nào để đính kèm!");
  };

  const handleUnsignClick = () => {
    onUnsign?.(selectedSignedList);
  };

  const handleExportExcelClick = () => {
    onExportExcel?.(filteredGridItems);
  };

  const hasAnyColumnFilter = Object.entries(colFilters).some(([k, v]) =>
    k === "trangThai" || k === "kySo" || k === "gdDuyet" ? v !== "all" : Boolean(v)
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col space-y-0">
      {/* Cảnh báo chọn quá giới hạn */}
      {overLimit && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          Chỉ được phép chọn tối đa <b>{MAX_KY_SO} hồ sơ</b> cho mỗi lần ký —
          hiện đang chọn <b>{selectedCount}</b>. Nút &quot;Ký số&quot; sẽ bị
          khóa đến khi giảm xuống &le; {MAX_KY_SO}.
        </div>
      )}
      {/* HEADER ROW 1: CSKCB + QUICK SEARCH + THÊM HỒ SƠ 09 */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        {/* Left: Badge Cơ sở KCB */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 border border-blue-200/60 rounded-full text-xs font-semibold text-blue-700">
          <Building size={13} className="text-blue-600" />
          <span>Cơ sở KCB: {DEFAULT_MA_CSKCB} – PKĐK</span>
        </div>

        {/* Right: Quick Search + Thêm Hồ Sơ 09 */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-72 sm:w-80">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm nhanh theo mã thẻ, họ tên, mã BN, mã LK..."
              value={searchTerm}
              onChange={handleSearchInputChange}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={onAddNew}
          >
            Thêm Hồ Sơ 09
          </Button>
        </div>
      </div>

      {/* FILTER ROW 2: BỘ LỌC CHUẨN THÔNG TƯ SỐ 12/2026/TT-BTC */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex flex-wrap items-end gap-3.5">
          {/* Thời gian QT */}
          <div className="w-full sm:w-44">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Thời gian QT
            </label>
            <Select
              height={31.6}
              value={filterKyQt}
              onChange={handleKyQtFilterChange}
              containerClassName="mb-0"
              className="!text-xs"
              options={[
                { value: "all", label: "Tất cả kỳ" },
                ...availableKyQtOptions.map((k) => ({
                  value: k,
                  label: `Tháng ${k.slice(4)}/${k.slice(0, 4)}`,
                })),
              ]}
            />
          </div>

          {/* Tình trạng gửi */}
          <div className="w-full sm:w-40">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tình trạng gửi
            </label>
            <Select
              height={31.6}
              value={filterTinhTrangGui}
              onChange={handleTinhTrangGuiFilterChange}
              containerClassName="mb-0"
              className="!text-xs"
              options={[
                { value: "all", label: "Tất cả" },
                { value: "0", label: "Chưa gửi (0)" },
                { value: "2", label: "Đã gửi (2)" },
              ]}
            />
          </div>

          {/* Khoảng ngày (Từ ngày – Đến ngày) */}
          <div className="flex-1 min-w-[270px]">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Khoảng ngày (Từ ngày – Đến ngày)
            </label>
            <DatePicker.RangePicker
              value={
                filterTuNgay || filterDenNgay
                  ? [
                      filterTuNgay ? dayjs(filterTuNgay) : null,
                      filterDenNgay ? dayjs(filterDenNgay) : null,
                    ]
                  : null
              }
              onChange={handleDateRangeFilterChange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              containerClassName="!mb-0"
              className="!text-xs w-full"
            />
          </div>

          {/* Loại thao tác */}
          <div className="w-full sm:w-44">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Loại thao tác
            </label>
            <Select
              height={31.6}
              value={filterLoaiThaoTac}
              onChange={handleLoaiThaoTacFilterChange}
              containerClassName="mb-0"
              className="!text-xs"
              options={[
                { value: "all", label: "Tất cả" },
                { value: "dang_thao_tac", label: "Đang thao tác" },
                { value: "tong_hop_moi", label: "Tổng hợp mới" },
              ]}
            />
          </div>

          {/* Xóa bộ lọc */}
          <div className="pb-1.5">
            <button
              type="button"
              onClick={handleResetMainFilters}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* ACTION ROW 3: TOOLBAR CÁC NÚT THAO TÁC */}
      <div className="px-4 py-2.5 bg-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Gửi giám định */}
          <Button
            variant="success"
            icon={<Send size={13} />}
            onClick={handleTriggerSendGiamDinh}
            title="Gửi hồ sơ đã ký số sang Hệ thống Giám định BHYT"
          >
            Gửi giám định
          </Button>

          {/* Nút Ký số */}
          <Button
            variant="indigo"
            icon={<Edit2 size={13} />}
            onClick={handleTriggerBulkSign}
            disabled={selectedCount === 0 || overLimit}
            title="Ký số cho các hồ sơ đã chọn (tối đa 10 hồ sơ/lần)"
          >
            <span>Ký số</span>
            {selectedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold leading-none">
                {selectedCount}
              </span>
            )}
          </Button>

          {/* Nút Bỏ chọn nhanh nếu có dòng đang chọn */}
          {selectedCount > 0 && (
            <Button
              variant="neutral"
              icon={<X size={13} className="text-slate-500" />}
              onClick={handleClearSelected}
              title="Bỏ chọn toàn bộ hồ sơ đang được tích"
            >
              Bỏ chọn
            </Button>
          )}

          {/* Nút Hủy ký số (nếu có hồ sơ đã ký) */}
          {selectedSignedList.length > 0 && (
            <Button
              variant="warning"
              icon={<RotateCcw size={13} />}
              onClick={handleUnsignClick}
              title="Hủy chữ ký số để chỉnh sửa lại hồ sơ"
            >
              Hủy ký số ({selectedSignedList.length})
            </Button>
          )}

          {/* Nút Xuất Excel */}
          <Button
            variant="excel"
            icon={<FileSpreadsheet size={13} />}
            onClick={handleExportExcelClick}
            title="Xuất danh sách hồ sơ điều chỉnh ra file Excel"
          >
            Xuất Excel
          </Button>

          {/* Nút Đính kèm file */}
          <Button
            variant="sky"
            icon={<Paperclip size={13} />}
            onClick={handleAttachmentClick}
            title="Mở popup đính kèm tài liệu chứng minh theo mã lý do"
          >
            Đính kèm file
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {hasAnyColumnFilter && (
            <button
              type="button"
              onClick={clearColumnFilters}
              className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
            >
              Xóa bộ lọc cột
            </button>
          )}

          {/* Nút Hủy phiên làm việc */}
          <Button
            variant="danger"
            icon={<Trash2 size={13} />}
            onClick={handleTriggerHuyPhien}
            disabled={selectedCount === 0}
            title="Hủy phiên nhập liệu hiện tại, mở khóa giám định tự động (chỉ cho HS chưa ký)"
          >
            Hủy phiên làm việc
          </Button>
        </div>
      </div>

      {/* 2.2 GRIDVIEW CHÍNH CÓ TEXTBOX & COMBOBOX LỌC TRÊN CỘT */}
      <div
        ref={tableContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        className={`overflow-x-auto w-full border-t border-slate-200 table-scrollbar ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        title="Nhấn giữ chuột để kéo ngang bảng hoặc dùng thanh cuộn màu xám bên dưới"
      >
        <table className="w-full text-left border-collapse text-xs min-w-[1750px]">
          <thead>
            {/* Header Titles */}
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-2.5 w-11 min-w-[44px] text-center border-r border-slate-200">
                <Checkbox
                  checked={isAllSelectableChecked}
                  indeterminate={selectedIds.size > 0 && !isAllSelectableChecked}
                  onChange={toggleSelectAll}
                  title={
                    selectedCount > 0
                      ? `Nhấp để bỏ chọn tất cả (${selectedCount} hồ sơ)`
                      : "Chọn tất cả (tối đa 10 hồ sơ)"
                  }
                />
              </th>
              <th className="py-2.5 px-2 w-11 min-w-[44px] text-center border-r border-slate-200">
                STT
              </th>
              <th className="py-2.5 px-3 min-w-[105px] border-r border-slate-200">
                XML1_ID
              </th>
              <th className="py-2.5 px-2 text-center min-w-[135px] border-r border-slate-200">
                Loại Yêu Cầu
              </th>
              <th className="py-2.5 px-3 min-w-[150px] border-r border-slate-200">
                Mã Thẻ
              </th>
              <th className="py-2.5 px-3 min-w-[125px] border-r border-slate-200">
                Mã Bệnh Nhân
              </th>
              <th className="py-2.5 px-3 min-w-[165px] border-r border-slate-200">
                Họ Tên
              </th>
              <th className="py-2.5 px-3 min-w-[120px] border-r border-slate-200">
                Mã LK
              </th>
              <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-200">
                Ngày Vào / Ngày Ra
              </th>
              <th className="py-2.5 px-2 text-center min-w-[125px] border-r border-slate-200">
                Ký Số
              </th>
              <th className="py-2.5 px-2 text-center min-w-[130px] border-r border-slate-200">
                GĐ Duyệt
              </th>
              <th className="py-2.5 px-2 text-center min-w-[120px] border-r border-slate-200">
                Loại Thao Tác
              </th>
              <th className="py-2.5 px-2 text-center min-w-[140px] border-r border-slate-200">
                Ngày Lỗi / Còn Lại
              </th>
              <th className="py-2.5 px-2 text-center min-w-[95px] border-r border-slate-200">
                Tài Liệu
              </th>
              <th className="py-2.5 px-2 text-center min-w-[75px] border-r border-slate-200">
                In PDF
              </th>
              <th className="py-2.5 px-3 text-center min-w-[105px]">
                Thao Tác
              </th>
            </tr>

            {/* Quick Search on Columns Row (Mục 2.1) */}
            <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 text-[10px]">
              <th className="p-1.5 border-r border-slate-200"></th>
              <th className="p-1.5 border-r border-slate-200"></th>
              <th className="p-1.5 border-r border-slate-200">
                <input
                  type="text"
                  placeholder="Lọc ID..."
                  value={colFilters.xml1Id}
                  onChange={handleColFilter("xml1Id")}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <Select
                  height={24}
                  value={colFilters.trangThai}
                  onChange={handleColFilter("trangThai")}
                  containerClassName="mb-0"
                  className="!text-[11px]"
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "1", label: "1 - Thu hồi" },
                    { value: "2", label: "2 - Điều chỉnh" },
                    { value: "4", label: "4 - Xin ý kiến" },
                  ]}
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <input
                  type="text"
                  placeholder="Lọc thẻ..."
                  value={colFilters.maThe}
                  onChange={handleColFilter("maThe")}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <input
                  type="text"
                  placeholder="Lọc BN..."
                  value={colFilters.maBn}
                  onChange={handleColFilter("maBn")}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <input
                  type="text"
                  placeholder="Lọc họ tên..."
                  value={colFilters.hoTen}
                  onChange={handleColFilter("hoTen")}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <input
                  type="text"
                  placeholder="Lọc LK..."
                  value={colFilters.maLk}
                  onChange={handleColFilter("maLk")}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <input
                  type="text"
                  placeholder="Lọc ngày..."
                  value={colFilters.ngayVao}
                  onChange={handleColFilter("ngayVao")}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <Select
                  height={24}
                  value={colFilters.kySo}
                  onChange={handleColFilter("kySo")}
                  containerClassName="mb-0"
                  className="!text-[11px]"
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "0", label: "Chưa ký (0)" },
                    { value: "2", label: "Đã ký (2)" },
                  ]}
                />
              </th>
              <th className="p-1.5 border-r border-slate-200">
                <Select
                  height={24}
                  value={colFilters.gdDuyet}
                  onChange={handleColFilter("gdDuyet")}
                  containerClassName="mb-0"
                  className="!text-[11px]"
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "0", label: "Chưa xử lý (0)" },
                    { value: "1", label: "Đang xử lý (1)" },
                    { value: "2", label: "Đã xử lý (2)" },
                  ]}
                />
              </th>
              <th className="p-1.5 border-r border-slate-200"></th>
              <th className="p-1.5 border-r border-slate-200"></th>
              <th className="p-1.5 border-r border-slate-200"></th>
              <th className="p-1.5 border-r border-slate-200"></th>
              <th className="p-1.5"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-5 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <FileCheck2 size={30} className="text-slate-300" />
                    <span className="font-semibold text-xs text-slate-500">
                      Không tìm thấy hồ sơ điều chỉnh nào
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Hãy nạp file Excel Mẫu 09/BH hoặc bấm nút &quot;Thêm Hồ Sơ
                      09&quot;
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const isSigned = item.ttKySo === 2;
                const isSent = item.tinhTrangGui === 2;
                const filesCount = item.taiLieuDinhKem?.length || 0;

                const kySoBadge = isSigned ? (
                  <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                    Đã ký (2)
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600">
                    Chưa ký (0)
                  </span>
                );

                const gdDuyetVal = item.gdDuyet ?? 0;
                const gdDuyetBadge =
                  gdDuyetVal === 1 ? (
                    <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                      Đang xử lý (1)
                    </span>
                  ) : gdDuyetVal === 2 ? (
                    <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      Đã xử lý (2)
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600">
                      Chưa xử lý (0)
                    </span>
                  );

                const loaiThaoTacText =
                  item.loaiThaoTac === "tong_hop_moi" ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      Tổng hợp mới
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                      Đang thao tác
                    </span>
                  );

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSigned ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-100">
                        {!isSent ? (
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item)}
                          />
                        ) : (
                          <span title="Đã gửi giám định (khóa)">
                            <Lock
                              size={12}
                              className="text-slate-300 mx-auto"
                            />
                          </span>
                        )}
                      </td>

                      {/* STT */}
                      <td className="py-1.5 px-2 text-center text-slate-500 font-mono border-r border-slate-100">
                        {item.stt || idx + 1}
                      </td>

                      {/* XML1_ID với Tooltip lý do từ chối tự động */}
                      <td className="py-1.5 px-3 border-r border-slate-100 font-mono">
                        <span
                          className="font-bold text-slate-800 cursor-help underline decoration-dotted"
                          title={`Lý do từ chối tự động: ${
                            item.ttXml1.lyDoTuChoi ||
                            item.nhomLoi ||
                            "Không có vi phạm tự động"
                          }`}
                        >
                          {String(item.ttXml1.xml1Id || "—")}
                        </span>
                      </td>

                      {/* Loại yêu cầu (Trạng thái Mục 1) */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-100">
                        {(() => {
                          const effTt = getEffectiveHs09TrangThai(item);
                          if (effTt === 1) {
                            return (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                1 - Thu hồi
                              </span>
                            );
                          }
                          if (effTt === 4) {
                            return (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                4 - Xin ý kiến
                              </span>
                            );
                          }
                          return (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              2 - Điều chỉnh
                            </span>
                          );
                        })()}
                      </td>

                      {/* Mã thẻ (Hyperlink mở popup hành chính Mục 3.1) */}
                      <td className="py-1.5 px-3 border-r border-slate-100 font-mono">
                        <button
                          type="button"
                          onClick={() => onOpenHanhChinh?.(item)}
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer text-left"
                          title="Nhấn để mở popup điều chỉnh thông tin hành chính (XML1)"
                        >
                          {item.ttXml1.maThe}
                        </button>
                      </td>

                      {/* Mã bệnh nhân (Hyperlink mở popup chi phí Mục 3.2) */}
                      <td className="py-1.5 px-3 border-r border-slate-100 font-mono">
                        <button
                          type="button"
                          onClick={() => onOpenChiPhi?.(item)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer text-left"
                          title="Nhấn để mở popup điều chỉnh thông tin chi phí (XML2/XML3)"
                        >
                          {item.ttXml1.maBn || "—"}
                        </button>
                      </td>

                      {/* Họ tên */}
                      <td className="py-1.5 px-3 border-r border-slate-100 font-bold text-slate-900">
                        {item.ttXml1.hoTen}
                      </td>

                      {/* Mã liên kết */}
                      <td className="py-1.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-800">
                        {item.ttXml1.maLk}
                      </td>

                      {/* Ngày vào / Ngày ra */}
                      <td className="py-1.5 px-3 border-r border-slate-100 font-mono text-[11px] text-slate-600">
                        <div>
                          Vào: {formatYmdHmDisplay(item.ttXml1.ngayVao)}
                        </div>
                        <div>Ra: {formatYmdHmDisplay(item.ttXml1.ngayRa)}</div>
                      </td>

                      {/* Trạng thái ký số */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-100">
                        {kySoBadge}
                      </td>

                      {/* GD duyệt */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-100">
                        {gdDuyetBadge}
                      </td>

                      {/* Loại thao tác */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-100">
                        {loaiThaoTacText}
                      </td>

                      {/* Ngày lỗi / Thời gian còn lại */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-100 text-[11px]">
                        <span className="text-slate-600 block">
                          {item.ngayThongBaoLoi || "—"}
                        </span>
                        <span className="text-emerald-700 font-bold text-[10px] block mt-0.5">
                          {item.thoiGianConLai || ""}
                        </span>
                      </td>

                      {/* Tài liệu chứng minh (Hyperlink tải file Mục 8) */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-100">
                        <button
                          type="button"
                          onClick={() => onOpenAttachment?.(item)}
                          className="p-1 hover:bg-teal-50 text-teal-700 rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                          title="Đính kèm hoặc tải tài liệu chứng minh"
                        >
                          <Paperclip size={13} />
                          {filesCount > 0 ? (
                            <span className="font-bold underline">
                              Tải ({filesCount})
                            </span>
                          ) : (
                            <span className="text-slate-400">Đính kèm</span>
                          )}
                        </button>
                      </td>

                      {/* In PDF (Mục 4.2) */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-100">
                        <IconButton
                          icon={<Printer size={14} />}
                          tooltip="In Mẫu 09/BH dưới dạng PDF"
                          type="text"
                          className="!p-1 !text-slate-500 hover:!text-blue-600 hover:!bg-blue-50 !rounded cursor-pointer"
                          onClick={() => onPrintPdf?.(item)}
                        />
                      </td>

                      {/* Thao tác */}
                      <td className="py-1.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Xem XML gốc */}
                          <IconButton
                            icon={<Eye size={14} />}
                            tooltip="Xem chi tiết hồ sơ XML gốc"
                            type="text"
                            className="!p-1 !text-slate-500 hover:!text-indigo-600 hover:!bg-indigo-50 !rounded cursor-pointer"
                            onClick={() => onViewDetail(item)}
                          />

                          {/* Sửa */}
                          <IconButton
                            icon={isSigned ? <Lock size={12} /> : <Edit2 size={13} />}
                            tooltip={isSigned ? "Hồ sơ đã ký số — không thể sửa" : "Chỉnh sửa hồ sơ"}
                            type="text"
                            disabled={isSigned}
                            className={`!p-1 !rounded ${
                              isSigned
                                ? "!text-slate-300 cursor-not-allowed"
                                : "!text-slate-500 hover:!text-blue-600 hover:!bg-blue-50 cursor-pointer"
                            }`}
                            onClick={() => !isSigned && onEdit(item)}
                          />

                          {/* Xóa */}
                          <IconButton
                            icon={<Trash2 size={13} />}
                            tooltip={isSigned ? "Hồ sơ đã ký số — không thể xóa" : "Xóa hồ sơ"}
                            type="text"
                            danger
                            disabled={isSigned}
                            className={`!p-1 !rounded ${
                              isSigned
                                ? "!text-slate-300 cursor-not-allowed"
                                : "!text-slate-500 hover:!text-rose-600 hover:!bg-rose-50 cursor-pointer"
                            }`}
                            onClick={() => !isSigned && onDelete(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-3 py-1.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Hiển thị <b>{paginatedItems.length}</b> /{" "}
          <b>{filteredGridItems.length}</b> hồ sơ điều chỉnh
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={filteredGridItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
