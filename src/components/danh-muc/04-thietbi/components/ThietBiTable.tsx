import React from 'react';
import { Search, Edit3, Trash2, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import type { DmThietBiItem } from '../../../../types';
import { LOAI_THAU_OPTIONS, HT_THAU_OPTIONS } from '../services/thietBiService';
import { Pagination } from '../../../common';
import { usePagination } from '../../../../hooks/usePagination';

interface ThietBiTableProps {
  items: DmThietBiItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddNew: () => void;
  onEdit: (item: DmThietBiItem) => void;
  onDelete: (item: DmThietBiItem) => void;
}

export const ThietBiTable: React.FC<ThietBiTableProps> = ({
  items,
  searchTerm,
  onSearchChange,
  onAddNew,
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

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0 đ';
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  const formatDateDisplay = (ymd?: string) => {
    if (!ymd || ymd.length !== 8) return ymd || '—';
    return `${ymd.substring(6, 8)}/${ymd.substring(4, 6)}/${ymd.substring(0, 4)}`;
  };

  const getLoaiThauLabel = (val: number) => {
    const opt = LOAI_THAU_OPTIONS.find(o => o.value === val);
    return opt ? opt.label : `Loại ${val}`;
  };

  const getHtThauLabel = (val?: number) => {
    if (!val) return '—';
    const opt = HT_THAU_OPTIONS.find(o => o.value === val);
    return opt ? opt.label : `HT ${val}`;
  };

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header Search & Actions */}
      <div className="p-2.5 sm:p-3 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Danh Sách Thiết Bị / Vật Tư Y Tế Áp Dụng BHYT
            </h3>
            <span className="text-[10px] px-2 py-0.2 rounded-sm font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 font-mono">
              {items.length} bản ghi
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium">
            Mẫu 04/DM theo quy định TT 04/2017/TT-BYT, TT 24/2025/TT-BYT &amp; QĐ 3176/QĐ-BYT
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên TBYT, nhóm, hãng SX, số LH..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-2xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative table-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 border-separate border-spacing-0 min-w-[1800px]">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] sticky top-0 z-20 shadow-2xs">
            <tr>
              <th className="py-2.5 px-3 text-center w-[50px] min-w-[50px] max-w-[50px] sticky left-0 bg-slate-100 z-30 border-b border-r border-slate-200">
                STT
              </th>
              <th className="py-2.5 px-3 min-w-[130px] sticky left-[50px] bg-slate-100 z-30 border-b border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                Mã Vật Tư
              </th>
              <th className="py-2.5 px-4 min-w-[280px] border-b border-slate-200 bg-slate-100">Tên Vật Tư / TBYT</th>
              <th className="py-2.5 px-3 min-w-[150px] border-b border-slate-200 bg-slate-100">Nhóm TBYT</th>
              <th className="py-2.5 px-3 min-w-[140px] border-b border-slate-200 bg-slate-100">Mã Hiệu / Số LH</th>
              <th className="py-2.5 px-3 text-center min-w-[70px] border-b border-slate-200 bg-slate-100">ĐVT</th>
              <th className="py-2.5 px-3 text-right min-w-[120px] border-b border-slate-200 bg-slate-100">Đơn Giá</th>
              <th className="py-2.5 px-3 text-right min-w-[120px] border-b border-slate-200 bg-slate-100">Đơn Giá BHYT</th>
              <th className="py-2.5 px-3 text-center min-w-[90px] border-b border-slate-200 bg-slate-100">Tỷ Lệ BHYT</th>
              <th className="py-2.5 px-3 text-right min-w-[90px] border-b border-slate-200 bg-slate-100">Số Lượng</th>
              <th className="py-2.5 px-3 text-center min-w-[90px] border-b border-slate-200 bg-slate-100">Định Mức</th>
              <th className="py-2.5 px-3 min-w-[200px] border-b border-slate-200 bg-slate-100">Nhà Thầu / TT Thầu</th>
              <th className="py-2.5 px-3 min-w-[160px] border-b border-slate-200 bg-slate-100">Loại & HT Thầu</th>
              <th className="py-2.5 px-3 min-w-[120px] border-b border-slate-200 bg-slate-100">Hạn Hợp Đồng</th>
              <th className="py-2.5 px-3 min-w-[120px] border-b border-slate-200 bg-slate-100">Thời Gian Áp Dụng</th>
              <th className="py-2.5 px-3 text-center min-w-[80px] border-b border-slate-200 bg-slate-100">Mã CSKCB</th>
              <th className="py-2.5 px-3 text-center min-w-[100px] sticky right-0 bg-slate-100 z-30 border-b border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">
                Thao Tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-6 sm:py-7 text-center text-slate-400 bg-white">
                  <Cpu size={26} className="mx-auto mb-1 text-slate-300" />
                  <p className="font-bold text-xs text-slate-600">Không tìm thấy thiết bị y tế nào</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng nạp file Excel hoặc bấm "Thêm Mới Thiết Bị"</p>
                  <button
                    type="button"
                    onClick={onAddNew}
                    className="mt-2.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    Thêm Mới Thiết Bị
                  </button>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                const isBhyt100 = (item.tyleTtBh ?? 100) === 100;
                const isTaiSuDung = item.dinhMuc && item.dinhMuc > 1;

                return (
                  <tr
                    key={item.id || index}
                    className={`hover:bg-cyan-50/30 transition-colors group ${
                      item.isValid === false ? 'bg-amber-50/40' : 'bg-white'
                    }`}
                  >
                    {/* STT (Sticky Left 0) */}
                    <td className="py-3 px-3 text-center font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10 w-[50px] min-w-[50px] max-w-[50px] border-b border-r border-slate-100">
                      {item.stt || startIdx + index + 1}
                    </td>

                    {/* Mã Vật Tư (Sticky Left 50px) */}
                    <td className="py-3 px-3 font-mono font-bold text-cyan-700 sticky left-[50px] bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap min-w-[130px] border-b border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center gap-1.5">
                        <span>{item.maVatTu}</span>
                        {item.isValid === false && (
                          <span title={item.errors?.join(', ')}>
                            <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tên Vật Tư & Hãng SX */}
                    <td className="py-3 px-4 border-b border-slate-100">
                      <div className="font-bold text-slate-900 leading-snug">{item.tenVatTu}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                        {item.hangSx && <span className="text-slate-600 font-medium">{item.hangSx}</span>}
                        {item.nuocSx && (
                          <span className="text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                            {item.nuocSx}
                          </span>
                        )}
                        {item.quyCach && (
                          <span className="text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded text-[10px]">
                            {item.quyCach}
                          </span>
                        )}
                      </div>
                      {item.tinhnangKt && (
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5" title={item.tinhnangKt}>
                          KT: {item.tinhnangKt}
                        </div>
                      )}
                    </td>

                    {/* Nhóm Vật Tư */}
                    <td className="py-3 px-3 font-medium text-slate-700 border-b border-slate-100">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] border border-slate-200">
                        {item.nhomVatTu}
                      </span>
                    </td>

                    {/* Mã Hiệu & Số Lưu Hành */}
                    <td className="py-3 px-3 border-b border-slate-100">
                      <div className="font-mono text-[11px] text-slate-800">{item.maHieu || '—'}</div>
                      {item.soLuuHanh && (
                        <div className="text-[10px] text-indigo-600 font-medium">{item.soLuuHanh}</div>
                      )}
                    </td>

                    {/* Đơn Vị Tính */}
                    <td className="py-3 px-3 text-center font-medium text-slate-600 border-b border-slate-100">
                      {item.donViTinh}
                    </td>

                    {/* Đơn Giá */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap border-b border-slate-100">
                      {formatCurrency(item.donGia)}
                    </td>

                    {/* Đơn Giá BHYT */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-cyan-700 whitespace-nowrap border-b border-slate-100">
                      {formatCurrency(item.donGiaBh)}
                    </td>

                    {/* Tỷ Lệ BHYT */}
                    <td className="py-3 px-3 text-center border-b border-slate-100">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isBhyt100
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.tyleTtBh ?? 100}%
                      </span>
                    </td>

                    {/* Số Lượng */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap border-b border-slate-100">
                      {item.soLuong ? item.soLuong.toLocaleString('vi-VN') : '0'}
                    </td>

                    {/* Định Mức Tái Sử Dụng */}
                    <td className="py-3 px-3 text-center border-b border-slate-100">
                      {isTaiSuDung ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[11px]">
                          <RefreshCw size={11} /> {item.dinhMuc} lần
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">1 lần</span>
                      )}
                    </td>

                    {/* Nhà Thầu / TT Thầu */}
                    <td className="py-3 px-3 border-b border-slate-100">
                      <div className="font-medium text-slate-900 line-clamp-1" title={item.nhaThau}>
                        {item.nhaThau || '—'}
                      </div>
                      {item.ttThau && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 line-clamp-1" title={item.ttThau}>
                          {item.ttThau}
                        </div>
                      )}
                    </td>

                    {/* Loại & HT Thầu */}
                    <td className="py-3 px-3 border-b border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-800">
                        {getLoaiThauLabel(item.loaiThau)}
                      </div>
                      {item.htThau && (
                        <div className="text-[10px] text-slate-500">{getHtThauLabel(item.htThau)}</div>
                      )}
                      {item.maCskcbTbyt && (
                        <div className="text-[10px] text-rose-600 font-bold">Từ: {item.maCskcbTbyt}</div>
                      )}
                    </td>

                    {/* Hạn Hợp Đồng */}
                    <td className="py-3 px-3 text-[11px] font-mono text-slate-600 whitespace-nowrap border-b border-slate-100">
                      <div>Từ: {formatDateDisplay(item.tuNgayHd)}</div>
                      <div>Đến: {formatDateDisplay(item.denNgayHd)}</div>
                    </td>

                    {/* Thời Gian Áp Dụng */}
                    <td className="py-3 px-3 text-[11px] font-mono text-slate-600 whitespace-nowrap border-b border-slate-100">
                      <div>Từ: {formatDateDisplay(item.tuNgay)}</div>
                      {item.denNgay ? (
                        <div className="text-rose-600 font-medium">Đến: {formatDateDisplay(item.denNgay)}</div>
                      ) : (
                        <div className="text-emerald-600 font-medium">Đang áp dụng</div>
                      )}
                    </td>

                    {/* Mã CSKCB */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 border-b border-slate-100">
                      {item.maCskcb}
                    </td>

                    {/* Thao Tác (Sticky Right) */}
                    <td className="py-3 px-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-b border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="w-7 h-7 rounded-lg hover:bg-cyan-100 text-slate-500 hover:text-cyan-700 flex items-center justify-center transition-colors"
                          title="Chỉnh sửa thiết bị"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="w-7 h-7 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors"
                          title="Xóa thiết bị"
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
        itemLabel="thiết bị / vật tư"
        themeColor="blue"
      />
    </div>
  );
};
