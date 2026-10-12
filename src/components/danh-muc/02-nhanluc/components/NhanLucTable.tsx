import React from 'react';
import { Search, Users, Edit2, Trash2 } from 'lucide-react';
import type { DmNhanLucItem } from '../../../../types';
import { Pagination } from '../../../common';
import { usePagination } from '../../../../hooks/usePagination';

interface NhanLucTableProps {
  items: DmNhanLucItem[];
  searchTerm: string;
  totalCount: number;
  onSearchChange: (term: string) => void;
  onEdit: (item: DmNhanLucItem) => void;
  onDelete: (item: DmNhanLucItem) => void;
}

export const NhanLucTable: React.FC<NhanLucTableProps> = ({
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
  const chucDanhMap: Record<string, string> = {
    '1': 'Bác sỹ',
    '2': 'Y sỹ',
    '3': 'Điều dưỡng',
    '4': 'Hộ sinh',
    '5': 'Kỹ thuật y',
    '6': 'Cử nhân tâm lý LS',
    '7': 'Lương y',
    '8': 'Dược sỹ',
    '9': 'Khác'
  };

  const viTriMap: Record<string, string> = {
    '1': 'Người chịu TNCM',
    '2': 'Trưởng khoa',
    '3': 'Người chịu TNCM kiêm TK',
    '4': 'Người đứng đầu CSKCB',
    '5': 'Phụ trách khoa',
    '6': 'Người được UQ theo NĐ96'
  };

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên, CCCD/Định danh, mã khoa, số CCHN, phạm vi CM..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
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
          <span>Hiển thị <strong className="text-slate-900 font-bold">{items.length}</strong> / {totalCount} nhân sự</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span className="font-mono text-[11px] text-indigo-700 font-semibold">24 Cột Dữ Liệu Chuẩn BHXH</span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative table-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1700px]">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <tr>
              <th className="py-3 px-2 text-center w-[52px] min-w-[52px] max-w-[52px] sticky left-0 bg-slate-100 z-30">
                STT
              </th>
              <th className="py-3 px-3 min-w-[200px] sticky left-[52px] bg-slate-100 z-30 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                Họ Và Tên
              </th>
              <th className="py-3 px-3 min-w-[130px]">Số Định Danh / CCCD</th>
              <th className="py-3 px-3 text-center min-w-[80px]">Giới Tính</th>
              <th className="py-3 px-3 min-w-[130px]">Chức Danh NN</th>
              <th className="py-3 px-3 min-w-[140px]">Vị Trí Chuyên Môn</th>
              <th className="py-3 px-3 min-w-[100px]">Mã Khoa</th>
              <th className="py-3 px-3 min-w-[180px]">Tên Khoa / Phòng</th>
              <th className="py-3 px-3 min-w-[130px]">Số CCHN</th>
              <th className="py-3 px-3 min-w-[90px]">Ngày Cấp CCHN</th>
              <th className="py-3 px-3 min-w-[130px]">Nơi Cấp CCHN</th>
              <th className="py-3 px-3 min-w-[160px]">Phạm Vi Chuyên Môn</th>
              <th className="py-3 px-3 min-w-[120px]">PV Bổ Sung</th>
              <th className="py-3 px-3 min-w-[120px]">Thời Gian ĐK</th>
              <th className="py-3 px-3 min-w-[120px]">Giờ Làm Việc</th>
              <th className="py-3 px-3 min-w-[100px]">Ngày Trong Tuần</th>
              <th className="py-3 px-3 min-w-[90px]">Từ Ngày</th>
              <th className="py-3 px-3 min-w-[90px]">Đến Ngày</th>
              <th className="py-3 px-3 min-w-[80px]">Mã CSKCB</th>
              <th className="py-3 px-3 text-center min-w-[90px] sticky right-0 bg-slate-100 z-30 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={20} className="py-6 sm:py-7 text-center text-slate-400">
                  <Users size={26} className="mx-auto mb-1 text-slate-300" />
                  <p className="font-bold text-xs text-slate-600">Không tìm thấy nhân sự KCB nào</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng nạp file Excel hoặc bấm "Thêm Nhân Lực Mới"</p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => (
                <tr key={item.id || item.soDinhDanh || idx} className="hover:bg-blue-50/25 transition-colors group">
                  <td className="py-3 px-2 text-center font-bold text-slate-400 w-[52px] min-w-[52px] max-w-[52px] sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                    {item.stt || startIdx + idx + 1}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap sticky left-[52px] bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-sm bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {item.hoTen.charAt(0)}
                      </div>
                      <span>{item.hoTen}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {item.soDinhDanh}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                      item.gioiTinh === 1 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {item.gioiTinh === 1 ? 'Nam' : item.gioiTinh === 2 ? 'Nữ' : 'Khác'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {chucDanhMap[item.chucDanhNn] || item.chucDanhNn}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.viTri ? (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                        {viTriMap[item.viTri] || item.viTri}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-700">
                    {item.maKhoa}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium max-w-[200px] truncate" title={item.tenKhoa}>
                    {item.tenKhoa}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-emerald-700 font-bold">
                    {item.macchn || <span className="text-slate-400 font-normal italic">Chưa có</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">{item.ngaycapCchn || '-'}</td>
                  <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]" title={item.noicapCchn}>{item.noicapCchn || '-'}</td>
                  <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-[160px]" title={item.phamviCm}>
                    {item.phamviCm || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{item.phamviCmbs || '-'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.thoigianDk === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.thoigianDk === 1 ? 'Toàn thời gian' : 'Bán thời gian'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{item.thoigianNgay || '-'}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{item.thoigianTuan || '-'}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 font-bold">{item.tuNgay}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{item.denNgay || '-'}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{item.maCskcb}</td>
                  <td className="py-3 px-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Xóa nhân sự"
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
        itemLabel="nhân sự"
        themeColor="blue"
      />
    </div>
  );
};
