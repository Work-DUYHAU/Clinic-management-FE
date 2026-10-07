import React from 'react';
import { User, Calendar, DollarSign, ShieldCheck, X } from 'lucide-react';
import type { Hs01TongHopItem } from '../services/hs01TongHopService';
import {
  LOAI_KCB_OPTIONS,
  GIOI_TINH_MAP,
} from '../services/hs01TongHopService';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';
import {
  formatCurrencyVnd,
  formatYmdHmDisplay,
} from '../../../../utils/shared/excelXmlShared';
import { InfoGrid } from '../../../common';

interface Hs01DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Hs01TongHopItem | null;
}

export const Hs01DetailModal: React.FC<Hs01DetailModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  useModalBehavior(isOpen && !!item, onClose);

  if (!isOpen || !item) return null;

  const loaiKcbObj = LOAI_KCB_OPTIONS.find((o) => o.code === item.maLoaiKcb);
  const loaiKcbName = loaiKcbObj ? loaiKcbObj.name : `Loại ${item.maLoaiKcb}`;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 ant-modal-anim"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-md max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-blue-100 text-[#1677ff]">
              <User size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  {item.hoTen}
                </h3>
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {GIOI_TINH_MAP[String(item.gioiTinh)] || item.gioiTinh}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Thẻ BHYT:{" "}
                <strong className="text-slate-900">{item.maTheBhyt}</strong> •
                STT: #{item.stt}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-sm hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Lỗi cảnh báo nếu có */}
          {item.errors && item.errors.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <span>⚠️ Cảnh Báo Đối Soát Dữ Liệu ({item.errors.length} lỗi):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                {item.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Thông tin KBCB */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={15} className="text-blue-600" />
              <span>1. Thông Tin Khám Chữa Bệnh (11 Trường)</span>
            </h4>
            <InfoGrid
              items={[
                { label: 'Ngày Sinh', value: formatYmdHmDisplay(item.ngaySinh).split(' ')[0], mono: true },
                { label: 'Mã Thẻ BHYT', value: item.maTheBhyt, mono: true, highlight: true },
                { label: 'Bệnh Chính ICD-10', value: item.maBenhChinh, mono: true, danger: true },
                { label: 'Hình Thức KCB', value: loaiKcbName },
                { label: 'Số Ngày Điều Trị', value: `${item.soNgayDtri} ngày`, bold: true },
                { label: 'Ngày Vào KCB', value: formatYmdHmDisplay(item.ngayVao), mono: true },
                { label: 'Vào Nội Trú', value: item.ngayVaoNoiTru ? formatYmdHmDisplay(item.ngayVaoNoiTru) : '—', mono: true },
                { label: 'Ngày Ra Viện', value: formatYmdHmDisplay(item.ngayRa), mono: true },
              ]}
              columns={4}
            />
          </div>

          {/* Section 2: Cơ cấu chi phí */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <DollarSign size={15} className="text-blue-600" />
              <span>2. Cơ Cấu Chi Phí Viện Phí KCB (6 Trường)</span>
            </h4>
            <InfoGrid
              items={[
                { label: 'Tổng Chi BV (T_TONGCHI_BV)', value: formatCurrencyVnd(item.tTongchiBv), bold: true },
                { label: 'Tổng Chi BH (T_TONGCHI_BH)', value: formatCurrencyVnd(item.tTongchiBh), highlight: true },
                { label: 'BHYT Thanh Toán (T_BHTT)', value: formatCurrencyVnd(item.tBhtt), success: true },
                { label: 'Cùng Chi Trả (T_BNCCT)', value: formatCurrencyVnd(item.tBncct), danger: true },
                { label: 'BN Tự Trả (T_BNTT)', value: formatCurrencyVnd(item.tBntt) },
                { label: 'Nguồn Khác (T_NGUONKHAC)', value: formatCurrencyVnd(item.tNguonkhac || 0) },
              ]}
              columns={3}
            />
          </div>

          {/* Section 3: Cơ sở KCB & Kỳ quyết toán */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={15} className="text-blue-600" />
              <span>3. Thông Tin Cơ Sở KCB &amp; Kỳ Quyết Toán</span>
            </h4>
            <InfoGrid
              items={[
                { label: 'Mã CSKCB', value: item.maCskcb, mono: true, bold: true },
                { label: 'Năm Quyết Toán', value: item.namQt, mono: true },
                { label: 'Tháng Quyết Toán', value: `Tháng ${item.thangQt}`, mono: true, highlight: true },
              ]}
              columns={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-sm font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
