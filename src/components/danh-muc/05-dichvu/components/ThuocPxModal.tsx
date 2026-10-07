import React, { useState, useEffect } from 'react';
import { X, Atom, Save } from 'lucide-react';
import type { DmThuocPxItem } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { ThuocPxListEditor } from './ThuocPxListEditor';

interface ThuocPxModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  serviceCode: string;
  items: DmThuocPxItem[];
  onSave: (items: DmThuocPxItem[]) => void;
}

export const ThuocPxModal: React.FC<ThuocPxModalProps> = ({
  isOpen,
  onClose,
  serviceName,
  serviceCode,
  items,
  onSave
}) => {
  const toast = useToast();
  const [pxList, setPxList] = useState<DmThuocPxItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPxList(items && items.length > 0 ? items.map(it => ({ ...it })) : []);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Lọc bỏ các dòng hoàn toàn rỗng
    const validRows = pxList.filter(
      (r) => r.maThuoc.trim() !== '' || r.tenThuoc.trim() !== '' || (r.donGiaThuoc && r.donGiaThuoc > 0)
    );

    // Kiểm tra các dòng có nhập thiếu mã hoặc tên thuốc
    const invalidRow = validRows.find((r) => !r.maThuoc.trim() || !r.tenThuoc.trim());
    if (invalidRow) {
      toast.warning('Tất cả thuốc phóng xạ cần có đầy đủ Mã thuốc và Tên thuốc!', 'Thiếu Thông Tin');
      return;
    }

    onSave(validRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Atom size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold">Danh Sách Thuốc Phóng Xạ & Chất Đánh Dấu</h3>
              <p className="text-xs text-amber-100 font-medium">
                Dịch vụ: <span className="font-bold text-white">[{serviceCode}] {serviceName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <ThuocPxListEditor
            items={pxList}
            onChange={setPxList}
            serviceName={serviceName}
            serviceCode={serviceCode}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-sm bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Save size={15} />
            <span>Lưu Danh Sách Thuốc PX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
