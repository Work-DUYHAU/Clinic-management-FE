import React, { useState } from 'react';
import { Stethoscope, Check } from 'lucide-react';
import type { DmDichVuItem } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { ThuocPxListEditor } from './ThuocPxListEditor';
import { DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';
import { FormField } from '../../../common';

interface DichVuEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DmDichVuItem) => void;
  initialData: DmDichVuItem | null;
}

const getDefaultDichVuData = (): DmDichVuItem => ({
  stt: 1,
  maDichVu: '',
  tenDichVu: '',
  tenDvktGia: '',
  donGia: 0,
  quyTrinh: '',
  soLuongCgkt: undefined,
  cskcbCgkt: '',
  cskcbCls: '',
  qdDvkt: '',
  qdPdGia: '',
  ghiChu: '',
  giaThanhToan: 0,
  tuNgay: getTodayYmd(),
  denNgay: '',
  maCskcb: DEFAULT_MA_CSKCB,
  dsThuocPx: []
});

export const DichVuEditModal: React.FC<DichVuEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <DichVuEditModalContent
      key={initialData?.id ?? 'new'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
};

interface DichVuEditModalContentProps {
  onClose: () => void;
  onSave: (item: DmDichVuItem) => void;
  initialData: DmDichVuItem | null;
}

const DichVuEditModalContent: React.FC<DichVuEditModalContentProps> = ({
  onClose,
  onSave,
  initialData
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState<DmDichVuItem>(() => {
    if (initialData) return { ...initialData };
    return getDefaultDichVuData();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maDichVu.trim()) {
      toast.warning('Vui lòng nhập Mã dịch vụ kỹ thuật (MA_DICH_VU)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.tenDichVu.trim()) {
      toast.warning('Vui lòng nhập Tên dịch vụ kỹ thuật (TEN_DICH_VU)', 'Thiếu Dữ Liệu');
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
        className="bg-white rounded-md max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 text-[#1677ff]">
                <Stethoscope size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {initialData ? 'Chỉnh Sửa Dịch Vụ Kỹ Thuật' : 'Thêm Mới Dịch Vụ Kỹ Thuật'}
                </h3>
                <p className="text-xs text-slate-500">Quy định Mẫu 05/DM - Loại hồ sơ 70/72</p>
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
            {/* Section 1: Thông tin DVKT & Giá */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Mã Dịch Vụ (MA_DICH_VU)"
                required
                placeholder="vd: DV01.001"
                value={formData.maDichVu}
                onChange={(v) => setFormData({ ...formData, maDichVu: v.toUpperCase() })}
                mono
                bold
              />
              <FormField
                label="Tên Dịch Vụ (TEN_DICH_VU)"
                required
                placeholder="vd: Khám bệnh chuyên khoa nội"
                value={formData.tenDichVu}
                onChange={(v) => setFormData({ ...formData, tenDichVu: v })}
                bold
                className="sm:col-span-2"
              />
              <FormField
                label="Tên DVKT Phê Duyệt Giá"
                placeholder="vd: Khám lâm sàng chung"
                value={formData.tenDvktGia}
                onChange={(v) => setFormData({ ...formData, tenDvktGia: v })}
                className="sm:col-span-2"
              />
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
                label="Giá Thanh Toán (VNĐ)"
                type="number"
                min={0}
                value={formData.giaThanhToan}
                onChange={(v) => setFormData({ ...formData, giaThanhToan: Number(v) })}
                mono
                bold
              />
              <FormField
                label="Quy Trình Kỹ Thuật"
                value={formData.quyTrinh}
                onChange={(v) => setFormData({ ...formData, quyTrinh: v })}
                mono
              />
              <FormField
                label="Quyết Định Phê Duyệt Giá"
                value={formData.qdPdGia}
                onChange={(v) => setFormData({ ...formData, qdPdGia: v })}
                mono
              />
            </div>

            {/* Section 2: Thời hạn & CSKCB */}
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
              <FormField
                label="Ghi Chú"
                value={formData.ghiChu}
                onChange={(v) => setFormData({ ...formData, ghiChu: v })}
                className="sm:col-span-3"
              />
            </div>

            {/* Section 3: Thuốc / PX đi kèm nếu có */}
            <div className="bg-slate-50/70 p-3.5 rounded-sm border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase block">
                Thuốc &amp; Phóng Xạ Đi Kèm Dịch Vụ (Nếu Có)
              </span>
              <ThuocPxListEditor
                items={formData.dsThuocPx || []}
                onChange={(ds) => setFormData({ ...formData, dsThuocPx: ds })}
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
              <span>Lưu Thông Tin Dịch Vụ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
