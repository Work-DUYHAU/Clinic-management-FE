import React from 'react';
import { Search, Cpu, Edit2, Trash2, Plus, AlertTriangle } from 'lucide-react';
import type { DmTbytThdvItem } from '../../../../types';

interface TbytThdvTableProps {
  items: DmTbytThdvItem[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddNew: () => void;
  onEdit: (item: DmTbytThdvItem) => void;
  onDelete: (item: DmTbytThdvItem) => void;
}

export const TbytThdvTable: React.FC<TbytThdvTableProps> = ({
  items,
  searchTerm,
  onSearchChange,
  onAddNew,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên thiết bị, mã máy, model, số lưu hành, hãng SX..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium"
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
            Hiển thị <strong className="text-slate-900 font-bold">{items.length}</strong> thiết bị y tế
          </span>
          <button
            type="button"
            onClick={onAddNew}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-sm text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Thêm Thiết Bị</span>
          </button>
        </div>
      </div>

      {/* Responsive Table with horizontal scroll */}
      <div className="overflow-x-auto max-h-[600px] relative">
        <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1700px]">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <tr>
              <th className="py-3 px-2 text-center w-[52px] min-w-[52px] max-w-[52px] sticky top-0 left-0 bg-slate-100 z-30">
                STT
              </th>
              <th className="py-3 px-3 min-w-[260px] sticky top-0 left-[52px] bg-slate-100 z-30 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                TÊN THIẾT BỊ Y TẾ (*)
              </th>
              <th className="py-3 px-3 min-w-[150px]">MÃ MÁY (QĐ 3176) (*)</th>
              <th className="py-3 px-3 min-w-[130px]">MODEL / KÝ HIỆU</th>
              <th className="py-3 px-3 min-w-[180px]">CÔNG TY SẢN XUẤT</th>
              <th className="py-3 px-3 min-w-[110px]">NƯỚC SX</th>
              <th className="py-3 px-3 text-center min-w-[85px]">NĂM SX</th>
              <th className="py-3 px-3 text-center min-w-[85px]">NĂM SD</th>
              <th className="py-3 px-3 min-w-[160px]">SỐ LƯU HÀNH (NĐ 07)</th>
              <th className="py-3 px-3 min-w-[110px]">HĐ THUÊ TỪ</th>
              <th className="py-3 px-3 min-w-[110px]">HĐ THUÊ ĐẾN</th>
              <th className="py-3 px-3 min-w-[110px]">TỪ NGÀY (*)</th>
              <th className="py-3 px-3 min-w-[110px]">ĐẾN NGÀY</th>
              <th className="py-3 px-3 min-w-[90px]">MÃ CSKCB</th>
              <th className="py-3 px-3 text-center min-w-[100px] sticky top-0 right-0 bg-slate-100 z-30 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                THAO TÁC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-400">
                  <Cpu size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-sm text-slate-600">Chưa có dữ liệu Thiết Bị Y Tế Thực Hiện DVKT</p>
                  <p className="text-xs text-slate-400 mt-1">Vui lòng nạp file Excel hoặc bấm "Thêm Thiết Bị" mới</p>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const isInvalid = item.isValid === false || (item.errors && item.errors.length > 0);
                const errorTooltip = item.errors?.join('\n') || 'Dữ liệu chưa hợp lệ';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${
                      isInvalid
                        ? 'bg-amber-50/40 hover:bg-amber-100/50 border-l-4 border-amber-500'
                        : 'hover:bg-purple-50/30'
                    }`}
                  >
                    <td
                      className={`py-3 px-2 text-center font-bold sticky left-0 z-10 w-[52px] min-w-[52px] max-w-[52px] ${
                        isInvalid
                          ? 'bg-amber-50/80 group-hover:bg-amber-100/80 text-amber-700'
                          : 'bg-white group-hover:bg-slate-50 text-slate-400'
                      }`}
                    >
                      {item.stt || idx + 1}
                    </td>
                    <td
                      className={`py-3 px-3 font-bold sticky left-[52px] z-10 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)] min-w-[260px] ${
                        isInvalid
                          ? 'bg-amber-50/80 group-hover:bg-amber-100/80 text-slate-900'
                          : 'bg-white group-hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isInvalid && (
                          <span
                            className="inline-flex items-center text-amber-600 cursor-help"
                            title={errorTooltip}
                          >
                            <AlertTriangle size={14} className="flex-shrink-0" />
                          </span>
                        )}
                        <span className="truncate max-w-[230px]" title={item.tenTb}>
                          {item.tenTb}
                        </span>
                      </div>
                      {isInvalid && (
                        <div className="text-[10px] text-amber-700 font-normal font-mono truncate max-w-[240px] mt-0.5" title={errorTooltip}>
                          ⚠ {item.errors?.[0]}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700">
                      {item.maMay}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{item.kyHieu || '-'}</td>
                    <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={item.congTySx || ''}>
                      {item.congTySx || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.nuocSx || '-'}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{item.namSx || '-'}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{item.namSd || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.soLuuHanh || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.hdTu || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.hdDen || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.tuNgay}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.denNgay || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.maCskcb}</td>
                    <td
                      className={`py-3 px-3 text-center sticky right-0 z-10 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)] min-w-[100px] ${
                        isInvalid
                          ? 'bg-amber-50/80 group-hover:bg-amber-100/80'
                          : 'bg-white group-hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thiết bị"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
    </div>
  );
};
