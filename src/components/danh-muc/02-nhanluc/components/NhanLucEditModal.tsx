import React, { useState } from 'react';
import { Users, Check } from 'lucide-react';
import type { DmNhanLucItem } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';
import { FormField } from '../../../common';

interface NhanLucEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DmNhanLucItem) => void;
  initialData: DmNhanLucItem | null;
}

const getDefaultNhanLucData = (): DmNhanLucItem => ({
  stt: 1,
  maKhoa: '',
  tenKhoa: '',
  hoTen: '',
  gioiTinh: 1,
  soDinhDanh: '',
  chucDanhNn: '1',
  viTri: '',
  macchn: '',
  ngaycapCchn: '',
  noicapCchn: '',
  phamviCm: '',
  phamviCmbs: '',
  dvktKhac: '',
  vbPhancong: '',
  thoigianDk: 1,
  thoigianNgay: '0730-1630',
  thoigianTuan: 'T2T3T4T5T6',
  cskcbKhac: '',
  cskcbCgkt: '',
  qdCgkt: '',
  tuNgay: getTodayYmd(),
  denNgay: '',
  maCskcb: DEFAULT_MA_CSKCB
});

export const NhanLucEditModal: React.FC<NhanLucEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <NhanLucEditModalContent
      key={initialData?.id ?? 'new'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
};

interface NhanLucEditModalContentProps {
  onClose: () => void;
  onSave: (item: DmNhanLucItem) => void;
  initialData: DmNhanLucItem | null;
}

const NhanLucEditModalContent: React.FC<NhanLucEditModalContentProps> = ({
  onClose,
  onSave,
  initialData
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState<DmNhanLucItem>(() => {
    if (initialData) return { ...initialData };
    return getDefaultNhanLucData();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen.trim()) {
      toast.warning('Vui lòng nhập Họ và tên nhân lực (HO_TEN)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.soDinhDanh.trim()) {
      toast.warning('Vui lòng nhập Số định danh / CCCD (SO_DINH_DANH)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.maKhoa.trim()) {
      toast.warning('Vui lòng nhập Mã khoa / Bàn khám (MA_KHOA)', 'Thiếu Dữ Liệu');
      return;
    }
    if (!formData.tuNgay.trim() || formData.tuNgay.length !== 8) {
      toast.warning('Vui lòng nhập Từ ngày đúng định dạng 8 ký tự YYYYMMDD (TU_NGAY)', 'Sai Định Dạng');
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
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {initialData ? 'Chỉnh Sửa Nhân Lực Y Tế' : 'Thêm Mới Nhân Lực Y Tế'}
                </h3>
                <p className="text-xs text-slate-500">Quy định Mẫu 02/DM - Loại hồ sơ 71</p>
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
            {/* Section 1: Định danh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Họ và Tên (HO_TEN)"
                required
                placeholder="vd: BS. NGUYỄN VĂN A"
                value={formData.hoTen}
                onChange={(v) => setFormData({ ...formData, hoTen: v })}
                bold
              />
              <FormField
                label="Số Định Danh / CCCD"
                required
                maxLength={12}
                placeholder="12 chữ số"
                value={formData.soDinhDanh}
                onChange={(v) => setFormData({ ...formData, soDinhDanh: v })}
                mono
                bold
              />
              <FormField
                label="Giới Tính"
                type="select"
                value={formData.gioiTinh}
                onChange={(v) => setFormData({ ...formData, gioiTinh: Number(v) })}
                options={[{ value: 1, label: '1 - Nam' }, { value: 2, label: '2 - Nữ' }]}
              />
              <FormField
                label="Mã Khoa (MA_KHOA)"
                required
                placeholder="vd: K01"
                value={formData.maKhoa}
                onChange={(v) => setFormData({ ...formData, maKhoa: v.toUpperCase() })}
                mono
              />
              <FormField
                label="Tên Khoa / Phòng"
                placeholder="vd: Khoa Cấp Cứu"
                value={formData.tenKhoa}
                onChange={(v) => setFormData({ ...formData, tenKhoa: v })}
              />
              <FormField
                label="Chức Danh Nghề Nghiệp"
                value={formData.chucDanhNn}
                onChange={(v) => setFormData({ ...formData, chucDanhNn: v })}
                mono
              />
            </div>

            {/* Section 2: Chứng chỉ hành nghề */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Mã CCHN (MACCHN)"
                placeholder="vd: 001234/HNO-CCHN"
                value={formData.macchn}
                onChange={(v) => setFormData({ ...formData, macchn: v })}
                mono
                bold
              />
              <FormField
                label="Ngày Cấp CCHN (YYYYMMDD)"
                maxLength={8}
                value={formData.ngaycapCchn}
                onChange={(v) => setFormData({ ...formData, ngaycapCchn: v })}
                mono
              />
              <FormField
                label="Nơi Cấp CCHN"
                placeholder="vd: Sở Y Tế Hà Nội"
                value={formData.noicapCchn}
                onChange={(v) => setFormData({ ...formData, noicapCchn: v })}
              />
              <FormField
                label="Phạm Vi Chuyên Môn"
                value={formData.phamviCm}
                onChange={(v) => setFormData({ ...formData, phamviCm: v })}
                className="sm:col-span-2"
              />
              <FormField
                label="Phạm Vi Bổ Sung"
                value={formData.phamviCmbs}
                onChange={(v) => setFormData({ ...formData, phamviCmbs: v })}
              />
            </div>

            {/* Section 3: Thời gian làm việc */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-sm border border-slate-200">
              <FormField
                label="Thời Gian Ngày"
                placeholder="0730-1630"
                value={formData.thoigianNgay}
                onChange={(v) => setFormData({ ...formData, thoigianNgay: v })}
                mono
              />
              <FormField
                label="Thời Gian Tuần"
                placeholder="T2T3T4T5T6"
                value={formData.thoigianTuan}
                onChange={(v) => setFormData({ ...formData, thoigianTuan: v })}
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
              <span>Lưu Thông Tin Nhân Lực</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
