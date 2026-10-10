import React, { useState } from "react";
import {
  User,
  FileSpreadsheet,
  FileCheck2,
  DollarSign,
  Layers,
  ShieldCheck,
  Copy,
  Check,
  Paperclip,
  FileText,
} from "lucide-react";
import type {
  HoSoDieuChinh09Item,
  ChiPhiDieuChinhItem,
  TtXml1DieuChinhItem,
} from "../../../../types/hs09DieuChinhTypes";
import { SO_BANG_XML_MAP } from "../../../../utils/constants/hs09DieuChinhConstants";
import { Modal } from "../../../../shared/components";
import {
  formatCurrencyVnd,
  formatYmdHmDisplay,
} from "../../../../utils/shared/excelXmlShared";
import { renderHs09ItemXml } from "../../../../utils/parsers/hs09RowParser";
import { getEffectiveHs09TrangThai } from "../../../../utils/hs09RequestTypeResolver";
import { useToast } from "../../../../context/ToastContext";
import { InfoGrid } from "../../../common";

interface Hs09DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HoSoDieuChinh09Item | null;
}

export const Hs09DetailModal: React.FC<Hs09DetailModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<
    "overview" | "xml1_diff" | "expenses" | "legal" | "xml"
  >("overview");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const handleCopyXmlSnippet = () => {
    navigator.clipboard.writeText(renderHs09ItemXml(item));
    setCopied(true);
    toast.success("Đã sao chép đoạn XML hồ sơ!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      width={880}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Chi Tiết Hồ Sơ 09/BH - LK: {item.ttXml1.maLk}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-sm text-[11px] font-bold">
                Kỳ {item.ttXml1.kyQt}
              </span>
              {item.trangThai === "da_gui_cong" && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-sm text-[11px] font-bold flex items-center gap-1">
                  <FileCheck2 size={11} /> Đã gửi cổng
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Bệnh nhân: <b>{item.ttXml1.hoTen}</b> | Thẻ BHYT:{" "}
              <span className="font-mono">{item.ttXml1.maThe}</span>
            </span>
          </div>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 px-5 bg-slate-50/50">
        {[
          { id: "overview", label: "Tổng Quan", icon: User },
          {
            id: "xml1_diff",
            label: `Đổi Hành Chính (${item.dsXml1DieuChinh?.length || 0})`,
            icon: Layers,
          },
          {
            id: "expenses",
            label: `Chi Phí (${item.dsChiPhiDieuChinh.length})`,
            icon: DollarSign,
          },
          { id: "legal", label: "Căn Cứ & Khoa", icon: ShieldCheck },
          { id: "xml", label: "Đoạn XML", icon: FileSpreadsheet },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Modal Content Body */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
        {activeTab === "overview" && (
          <div className="space-y-3.5">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase block mb-1.5">
                1. Thông tin Mẫu 09/BH (&lt;TT_MAU&gt;)
              </span>
              <InfoGrid
                items={[
                  { label: "Mẫu Số", value: item.ttMau.mauSo, bold: true },
                  { label: "Mã CSKCB", value: item.ttMau.maCskcb, mono: true },
                  { label: "Người Lập Biểu", value: item.ttMau.nguoiLapBieu },
                  { label: "Thủ Trưởng ĐV", value: item.ttMau.thuTruongDv },
                  {
                    label: "Ngày Lập",
                    value: item.ttMau.ngayThangNam,
                    mono: true,
                  },
                ]}
                columns={4}
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase block mb-1.5">
                2. Thông tin bệnh nhân gốc (&lt;TT_XML1&gt;)
              </span>
              <InfoGrid
                items={[
                  {
                    label: "Mã LK",
                    value: item.ttXml1.maLk,
                    mono: true,
                    highlight: true,
                  },
                  { label: "XML1 ID", value: item.ttXml1.xml1Id, mono: true },
                  {
                    label: "Mã Bệnh Nhân",
                    value: item.ttXml1.maBn,
                    mono: true,
                  },
                  { label: "Họ và Tên", value: item.ttXml1.hoTen, bold: true },
                  {
                    label: "Mã Thẻ BHYT",
                    value: item.ttXml1.maThe,
                    mono: true,
                    highlight: true,
                  },
                  {
                    label: "Ngày Vào",
                    value: formatYmdHmDisplay(item.ttXml1.ngayVao),
                    mono: true,
                  },
                  {
                    label: "Ngày Ra",
                    value: formatYmdHmDisplay(item.ttXml1.ngayRa),
                    mono: true,
                  },
                  {
                    label: "Kỳ QT",
                    value: item.ttXml1.kyQt,
                    mono: true,
                    highlight: true,
                  },
                ]}
                columns={4}
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase block mb-1.5">
                3. Trạng thái điều chỉnh &amp; Giám định BHYT (Thông tư
                12/2026/TT-BTC)
              </span>
              <InfoGrid
                items={[
                  {
                    label: "Loại Yêu Cầu (TT)",
                    value: (() => {
                      const eff = getEffectiveHs09TrangThai(item);
                      if (eff === 1) return "1 - Thu hồi ĐNTT";
                      if (eff === 4) return "4 - Xin ý kiến";
                      return "2 - Điều chỉnh dữ liệu gốc";
                    })(),
                    bold: true,
                    highlight: true,
                  },
                  {
                    label: "Trạng Thái Ký Số",
                    value:
                      item.ttKySo === 2 ? "Đã ký số (2)" : "Chưa ký số (0)",
                    bold: true,
                  },
                  {
                    label: "Tình Trạng Gửi",
                    value:
                      item.tinhTrangGui === 2
                        ? "Đã gửi cổng (2)"
                        : "Chưa gửi cổng (0)",
                    bold: true,
                  },
                  {
                    label: "GĐ Duyệt",
                    value:
                      item.gdDuyet === 1
                        ? "1 - Đang xử lý"
                        : item.gdDuyet === 2
                          ? "2 - Đã xử lý"
                          : "0 - Chưa xử lý",
                    bold: true,
                  },
                  {
                    label: "Loại Thao Tác",
                    value:
                      item.loaiThaoTac === "tong_hop_moi"
                        ? "Tổng hợp mới"
                        : "Đang thao tác",
                  },
                  {
                    label: "Ngày Báo Lỗi",
                    value: item.ngayThongBaoLoi || "—",
                    mono: true,
                  },
                  {
                    label: "Hạn Còn Lại",
                    value: item.thoiGianConLai || "—",
                  },
                  {
                    label: "Mã Giao Dịch",
                    value: item.maGiaoDichBhxh || "Chưa phát sinh",
                    mono: true,
                  },
                ]}
                columns={4}
              />
            </div>
          </div>
        )}

        {activeTab === "xml1_diff" && (
          <div className="space-y-2">
            {!item.dsXml1DieuChinh || item.dsXml1DieuChinh.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-sm">
                Không có thay đổi hành chính
              </div>
            ) : (
              <div className="border border-slate-200 rounded-sm overflow-hidden max-h-[280px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">STT</th>
                      <th className="py-2 px-3">Trường Sai Gốc</th>
                      <th className="py-2 px-3">Giá Trị Cũ</th>
                      <th className="py-2 px-3">Trường Điều Chỉnh</th>
                      <th className="py-2 px-3">Giá Trị Mới</th>
                      <th className="py-2 px-3">Lý Do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {item.dsXml1DieuChinh.map(
                      (x1: TtXml1DieuChinhItem, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-mono">
                            {x1.stt || idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-rose-800">
                            {x1.truongTtGoc}
                          </td>
                          <td className="py-2 px-3 font-mono text-rose-600 line-through">
                            {x1.ttGoc}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                            {x1.truongTtDieuChinh}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                            {x1.ttDieuChinh}
                          </td>
                          <td className="py-2 px-3 text-slate-600 italic">
                            {x1.lyDoDieuChinh || "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs pb-1">
              <span>
                Xuất toán:{" "}
                <b className="text-rose-700">
                  {formatCurrencyVnd(item.tienXuatToan || 0)}
                </b>
              </span>
              <span>
                Đề nghị thanh toán lại:{" "}
                <b className="text-emerald-700">
                  {formatCurrencyVnd(item.tienDeNghiThanhToanLai || 0)}
                </b>
              </span>
            </div>
            {item.dsChiPhiDieuChinh.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-sm">
                Không có chi phí điều chỉnh
              </div>
            ) : (
              <div className="border border-slate-200 rounded-sm overflow-hidden max-h-[280px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">Bảng XML</th>
                      <th className="py-2 px-2.5">ID CP</th>
                      <th className="py-2 px-2.5">Trường Gốc</th>
                      <th className="py-2 px-2.5">Giá Trị Cũ</th>
                      <th className="py-2 px-2.5">Trường ĐC</th>
                      <th className="py-2 px-2.5">Giá Trị Mới</th>
                      <th className="py-2 px-3">Lý Do / Từ Chối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {item.dsChiPhiDieuChinh.map(
                      (cp: ChiPhiDieuChinhItem, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-bold text-blue-700">
                            {SO_BANG_XML_MAP[cp.soBangXml] ||
                              `XML${cp.soBangXml}`}
                          </td>
                          <td className="py-2 px-2.5 font-mono">{cp.idCp}</td>
                          <td className="py-2 px-2.5 font-mono text-rose-700">
                            {cp.truongTtGoc || "—"}
                          </td>
                          <td className="py-2 px-2.5 font-mono line-through text-rose-600">
                            {cp.ttGoc || "—"}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-emerald-700 font-bold">
                            {cp.truongTtDieuChinh || "—"}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-emerald-700 font-bold">
                            {cp.ttDieuChinh || "—"}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {cp.lyDoDieuChinh || cp.tuChoi || "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "legal" && (
          <div className="space-y-3">
            <InfoGrid
              items={[
                {
                  label: "Khoa Điều Trị",
                  value: item.khoaDieuTri || "—",
                  bold: true,
                },
                {
                  label: "Người Giải Trình",
                  value: item.nguoiGiaiTrinh || item.ttMau?.nguoiLapBieu || "—",
                },
                {
                  label: "Ngày Giải Trình",
                  value: item.ngayGiaiTrinh || item.ttMau?.ngayThangNam || "—",
                  mono: true,
                },
                {
                  label: "Nhóm Lỗi",
                  value: item.nhomLoi || "—",
                  highlight: true,
                },
              ]}
              columns={2}
            />
            {item.taiLieuDinhKem && item.taiLieuDinhKem.length > 0 && (
              <div className="bg-slate-50 p-3.5 rounded-sm border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Paperclip size={13} className="text-blue-600" />
                  Tài Liệu Đính Kèm ({item.taiLieuDinhKem.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.taiLieuDinhKem.map((doc, dIdx) => {
                    const docName = typeof doc === "string" ? doc : doc.tenFile;
                    return (
                      <div
                        key={dIdx}
                        className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-sm text-xs"
                      >
                        <FileText
                          size={14}
                          className="text-blue-600 shrink-0"
                        />
                        <span
                          className="font-medium text-slate-800 truncate"
                          title={docName}
                        >
                          {docName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "xml" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-700">
                Khối &lt;TT_HOSO&gt; cho LK: {item.ttXml1.maLk}
              </span>
              <button
                onClick={handleCopyXmlSnippet}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer"
              >
                {copied ? (
                  <Check size={13} className="text-emerald-600" />
                ) : (
                  <Copy size={13} />
                )}
                <span>{copied ? "Đã chép" : "Sao chép XML"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-sm overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[300px]">
              {renderHs09ItemXml(item)}
            </pre>
          </div>
        )}
      </div>

      {
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-400 font-mono">
            ID: {item.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-sm text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      }
    </Modal>
  );
};
