import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  User,
} from 'lucide-react';
import type { Hs01TongHopItem } from '../services/hs01TongHopService';
import { LOAI_KCB_OPTIONS, GIOI_TINH_MAP } from '../services/hs01TongHopService';
import { formatCurrencyVnd, formatYmdHmDisplay } from '../../../../utils/shared/excelXmlShared';
import { Pagination } from '../../../common';

interface Hs01TableProps {
  items: Hs01TongHopItem[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterLoaiKcb: string;
  onFilterLoaiKcbChange: (val: string) => void;
  filterTrangThai: string;
  onFilterTrangThaiChange: (val: string) => void;
  onAddNew: () => void;
  onEdit: (item: Hs01TongHopItem) => void;
  onDelete: (item: Hs01TongHopItem) => void;
  onViewDetail: (item: Hs01TongHopItem) => void;
}

export const Hs01Table: React.FC<Hs01TableProps> = ({
  items,
  searchTerm,
  onSearchChange,
  filterLoaiKcb,
  onFilterLoaiKcbChange,
  filterTrangThai,
  onFilterTrangThaiChange,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedItems = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (validCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Search & Filter Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã thẻ, mã bệnh, mã CSKCB..."
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          {/* Filter Loại KCB */}
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterLoaiKcb}
              onChange={(e) => {
                onFilterLoaiKcbChange(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="all">Tất cả loại KCB</option>
              {LOAI_KCB_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  [{o.code}] {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Trạng thái */}
          <select
            value={filterTrangThai}
            onChange={(e) => {
              onFilterTrangThaiChange(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="hop_le">Hợp lệ (Sẵn sàng gửi)</option>
            <option value="canh_bao">Cần kiểm tra lại</option>
            <option value="da_gui_cong">Đã gửi Cổng BHXH</option>
          </select>

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setCurrentPage(1);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
            >
              Xóa lọc
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onAddNew}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Thêm Hồ Sơ Mới</span>
          </button>
        </div>
      </div>

      {/* Table with Sticky Header, Sticky STT & Name (0px gap) and Sticky Actions */}
      <div className="overflow-x-auto max-h-[600px] relative">
        <table className="w-full text-left text-xs text-slate-700 min-w-[1600px] border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <tr>
              {/* 1. STT (Sticky top-0 left-0, w-56px) */}
              <th className="py-3 px-2 text-center w-[56px] min-w-[56px] max-w-[56px] sticky top-0 left-0 bg-slate-100 z-30">
                STT
              </th>

              {/* 2. HO_TEN (Sticky top-0 left-56px, w-220px, 0px gap) */}
              <th className="py-3 px-3 w-[220px] min-w-[220px] max-w-[220px] sticky top-0 left-[56px] bg-slate-100 z-30 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                HỌ VÀ TÊN
              </th>

              {/* 3. NGAY_SINH */}
              <th className="py-3 px-3 min-w-[110px]">NGÀY SINH</th>

              {/* 4. GIOI_TINH */}
              <th className="py-3 px-2 text-center min-w-[70px]">GIỚI TÍNH</th>

              {/* 5. MA_THE_BHYT */}
              <th className="py-3 px-3 min-w-[140px]">MÃ THẺ BHYT</th>

              {/* 6. MA_BENH_CHINH */}
              <th className="py-3 px-3 min-w-[100px]">MÃ BỆNH</th>

              {/* 7. NGAY_VAO */}
              <th className="py-3 px-3 min-w-[130px]">NGÀY VÀO</th>

              {/* 8. NGAY_VAO_NOI_TRU */}
              <th className="py-3 px-3 min-w-[130px]">VÀO NỘI TRÚ</th>

              {/* 9. NGAY_RA */}
              <th className="py-3 px-3 min-w-[130px]">NGÀY RA</th>

              {/* 10. SO_NGAY_DTRI */}
              <th className="py-3 px-2 text-center min-w-[80px]">SỐ NGÀY ĐT</th>

              {/* 11. MA_LOAI_KCB */}
              <th className="py-3 px-3 min-w-[110px]">LOẠI KCB</th>

              {/* 12. T_TONGCHI_BV */}
              <th className="py-3 px-3 text-right min-w-[130px]">TỔNG CHI BV</th>

              {/* 13. T_TONGCHI_BH */}
              <th className="py-3 px-3 text-right min-w-[130px]">TỔNG CHI BH</th>

              {/* 14. T_BHTT */}
              <th className="py-3 px-3 text-right min-w-[130px]">BHYT CHI TRẢ</th>

              {/* 15. T_BNCCT */}
              <th className="py-3 px-3 text-right min-w-[120px]">CÙNG CHI TRẢ</th>

              {/* 16. T_BNTT */}
              <th className="py-3 px-3 text-right min-w-[110px]">BN TỰ TRẢ</th>

              {/* 17. T_NGUONKHAC */}
              <th className="py-3 px-3 text-right min-w-[110px]">NGUỒN KHÁC</th>

              {/* 18. MA_CSKCB */}
              <th className="py-3 px-3 text-center min-w-[90px]">MÃ CSKCB</th>

              {/* 19 & 20. NAM_QT / THANG_QT */}
              <th className="py-3 px-3 text-center min-w-[100px]">KỲ QT</th>

              {/* Action Column (Sticky top-0 right-0) */}
              <th className="py-3 px-3 text-center w-[110px] min-w-[110px] max-w-[110px] sticky top-0 right-0 bg-slate-100 z-30 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                THAO TÁC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={20} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User size={32} className="text-slate-300" />
                    <span>Không tìm thấy hồ sơ tổng hợp 01/BH nào phù hợp</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const loaiKcbObj = LOAI_KCB_OPTIONS.find((o) => o.code === item.maLoaiKcb);
                const loaiKcbLabel = loaiKcbObj ? `[${item.maLoaiKcb}] ${loaiKcbObj.name}` : `Mã ${item.maLoaiKcb}`;

                return (
                  <tr key={item.id} className="group hover:bg-indigo-50/30 transition-colors">
                    {/* 1. STT */}
                    <td className="py-3 px-2 text-center font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10 w-[56px] min-w-[56px] max-w-[56px]">
                      {item.stt}
                    </td>

                    {/* 2. HO_TEN */}
                    <td className="py-3 px-3 font-medium sticky left-[56px] bg-white group-hover:bg-slate-50 z-10 w-[220px] min-w-[220px] max-w-[220px] border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                      <div className="font-bold text-slate-900 truncate" title={item.hoTen}>
                        {item.hoTen}
                      </div>
                    </td>

                    {/* 3. NGAY_SINH */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      {formatYmdHmDisplay(item.ngaySinh).split(' ')[0]}
                    </td>

                    {/* 4. GIOI_TINH */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {GIOI_TINH_MAP[String(item.gioiTinh)] || item.gioiTinh}
                      </span>
                    </td>

                    {/* 5. MA_THE_BHYT */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {item.maTheBhyt}
                      </span>
                    </td>

                    {/* 6. MA_BENH_CHINH */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {item.maBenhChinh}
                      </span>
                    </td>

                    {/* 7. NGAY_VAO */}
                    <td className="py-3 px-3 text-[11px] whitespace-nowrap text-slate-700">
                      {formatYmdHmDisplay(item.ngayVao)}
                    </td>

                    {/* 8. NGAY_VAO_NOI_TRU */}
                    <td className="py-3 px-3 text-[11px] whitespace-nowrap text-slate-500">
                      {item.ngayVaoNoiTru ? formatYmdHmDisplay(item.ngayVaoNoiTru) : '-'}
                    </td>

                    {/* 9. NGAY_RA */}
                    <td className="py-3 px-3 text-[11px] whitespace-nowrap text-slate-700">
                      {formatYmdHmDisplay(item.ngayRa)}
                    </td>

                    {/* 10. SO_NGAY_DTRI */}
                    <td className="py-3 px-2 text-center font-bold text-slate-800 whitespace-nowrap">
                      {item.soNgayDtri}
                    </td>

                    {/* 11. MA_LOAI_KCB */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200" title={loaiKcbLabel}>
                        {loaiKcbLabel}
                      </span>
                    </td>

                    {/* 12. T_TONGCHI_BV */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatCurrencyVnd(item.tTongchiBv)}
                    </td>

                    {/* 13. T_TONGCHI_BH */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-blue-700">
                      {formatCurrencyVnd(item.tTongchiBh)}
                    </td>

                    {/* 14. T_BHTT */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-emerald-700">
                      {formatCurrencyVnd(item.tBhtt)}
                    </td>

                    {/* 15. T_BNCCT */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-amber-700">
                      {formatCurrencyVnd(item.tBncct)}
                    </td>

                    {/* 16. T_BNTT */}
                    <td className="py-3 px-3 text-right whitespace-nowrap text-slate-600">
                      {formatCurrencyVnd(item.tBntt)}
                    </td>

                    {/* 17. T_NGUONKHAC */}
                    <td className="py-3 px-3 text-right whitespace-nowrap text-slate-500">
                      {formatCurrencyVnd(item.tNguonkhac || 0)}
                    </td>

                    {/* 18. MA_CSKCB */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                      {item.maCskcb}
                    </td>

                    {/* 19 & 20. NAM_QT / THANG_QT */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {item.thangQt}/{item.namQt}
                      </span>
                    </td>

                    {/* 20. THAO TÁC (Sticky right) */}
                    <td className="py-3 px-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 w-[110px] min-w-[110px] max-w-[110px] border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Xem chi tiết 20 trường"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa hồ sơ"
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

      {/* Common Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={items.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        itemLabel="hồ sơ"
        themeColor="indigo"
      />
    </div>
  );
};
