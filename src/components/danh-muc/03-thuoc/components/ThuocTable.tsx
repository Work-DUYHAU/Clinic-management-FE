import React from 'react';
import { Search, Edit2, Trash2, AlertCircle, CheckCircle2, Pill } from 'lucide-react';
import type { DmThuocItem } from '../../../../types';
import { Pagination } from '../../../common';
import { usePagination } from '../../../../hooks/usePagination';

interface ThuocTableProps {
  items: DmThuocItem[];
  searchTerm: string;
  totalCount: number;
  onSearchChange: (term: string) => void;
  onEdit: (item: DmThuocItem) => void;
  onDelete: (item: DmThuocItem) => void;
}

const getLoaiThuocBadge = (loai: number) => {
  switch (loai) {
    case 1:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 whitespace-nowrap">
          1: Tân dược
        </span>
      );
    case 2:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 whitespace-nowrap">
          2: Chế phẩm YHCT
        </span>
      );
    case 3:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 whitespace-nowrap">
          3: Vị thuốc
        </span>
      );
    case 4:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 whitespace-nowrap">
          4: Phóng xạ
        </span>
      );
    case 7:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[10px] border border-teal-200 whitespace-nowrap">
          7: Dược liệu
        </span>
      );
    case 9:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200 whitespace-nowrap">
          9: Máu
        </span>
      );
    case 10:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 font-bold text-[10px] border border-red-200 whitespace-nowrap">
          10: Chế phẩm máu
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] whitespace-nowrap">
          {loai}: Khác
        </span>
      );
  }
};

export const ThuocTable: React.FC<ThuocTableProps> = ({
  items,
  searchTerm,
  totalCount,
  onSearchChange,
  onEdit,
  onDelete
}) => {
  const {
    currentPage,
    pageSize,
    paginatedItems,
    startIdx,
    setCurrentPage,
    setPageSize
  } = usePagination(items, 20);

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Table Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã thuốc, tên thuốc, hoạt chất, số đăng ký..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
            >
              Xóa
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span>
            Hiển thị <strong className="text-slate-900 font-bold">{items.length}</strong> / {totalCount} mặt hàng
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span className="font-mono text-[11px] text-[#1677ff] font-semibold">37 Cột Dữ Liệu Chuẩn Loại 10</span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative table-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1350px]">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <tr>
              <th className="py-3 px-2 text-center w-[52px] min-w-[52px] max-w-[52px] sticky left-0 bg-slate-100 z-30">
                STT
              </th>
              <th className="py-3 px-3 min-w-[130px] sticky left-[52px] bg-slate-100 z-30 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                Mã Thuốc (QĐ 3176)
              </th>
              <th className="py-3 px-4 min-w-[220px]">Tên Thuốc & Hoạt Chất</th>
              <th className="py-3 px-3 min-w-[140px]">Hàm Lượng / Dạng BC</th>
              <th className="py-3 px-3 min-w-[120px]">Đường Dùng</th>
              <th className="py-3 px-3 text-center min-w-[70px]">Đơn Vị</th>
              <th className="py-3 px-3 text-right min-w-[110px]">Đơn Giá BHYT</th>
              <th className="py-3 px-3 min-w-[110px]">Số Đăng Ký</th>
              <th className="py-3 px-3 text-center min-w-[120px]">Loại Thuốc</th>
              <th className="py-3 px-3 text-center min-w-[100px]">Trạng Thái</th>
              <th className="py-3 px-3 text-center min-w-[90px] sticky right-0 bg-slate-100 z-30 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 sm:py-7 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Pill size={26} className="mx-auto text-slate-300" />
                    <p className="font-bold text-xs text-slate-600">Không tìm thấy mặt hàng thuốc nào phù hợp</p>
                    <p className="text-[11px] text-slate-400">Vui lòng nạp file Excel hoặc bấm "Thêm Thuốc Mới"</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((th, idx) => (
                <tr key={th.id || th.maThuoc || idx} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="py-3 px-2 text-center font-bold text-slate-400 w-[52px] min-w-[52px] max-w-[52px] sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                    {th.stt || startIdx + idx + 1}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#1677ff] whitespace-nowrap sticky left-[52px] bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                    {th.maThuoc}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-extrabold text-slate-900 leading-snug">{th.tenThuoc}</div>
                    {th.tenHoatChat && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5">{th.tenHoatChat}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{th.hamLuong || '—'}</div>
                    {th.dangBaoChe && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{th.dangBaoChe}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">{th.duongDung || '—'}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1">({th.maDuongDung})</span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-800">{th.donViTinh}</td>
                  <td className="py-3 px-3 text-right font-black text-blue-700 whitespace-nowrap">
                    {(th.donGiaBh || th.donGia || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-700 font-semibold whitespace-nowrap">
                    {th.soDangKy}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {getLoaiThuocBadge(th.loaiThuoc)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {th.isValid !== false ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 size={13} />
                        <span>Hợp lệ</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 cursor-help"
                        title={th.errors?.join('\n')}
                      >
                        <AlertCircle size={13} />
                        <span>Lỗi XML</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(th)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1677ff] transition-colors"
                        title="Chỉnh sửa thông tin thuốc"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(th)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Xóa mặt hàng thuốc"
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
        itemLabel="mặt hàng thuốc"
        themeColor="blue"
      />
    </div>
  );
};
