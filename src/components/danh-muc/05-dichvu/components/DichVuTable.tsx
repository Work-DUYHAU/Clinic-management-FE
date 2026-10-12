import React from 'react';
import { Search, Activity, Edit2, Trash2, Atom, Plus } from 'lucide-react';
import type { DmDichVuItem } from '../../../../types';
import { Pagination } from '../../../common';
import { usePagination } from '../../../../hooks/usePagination';

interface DichVuTableProps {
  items: DmDichVuItem[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddNew: () => void;
  onEdit: (item: DmDichVuItem) => void;
  onDelete: (item: DmDichVuItem) => void;
  onManageThuocPx: (item: DmDichVuItem) => void;
}

export const DichVuTable: React.FC<DichVuTableProps> = ({
  items,
  searchTerm,
  onSearchChange,
  onAddNew,
  onEdit,
  onDelete,
  onManageThuocPx
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
              placeholder="Tìm kiếm theo mã DV, tên DVKT, quy trình, quyết định..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Hiển thị <strong className="text-slate-900 font-bold">{items.length}</strong> dịch vụ
          </span>
          <button
            type="button"
            onClick={onAddNew}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Thêm DVKT</span>
          </button>
        </div>
      </div>

      {/* Responsive Table with horizontal scroll */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative table-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1800px]">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <tr>
              <th className="py-3 px-2 text-center w-[52px] min-w-[52px] max-w-[52px] sticky left-0 bg-slate-100 z-30">
                STT
              </th>
              <th className="py-3 px-3 min-w-[140px] sticky left-[52px] bg-slate-100 z-30 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                MÃ DỊCH VỤ
              </th>
              <th className="py-3 px-3 min-w-[240px]">TÊN DỊCH VỤ (QĐ 3176)</th>
              <th className="py-3 px-3 min-w-[200px]">TÊN DVKT THEO GIÁ</th>
              <th className="py-3 px-3 text-right min-w-[120px]">ĐƠN GIÁ (VNĐ)</th>
              <th className="py-3 px-3 text-right min-w-[130px]">GIÁ TT BHYT</th>
              <th className="py-3 px-3 text-center min-w-[110px]">THUỐC PX</th>
              <th className="py-3 px-3 min-w-[140px]">QUY TRÌNH</th>
              <th className="py-3 px-3 min-w-[140px]">QĐ DVKT</th>
              <th className="py-3 px-3 min-w-[140px]">QĐ PHÊ DUYỆT GIÁ</th>
              <th className="py-3 px-3 min-w-[100px]">MÃ CSKCB</th>
              <th className="py-3 px-3 min-w-[110px]">TỪ NGÀY</th>
              <th className="py-3 px-3 min-w-[110px]">ĐẾN NGÀY</th>
              <th className="py-3 px-3 text-center min-w-[100px] sticky right-0 bg-slate-100 z-30 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                THAO TÁC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-6 sm:py-7 text-center text-slate-400">
                  <Activity size={26} className="mx-auto mb-1 text-slate-300" />
                  <p className="font-bold text-xs text-slate-600">Chưa có dữ liệu Danh mục Dịch Vụ KBCB</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng nạp file Excel hoặc bấm "Thêm DVKT" mới</p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const hasThuocPx = item.dsThuocPx && item.dsThuocPx.length > 0;
                return (
                  <tr key={item.id || item.maDichVu || idx} className="hover:bg-blue-50/25 transition-colors group">
                    <td className="py-3 px-2 text-center font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10 w-[52px] min-w-[52px] max-w-[52px]">
                      {item.stt || startIdx + idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 sticky left-[52px] bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)] min-w-[140px]">
                      {item.maDichVu}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 max-w-[260px] truncate" title={item.tenDichVu}>
                      {item.tenDichVu}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-[220px] truncate" title={item.tenDvktGia || ''}>
                      {item.tenDvktGia || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {item.donGia != null ? item.donGia.toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      {item.giaThanhToan != null ? item.giaThanhToan.toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onManageThuocPx(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                          hasThuocPx
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Quản lý danh sách thuốc phóng xạ đi kèm"
                      >
                        <Atom size={12} className={hasThuocPx ? 'text-amber-600' : ''} />
                        <span>{hasThuocPx ? `${item.dsThuocPx?.length} Thuốc PX` : 'Thêm PX'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.quyTrinh || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.qdDvkt || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.qdPdGia || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.maCskcb}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.tuNgay}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.denNgay || '-'}</td>
                    <td className="py-3 px-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)] min-w-[100px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa dịch vụ"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa dịch vụ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
        itemLabel="dịch vụ kỹ thuật"
        themeColor="blue"
      />
    </div>
  );
};
