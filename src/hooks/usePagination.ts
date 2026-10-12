import { useState, useMemo } from 'react';

export interface UsePaginationOptions {
  initialPageSize?: number;
}

export interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  paginatedItems: T[];
  startIdx: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetPage: () => void;
}

export function usePagination<T>(
  items: T[],
  options?: UsePaginationOptions | number
): UsePaginationReturn<T> {
  const initialPageSize =
    typeof options === 'number'
      ? options
      : options?.initialPageSize ?? 20;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = useMemo(() => {
    return (validCurrentPage - 1) * pageSize;
  }, [validCurrentPage, pageSize]);

  const paginatedItems = useMemo(() => {
    return items.slice(startIdx, startIdx + pageSize);
  }, [items, startIdx, pageSize]);

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage: validCurrentPage,
    pageSize,
    paginatedItems,
    startIdx,
    totalPages,
    setCurrentPage,
    setPageSize,
    resetPage,
  };
}
