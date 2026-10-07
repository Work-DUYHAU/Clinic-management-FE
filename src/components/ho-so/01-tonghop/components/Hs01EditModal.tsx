import React, { useState, useEffect } from 'react';
import { User, FileText, DollarSign, Calendar, X, Check } from 'lucide-react';
import type { Hs01TongHopItem } from '../services/hs01TongHopService';
import { LOAI_KCB_OPTIONS } from '../services/hs01TongHopService';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';
import { validateHs01Data } from '../../../../utils/validators';
import { DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { useToast } from '../../../../context/ToastContext';
import { FormField } from '../../../common';

interface Hs01EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Hs01TongHopItem) => void;
  initialData: Hs01TongHopItem | null;
  totalItemsCount?: number;
}

const getDefaultData = (count = 0): Hs01TongHopItem => {
  const ymd = getTodayYmd();
  return {
    id: '',
    stt: count + 1,
    hoTen: '',
    ngaySinh: '',
    gioiTinh: '1',
    maTheBhyt: '',
    maBenhChinh: '',
    ngayVao: `${ymd}0800`,
    ngayVaoNoiTru: '',
    ngayRa: `${ymd}1100`,
    soNgayDtri: 1,
    maLoaiKcb: '01',
    tTongchiBv: 0,
    tTongchiBh: 0,
    tBhtt: 0,
    tBncct: 0,
    tBntt: 0,
    tNguonkhac: 0,
    maCskcb: DEFAULT_MA_CSKCB,
    namQt: Number(ymd.slice(0, 4)),
    thangQt: ymd.slice(4, 6),
    trangThai: 'hop_le',
    isValid: true,
    errors: []
  };
};

export const Hs01EditModal: React.FC<Hs01EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  totalItemsCount = 0
}) => {
  const toast = useToast();
  useModalBehavior(isOpen, onClose);

  const [form, setForm] = useState<Hs01TongHopItem>(() => getDefaultData(totalItemsCount));

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...initialData } : getDefaultData(totalItemsCount));
    }
  }, [isOpen, initialData, totalItemsCount]);

  if (!isOpen) return null;

  const updateCost = (field: keyof Hs01TongHopItem, val: number) => {
    const updated = { ...form, [field]: val };
    if (field === 'tTongchiBh') {
      updated.tBhtt = Math.round(val * 0.8);
      updated.tBncct = Math.max(0, val - updated.tBhtt);
      updated.tTongchiBv = updated.tTongchiBh + (updated.tBntt || 0) + (updated.tNguonkhac || 0);
    } else if (field === 'tBhtt') {
      updated.tBncct = Math.max(0, (updated.tTongchiBh || 0) - val);
    } else if (field === 'tBntt' || field === 'tNguonkhac') {
      updated.tTongchiBv = (updated.tTongchiBh || 0) + (updated.tBntt || 0) + (updated.tNguonkhac || 0);
    }
    setForm(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateHs01Data(form);
    if (errors.length > 0) return toast.warning(errors[0], 'Dữ Liệu Chưa Hợp Lệ');

    onSave({
      ...form,
      hoTen: form.hoTen.trim(),
      maTheBhyt: form.maTheBhyt.trim().toUpperCase(),
      isValid: true,
      errors: []
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 ant-modal-anim" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-md max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 text-[#1677ff]">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{initialData ? 'Chỉnh Sửa Hồ Sơ Tổng Hợp (Mẫu 01/BH)' : 'Thêm Mới Hồ Sơ Tổng Hợp (Mẫu 01/BH - Loại 5)'}</h3>
              <p className="text-[11px] text-slate-500">20 trường thông tin chuẩn Cổng giám định BHYT (XML &lt;HSTH01BH&gt;)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-sm hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center font-bold cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Section 1: Thông tin người bệnh */}
          <div>
            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={13} /> <span>1. Thông Tin Người Bệnh &amp; Thẻ BHYT</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50/60 p-3 rounded-sm border border-slate-200/80">
              <FormField label="Họ và tên người bệnh" required placeholder="NGUYỄN VĂN A" value={form.hoTen} onChange={(v) => setForm({ ...form, hoTen: v.toUpperCase() })} bold className="lg:col-span-2" />
              <FormField label="Mã thẻ BHYT" required maxLength={15} placeholder="DN4791234567890" value={form.maTheBhyt} onChange={(v) => setForm({ ...form, maTheBhyt: v.toUpperCase() })} mono bold />
              <FormField label="Giới tính" type="select" required value={form.gioiTinh} onChange={(v) => setForm({ ...form, gioiTinh: v })} options={[{ value: '1', label: '1 - Nam' }, { value: '2', label: '2 - Nữ' }, { value: '3', label: '3 - Khác' }]} />
              <FormField label="Ngày sinh (12 số)" required maxLength={12} placeholder="YYYYMMDDHHmm" value={form.ngaySinh} onChange={(v) => setForm({ ...form, ngaySinh: v })} mono />
              <FormField label="STT gửi" type="number" min={1} required value={form.stt} onChange={(v) => setForm({ ...form, stt: Number(v) })} bold />
              <FormField label="Mã CSKCB" required maxLength={5} value={form.maCskcb} onChange={(v) => setForm({ ...form, maCskcb: v })} mono bold />
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Kỳ Quyết Toán *</label>
                <div className="flex items-center gap-1">
                  <input type="text" required maxLength={2} placeholder="MM" value={form.thangQt} onChange={(e) => setForm({ ...form, thangQt: e.target.value })} className="w-12 px-1.5 py-1.5 bg-white border border-slate-200 rounded-sm text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-600" />
                  <span>/</span>
                  <input type="number" required placeholder="YYYY" value={form.namQt} onChange={(e) => setForm({ ...form, namQt: Number(e.target.value) })} className="w-16 px-1.5 py-1.5 bg-white border border-slate-200 rounded-sm text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin KCB */}
          <div>
            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={13} /> <span>2. Thông Tin Khám Chữa Bệnh &amp; Thời Gian</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50/60 p-3 rounded-sm border border-slate-200/80">
              <FormField label="Mã Bệnh ICD-10" required maxLength={7} placeholder="I10" value={form.maBenhChinh} onChange={(v) => setForm({ ...form, maBenhChinh: v.toUpperCase() })} mono bold />
              <FormField label="Hình thức KCB" type="select" required value={form.maLoaiKcb} onChange={(v) => setForm({ ...form, maLoaiKcb: v })} options={LOAI_KCB_OPTIONS.map((o) => ({ value: o.code, label: `[${o.code}] ${o.name}` }))} />
              <FormField label="Thời điểm vào KCB" required maxLength={12} placeholder="YYYYMMDDHHmm" value={form.ngayVao} onChange={(v) => setForm({ ...form, ngayVao: v })} mono />
              <FormField label="Vào nội trú (nếu có)" maxLength={12} placeholder="YYYYMMDDHHmm" value={form.ngayVaoNoiTru || ''} onChange={(v) => setForm({ ...form, ngayVaoNoiTru: v })} mono />
              <FormField label="Thời điểm ra viện" required maxLength={12} placeholder="YYYYMMDDHHmm" value={form.ngayRa} onChange={(v) => setForm({ ...form, ngayRa: v })} mono />
              <FormField label="Số ngày điều trị" type="number" min={1} required value={form.soNgayDtri} onChange={(v) => setForm({ ...form, soNgayDtri: Number(v) })} bold />
            </div>
          </div>

          {/* Section 3: Cơ cấu chi phí */}
          <div>
            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign size={13} /> <span>3. Cơ Cấu Chi Phí KBCB &amp; Đề Nghị Thanh Toán</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-slate-50/60 p-3 rounded-sm border border-slate-200/80">
              <FormField label="Tổng chi BV (T_TONGCHI_BV)" type="number" min={0} step="0.01" required value={form.tTongchiBv} onChange={(v) => updateCost('tTongchiBv', Number(v))} mono bold />
              <FormField label="Tổng chi BH (T_TONGCHI_BH)" type="number" min={0} step="0.01" required value={form.tTongchiBh} onChange={(v) => updateCost('tTongchiBh', Number(v))} mono bold />
              <FormField label="BHYT Thanh Toán (T_BHTT)" type="number" min={0} step="0.01" required value={form.tBhtt} onChange={(v) => updateCost('tBhtt', Number(v))} mono bold />
              <FormField label="Cùng Chi Trả (T_BNCCT)" type="number" min={0} step="0.01" required value={form.tBncct} onChange={(v) => setForm({ ...form, tBncct: Number(v) })} mono />
              <FormField label="BN Tự Trả Ngoài BH (T_BNTT)" type="number" min={0} step="0.01" value={form.tBntt} onChange={(v) => updateCost('tBntt', Number(v))} mono />
              <FormField label="Nguồn Khác Chi Trả (T_NGUONKHAC)" type="number" min={0} step="0.01" value={form.tNguonkhac || 0} onChange={(v) => updateCost('tNguonkhac', Number(v))} mono />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-sm font-bold text-xs cursor-pointer">Hủy Bỏ</button>
            <button type="submit" className="px-5 py-2 bg-[#1677ff] hover:bg-blue-600 text-white rounded-sm font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer">
              <Check size={14} /> <span>{initialData ? 'Cập Nhật Hồ Sơ 01/BH' : 'Lưu Hồ Sơ Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
