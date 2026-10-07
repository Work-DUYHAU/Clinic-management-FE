import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileSpreadsheet, User, Layers, DollarSign, ShieldCheck, Check } from 'lucide-react';
import type {
  HoSoDieuChinh09Item,
  TtXml1DieuChinhItem,
  ChiPhiDieuChinhItem,
  TrangThaiXuLy09
} from '../../../../types/hs09DieuChinhTypes';
import { DEFAULT_MA_CSKCB, getTodayYmd } from '../../../../utils/shared/excelXmlShared';
import { useToast } from '../../../../context/ToastContext';
import { FormField } from '../../../common';

interface Hs09EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: HoSoDieuChinh09Item) => void;
  initialData: HoSoDieuChinh09Item | null;
  totalItemsCount: number;
}

const getDefaultForm = () => ({
  mauSo: '09/BH',
  maCskcb: DEFAULT_MA_CSKCB,
  nguoiLapBieu: '',
  thuTruongDv: '',
  ngayThangNam: getTodayYmd(),
  xml1Id: '',
  maLk: '',
  maBn: '',
  hoTen: '',
  maThe: '',
  ngayVao: '',
  ngayRa: '',
  kyQt: '',
  trangThaiXml1: '1',
  khoaDieuTri: '',
  nhomLoi: '',
  tienXuatToan: '0',
  tienDeNghiThanhToanLai: '0',
  trangThai: 'cho_xu_ly' as TrangThaiXuLy09,
});

export const Hs09EditModal: React.FC<Hs09EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  totalItemsCount
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'xml1_diff' | 'expenses' | 'legal'>('info');

  const [form, setForm] = useState(getDefaultForm);
  const [dsXml1DieuChinh, setDsXml1DieuChinh] = useState<TtXml1DieuChinhItem[]>([]);
  const [dsChiPhiDieuChinh, setDsChiPhiDieuChinh] = useState<ChiPhiDieuChinhItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          mauSo: initialData.ttMau.mauSo || '09/BH',
          maCskcb: initialData.ttMau.maCskcb || DEFAULT_MA_CSKCB,
          nguoiLapBieu: initialData.ttMau.nguoiLapBieu || '',
          thuTruongDv: initialData.ttMau.thuTruongDv || '',
          ngayThangNam: initialData.ttMau.ngayThangNam || getTodayYmd(),
          xml1Id: String(initialData.ttXml1.xml1Id || ''),
          maLk: initialData.ttXml1.maLk || '',
          maBn: initialData.ttXml1.maBn || '',
          hoTen: initialData.ttXml1.hoTen || '',
          maThe: initialData.ttXml1.maThe || '',
          ngayVao: initialData.ttXml1.ngayVao || '',
          ngayRa: initialData.ttXml1.ngayRa || '',
          kyQt: initialData.ttXml1.kyQt || '',
          trangThaiXml1: String(initialData.ttXml1.trangThai || 1),
          khoaDieuTri: initialData.khoaDieuTri || '',
          nhomLoi: initialData.nhomLoi || '',
          tienXuatToan: String(initialData.tienXuatToan || 0),
          tienDeNghiThanhToanLai: String(initialData.tienDeNghiThanhToanLai || 0),
          trangThai: initialData.trangThai || 'cho_xu_ly',
        });
        setDsXml1DieuChinh(initialData.dsXml1DieuChinh || []);
        setDsChiPhiDieuChinh(initialData.dsChiPhiDieuChinh || []);
      } else {
        setForm(getDefaultForm());
        setDsXml1DieuChinh([]);
        setDsChiPhiDieuChinh([]);
      }
      setActiveTab('info');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const updateField = (key: keyof typeof form, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    if (!form.maLk.trim()) return toast.error('Mã LK không được để trống!');
    if (!form.hoTen.trim()) return toast.error('Họ tên bệnh nhân không được để trống!');
    if (!form.maThe.trim()) return toast.error('Mã thẻ BHYT không được để trống!');

    onSave({
      id: initialData?.id || `hs09-${Date.now()}`,
      stt: initialData?.stt || totalItemsCount + 1,
      ttMau: {
        mauSo: form.mauSo.trim(),
        maCskcb: form.maCskcb.trim(),
        nguoiLapBieu: form.nguoiLapBieu.trim(),
        thuTruongDv: form.thuTruongDv.trim(),
        ngayThangNam: form.ngayThangNam.trim() || getTodayYmd()
      },
      ttXml1: {
        xml1Id: form.xml1Id.trim() || `100${Date.now().toString().slice(-6)}`,
        maLk: form.maLk.trim(),
        maBn: form.maBn.trim() || `BN-${Date.now().toString().slice(-4)}`,
        hoTen: form.hoTen.trim(),
        maThe: form.maThe.trim(),
        ngayVao: form.ngayVao.trim(),
        ngayRa: form.ngayRa.trim(),
        kyQt: form.kyQt.trim() || getTodayYmd().slice(0, 6),
        trangThai: Number(form.trangThaiXml1) || 1
      },
      dsXml1DieuChinh,
      dsChiPhiDieuChinh,
      khoaDieuTri: form.khoaDieuTri.trim(),
      nhomLoi: form.nhomLoi.trim(),
      tienXuatToan: Number(form.tienXuatToan) || 0,
      tienDeNghiThanhToanLai: Number(form.tienDeNghiThanhToanLai) || 0,
      tienChapNhanLai: initialData?.tienChapNhanLai || 0,
      taiLieuDinhKem: initialData?.taiLieuDinhKem || [],
      nguoiGiaiTrinh: form.nguoiLapBieu.trim(),
      ngayGiaiTrinh: getTodayYmd(),
      trangThai: form.trangThai,
      isValid: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {initialData ? 'Sửa Hồ Sơ Điều Chỉnh 09/BH' : 'Thêm Hồ Sơ Điều Chỉnh 09/BH'}
              </h3>
              <p className="text-[11px] text-slate-500">Quy chuẩn Loại HS 73 - GuiHoSoDieuChinh09BH</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer"><X size={16} /></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50/50">
          {[
            { id: 'info', label: '1. Thông Tin Chung & BN', icon: User },
            { id: 'xml1_diff', label: `2. Đổi Hành Chính (${dsXml1DieuChinh.length})`, icon: Layers },
            { id: 'expenses', label: `3. Chi Phí Điều Chỉnh (${dsChiPhiDieuChinh.length})`, icon: DollarSign },
            { id: 'legal', label: '4. Khoa & Tài Chính', icon: ShieldCheck }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Modal Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Mẫu Số" value={form.mauSo} onChange={(v) => updateField('mauSo', v)} bold />
                <FormField label="Mã CSKCB" value={form.maCskcb} onChange={(v) => updateField('maCskcb', v)} mono />
                <FormField label="Ngày Lập (YYYYMMDD)" value={form.ngayThangNam} onChange={(v) => updateField('ngayThangNam', v)} mono />
                <FormField label="Người Lập Biểu" placeholder="Nhập người lập biểu" value={form.nguoiLapBieu} onChange={(v) => updateField('nguoiLapBieu', v)} />
                <FormField label="Thủ Trưởng Đơn Vị" placeholder="Nhập thủ trưởng đơn vị" value={form.thuTruongDv} onChange={(v) => updateField('thuTruongDv', v)} />
              </div>
              <div className="border-t border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Mã LK" placeholder="Nhập mã LK" value={form.maLk} onChange={(v) => updateField('maLk', v)} mono bold required />
                <FormField label="Mã Bệnh Nhân" placeholder="Nhập mã BN" value={form.maBn} onChange={(v) => updateField('maBn', v)} mono />
                <FormField label="Họ và Tên" placeholder="Nhập họ và tên BN" value={form.hoTen} onChange={(v) => updateField('hoTen', v)} bold required />
                <FormField label="Mã Thẻ BHYT" placeholder="Nhập mã thẻ BHYT" value={form.maThe} onChange={(v) => updateField('maThe', v)} mono required />
                <FormField label="Ngày Vào (YYYYMMDDHHmm)" placeholder="YYYYMMDDHHmm" value={form.ngayVao} onChange={(v) => updateField('ngayVao', v)} mono />
                <FormField label="Ngày Ra (YYYYMMDDHHmm)" placeholder="YYYYMMDDHHmm" value={form.ngayRa} onChange={(v) => updateField('ngayRa', v)} mono />
                <FormField label="Kỳ Quyết Toán (YYYYMM)" placeholder="YYYYMM" value={form.kyQt} onChange={(v) => updateField('kyQt', v)} mono />
              </div>
            </div>
          )}

          {activeTab === 'xml1_diff' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-blue-700 uppercase">Danh sách thẻ hành chính điều chỉnh</span>
                <button
                  type="button"
                  onClick={() => setDsXml1DieuChinh(p => [...p, { stt: p.length + 1, truongTtGoc: '', ttGoc: '', truongTtDieuChinh: '', ttDieuChinh: '', lyDoDieuChinh: '' }])}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-sm font-bold text-xs cursor-pointer"
                >
                  <Plus size={13} /> Thêm Thẻ XML1
                </button>
              </div>
              {dsXml1DieuChinh.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-sm border border-dashed border-slate-200">
                  Chưa có thông tin điều chỉnh hành chính. Bấm <b>"Thêm Thẻ XML1"</b> để thêm.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {dsXml1DieuChinh.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-blue-50/40 rounded-sm border border-blue-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <FormField label="Trường Gốc" placeholder="vd: MA_BENH_CHINH" value={item.truongTtGoc} onChange={(v) => setDsXml1DieuChinh(p => p.map((it, i) => i === idx ? { ...it, truongTtGoc: v } : it))} mono bold />
                      </div>
                      <div className="sm:col-span-2">
                        <FormField label="Giá Trị Cũ" placeholder="Giá trị cũ" value={item.ttGoc} onChange={(v) => setDsXml1DieuChinh(p => p.map((it, i) => i === idx ? { ...it, ttGoc: v } : it))} mono />
                      </div>
                      <div className="sm:col-span-3">
                        <FormField label="Trường Điều Chỉnh" placeholder="vd: MA_BENH_CHINH" value={item.truongTtDieuChinh} onChange={(v) => setDsXml1DieuChinh(p => p.map((it, i) => i === idx ? { ...it, truongTtDieuChinh: v } : it))} mono />
                      </div>
                      <div className="sm:col-span-3">
                        <FormField label="Giá Trị Mới" placeholder="Giá trị mới" value={item.ttDieuChinh} onChange={(v) => setDsXml1DieuChinh(p => p.map((it, i) => i === idx ? { ...it, ttDieuChinh: v } : it))} mono bold />
                      </div>
                      <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                        <button type="button" onClick={() => setDsXml1DieuChinh(p => p.filter((_, i) => i !== idx))} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                      <div className="sm:col-span-12">
                        <FormField label="Lý Do Điều Chỉnh" placeholder="Nhập lý do điều chỉnh" value={item.lyDoDieuChinh} onChange={(v) => setDsXml1DieuChinh(p => p.map((it, i) => i === idx ? { ...it, lyDoDieuChinh: v } : it))} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-blue-700 uppercase">Danh sách chi phí điều chỉnh</span>
                <button
                  type="button"
                  onClick={() => setDsChiPhiDieuChinh(p => [...p, { stt: p.length + 1, soBangXml: 3, idCp: '', sttXml: p.length + 1, ngayYl: '', trangThai: 1, truongTtGoc: '', ttGoc: '', tuChoi: '', truongTtDieuChinh: '', ttDieuChinh: '', lyDoDieuChinh: '' }])}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-sm font-bold text-xs cursor-pointer"
                >
                  <Plus size={13} /> Thêm Mục Chi Phí
                </button>
              </div>
              {dsChiPhiDieuChinh.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-sm border border-dashed border-slate-200">
                  Chưa có chi phí điều chỉnh. Bấm <b>"Thêm Mục Chi Phí"</b> để thêm.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {dsChiPhiDieuChinh.map((cp, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-blue-700">
                        <span>Mục #{idx + 1} (Bảng XML{cp.soBangXml})</span>
                        <button type="button" onClick={() => setDsChiPhiDieuChinh(p => p.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 size={13} /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <FormField
                          label="Bảng XML"
                          type="select"
                          value={cp.soBangXml}
                          options={[{ value: 2, label: 'XML2 (Thuốc)' }, { value: 3, label: 'XML3 (DVKT)' }, { value: 4, label: 'XML4 (CLS)' }, { value: 5, label: 'XML5 (Diễn biến)' }]}
                          onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, soBangXml: Number(v) } : it))}
                        />
                        <FormField label="ID Chi Phí" placeholder="vd: CP-01" value={cp.idCp} onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, idCp: v } : it))} mono />
                        <FormField label="Trường Sai Gốc" placeholder="vd: DON_GIA" value={cp.truongTtGoc} onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, truongTtGoc: v } : it))} mono />
                        <FormField label="Giá Trị Cũ" placeholder="Giá trị cũ" value={cp.ttGoc} onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, ttGoc: v } : it))} mono />
                        <FormField label="Trường ĐC" placeholder="vd: DON_GIA" value={cp.truongTtDieuChinh} onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, truongTtDieuChinh: v } : it))} mono />
                        <FormField label="Giá Trị Mới" placeholder="Giá trị mới" value={cp.ttDieuChinh} onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, ttDieuChinh: v } : it))} mono bold />
                        <FormField label="Mã Lỗi Từ Chối" placeholder="vd: SAI_GIACABHYT" value={cp.tuChoi} onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, tuChoi: v } : it))} mono />
                        <FormField label="Lý Do Điều Chỉnh" placeholder="Nhập lý do" value={cp.lyDoDieuChinh} onChange={(v) => setDsChiPhiDieuChinh(p => p.map((it, i) => i === idx ? { ...it, lyDoDieuChinh: v } : it))} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Khoa Điều Trị" placeholder="Nhập khoa điều trị" value={form.khoaDieuTri} onChange={(v) => updateField('khoaDieuTri', v)} />
              <FormField label="Nhóm Lỗi Xuất Toán" placeholder="vd: CHIDINH_SAI" value={form.nhomLoi} onChange={(v) => updateField('nhomLoi', v)} mono />
              <FormField label="Tiền Bị Xuất Toán (VNĐ)" type="number" value={form.tienXuatToan} onChange={(v) => updateField('tienXuatToan', v)} mono bold />
              <FormField label="Tiền Đề Nghị Thanh Toán Lại (VNĐ)" type="number" value={form.tienDeNghiThanhToanLai} onChange={(v) => updateField('tienDeNghiThanhToanLai', v)} mono bold />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer">Hủy</button>
          <button type="button" onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1677ff] hover:bg-blue-600 text-white rounded-sm text-xs font-semibold shadow-xs cursor-pointer">
            <Check size={14} /> <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Hồ Sơ 09'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
