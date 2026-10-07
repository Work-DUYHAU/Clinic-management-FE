import React, { useState } from 'react';
import { Cpu, Check } from 'lucide-react';
import type { DmThietBiItem } from '../../../../types';
import { LOAI_THAU_OPTIONS, HT_THAU_OPTIONS } from '../services/thietBiService';
import { DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';
import { useToast } from '../../../../context/ToastContext';
import { FormField } from '../../../common';

interface ThietBiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DmThietBiItem) => void;
  initialData: DmThietBiItem | null;
}

const getDefaultThietBiData = (): DmThietBiItem => ({
  stt: 1,
  maVatTu: '',
  nhomVatTu: '',
  tenVatTu: '',
  maHieu: '',
  soLuuHanh: '',
  tinhnangKt: '',
  quyCach: '',
  hangSx: '',
  nuocSx: '',
  donViTinh: 'Cái',
  donGia: 0,
  donGiaBh: 0,
  tyleTtBh: 100,
  soLuong: 1,
  dinhMuc: 1,
  nhaThau: '',
  ttThau: '',
  tuNgayHd: '',
  denNgayHd: '',
  maCskcb: DEFAULT_MA_CSKCB,
  loaiThau: 1,
  htThau: 1,
  maCskcbTbyt: '',
  tuNgay: getTodayYmd(),
  denNgay: ''
});

export const ThietBiEditModal: React.FC<ThietBiEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <ThietBiEditModalContent
      key={initialData?.id ?? 'new'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
};

interface ThietBiEditModalContentProps {
  onClose: () => void;
  onSave: (item: DmThietBiItem) => void;
  initialData: DmThietBiItem | null;
}

const ThietBiEditModalContent: React.FC<ThietBiEditModalContentProps> = ({
  onClose,
  onSave,
  initialData
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState<DmThietBiItem>(() => {
    if (initialData) return { ...initialData };
    return getDefaultThietBiData();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maVatTu.trim()) {
      toast.warning('Vui lòng nhập Mã vật tư / Thiết bị (MA_VAT_TU)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.tenVatTu.trim()) {
      toast.warning('Vui lòng nhập Tên vật tư / Thiết bị (TEN_VAT_TU)', 'Thiếu Dữ Liệu');
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
        className="bg-white rounded-md max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 text-[#1677ff]">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {initialData ? 'Chỉnh Sửa Vật Tư / Thiết Bị Y Tế' : 'Thêm Mới Vật Tư / Thiết Bị Y Tế'}
                </h3>
                <p className="text-xs text-slate-500">Quy định Mẫu 04/DM - Loại hồ sơ 72</p>
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

          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Group 1: Thông tin cơ bản */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Mã Vật Tư (MA_VAT_TU)"
                required
                placeholder="vd: VT.01.002"
                value={formData.maVatTu}
                onChange={(v) => setFormData({ ...formData, maVatTu: v.toUpperCase() })}
                mono
                bold
              />
              <FormField
                label="Tên Vật Tư (TEN_VAT_TU)"
                required
                placeholder="vd: Bơm tiêm vô trùng 5ml"
                value={formData.tenVatTu}
                onChange={(v) => setFormData({ ...formData, tenVatTu: v })}
                bold
                className="sm:col-span-2"
              />
              <FormField
                label="Nhóm Vật Tư"
                value={formData.nhomVatTu}
                onChange={(v) => setFormData({ ...formData, nhomVatTu: v })}
                mono
              />
              <FormField
                label="Mã Hiệu"
                value={formData.maHieu}
                onChange={(v) => setFormData({ ...formData, maHieu: v })}
                mono
              />
              <FormField
                label="Số Lưu Hành"
                value={formData.soLuuHanh}
                onChange={(v) => setFormData({ ...formData, soLuuHanh: v })}
                mono
              />
              <FormField
                label="Đơn Vị Tính"
                value={formData.donViTinh}
                onChange={(v) => setFormData({ ...formData, donViTinh: v })}
              />
              <FormField
                label="Hãng Sản Xuất"
                value={formData.hangSx}
                onChange={(v) => setFormData({ ...formData, hangSx: v })}
              />
              <FormField
                label="Nước Sản Xuất"
                value={formData.nuocSx}
                onChange={(v) => setFormData({ ...formData, nuocSx: v })}
              />
            </div>

            {/* Group 2: Đơn giá & Thầu */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Đơn Giá (VNĐ)"
                type="number"
                min={0}
                value={formData.donGia}
                onChange={(v) => setFormData({ ...formData, donGia: Number(v) })}
                mono
                bold
              />
              <FormField
                label="Đơn Giá BHYT"
                type="number"
                min={0}
                value={formData.donGiaBh}
                onChange={(v) => setFormData({ ...formData, donGiaBh: Number(v) })}
                mono
                bold
              />
              <FormField
                label="Tỷ Lệ TT BHYT (%)"
                type="number"
                min={0}
                max={100}
                value={formData.tyleTtBh}
                onChange={(v) => setFormData({ ...formData, tyleTtBh: Number(v) })}
                mono
              />
              <FormField
                label="Số Lượng"
                type="number"
                min={0}
                value={formData.soLuong}
                onChange={(e) => setFormData({ ...formData, soLuong: Number(e) })}
              />
              <FormField
                label="Loại Thầu"
                type="select"
                value={formData.loaiThau}
                onChange={(v) => setFormData({ ...formData, loaiThau: Number(v) })}
                options={LOAI_THAU_OPTIONS}
              />
              <FormField
                label="Hình Thức Thầu"
                type="select"
                value={formData.htThau}
                onChange={(v) => setFormData({ ...formData, htThau: Number(v) })}
                options={HT_THAU_OPTIONS}
              />
              <FormField
                label="Thông Tin Thầu"
                value={formData.ttThau}
                onChange={(v) => setFormData({ ...formData, ttThau: v })}
                mono
                className="sm:col-span-2"
              />
            </div>

            {/* Group 3: Thời hạn & CSKCB */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Mã CSKCB"
                required
                value={formData.maCskcb}
                onChange={(v) => setFormData({ ...formData, maCskcb: v })}
                mono
              />
              <FormField
                label="Từ Ngày (TU_NGAY) *"
                required
                maxLength={8}
                placeholder="YYYYMMDD"
                value={formData.tuNgay}
                onChange={(v) => setFormData({ ...formData, tuNgay: v })}
                mono
                bold
              />
              <FormField
                label="Đến Ngày (DEN_NGAY)"
                maxLength={8}
                placeholder="YYYYMMDD"
                value={formData.denNgay || ''}
                onChange={(v) => setFormData({ ...formData, denNgay: v })}
                mono
              />
            </div>
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
              <span>Lưu Thông Tin Thiết Bị</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
