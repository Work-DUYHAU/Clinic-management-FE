import React from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  User,
} from 'lucide-react';
import type { Hs01TongHopItem } from '../../../../types/hs01TongHopTypes';
import { LOAI_KCB_OPTIONS, GIOI_TINH_MAP } from '../../../../utils/constants/hs01TongHopConstants';
import { formatCurrencyVnd, formatYmdHmDisplay } from '../../../../utils/shared/excelXmlShared';
import { Pagination } from '../../../common';
import { Button, IconButton, Select } from '../../../../shared/components';
import { usePagination } from '../../../../hooks/usePagination';
import { useHs01TableHandlers } from '../handlers';

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

export const Hs01Table: React.FC<Hs01TableProps> = React.memo(({
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
  const {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    setPageSize
  } = usePagination(items, 10);

  const {
    handleSearchChange,
    handleClearSearch,
    handleLoaiKcbFilter,
    handleTrangThaiFilter,
    handleAddNew: onAddNewHandler,
    handleViewDetailRow,
    handleEditRow,
    handleDeleteRow,
  } = useHs01TableHandlers({
    onSearchChange,
    onFilterLoaiKcbChange,
    onFilterTrangThaiChange,
    onAddNew,
    onEdit,
    onDelete,
    onViewDetail,
    setCurrentPage,
  });

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      <div className="p-3 sm:p-3.5 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã thẻ, mã bệnh, mã CSKCB..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <Select
              height={32}
              value={filterLoaiKcb}
              onChange={handleLoaiKcbFilter}
              containerClassName="mb-0 w-48"
              className="!text-xs font-medium"
              options={[
                { value: "all", label: "Tất cả loại KCB" },
                ...LOAI_KCB_OPTIONS.map((o) => ({
                  value: o.code,
                  label: `[${o.code}] ${o.name}`,
                })),
              ]}
            />
          </div>

          <Select
            height={32}
            value={filterTrangThai}
            onChange={handleTrangThaiFilter}
            containerClassName="mb-0 w-44"
            className="!text-xs font-medium"
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "hop_le", label: "Hợp lệ (Sẵn sàng gửi)" },
              { value: "canh_bao", label: "Cần kiểm tra lại" },
              { value: "da_gui_cong", label: "Đã gửi Cổng BHXH" },
            ]}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-xs text-rose-600 hover:underline font-bold px-2 py-1 cursor-pointer"
            >
              Xóa lọc
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={onAddNewHandler}
          >
            Thêm Hồ Sơ Mới
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative table-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 min-w-[1600px] border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <tr>
              <th className="py-3 px-2 text-center w-[56px] min-w-[56px] max-w-[56px] sticky top-0 left-0 bg-slate-100 z-30">
                STT
              </th>
              <th className="py-3 px-3 w-[220px] min-w-[220px] max-w-[220px] sticky top-0 left-[56px] bg-slate-100 z-30 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                HỌ VÀ TÊN
              </th>
              <th className="py-3 px-3 min-w-[110px]">NGÀY SINH</th>
              <th className="py-3 px-2 text-center min-w-[70px]">GIỚI TÍNH</th>
              <th className="py-3 px-3 min-w-[140px]">MÃ THẺ BHYT</th>
              <th className="py-3 px-3 min-w-[100px]">MÃ BỆNH</th>
              <th className="py-3 px-3 min-w-[130px]">NGÀY VÀO</th>
              <th className="py-3 px-3 min-w-[130px]">VÀO NỘI TRÚ</th>
              <th className="py-3 px-3 min-w-[130px]">NGÀY RA</th>
              <th className="py-3 px-2 text-center min-w-[80px]">SỐ NGÀY ĐT</th>
              <th className="py-3 px-3 min-w-[110px]">LOẠI KCB</th>
              <th className="py-3 px-3 text-right min-w-[130px]">TỔNG CHI BV</th>
              <th className="py-3 px-3 text-right min-w-[130px]">TỔNG CHI BH</th>
              <th className="py-3 px-3 text-right min-w-[130px]">BHYT CHI TRẢ</th>
              <th className="py-3 px-3 text-right min-w-[120px]">CÙNG CHI TRẢ</th>
              <th className="py-3 px-3 text-right min-w-[110px]">BN TỰ TRẢ</th>
              <th className="py-3 px-3 text-right min-w-[110px]">NGUỒN KHÁC</th>
              <th className="py-3 px-3 text-center min-w-[90px]">MÃ CSKCB</th>
              <th className="py-3 px-3 text-center min-w-[100px]">KỲ QT</th>
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
                    <td className="py-3 px-2 text-center font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10 w-[56px] min-w-[56px] max-w-[56px]">
                      {item.stt}
                    </td>
                    <td className="py-3 px-3 font-medium sticky left-[56px] bg-white group-hover:bg-slate-50 z-10 w-[220px] min-w-[220px] max-w-[220px] border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                      <div className="font-bold text-slate-900 truncate" title={item.hoTen}>
                        {item.hoTen}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      {formatYmdHmDisplay(item.ngaySinh).split(' ')[0]}
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {GIOI_TINH_MAP[String(item.gioiTinh)] || item.gioiTinh}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {item.maTheBhyt}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {item.maBenhChinh}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] whitespace-nowrap text-slate-700">
                      {formatYmdHmDisplay(item.ngayVao)}
                    </td>
                    <td className="py-3 px-3 text-[11px] whitespace-nowrap text-slate-500">
                      {item.ngayVaoNoiTru ? formatYmdHmDisplay(item.ngayVaoNoiTru) : '-'}
                    </td>
                    <td className="py-3 px-3 text-[11px] whitespace-nowrap text-slate-700">
                      {formatYmdHmDisplay(item.ngayRa)}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-800 whitespace-nowrap">
                      {item.soNgayDtri}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200" title={loaiKcbLabel}>
                        {loaiKcbLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatCurrencyVnd(item.tTongchiBv)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-blue-700">
                      {formatCurrencyVnd(item.tTongchiBh)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-emerald-700">
                      {formatCurrencyVnd(item.tBhtt)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-amber-700">
                      {formatCurrencyVnd(item.tBncct)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap text-slate-600">
                      {formatCurrencyVnd(item.tBntt)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap text-slate-500">
                      {formatCurrencyVnd(item.tNguonkhac || 0)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                      {item.maCskcb}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {item.thangQt}/{item.namQt}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 w-[110px] min-w-[110px] max-w-[110px] border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-center gap-1">
                        <IconButton
                          icon={<Eye size={14} />}
                          tooltip="Xem chi tiết 20 trường"
                          type="text"
                          className="!p-1.5 !text-slate-400 hover:!text-indigo-600 hover:!bg-indigo-50 !rounded cursor-pointer"
                          onClick={() => handleViewDetailRow(item)}
                        />
                        <IconButton
                          icon={<Edit2 size={13} />}
                          tooltip="Chỉnh sửa hồ sơ"
                          type="text"
                          className="!p-1.5 !text-slate-400 hover:!text-blue-600 hover:!bg-blue-50 !rounded cursor-pointer"
                          onClick={() => handleEditRow(item)}
                        />
                        <IconButton
                          icon={<Trash2 size={13} />}
                          tooltip="Xóa hồ sơ"
                          type="text"
                          danger
                          className="!p-1.5 !text-slate-400 hover:!text-rose-600 hover:!bg-rose-50 !rounded cursor-pointer"
                          onClick={() => handleDeleteRow(item)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
});

