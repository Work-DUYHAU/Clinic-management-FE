import { useCallback } from "react";
import type { Hs01TongHopItem } from "../../../../types/hs01TongHopTypes";

export interface UseHs01TableHandlersParams {
  onSearchChange: (text: string) => void;
  onFilterLoaiKcbChange: (code: string) => void;
  onFilterTrangThaiChange: (status: string) => void;
  onAddNew: () => void;
  onEdit: (item: Hs01TongHopItem) => void;
  onDelete: (item: Hs01TongHopItem) => void;
  onViewDetail: (item: Hs01TongHopItem) => void;
  setCurrentPage: (page: number) => void;
}

/**
 * Hook quản lý toàn bộ các hàm sự kiện (event handlers) cho bảng Hs01Table.
 * Tách biệt hoàn toàn event logic khỏi JSX giúp code tường minh và dễ bảo trì.
 */
export function useHs01TableHandlers({
  onSearchChange,
  onFilterLoaiKcbChange,
  onFilterTrangThaiChange,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail,
  setCurrentPage,
}: UseHs01TableHandlersParams) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
      setCurrentPage(1);
    },
    [onSearchChange, setCurrentPage],
  );

  const handleClearSearch = useCallback(() => {
    onSearchChange("");
    setCurrentPage(1);
  }, [onSearchChange, setCurrentPage]);

  const handleLoaiKcbFilter = useCallback(
    (val: unknown) => {
      onFilterLoaiKcbChange(val as string);
      setCurrentPage(1);
    },
    [onFilterLoaiKcbChange, setCurrentPage],
  );

  const handleTrangThaiFilter = useCallback(
    (val: unknown) => {
      onFilterTrangThaiChange(val as string);
      setCurrentPage(1);
    },
    [onFilterTrangThaiChange, setCurrentPage],
  );

  const handleViewDetailRow = useCallback(
    (item: Hs01TongHopItem) => {
      onViewDetail(item);
    },
    [onViewDetail],
  );

  const handleEditRow = useCallback(
    (item: Hs01TongHopItem) => {
      onEdit(item);
    },
    [onEdit],
  );

  const handleDeleteRow = useCallback(
    (item: Hs01TongHopItem) => {
      onDelete(item);
    },
    [onDelete],
  );

  return {
    handleSearchChange,
    handleClearSearch,
    handleLoaiKcbFilter,
    handleTrangThaiFilter,
    handleAddNew: onAddNew,
    handleViewDetailRow,
    handleEditRow,
    handleDeleteRow,
  };
}
