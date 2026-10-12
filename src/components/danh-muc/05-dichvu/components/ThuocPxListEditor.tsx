import React from 'react';
import { Atom, Plus, Trash2, Calculator, AlertCircle, Sparkles } from 'lucide-react';
import type { DmThuocPxItem } from '../../../../types';

interface ThuocPxListEditorProps {
  items: DmThuocPxItem[];
  onChange: (items: DmThuocPxItem[]) => void;
  serviceName?: string;
  serviceCode?: string;
}

/**
 * Tính tự động Thành Tiền Thuốc Phóng Xạ / Chất Đánh Dấu theo quy định BYT:
 * 1. Nếu có Chất đánh dấu (dmThucTeCdD > 0): (donGia * dmThucTeCdD) / (dmNsxCdD || 1)
 * 2. Nếu là Thuốc phóng xạ (lieuBqPx > 0): (donGia * lieuBqPx) / (tlThucTeBqPx || 1)
 * 3. Mặc định: donGia
 */
export function calculateThanhTienThuocPx(item: Partial<DmThuocPxItem>): number {
  const donGia = Number(item.donGiaThuoc) || 0;
  const dmThucTe = Number(item.dmThucTeCdD) || 0;
  const dmNsx = Number(item.dmNsxCdD) || 1;
  const lieuBq = Number(item.lieuBqPx) || 0;
  const tlThucTe = Number(item.tlThucTeBqPx) || 1;

  if (dmThucTe > 0) {
    return Math.round((donGia * dmThucTe) / (dmNsx > 0 ? dmNsx : 1));
  }
  if (lieuBq > 0) {
    return Math.round((donGia * lieuBq) / (tlThucTe > 0 ? tlThucTe : 1));
  }
  return donGia;
}

export const ThuocPxListEditor: React.FC<ThuocPxListEditorProps> = ({
  items,
  onChange,
  serviceName,
  serviceCode
}) => {
  const handleAddRow = () => {
    const newRow: DmThuocPxItem = {
      id: `px-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stt: items.length + 1,
      maThuoc: '',
      tenThuoc: '',
      soDangKy: '',
      donViTinh: 'Lọ',
      ttThau: '',
      donGiaThuoc: 0,
      dmNsxCdD: undefined,
      dmThucTeCdD: undefined,
      lieuBqPx: 1,
      tlThucTeBqPx: 1,
      thanhTienThuoc: 0
    };
    onChange([...items, newRow]);
  };

  const handleRemoveRow = (idx: number) => {
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, stt: i + 1 }));
    onChange(next);
  };

  const handleChangeRow = (idx: number, field: keyof DmThuocPxItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[idx], [field]: value };

    // Chỉ tự động tính toán lại thành tiền khi sửa các tham số đầu vào của công thức
    const calcFields: (keyof DmThuocPxItem)[] = [
      'donGiaThuoc',
      'lieuBqPx',
      'tlThucTeBqPx',
      'dmNsxCdD',
      'dmThucTeCdD'
    ];

    if (calcFields.includes(field)) {
      item.thanhTienThuoc = calculateThanhTienThuocPx(item);
    }

    updated[idx] = item;
    onChange(updated);
  };

  const totalCost = items.reduce((acc, cur) => acc + (cur.thanhTienThuoc || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header Info Box */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-md flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <AlertCircle size={17} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-950">
            <span>Quy định tính giá Thuốc phóng xạ / Chất đánh dấu (Mẫu 05/DM - Loại HS 12):</span>
            {serviceCode && (
              <span className="font-mono px-1.5 py-0.2 bg-amber-200/70 rounded-sm text-[11px]">
                [{serviceCode}] {serviceName}
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-amber-800 pt-0.5">
            <p>
              • <strong>Chất đánh dấu:</strong> <code className="bg-amber-100 px-1 py-0.5 rounded-sm font-mono font-bold">(Đơn giá × Định mức TT) ÷ Định mức NSX</code>
            </p>
            <p>
              • <strong>Thuốc phóng xạ:</strong> <code className="bg-amber-100 px-1 py-0.5 rounded-sm font-mono font-bold">(Đơn giá × Liều BQ) ÷ Tỷ lệ TT BQ</code>
            </p>
          </div>
        </div>
      </div>

      {/* Table of Drugs with Sticky Columns */}
      <div className="border border-slate-200 rounded-md overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto overflow-y-auto max-h-[420px] relative table-scrollbar">
          <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1450px]">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
              <tr>
                {/* 1. STT (Sticky Left 0) */}
                <th className="py-2.5 px-2 text-center w-[44px] min-w-[44px] max-w-[44px] sticky left-0 bg-slate-100 z-30">
                  STT
                </th>

                {/* 2. Tên Thuốc (Sticky Left 44px + Shadow border) */}
                <th className="py-2.5 px-2 w-[240px] min-w-[240px] max-w-[240px] sticky left-[44px] bg-slate-100 z-30 border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                  TÊN THUỐC / CHẤT ĐÁNH DẤU (*)
                </th>

                {/* 3. Mã Thuốc (Không sticky) */}
                <th className="py-2.5 px-2 min-w-[130px]">
                  MÃ THUỐC / PX (*)
                </th>

                <th className="py-2.5 px-2 min-w-[110px]">SỐ ĐK / GPNK</th>
                <th className="py-2.5 px-2 min-w-[80px]">ĐVT</th>
                <th className="py-2.5 px-2 min-w-[130px]">THÔNG TIN THẦU</th>
                <th className="py-2.5 px-2 min-w-[110px] text-right">ĐƠN GIÁ (VNĐ)</th>
                <th className="py-2.5 px-2 min-w-[90px] text-right" title="Định mức nhà sản xuất của chất đánh dấu">ĐM NSX</th>
                <th className="py-2.5 px-2 min-w-[90px] text-right" title="Định mức thực tế bình quân của chất đánh dấu">ĐM THỰC TẾ</th>
                <th className="py-2.5 px-2 min-w-[85px] text-right" title="Liều bình quân thuốc phóng xạ">LIỀU BQ</th>
                <th className="py-2.5 px-2 min-w-[85px] text-right" title="Tỷ lệ thực tế bình quân thuốc phóng xạ">TỶ LỆ TT</th>
                <th className="py-2.5 px-3 min-w-[130px] text-right bg-amber-50/70">THÀNH TIỀN (VNĐ)</th>

                {/* 4. Xóa (Sticky Right 0 + Shadow border) */}
                <th className="py-2.5 px-2 text-center w-[60px] min-w-[60px] sticky right-0 bg-slate-100 z-30 border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                  XÓA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400 bg-white">
                    <Atom size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-xs">Dịch vụ này chưa gán thuốc phóng xạ / chất đánh dấu nào</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Nhấp nút "Thêm Thuốc Phóng Xạ / Chất Đánh Dấu" bên dưới nếu dịch vụ có sử dụng</p>
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-amber-50/30 transition-colors group">
                    {/* 1. STT (Sticky Left 0) */}
                    <td className="py-2 px-2 text-center font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10 w-[44px] min-w-[44px] max-w-[44px]">
                      {idx + 1}
                    </td>

                    {/* 2. Tên thuốc (Sticky Left 44px + Shadow border) */}
                    <td className="py-1.5 px-1.5 sticky left-[44px] bg-white group-hover:bg-slate-50 z-10 w-[240px] min-w-[240px] max-w-[240px] border-r border-slate-200/80 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                      <input
                        type="text"
                        value={row.tenThuoc}
                        onChange={(e) => handleChangeRow(idx, 'tenThuoc', e.target.value)}
                        placeholder="Tên thuốc / PX (*)..."
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </td>

                    {/* 3. Mã thuốc (Không sticky) */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="text"
                        value={row.maThuoc}
                        onChange={(e) => handleChangeRow(idx, 'maThuoc', e.target.value)}
                        placeholder="Mã thuốc (*)..."
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-amber-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </td>

                    {/* Số đăng ký */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="text"
                        value={row.soDangKy || ''}
                        onChange={(e) => handleChangeRow(idx, 'soDangKy', e.target.value)}
                        placeholder="Số ĐK/GPNK"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* ĐVT */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="text"
                        value={row.donViTinh || ''}
                        onChange={(e) => handleChangeRow(idx, 'donViTinh', e.target.value)}
                        placeholder="Lọ/Liều"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* TT Thầu */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="text"
                        value={row.ttThau || ''}
                        onChange={(e) => handleChangeRow(idx, 'ttThau', e.target.value)}
                        placeholder="Gói/Nhóm thầu"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* Đơn giá */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="number"
                        value={row.donGiaThuoc || ''}
                        onChange={(e) => handleChangeRow(idx, 'donGiaThuoc', Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* ĐM NSX Chất đánh dấu */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="number"
                        step="any"
                        value={row.dmNsxCdD !== undefined ? row.dmNsxCdD : ''}
                        onChange={(e) => handleChangeRow(idx, 'dmNsxCdD', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="ĐM NSX"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* ĐM Thực tế Chất đánh dấu */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="number"
                        step="any"
                        value={row.dmThucTeCdD !== undefined ? row.dmThucTeCdD : ''}
                        onChange={(e) => handleChangeRow(idx, 'dmThucTeCdD', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="ĐM TT"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* Liều BQ PX */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="number"
                        step="any"
                        value={row.lieuBqPx !== undefined ? row.lieuBqPx : ''}
                        onChange={(e) => handleChangeRow(idx, 'lieuBqPx', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="Liều"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* Tỷ lệ TT BQ PX */}
                    <td className="py-1.5 px-1.5">
                      <input
                        type="number"
                        step="any"
                        value={row.tlThucTeBqPx !== undefined ? row.tlThucTeBqPx : ''}
                        onChange={(e) => handleChangeRow(idx, 'tlThucTeBqPx', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="Tỷ lệ"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right focus:border-amber-500 outline-none"
                      />
                    </td>

                    {/* Thành tiền (Read-only tự động tính theo công thức) */}
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/70">
                      <div className="flex items-center justify-end gap-1">
                        <Sparkles size={11} className="text-amber-500" />
                        <span>{row.thanhTienThuoc?.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </td>

                    {/* 4. Thao tác xóa (Sticky Right 0 + Shadow border) */}
                    <td className="py-1.5 px-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 w-[60px] min-w-[60px] border-l border-slate-200/80 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa dòng thuốc"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={handleAddRow}
          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus size={15} />
          <span>Thêm Thuốc Phóng Xạ / Chất Đánh Dấu</span>
        </button>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <Calculator size={16} className="text-amber-600" />
          <span className="text-xs text-slate-600">Tổng tiền thuốc PX kèm DVKT:</span>
          <span className="font-mono font-bold text-sm text-amber-700">
            {totalCost.toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
      </div>
    </div>
  );
};
