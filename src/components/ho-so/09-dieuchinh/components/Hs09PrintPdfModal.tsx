import React from "react";
import { Printer, FileText, CheckCircle2 } from "lucide-react";
import type { HoSoDieuChinh09Item } from "../../../../types/hs09DieuChinhTypes";
import {
  formatCurrencyVnd,
  formatYmdHmDisplay,
} from "../../../../utils/shared/excelXmlShared";
import { Button, Modal } from "../../../../shared/components";
import { useModalBehavior } from "../../../../hooks/useModalBehavior";

interface Hs09PrintPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HoSoDieuChinh09Item | null;
}

export const Hs09PrintPdfModal: React.FC<Hs09PrintPdfModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  useModalBehavior(isOpen, onClose);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const kyQtDisplay = item.ttXml1.kyQt
    ? `Tháng ${item.ttXml1.kyQt.slice(4)} năm ${item.ttXml1.kyQt.slice(0, 4)}`
    : "Kỳ quyết toán hiện tại";

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      width={960}
      title={
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <span className="text-sm font-bold text-slate-800">
            In Mẫu số 09/BH (Phụ lục I Thông tư số 12/2026/TT-BTC)
          </span>
        </div>
      }
    >
      {/* Printable Paper Preview */}
      <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-slate-100/50 print:p-0 print:bg-white text-slate-900 text-xs">
        <div className="print-area bg-white p-8 sm:p-12 max-w-3xl mx-auto shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-4 space-y-6">
          {/* Header Form */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold uppercase text-[11px]">
                CƠ SỞ KCB: {item.ttMau.maCskcb}
              </p>
              <p className="text-[10px] text-slate-600">
                Số: {item.ttXml1.maLk}/09BH
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[11px]">Mẫu số 09/BH</p>
              <p className="text-[10px] italic text-slate-600">
                (Ban hành kèm theo Thông tư số 12/2026/TT-BTC)
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold uppercase tracking-wide">
              BẢNG KÊ CHI TIẾT ĐIỀU CHỈNH THÔNG TIN GIÁM ĐỊNH BHYT
            </h2>
            <p className="text-xs italic text-slate-700">
              Kỳ quyết toán: {kyQtDisplay}
            </p>
          </div>

          {/* Thông tin bệnh nhân */}
          <div className="border border-slate-300 p-3 rounded space-y-1.5 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <p>
                <b>Họ và tên:</b> {item.ttXml1.hoTen}
              </p>
              <p>
                <b>Mã thẻ BHYT:</b>{" "}
                <span className="font-mono">{item.ttXml1.maThe}</span>
              </p>
              <p>
                <b>Mã liên kết (MA_LK):</b>{" "}
                <span className="font-mono">{item.ttXml1.maLk}</span>
              </p>
              <p>
                <b>Mã bệnh nhân:</b>{" "}
                <span className="font-mono">{item.ttXml1.maBn}</span>
              </p>
              <p>
                <b>Ngày vào viện:</b> {formatYmdHmDisplay(item.ttXml1.ngayVao)}
              </p>
              <p>
                <b>Ngày ra viện:</b> {formatYmdHmDisplay(item.ttXml1.ngayRa)}
              </p>
            </div>
          </div>

          {/* Bảng 1: Thông tin hành chính điều chỉnh */}
          {item.dsXml1DieuChinh && item.dsXml1DieuChinh.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-bold text-[11px] uppercase">
                I. Điều chỉnh thông tin hành chính (XML1)
              </p>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1.5 w-8">STT</th>
                    <th className="border border-slate-300 p-1.5">
                      Trường thông tin
                    </th>
                    <th className="border border-slate-300 p-1.5">
                      Thông tin gốc
                    </th>
                    <th className="border border-slate-300 p-1.5">
                      Thông tin điều chỉnh
                    </th>
                    <th className="border border-slate-300 p-1.5">
                      Lý do điều chỉnh
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.dsXml1DieuChinh.map((dc, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono">
                        {dc.truongTtGoc}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-rose-700">
                        {dc.ttGoc}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-bold text-blue-800">
                        {dc.ttDieuChinh}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        {dc.lyDoDieuChinh}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bảng 2: Chi phí điều chỉnh */}
          {item.dsChiPhiDieuChinh && item.dsChiPhiDieuChinh.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-bold text-[11px] uppercase">
                II. Chi tiết chi phí điều chỉnh (XML2/XML3)
              </p>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1.5 w-8">STT</th>
                    <th className="border border-slate-300 p-1.5">
                      ID Chi phí
                    </th>
                    <th className="border border-slate-300 p-1.5">Bảng</th>
                    <th className="border border-slate-300 p-1.5">Trường TT</th>
                    <th className="border border-slate-300 p-1.5">
                      Giá trị gốc
                    </th>
                    <th className="border border-slate-300 p-1.5">
                      Giá trị điều chỉnh
                    </th>
                    <th className="border border-slate-300 p-1.5">
                      Lý do điều chỉnh
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.dsChiPhiDieuChinh.map((cp, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono">
                        {String(cp.idCp)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        XML{cp.soBangXml}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono">
                        {cp.truongTtGoc}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-rose-700">
                        {cp.ttGoc}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-bold text-indigo-800">
                        {cp.ttDieuChinh}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        {cp.lyDoDieuChinh}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tổng kinh phí */}
          <div className="flex justify-end gap-6 text-[11px] border-t border-slate-200 pt-3">
            <p>
              Tiền xuất toán:{" "}
              <b className="text-rose-700">
                {formatCurrencyVnd(item.tienXuatToan || 0)}
              </b>
            </p>
            <p>
              Tiền đề nghị lại:{" "}
              <b className="text-emerald-700">
                {formatCurrencyVnd(item.tienDeNghiThanhToanLai || 0)}
              </b>
            </p>
          </div>

          {/* Signature section */}
          <div className="pt-8 grid grid-cols-3 text-center text-[11px] gap-4">
            <div>
              <p className="font-bold">NGƯỜI LẬP BIỂU</p>
              <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="font-semibold text-slate-700">
                  {item.ttMau.nguoiLapBieu || "—"}
                </span>
              </div>
            </div>

            <div>
              <p className="font-bold">GIÁM ĐỊNH VIÊN BHYT</p>
              <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-slate-400 italic">Chờ phê duyệt</span>
              </div>
            </div>

            <div>
              <p className="font-bold">THỦ TRƯỞNG ĐƠN VỊ</p>
              <p className="text-[10px] italic text-slate-500">
                (Ký số, đóng dấu)
              </p>
              <div className="h-16 flex flex-col items-center justify-center">
                {item.ttKySo === 2 ? (
                  <div className="border border-emerald-500 bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Đã Ký Số Điện Tử
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Chưa ký số</span>
                )}
                <span className="text-[10px] mt-1 font-semibold">
                  {item.ttMau.thuTruongDv}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        <div className="flex items-center justify-end gap-2 w-full print:hidden">
          <Button
            variant="print"
            icon={<Printer size={14} />}
            onClick={handlePrint}
          >
            In Mẫu 09/BH
          </Button>
        </div>
      }
    </Modal>
  );
};
