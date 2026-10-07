import React, { useState } from 'react';
import { Building2, Check } from 'lucide-react';
import type { DmBpcmItem } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';
import { FormField } from '../../../common';

interface BpcmEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DmBpcmItem) => void;
  initialData: DmBpcmItem | null;
}

const getDefaultBpcmData = (): DmBpcmItem => ({
  stt: 1,
  maKhoa: '',
  tenKhoa: '',
  banKham: 1,
  giuongPd: 0,
  giuongTk: 0,
  giuongHstc: 0,
  giuongHscc: 0,
  tuNgay: getTodayYmd(),
  denNgay: '',
  maCskcb: DEFAULT_MA_CSKCB
});

export const BpcmEditModal: React.FC<BpcmEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <BpcmEditModalContent
      key={initialData?.id ?? 'new'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
};

interface BpcmEditModalContentProps {
  onClose: () => void;
  onSave: (item: DmBpcmItem) => void;
  initialData: DmBpcmItem | null;
}

const BpcmEditModalContent: React.FC<BpcmEditModalContentProps> = ({
  onClose,
  onSave,
  initialData
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState<DmBpcmItem>(() => {
    if (initialData) return { ...initialData };
    return getDefaultBpcmData();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maKhoa.trim()) {
      toast.warning('Vui lòng nhập Mã khoa / Bàn khám (MA_KHOA)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.tenKhoa.trim()) {
      toast.warning('Vui lòng nhập Tên khoa / Bàn khám (TEN_KHOA)', 'Thiếu Dữ Liệu');
      return;
    }
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 ant-modal-anim"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-md max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 text-[#1677ff]">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {initialData ? 'Chỉnh Sửa Bộ Phận Chuyên Môn' : 'Thêm Mới Bộ Phận Chuyên Môn'}
                </h3>
                <p className="text-xs text-slate-500">Quy định Mẫu 01/DM - Loại hồ sơ 70</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-sm hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center font-bold text-lg cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <FormField
              label="Mã Khoa (MA_KHOA)"
              required
              placeholder="vd: K01, K0809"
              value={formData.maKhoa}
              onChange={(v) => setFormData({ ...formData, maKhoa: v.toUpperCase() })}
              mono
              bold
            />
            <FormField
              label="Mã CSKCB (MA_CSKCB)"
              required
              value={formData.maCskcb}
              onChange={(v) => setFormData({ ...formData, maCskcb: v })}
              mono
              bold
            />
            <FormField
              label="Tên Khoa / Bàn Khám (TEN_KHOA)"
              required
              placeholder="vd: Khoa Khám Bệnh Đa Khoa"
              value={formData.tenKhoa}
              onChange={(v) => setFormData({ ...formData, tenKhoa: v })}
              bold
              className="md:col-span-2"
            />
            <FormField
              label="Số Bàn Khám (BAN_KHAM)"
              type="number"
              min={0}
              value={formData.banKham}
              onChange={(v) => setFormData({ ...formData, banKham: Number(v) })}
            />
            <FormField
              label="Giường Phê Duyệt (GIUONG_PD)"
              type="number"
              min={0}
              value={formData.giuongPd}
              onChange={(v) => setFormData({ ...formData, giuongPd: Number(v) })}
            />
            <FormField
              label="Giường Thực Kê (GIUONG_TK)"
              type="number"
              min={0}
              value={formData.giuongTk}
              onChange={(v) => setFormData({ ...formData, giuongTk: Number(v) })}
            />
            <FormField
              label="Giường HSTC (GIUONG_HSTC)"
              type="number"
              min={0}
              value={formData.giuongHstc}
              onChange={(v) => setFormData({ ...formData, giuongHstc: Number(v) })}
            />
            <FormField
              label="Giường HSCC (GIUONG_HSCC)"
              type="number"
              min={0}
              value={formData.giuongHscc}
              onChange={(v) => setFormData({ ...formData, giuongHscc: Number(v) })}
            />
            <FormField
              label="Từ Ngày (TU_NGAY - YYYYMMDD)"
              required
              maxLength={8}
              placeholder="YYYYMMDD"
              value={formData.tuNgay}
              onChange={(v) => setFormData({ ...formData, tuNgay: v })}
              mono
              bold
            />
            <FormField
              label="Đến Ngày (DEN_NGAY - Tùy chọn)"
              maxLength={8}
              placeholder="Để trống nếu đang áp dụng"
              value={formData.denNgay || ''}
              onChange={(v) => setFormData({ ...formData, denNgay: v })}
              mono
              className="md:col-span-2"
            />
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-sm text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#1677ff] hover:bg-blue-600 text-white rounded-sm text-xs font-bold shadow-sm cursor-pointer"
            >
              <Check size={14} />
              <span>Lưu Thông Tin BPCM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
