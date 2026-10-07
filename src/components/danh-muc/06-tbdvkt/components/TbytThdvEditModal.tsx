import React, { useState } from 'react';
import { Cpu, Check } from 'lucide-react';
import type { DmTbytThdvItem } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';
import { isValidYmdDate, DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { FormField } from '../../../common';

interface TbytThdvEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DmTbytThdvItem) => void;
  initialData: DmTbytThdvItem | null;
}

const getDefaultTbytThdvData = (): DmTbytThdvItem => ({
  stt: 1,
  tenTb: '',
  kyHieu: '',
  congTySx: '',
  nuocSx: '',
  namSx: undefined,
  namSd: undefined,
  maMay: '',
  soLuuHanh: '',
  hdTu: '',
  hdDen: '',
  tuNgay: getTodayYmd(),
  denNgay: '',
  maCskcb: DEFAULT_MA_CSKCB
});

export const TbytThdvEditModal: React.FC<TbytThdvEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <TbytThdvEditModalContent
      key={initialData?.id ?? 'new'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
};

interface TbytThdvEditModalContentProps {
  onClose: () => void;
  onSave: (item: DmTbytThdvItem) => void;
  initialData: DmTbytThdvItem | null;
}

const TbytThdvEditModalContent: React.FC<TbytThdvEditModalContentProps> = ({
  onClose,
  onSave,
  initialData
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState<DmTbytThdvItem>(() => {
    if (initialData) return { ...initialData };
    return getDefaultTbytThdvData();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenTb.trim()) {
      toast.warning('Vui lòng nhập Tên thiết bị y tế (TEN_TB)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.maMay.trim()) {
      toast.warning('Vui lòng nhập Mã máy / Mã thiết bị (MA_MAY)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.tuNgay.trim() || !isValidYmdDate(formData.tuNgay)) {
      toast.warning('Vui lòng nhập Từ ngày đúng định dạng YYYYMMDD (TU_NGAY)', 'Sai Định Dạng');
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
                  {initialData ? 'Chỉnh Sửa Thiết Bị Thực Hiện DVKT' : 'Thêm Mới Thiết Bị Thực Hiện DVKT'}
                </h3>
                <p className="text-xs text-slate-500">Quy định Mẫu 06/DM - Loại hồ sơ 70/72</p>
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
            {/* Group 1: Thiết bị */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Mã Máy / TB (MA_MAY)"
                required
                placeholder="vd: MM01.002"
                value={formData.maMay}
                onChange={(v) => setFormData({ ...formData, maMay: v.toUpperCase() })}
                mono
                bold
              />
              <FormField
                label="Tên Thiết Bị (TEN_TB)"
                required
                placeholder="vd: Máy siêu âm màu 4D"
                value={formData.tenTb}
                onChange={(v) => setFormData({ ...formData, tenTb: v })}
                bold
                className="sm:col-span-2"
              />
              <FormField
                label="Ký Hiệu / Model"
                value={formData.kyHieu}
                onChange={(v) => setFormData({ ...formData, kyHieu: v })}
                mono
              />
              <FormField
                label="Công Ty Sản Xuất"
                value={formData.congTySx}
                onChange={(v) => setFormData({ ...formData, congTySx: v })}
              />
              <FormField
                label="Nước Sản Xuất"
                value={formData.nuocSx}
                onChange={(v) => setFormData({ ...formData, nuocSx: v })}
              />
              <FormField
                label="Năm Sản Xuất"
                type="number"
                value={formData.namSx}
                onChange={(v) => setFormData({ ...formData, namSx: v ? Number(v) : undefined })}
                mono
              />
              <FormField
                label="Năm Sử Dụng"
                type="number"
                value={formData.namSd}
                onChange={(v) => setFormData({ ...formData, namSd: v ? Number(v) : undefined })}
                mono
              />
              <FormField
                label="Số Lưu Hành"
                value={formData.soLuuHanh}
                onChange={(v) => setFormData({ ...formData, soLuuHanh: v })}
                mono
              />
            </div>

            {/* Group 2: Thời hạn & CSKCB */}
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
                label="Hợp Đồng Từ Ngày"
                maxLength={8}
                placeholder="YYYYMMDD"
                value={formData.hdTu}
                onChange={(v) => setFormData({ ...formData, hdTu: v })}
                mono
              />
              <FormField
                label="Hợp Đồng Đến Ngày"
                maxLength={8}
                placeholder="YYYYMMDD"
                value={formData.hdDen}
                onChange={(v) => setFormData({ ...formData, hdDen: v })}
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
