import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  User,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  Layers,
  ArrowRight,
} from "lucide-react";
import type {
  HoSoDieuChinh09Item,
  ChiPhiDieuChinhItem,
  TtXml1DieuChinhItem,
} from "../../../../types/hs09DieuChinhTypes";
import {
  SO_BANG_XML_MAP,
  NHOM_LOI_XUAT_TOAN_MAP,
} from "../../../../utils/constants/hs09DieuChinhConstants";
import { formatCurrencyVnd } from "../../../../utils/shared/excelXmlShared";
import { Pagination } from "../../../common";

interface Hs09TableProps {
  items: HoSoDieuChinh09Item[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterNhomLoi: string;
  onFilterNhomLoiChange: (val: string) => void;
  filterSoBangXml: string;
  onFilterSoBangXmlChange: (val: string) => void;
  filterTrangThai: string;
  onFilterTrangThaiChange: (val: string) => void;
  onAddNew: () => void;
  onEdit: (item: HoSoDieuChinh09Item) => void;
  onDelete: (item: HoSoDieuChinh09Item) => void;
  onViewDetail: (item: HoSoDieuChinh09Item) => void;
}

export const Hs09Table: React.FC<Hs09TableProps> = ({
  items,
  searchTerm,
  onSearchChange,
  filterNhomLoi,
  onFilterNhomLoiChange,
  filterSoBangXml,
  onFilterSoBangXmlChange,
  filterTrangThai,
  onFilterTrangThaiChange,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>(
    {},
  );

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const paginatedItems = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (validCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Search & Filter Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-56 md:w-64 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm mã LK, họ tên, mã thẻ, BN..."
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
            />
          </div>

          {/* Filter Bảng XML */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-sm px-2.5 py-1.5 focus-within:border-amber-500 transition-all">
            <Layers size={13} className="text-slate-400 shrink-0" />
            <select
              value={filterSoBangXml}
              onChange={(e) => {
                onFilterSoBangXmlChange(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">Tất cả bảng XML</option>
              <option value="xml1">XML1 (Hành chính)</option>
              <option value="2">XML2 (Thuốc / Hóa chất)</option>
              <option value="3">XML3 (DVKT / VTYT)</option>
              <option value="4">XML4 (Kết quả CLS)</option>
              <option value="5">XML5 (Diễn biến LS)</option>
            </select>
          </div>

          {/* Filter Nhóm Lỗi Xuất Toán */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-sm px-2.5 py-1.5 focus-within:border-amber-500 transition-all">
            <Filter size={13} className="text-slate-400 shrink-0" />
            <select
              value={filterNhomLoi}
              onChange={(e) => {
                onFilterNhomLoiChange(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer max-w-[145px] truncate"
            >
              <option value="all">Tất cả nhóm lỗi</option>
              {Object.entries(NHOM_LOI_XUAT_TOAN_MAP).map(([code, label]) => (
                <option key={code} value={code}>
                  {code} - {String(label)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Trạng thái */}
          <div className="flex items-center bg-white border border-slate-200 rounded-sm px-2.5 py-1.5 focus-within:border-amber-500 transition-all">
            <select
              value={filterTrangThai}
              onChange={(e) => {
                onFilterTrangThaiChange(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="cho_xu_ly">Chờ xử lý</option>
              <option value="da_lap_bieu">Đã lập biểu mẫu 09</option>
              <option value="da_gui_cong">Đã gửi cổng BHXH</option>
              <option value="chap_nhan">Chấp nhận lại</option>
              <option value="tu_choi">Từ chối</option>
            </select>
          </div>

          {/* Nút xóa lọc nhanh */}
          {(searchTerm || filterSoBangXml !== "all" || filterNhomLoi !== "all" || filterTrangThai !== "all") && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onFilterSoBangXmlChange("all");
                onFilterNhomLoiChange("all");
                onFilterTrangThaiChange("all");
                setCurrentPage(1);
              }}
              className="text-xs text-slate-400 hover:text-rose-600 font-bold px-2 py-1 cursor-pointer transition-colors whitespace-nowrap"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Action Button: Thêm mới */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-sm text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Thêm Hồ Sơ 09</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3">Mã LK / Kỳ QT</th>
              <th className="py-3 px-4">Bệnh Nhân &amp; Thẻ BHYT</th>
              <th className="py-3 px-4">Khoa &amp; Nhóm Lỗi</th>
              <th className="py-3 px-4">Mục Điều Chỉnh</th>
              <th className="py-3 px-4 text-right">Xuất Toán / Đề Nghị</th>
              <th className="py-3 px-3 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCheck2 size={36} className="text-slate-300" />
                    <span className="font-semibold text-sm text-slate-500">
                      Không tìm thấy hồ sơ điều chỉnh nào
                    </span>
                    <span className="text-xs text-slate-400">
                      Hãy nạp file Excel Mẫu 09/BH hoặc bấm nút &quot;Thêm Hồ Sơ
                      09&quot;
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isExpanded = !!expandedRowIds[item.id];
                const totalCpCount = item.dsChiPhiDieuChinh.length;
                const totalXml1Count = item.dsXml1DieuChinh?.length || 0;

                return (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-indigo-50/30 transition-colors">
                      {/* Expand / Index */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleRowExpand(item.id)}
                          className="p-1 hover:bg-slate-200/60 rounded text-slate-500 transition-colors"
                          title="Xem chi tiết các dòng điều chỉnh"
                        >
                          {isExpanded ? (
                            <ChevronDown
                              size={14}
                              className="text-indigo-600"
                            />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </button>
                      </td>

                      {/* Mã LK & Kỳ QT */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900 text-[13px]">
                          {item.ttXml1.maLk}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>Mã BN: {item.ttXml1.maBn}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">
                            Kỳ: {item.ttXml1.kyQt}
                          </span>
                        </div>
                      </td>

                      {/* Bệnh Nhân & Thẻ BHYT */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0">
                            <User size={13} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {item.ttXml1.hoTen}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {item.ttXml1.maThe}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Khoa & Nhóm Lỗi */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {item.khoaDieuTri || "—"}
                        </div>
                        {item.nhomLoi && (
                          <div className="mt-0.5">
                            <span className="inline-block font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                              {item.nhomLoi}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Nội Dung Điều Chỉnh Tóm Tắt */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {totalXml1Count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold">
                              XML1: {totalXml1Count} mục HC
                            </span>
                          )}
                          {totalCpCount > 0 ? (
                            item.dsChiPhiDieuChinh
                              .slice(0, 2)
                              .map((cp: ChiPhiDieuChinhItem, cIdx: number) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md text-[10px] font-medium"
                                >
                                  <span className="font-bold">
                                    {SO_BANG_XML_MAP[cp.soBangXml] ||
                                      `XML${cp.soBangXml}`}
                                    :
                                  </span>
                                  <span
                                    className="max-w-[120px] truncate"
                                    title={
                                      cp.truongTtDieuChinh || String(cp.idCp)
                                    }
                                  >
                                    {cp.truongTtDieuChinh || `ID:${cp.idCp}`}
                                  </span>
                                </span>
                              ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              Không có CP
                            </span>
                          )}
                          {totalCpCount > 2 && (
                            <span className="text-[10px] text-slate-500 font-semibold">
                              +{totalCpCount - 2} mục
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tiền Xuất Toán / Đề Nghị */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-rose-700 text-xs">
                          - {formatCurrencyVnd(item.tienXuatToan || 0)}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                          + Đề nghị:{" "}
                          {formatCurrencyVnd(item.tienDeNghiThanhToanLai || 0)}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center">
                        {item.trangThai === "da_gui_cong" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-[10px]">
                            <FileCheck2 size={11} /> Đã gửi cổng
                          </span>
                        ) : item.trangThai === "chap_nhan" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-[10px]">
                            Chấp nhận
                          </span>
                        ) : item.trangThai === "tu_choi" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full font-bold text-[10px]">
                            <AlertCircle size={11} /> Từ chối
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-bold text-[10px]">
                            {item.trangThai === "da_lap_bieu"
                              ? "Đã lập biểu"
                              : "Chờ xử lý"}
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Xem chi tiết hồ sơ điều chỉnh"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa hồ sơ"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa hồ sơ"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-row: Chi tiết mở rộng khi bấm Chevron */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70">
                        <td
                          colSpan={8}
                          className="p-4 border-y border-slate-200"
                        >
                          <div className="space-y-4 pl-6 pr-2">
                            {/* 1. Danh sách thay đổi hành chính XML1 */}
                            {item.dsXml1DieuChinh &&
                              item.dsXml1DieuChinh.length > 0 && (
                                <div className="bg-white rounded-xl border border-blue-200 p-3 shadow-2xs">
                                  <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <span>
                                      Điều chỉnh thông tin hành chính
                                      (DS_XML1_DIEUCHINH):
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {item.dsXml1DieuChinh.map(
                                      (
                                        x1: TtXml1DieuChinhItem,
                                        xIdx: number,
                                      ) => (
                                        <div
                                          key={xIdx}
                                          className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 text-xs flex items-center justify-between"
                                        >
                                          <div>
                                            <span className="font-bold text-blue-900">
                                              {x1.truongTtDieuChinh ||
                                                x1.truongTtGoc}
                                              :
                                            </span>{" "}
                                            <span className="line-through text-rose-600 font-mono">
                                              {x1.ttGoc}
                                            </span>{" "}
                                            <ArrowRight
                                              size={12}
                                              className="inline text-slate-400 mx-1"
                                            />
                                            <span className="font-bold text-emerald-700 font-mono">
                                              {x1.ttDieuChinh}
                                            </span>
                                          </div>
                                          {x1.lyDoDieuChinh && (
                                            <span className="text-[10px] text-slate-500 italic">
                                              Lý do: {x1.lyDoDieuChinh}
                                            </span>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* 2. Danh sách chi phí điều chỉnh */}
                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
                              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center justify-between">
                                <span>
                                  Danh sách chi phí điều chỉnh (DSCP_DIEUCHINH):
                                </span>
                                <span className="text-emerald-700 font-black">
                                  Đề nghị thanh toán:{" "}
                                  {formatCurrencyVnd(
                                    item.tienDeNghiThanhToanLai || 0,
                                  )}
                                </span>
                              </div>
                              {item.dsChiPhiDieuChinh.length === 0 ? (
                                <div className="text-slate-400 italic text-center py-2">
                                  Không có khoản mục chi phí nào được điều chỉnh
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                                      <tr>
                                        <th className="py-2 px-2.5">
                                          Bảng XML
                                        </th>
                                        <th className="py-2 px-2.5">
                                          ID Chi Phí
                                        </th>
                                        <th className="py-2 px-3">
                                          Trường Sai Gốc
                                        </th>
                                        <th className="py-2 px-2 text-right">
                                          Giá Trị Cũ
                                        </th>
                                        <th className="py-2 px-2.5">
                                          Trường Điều Chỉnh
                                        </th>
                                        <th className="py-2 px-2.5">
                                          Giá Trị Mới
                                        </th>
                                        <th className="py-2 px-3">
                                          Lý Do Điều Chỉnh
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                      {item.dsChiPhiDieuChinh.map(
                                        (
                                          cp: ChiPhiDieuChinhItem,
                                          cIdx: number,
                                        ) => (
                                          <tr
                                            key={cIdx}
                                            className="hover:bg-slate-50"
                                          >
                                            <td className="py-1.5 px-2.5">
                                              <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                                                {SO_BANG_XML_MAP[
                                                  cp.soBangXml
                                                ] || `XML${cp.soBangXml}`}
                                              </span>
                                            </td>
                                            <td className="py-1.5 px-2.5 font-mono text-slate-700 font-semibold">
                                              {cp.idCp}
                                            </td>
                                            <td className="py-1.5 px-3 font-mono text-rose-700 font-medium">
                                              {cp.truongTtGoc || "—"}
                                            </td>
                                            <td className="py-1.5 px-2 text-right font-mono line-through text-rose-600">
                                              {cp.ttGoc || "—"}
                                            </td>
                                            <td className="py-1.5 px-2.5 font-mono text-emerald-700 font-bold">
                                              {cp.truongTtDieuChinh || "—"}
                                            </td>
                                            <td className="py-1.5 px-2.5 font-mono text-emerald-700 font-bold">
                                              {cp.ttDieuChinh || "—"}
                                            </td>
                                            <td className="py-1.5 px-3">
                                              <div className="flex items-center gap-1.5">
                                                {cp.tuChoi && (
                                                  <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                                                    {cp.tuChoi}
                                                  </span>
                                                )}
                                                <span
                                                  className="text-slate-600 text-[11px] truncate max-w-[180px]"
                                                  title={cp.lyDoDieuChinh}
                                                >
                                                  {cp.lyDoDieuChinh || "—"}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
        itemLabel="hồ sơ điều chỉnh"
        themeColor="indigo"
      />
    </div>
  );
};
