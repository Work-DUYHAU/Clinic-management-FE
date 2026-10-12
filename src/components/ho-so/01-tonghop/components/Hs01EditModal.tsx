import React from "react";
import { User, FileText, DollarSign, Calendar, Check } from "lucide-react";
import type { Hs01TongHopItem } from "../../../../types/hs01TongHopTypes";
import { LOAI_KCB_OPTIONS } from "../../../../utils/constants/hs01TongHopConstants";
import { FormField } from "../../../common";
import { Modal, Button } from "../../../../shared/components";
import { useModalBehavior } from "../../../../hooks/useModalBehavior";
import { useHs01EditModalHandlers } from "../handlers";

interface Hs01EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Hs01TongHopItem) => void;
  initialData: Hs01TongHopItem | null;
  totalItemsCount?: number;
}

export const Hs01EditModal: React.FC<Hs01EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  totalItemsCount = 0,
}) => {
  useModalBehavior(isOpen, onClose);

  const {
    form,
    handleSubmit,
    handleClose,
    handleHoTenChange,
    handleMaTheChange,
    handleGioiTinhChange,
    handleNgaySinhChange,
    handleSttChange,
    handleMaCskcbChange,
    handleThangQtChange,
    handleNamQtChange,
    handleMaBenhChinhChange,
    handleMaLoaiKcbChange,
    handleNgayVaoChange,
    handleNgayVaoNoiTruChange,
    handleNgayRaChange,
    handleSoNgayDtriChange,
    handleTTongchiBvChange,
    handleTTongchiBhChange,
    handleTBhttChange,
    handleTBncctChange,
    handleTBnttChange,
    handleTNguonkhacChange,
  } = useHs01EditModalHandlers({
    isOpen,
    initialData,
    totalItemsCount,
    onSave,
    onClose,
  });

  return (
    <Modal
      show={isOpen}
      onHide={handleClose}
      width={920}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              {initialData
                ? "Chỉnh Sửa Hồ Sơ Tổng Hợp (Mẫu 01/BH)"
                : "Thêm Mới Hồ Sơ Tổng Hợp (Mẫu 01/BH - Loại 5)"}
            </h3>
            <p className="text-[11px] text-slate-500">
              20 trường thông tin chuẩn Cổng giám định BHYT (XML &lt;HSTH01BH&gt;)
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        {/* Form Body */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4 text-xs">
          {/* Section 1: Thông tin người bệnh */}
          <div>
            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={13} /> <span>1. Thông Tin Người Bệnh &amp; Thẻ BHYT</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50/60 p-3 rounded border border-slate-200/80">
              <FormField
                label="Họ và tên người bệnh"
                required
                placeholder="NGUYỄN VĂN A"
                value={form.hoTen}
                onChange={handleHoTenChange}
                bold
                className="lg:col-span-2"
              />
              <FormField
                label="Mã thẻ BHYT"
                required
                maxLength={15}
                placeholder="DN4791234567890"
                value={form.maTheBhyt}
                onChange={handleMaTheChange}
                mono
                bold
              />
              <FormField
                label="Giới tính"
                type="select"
                required
                value={form.gioiTinh}
                onChange={handleGioiTinhChange}
                options={[
                  { value: "1", label: "1 - Nam" },
                  { value: "2", label: "2 - Nữ" },
                  { value: "3", label: "3 - Khác" },
                ]}
              />
              <FormField
                label="Ngày sinh (12 số)"
                required
                maxLength={12}
                placeholder="YYYYMMDDHHmm"
                value={form.ngaySinh}
                onChange={handleNgaySinhChange}
                mono
              />
              <FormField
                label="STT gửi"
                type="number"
                min={1}
                required
                value={form.stt}
                onChange={handleSttChange}
                bold
              />
              <FormField
                label="Mã CSKCB"
                required
                maxLength={5}
                value={form.maCskcb}
                onChange={handleMaCskcbChange}
                mono
                bold
              />
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Kỳ Quyết Toán *
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="MM"
                    value={form.thangQt}
                    onChange={handleThangQtChange}
                    className="w-12 px-1.5 py-1.5 bg-white border border-slate-200 rounded text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-600"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    required
                    placeholder="YYYY"
                    value={form.namQt}
                    onChange={handleNamQtChange}
                    className="w-16 px-1.5 py-1.5 bg-white border border-slate-200 rounded text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin KCB */}
          <div>
            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={13} /> <span>2. Thông Tin Khám Chữa Bệnh &amp; Thời Gian</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50/60 p-3 rounded border border-slate-200/80">
              <FormField
                label="Mã Bệnh ICD-10"
                required
                maxLength={7}
                placeholder="I10"
                value={form.maBenhChinh}
                onChange={handleMaBenhChinhChange}
                mono
                bold
              />
              <FormField
                label="Hình thức KCB"
                type="select"
                required
                value={form.maLoaiKcb}
                onChange={handleMaLoaiKcbChange}
                options={LOAI_KCB_OPTIONS.map((o) => ({
                  value: o.code,
                  label: `[${o.code}] ${o.name}`,
                }))}
              />
              <FormField
                label="Thời điểm vào KCB"
                required
                maxLength={12}
                placeholder="YYYYMMDDHHmm"
                value={form.ngayVao}
                onChange={handleNgayVaoChange}
                mono
              />
              <FormField
                label="Vào nội trú (nếu có)"
                maxLength={12}
                placeholder="YYYYMMDDHHmm"
                value={form.ngayVaoNoiTru || ""}
                onChange={handleNgayVaoNoiTruChange}
                mono
              />
              <FormField
                label="Thời điểm ra viện"
                required
                maxLength={12}
                placeholder="YYYYMMDDHHmm"
                value={form.ngayRa}
                onChange={handleNgayRaChange}
                mono
              />
              <FormField
                label="Số ngày điều trị"
                type="number"
                min={1}
                required
                value={form.soNgayDtri}
                onChange={handleSoNgayDtriChange}
                bold
              />
            </div>
          </div>

          {/* Section 3: Cơ cấu chi phí */}
          <div>
            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign size={13} /> <span>3. Cơ Cấu Chi Phí KBCB &amp; Đề Nghị Thanh Toán</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-slate-50/60 p-3 rounded border border-slate-200/80">
              <FormField
                label="Tổng chi BV (T_TONGCHI_BV)"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.tTongchiBv}
                onChange={handleTTongchiBvChange}
                mono
                bold
              />
              <FormField
                label="Tổng chi BH (T_TONGCHI_BH)"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.tTongchiBh}
                onChange={handleTTongchiBhChange}
                mono
                bold
              />
              <FormField
                label="BHYT Thanh Toán (T_BHTT)"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.tBhtt}
                onChange={handleTBhttChange}
                mono
                bold
              />
              <FormField
                label="Cùng Chi Trả (T_BNCCT)"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.tBncct}
                onChange={handleTBncctChange}
                mono
              />
              <FormField
                label="BN Tự Trả Ngoài BH (T_BNTT)"
                type="number"
                min={0}
                step="0.01"
                value={form.tBntt}
                onChange={handleTBnttChange}
                mono
              />
              <FormField
                label="Nguồn Khác Chi Trả (T_NGUONKHAC)"
                type="number"
                min={0}
                step="0.01"
                value={form.tNguonkhac || 0}
                onChange={handleTNguonkhacChange}
                mono
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 px-5 pb-1 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button variant="neutral" onClick={handleClose}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" icon={<Check size={14} />} htmlType="submit">
            {initialData ? "Cập Nhật Hồ Sơ 01/BH" : "Lưu Hồ Sơ Mới"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
