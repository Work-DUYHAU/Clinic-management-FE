import { useState, useRef, useCallback } from "react";
import type { HoSoDieuChinh09Item } from "../../../../types/hs09DieuChinhTypes";
import { useToast } from "../../../../context/ToastContext";



export interface UseHs09TableHandlersProps {
  items: HoSoDieuChinh09Item[];
  selectedItemsList: HoSoDieuChinh09Item[];
  selectedCount: number;
  overLimit: boolean;
  onSearchChange: (text: string) => void;
  onFilterKyQtChange?: (val: string) => void;
  onFilterTinhTrangGuiChange?: (val: string) => void;
  onFilterLoaiThaoTacChange?: (val: string) => void;
  onFilterTuNgayChange?: (val: string) => void;
  onFilterDenNgayChange?: (val: string) => void;
  onBulkSign?: (selected: HoSoDieuChinh09Item[]) => void;
  onSendGiamDinh?: (selected: HoSoDieuChinh09Item[]) => void;
  onHuyPhien?: (selected: HoSoDieuChinh09Item[]) => void;
  onExportExcel?: (selected?: HoSoDieuChinh09Item[]) => void;
  onUnsign?: (selected: HoSoDieuChinh09Item[]) => void;
  setCurrentPage: (page: number) => void;
}

export function useHs09TableHandlers({
  selectedItemsList,
  selectedCount,
  overLimit,
  onSearchChange,
  onFilterKyQtChange,
  onFilterTinhTrangGuiChange,
  onFilterLoaiThaoTacChange,
  onFilterTuNgayChange,
  onFilterDenNgayChange,
  onBulkSign,
  onSendGiamDinh,
  onHuyPhien,
  onExportExcel,
  onUnsign,
  setCurrentPage,
}: UseHs09TableHandlersProps) {
  const toast = useToast();

  // Scroll and Drag-to-scroll logic
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
  }, []);

  const handleMouseLeaveOrUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !tableContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      tableContainerRef.current.scrollLeft = scrollLeftPos - walk;
    },
    [isDragging, startX, scrollLeftPos],
  );

  // Search and Filter Handlers
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
      setCurrentPage(1);
    },
    [onSearchChange, setCurrentPage],
  );

  const handleKyQtFilterChange = useCallback(
    (val: unknown) => {
      onFilterKyQtChange?.(val as string);
      setCurrentPage(1);
    },
    [onFilterKyQtChange, setCurrentPage],
  );

  const handleTinhTrangGuiFilterChange = useCallback(
    (val: unknown) => {
      onFilterTinhTrangGuiChange?.(val as string);
      setCurrentPage(1);
    },
    [onFilterTinhTrangGuiChange, setCurrentPage],
  );

  const handleLoaiThaoTacFilterChange = useCallback(
    (val: unknown) => {
      onFilterLoaiThaoTacChange?.(val as string);
      setCurrentPage(1);
    },
    [onFilterLoaiThaoTacChange, setCurrentPage],
  );

  const handleDateRangeFilterChange = useCallback(
    (dates: any) => {
      if (!dates || !dates[0] || !dates[1]) {
        onFilterTuNgayChange?.("");
        onFilterDenNgayChange?.("");
      } else {
        onFilterTuNgayChange?.(dates[0].format("YYYY-MM-DD"));
        onFilterDenNgayChange?.(dates[1].format("YYYY-MM-DD"));
      }
      setCurrentPage(1);
    },
    [onFilterTuNgayChange, onFilterDenNgayChange, setCurrentPage],
  );

  // Action Triggers
  const handleTriggerBulkSign = useCallback(() => {
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
  }, [selectedCount, overLimit, selectedItemsList, toast, onBulkSign]);

  const handleTriggerSendGiamDinh = useCallback(() => {
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
  }, [selectedCount, selectedItemsList, toast, onSendGiamDinh]);

  const handleTriggerHuyPhien = useCallback(() => {
    if (selectedCount === 0) {
      toast.warning("Chưa chọn bản ghi nào!", "Thông báo");
      return;
    }

    const hasSigned = selectedItemsList.some((item) => item.ttKySo === 2);
    if (hasSigned) {
      toast.error(
        "Tất cả hồ sơ được chọn bắt buộc phải có TT_KYSO = 0 (Chưa ký số)! Vui lòng bỏ chọn các hồ sơ đã ký.",
        "Lỗi hủy phiên",
      );
      return;
    }

    onHuyPhien?.(selectedItemsList);
  }, [selectedCount, selectedItemsList, toast, onHuyPhien]);

  const handleTriggerExportSelected = useCallback(() => {
    if (selectedCount === 0) {
      onExportExcel?.();
    } else {
      onExportExcel?.(selectedItemsList);
    }
  }, [selectedCount, selectedItemsList, onExportExcel]);

  const handleTriggerUnsign = useCallback(
    (selectedSignedList: HoSoDieuChinh09Item[]) => {
      onUnsign?.(selectedSignedList);
    },
    [onUnsign],
  );

  return {
    tableContainerRef,
    isDragging,
    handleMouseDown,
    handleMouseLeaveOrUp,
    handleMouseMove,
    handleSearchInputChange,
    handleKyQtFilterChange,
    handleTinhTrangGuiFilterChange,
    handleLoaiThaoTacFilterChange,
    handleDateRangeFilterChange,
    handleTriggerBulkSign,
    handleTriggerSendGiamDinh,
    handleTriggerHuyPhien,
    handleTriggerExportSelected,
    handleTriggerUnsign,
  };
}
