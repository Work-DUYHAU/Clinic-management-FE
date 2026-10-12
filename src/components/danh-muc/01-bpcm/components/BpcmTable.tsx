import React from "react";
import { Search, Building2, Edit2, Trash2 } from "lucide-react";
import type { DmBpcmItem } from "../../../../types";
import { Pagination } from "../../../common";
import { usePagination } from "../../../../hooks/usePagination";

interface BpcmTableProps {
  items: DmBpcmItem[];
  searchTerm: string;
  totalCount: number;
  onSearchChange: (term: string) => void;
  onEdit: (item: DmBpcmItem) => void;
  onDelete: (item: DmBpcmItem) => void;
}

export const BpcmTable: React.FC<BpcmTableProps> = ({
  items,
  searchTerm,
  totalCount,
  onSearchChange,
  onEdit,
  onDelete,
}) => {
  const {
    currentPage,
    pageSize,
    paginatedItems,
    startIdx,
    setCurrentPage,
    setPageSize,
  } = usePagination(items, 20);

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Table Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã khoa, tên khoa, mã CSKCB..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
            >
              Xóa
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span>
            Hiển thị{" "}
            <strong className="text-slate-900 font-bold">{items.length}</strong>{" "}
            / {totalCount} bản ghi
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span className="font-mono text-[11px] text-[#1677ff] font-semibold">
            11 Cột Dữ Liệu Chuẩn
          </span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative table-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1200px]">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
            <tr>
              <th className="py-3 px-4 text-center w-12">STT</th>
              <th className="py-3 px-4">MÃ KHOA</th>
              <th className="py-3 px-4">TÊN KHOA / ĐƠN NGUYÊN</th>
              <th className="py-3 px-4 text-center">BÀN KHÁM</th>
              <th className="py-3 px-4 text-center">GIƯỜNG PD</th>
              <th className="py-3 px-4 text-center">GIƯỜNG TK</th>
              <th className="py-3 px-4 text-center">GIƯỜNG HSTC</th>
              <th className="py-3 px-4 text-center">GIƯỜNG HSCC</th>
              <th className="py-3 px-4">TỪ NGÀY</th>
              <th className="py-3 px-4">ĐẾN NGÀY</th>
              <th className="py-3 px-4">MÃ CSKCB</th>
              <th className="py-3 px-4 text-center w-24">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="py-6 sm:py-7 text-center text-slate-400"
                >
                  <Building2
                    size={26}
                    className="mx-auto mb-1 text-slate-300"
                  />
                  <p className="font-bold text-xs text-slate-600">
                    Chưa có dữ liệu Bộ Phận Chuyên Môn
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vui lòng nạp file Excel hoặc bấm "Thêm BPCM Mới"
                  </p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => (
                <tr
                  key={item.id || item.maKhoa || idx}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="py-3 px-4 text-center font-bold text-slate-400">
                    {item.stt || startIdx + idx + 1}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#1677ff]">
                    {item.maKhoa}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.tenKhoa}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-teal-700">
                    {item.banKham}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {item.giuongPd}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {item.giuongTk}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {item.giuongHstc}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {item.giuongHscc}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {item.tuNgay}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {item.denNgay || "-"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.maCskcb}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1677ff] transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Xóa bản ghi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <Pagination
        currentPage={currentPage}
        totalItems={items.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        itemLabel="khoa phòng"
        themeColor="blue"
      />
    </div>
  );
};
