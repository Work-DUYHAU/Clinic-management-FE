import React, { useState } from 'react';
import { Pill, AlertCircle } from 'lucide-react';
import type { DmThuocItem } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { useModalBehavior } from '../../../../hooks/useModalBehavior';

interface ThuocEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DmThuocItem) => void;
  initialData: DmThuocItem | null;
}

const getDefaultThuocData = (): DmThuocItem => ({
  id: '',
  stt: 1,
  maThuoc: '',
  tenHoatChat: '',
  tenThuoc: '',
  donViTinh: 'Viên',
  hamLuong: '',
  duongDung: 'Uống',
  maDuongDung: '1.01',
  dangBaoChe: 'Viên nén',
  soDangKy: '',
  soLuong: 0,
  donGia: 0,
  donGiaBh: 0,
  quyCach: '',
  nhaSx: '',
  nuocSx: 'Việt Nam',
  nhaThau: '',
  ttThau: '',
  tuNgayHd: '',
  denNgayHd: '',
  maCskcb: DEFAULT_MA_CSKCB,
  loaiThuoc: 1,
  loaiThau: 1,
  htThau: 1,
  maDvkt: '',
  tccl: '',
  boPhanVt: undefined,
  tenKhoaHoc: '',
  nguonGoc: '',
  ppChebien: '',
  maDlNhap: '',
  maDlCb: '',
  tlhhCb: undefined,
  tlhhBq: undefined,
  maCskcbThuoc: '',
  tuNgay: getTodayYmd(),
  denNgay: ''
});

export const ThuocEditModal: React.FC<ThuocEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <ThuocEditModalContent
      key={initialData?.id ?? 'new'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
};

interface ThuocEditModalContentProps {
  onClose: () => void;
  onSave: (item: DmThuocItem) => void;
  initialData: DmThuocItem | null;
}

const ThuocEditModalContent: React.FC<ThuocEditModalContentProps> = ({
  onClose,
  onSave,
  initialData
}) => {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<'info' | 'thau' | 'yhct' | 'validity'>('info');

  const [formData, setFormData] = useState<DmThuocItem>(() => {
    if (initialData) return { ...initialData };
    return getDefaultThuocData();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.maThuoc.trim()) {
      toast.warning('Vui lòng nhập Mã thuốc (MA_THUOC)', 'Thiếu Dữ Liệu');
      setActiveSection('info');
      return;
    }
    if (!formData.tenThuoc.trim()) {
      toast.warning('Vui lòng nhập Tên thuốc / chế phẩm (TEN_THUOC)', 'Thiếu Dữ Liệu');
      setActiveSection('info');
      return;
    }
    if (!formData.donViTinh.trim()) {
      toast.warning('Vui lòng nhập Đơn vị tính (DON_VI_TINH)', 'Thiếu Dữ Liệu');
      setActiveSection('info');
      return;
    }
    if (!formData.soDangKy.trim()) {
      toast.warning('Vui lòng nhập Số đăng ký / GPNK (SO_DANG_KY)', 'Thiếu Dữ Liệu');
      setActiveSection('info');
      return;
    }
    if (formData.donGia <= 0) {
      toast.warning('Đơn giá trúng thầu phải > 0 (DON_GIA)', 'Giá Trị Không Hợp Lệ');
      setActiveSection('info');
      return;
    }
    if (!formData.tuNgay.trim() || formData.tuNgay.length !== 8) {
      toast.warning('Vui lòng nhập Từ ngày hiệu lực đúng 8 ký tự YYYYMMDD (TU_NGAY)', 'Sai Định Dạng');
      setActiveSection('validity');
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
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-blue-100 text-[#1677ff]">
                <Pill size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {initialData ? 'Chỉnh Sửa Mặt Hàng Thuốc (Mẫu 03/DM)' : 'Thêm Mới Thuốc / Chế Phẩm Máu (Mẫu 03/DM)'}
                </h3>
                <p className="text-xs text-slate-500">Đặc tả chuẩn BHXH Việt Nam - Loại hồ sơ 10 (37 Trường dữ liệu)</p>
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

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 text-xs font-bold gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('info')}
              className={`py-2.5 px-3 border-b-2 transition-all ${
                activeSection === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Thông Tin Thuốc & Giá BHYT (*)
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('thau')}
              className={`py-2.5 px-3 border-b-2 transition-all ${
                activeSection === 'thau'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Đấu Thầu & Sản Xuất
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('yhct')}
              className={`py-2.5 px-3 border-b-2 transition-all ${
                activeSection === 'yhct'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Vị Thuốc / YHCT / Chế Phẩm
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('validity')}
              className={`py-2.5 px-3 border-b-2 transition-all ${
                activeSection === 'validity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              4. Hiệu Lực & Mã CSKCB (*)
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 text-xs">
            {/* 1. THÔNG TIN THUỐC & GIÁ BHYT */}
            {activeSection === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Thuốc BHYT (MA_THUOC) *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                    placeholder="vd: 40.123 hoặc 90.001"
                    value={formData.maThuoc}
                    onChange={(e) => setFormData({ ...formData, maThuoc: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên Thuốc / Chế Phẩm (TEN_THUOC) *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                    placeholder="vd: Panadol Extra 500mg/65mg"
                    value={formData.tenThuoc}
                    onChange={(e) => setFormData({ ...formData, tenThuoc: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên Hoạt Chất (TEN_HOAT_CHAT)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="vd: Paracetamol, Amoxicillin + Acid clavulanic"
                    value={formData.tenHoatChat || ''}
                    onChange={(e) => setFormData({ ...formData, tenHoatChat: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại Thuốc (LOAI_THUOC) *</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={formData.loaiThuoc}
                    onChange={(e) => setFormData({ ...formData, loaiThuoc: Number(e.target.value) })}
                  >
                    <option value={1}>1: Tân dược</option>
                    <option value={2}>2: Chế phẩm YHCT</option>
                    <option value={3}>3: Vị thuốc</option>
                    <option value={4}>4: Phóng xạ</option>
                    <option value={5}>5: Tân dược tự bào chế</option>
                    <option value={6}>6: Chế phẩm tự bào chế</option>
                    <option value={7}>7: Dược liệu</option>
                    <option value={8}>8: Vị thuốc tự bào chế</option>
                    <option value={9}>9: Máu</option>
                    <option value={10}>10: Chế phẩm máu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hàm Lượng (HAM_LUONG)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="vd: 500mg hoặc 250ml"
                    value={formData.hamLuong || ''}
                    onChange={(e) => setFormData({ ...formData, hamLuong: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Vị Tính (DON_VI_TINH) *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Viên, Lọ, Chai, Túi, Gói..."
                    value={formData.donViTinh}
                    onChange={(e) => setFormData({ ...formData, donViTinh: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đường Dùng (DUONG_DUNG)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Uống, Tiêm bắp, Truyền TM..."
                    value={formData.duongDung}
                    onChange={(e) => setFormData({ ...formData, duongDung: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Đường Dùng BYT (MA_DUONG_DUNG) *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                    placeholder="1.01 (Uống), 2.01 (Tiêm)..."
                    value={formData.maDuongDung}
                    onChange={(e) => setFormData({ ...formData, maDuongDung: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dạng Bào Chế (DANG_BAO_CHE)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Viên nén, Dung dịch tiêm..."
                    value={formData.dangBaoChe || ''}
                    onChange={(e) => setFormData({ ...formData, dangBaoChe: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Đăng Ký / GPNK (SO_DANG_KY) *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                    placeholder="VN-22134-19..."
                    value={formData.soDangKy}
                    onChange={(e) => setFormData({ ...formData, soDangKy: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Giá Trúng Thầu (DON_GIA) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={formData.donGia}
                    onChange={(e) => setFormData({ ...formData, donGia: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Giá BHYT (DON_GIA_BH) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono font-bold text-blue-700 outline-none focus:border-blue-500"
                    value={formData.donGiaBh}
                    onChange={(e) => setFormData({ ...formData, donGiaBh: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Lượng Dự Kiến (SO_LUONG)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    value={formData.soLuong || ''}
                    onChange={(e) => setFormData({ ...formData, soLuong: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            )}

            {/* 2. ĐẤU THẦU & SẢN XUẤT */}
            {activeSection === 'thau' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Quy Cách Đóng Gói (QUY_CACH)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Hộp 10 vỉ x 10 viên..."
                    value={formData.quyCach || ''}
                    onChange={(e) => setFormData({ ...formData, quyCach: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nước Sản Xuất (NUOC_SX)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Việt Nam, Pháp, Đức..."
                    value={formData.nuocSx || ''}
                    onChange={(e) => setFormData({ ...formData, nuocSx: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nhà Sản Xuất (NHA_SX)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Tên công ty sản xuất..."
                    value={formData.nhaSx || ''}
                    onChange={(e) => setFormData({ ...formData, nhaSx: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nhà Thầu / Đơn Vị Cung Ứng (NHA_THAU)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Công ty trúng thầu..."
                    value={formData.nhaThau || ''}
                    onChange={(e) => setFormData({ ...formData, nhaThau: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thông Tin Gói Thầu (TT_THAU)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    placeholder="01/2026/QĐ-SYT..."
                    value={formData.ttThau || ''}
                    onChange={(e) => setFormData({ ...formData, ttThau: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại Thầu (LOAI_THAU)</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    value={formData.loaiThau || ''}
                    onChange={(e) => setFormData({ ...formData, loaiThau: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">-- Chọn loại thầu --</option>
                    <option value={1}>1: Thầu tập trung</option>
                    <option value={2}>2: Thầu riêng tại cơ sở</option>
                    <option value={3}>3: Tự pha chế, bào chế</option>
                    <option value={4}>4: Mua sắm theo Điều 49 NĐ 188</option>
                    <option value={5}>5: Mua sắm khoản 4 Điều 80 NĐ 214</option>
                    <option value={6}>6: Tùy chọn mua thêm</option>
                    <option value={7}>7: Nhận điều chuyển</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hình Thức Thầu (HT_THAU)</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    value={formData.htThau || ''}
                    onChange={(e) => setFormData({ ...formData, htThau: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">-- Chọn hình thức thầu --</option>
                    <option value={1}>1: Đấu thầu rộng rãi</option>
                    <option value={2}>2: Đấu thầu hạn chế</option>
                    <option value={3}>3: Chỉ định thầu</option>
                    <option value={4}>4: Chào hàng cạnh tranh</option>
                    <option value={5}>5: Mua sắm trực tiếp</option>
                    <option value={6}>6: Trường hợp đặc biệt</option>
                    <option value={7}>7: Đàm phán giá</option>
                    <option value={8}>8: Chào giá trực tuyến</option>
                    <option value={9}>9: Mua sắm trực tuyến</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Từ Ngày Hợp Đồng (TU_NGAY_HD)</label>
                  <input
                    type="text"
                    maxLength={8}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    placeholder="YYYYMMDD (20260101)"
                    value={formData.tuNgayHd || ''}
                    onChange={(e) => setFormData({ ...formData, tuNgayHd: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đến Ngày Hợp Đồng (DEN_NGAY_HD)</label>
                  <input
                    type="text"
                    maxLength={8}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    placeholder="YYYYMMDD (20261231)"
                    value={formData.denNgayHd || ''}
                    onChange={(e) => setFormData({ ...formData, denNgayHd: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 3. VỊ THUỐC / YHCT / DƯỢC LIỆU */}
            {activeSection === 'yhct' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bộ Phận Vị Thuốc (BO_PHAN_VT)</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    value={formData.boPhanVt || ''}
                    onChange={(e) => setFormData({ ...formData, boPhanVt: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">-- Không áp dụng --</option>
                    <option value={1}>1: Rễ</option>
                    <option value={2}>2: Thân rễ</option>
                    <option value={3}>3: Quả</option>
                    <option value={4}>4: Hạt</option>
                    <option value={5}>5: Vỏ</option>
                    <option value={6}>6: Khác</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên Khoa Học Dược Liệu (TEN_KHOA_HOC)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs italic text-slate-900 outline-none focus:border-blue-500"
                    placeholder="vd: Zingiber officinale..."
                    value={formData.tenKhoaHoc || ''}
                    onChange={(e) => setFormData({ ...formData, tenKhoaHoc: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nguồn Gốc (NGUON_GOC)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Nuôi trồng, Thu hái tự nhiên..."
                    value={formData.nguonGoc || ''}
                    onChange={(e) => setFormData({ ...formData, nguonGoc: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phương Pháp Chế Biến (PP_CHEBIEN)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Mã PP chế biến BYT..."
                    value={formData.ppChebien || ''}
                    onChange={(e) => setFormData({ ...formData, ppChebien: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiêu Chuẩn Chất Lượng (TCCL)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 outline-none focus:border-blue-500"
                    placeholder="DĐVN V..."
                    value={formData.tccl || ''}
                    onChange={(e) => setFormData({ ...formData, tccl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tỷ Lệ Hao Hụt Chế Biến % (TLHH_CB)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    value={formData.tlhhCb || ''}
                    onChange={(e) => setFormData({ ...formData, tlhhCb: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tỷ Lệ Hao Hụt Bảo Quản % (TLHH_BQ)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    value={formData.tlhhBq || ''}
                    onChange={(e) => setFormData({ ...formData, tlhhBq: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã DVKT Thuốc Phóng Xạ (MA_DVKT)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    placeholder="07 ký tự đầu mã DVKT..."
                    value={formData.maDvkt || ''}
                    onChange={(e) => setFormData({ ...formData, maDvkt: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 4. HIỆU LỰC & MÃ CSKCB */}
            {activeSection === 'validity' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Từ Ngày Áp Dụng (TU_NGAY) *</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                    placeholder="20260101"
                    value={formData.tuNgay}
                    onChange={(e) => setFormData({ ...formData, tuNgay: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Định dạng 8 ký tự YYYYMMDD</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đến Ngày Ngừng Áp Dụng (DEN_NGAY)</label>
                  <input
                    type="text"
                    maxLength={8}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Để trống nếu đang áp dụng"
                    value={formData.denNgay || ''}
                    onChange={(e) => setFormData({ ...formData, denNgay: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Cơ Sở KCB (MA_CSKCB) *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={formData.maCskcb}
                    onChange={(e) => setFormData({ ...formData, maCskcb: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã CSKCB Nơi Chuyển Đến (MA_CSKCB_THUOC)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    placeholder="C.XXXXX (nếu nhận điều chuyển)"
                    value={formData.maCskcbThuoc || ''}
                    onChange={(e) => setFormData({ ...formData, maCskcbThuoc: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <AlertCircle size={13} />
              Trường có dấu (*) bắt buộc theo QĐ 130/QĐ-BYT
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-sm text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1677ff] hover:bg-blue-600 text-white rounded-sm text-xs font-bold shadow-sm cursor-pointer"
              >
                Lưu Mặt Hàng Thuốc (03/DM)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
