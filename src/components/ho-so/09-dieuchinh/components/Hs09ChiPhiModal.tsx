import React, { useState, useEffect, useRef } from "react";
import { DollarSign, Save, Plus, Trash2 } from "lucide-react";
import type {
  HoSoDieuChinh09Item,
  ChiPhiDieuChinhItem,
} from "../../../../types/hs09DieuChinhTypes";
import { useToast } from "../../../../context/ToastContext";
import { formatYmdHmDisplay } from "../../../../utils/shared/excelXmlShared";
import {
  Button,
  IconButton,
  Modal,
  Select,
} from "../../../../shared/components";
import { isHs09Locked, handleTuChoiValue } from "../../../../utils/hs09Helpers";
import {
  resolveHs09TrangThai,
  type Hs09UserAction,
} from "../../../../utils/hs09RequestTypeResolver";
import { Hs09LockBanner } from "./Hs09LockBanner";

interface Hs09ChiPhiModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HoSoDieuChinh09Item | null;
  onSave: (updatedItem: HoSoDieuChinh09Item) => void;
}

const SO_BANG_OPTIONS = [
  { value: 2, label: "XML2 - Thuốc" },
  { value: 3, label: "XML3 - DVKT/VTYT" },
  { value: 4, label: "XML4 - CLS" },
  { value: 5, label: "XML5 - Diễn biến" },
];

const emptyChiPhiRow = (stt: number): ChiPhiDieuChinhItem => ({
  stt,
  soBangXml: 2,
  idCp: "",
  sttXml: stt,
  ngayYl: "",
  trangThai: 2,
  truongTtGoc: "",
  ttGoc: "",
  truongTtDieuChinh: "",
  ttDieuChinh: "",
  lyDoDieuChinh: "",
});

export const Hs09ChiPhiModal: React.FC<Hs09ChiPhiModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const toast = useToast();
  const [rows, setRows] = useState<ChiPhiDieuChinhItem[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && item) {
      setRows(
        (item.dsChiPhiDieuChinh?.length
          ? item.dsChiPhiDieuChinh
          : [emptyChiPhiRow(1)]
        ).map((r, i) => ({ ...r, stt: r.stt || i + 1 })),
      );
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isLocked = isHs09Locked(item);

  const updateRow = (idx: number, patch: Partial<ChiPhiDieuChinhItem>) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        // TRUONG_TT_DIEUCHINH tự động = TRUONG_TT_GOC (QĐ 326 Mục 3.2)
        if (patch.truongTtGoc !== undefined && !r.truongTtDieuChinh) {
          next.truongTtDieuChinh = patch.truongTtGoc;
        }
        return next;
      }),
    );
  };

  const handleAddRow = () => {
    if (isLocked) return;
    setRows((prev) => [...prev, emptyChiPhiRow(prev.length + 1)]);
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const handleRemoveRow = (idx: number) => {
    if (isLocked) return;
    setRows((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, stt: i + 1 })),
    );
  };

  const handleTuChoiChange = (idx: number, val: string) => {
    updateRow(idx, { tuChoi: handleTuChoiValue(val) });
  };

  const handleRowField =
    (idx: number, field: keyof ChiPhiDieuChinhItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateRow(idx, { [field]: e.target.value });
    };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isLocked) {
      toast.warning(
        item.tinhTrangGui === 2
          ? "Hồ sơ đã gửi giám định, không được phép điều chỉnh!"
          : "Hồ sơ đã ký số, vui lòng Hủy ký số trước khi điều chỉnh!",
      );
      return;
    }

    const validRows = rows.filter(
      (r) =>
        String(r.idCp ?? "").trim() ||
        (r.truongTtGoc ?? "").trim() ||
        (r.ttDieuChinh ?? "").trim() ||
        (r.lyDoDieuChinh ?? "").trim(),
    );

    if (validRows.length === 0) {
      toast.error(
        "Chưa có mục chi phí điều chỉnh nào. Nhập ID chi phí / trường sai / giá trị mới!",
        "Thiếu thông tin",
      );
      return;
    }

    const missingId = validRows.findIndex((r) => !String(r.idCp ?? "").trim());
    if (missingId !== -1) {
      toast.error(
        `Mục #${missingId + 1}: ID chi phí (ID_CP) không được để trống!`,
        "Thiếu ID chi phí",
      );
      return;
    }

    // Xác định và kiểm tra loại yêu cầu (trạng thái 1, 2, 4) kết hợp ngữ cảnh và điều kiện phụ thuộc
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      const userAction: Hs09UserAction =
        r.trangThai === 1
          ? "THU_HOI"
          : r.trangThai === 4
            ? "XIN_Y_KIEN"
            : "DIEU_CHINH";

      const resolveRes = resolveHs09TrangThai({
        action: userAction,
        scope: "CHI_PHI",
        selectedItems: [r],
        fieldData: {
          truongTtGoc: r.truongTtGoc,
          ttGoc: r.ttGoc,
          truongTtDieuChinh: r.truongTtDieuChinh || r.truongTtGoc,
          ttDieuChinh: r.ttDieuChinh,
          lyDoDieuChinh: r.lyDoDieuChinh,
        },
        lyDoDieuChinh: r.lyDoDieuChinh,
        currentTrangThai: r.trangThai,
      });

      if (!resolveRes.isValid) {
        toast.error(
          `Mục #${i + 1} (${resolveRes.trangThaiLabel}): ${resolveRes.errors[0]}`,
          "Không đúng quy định điều chỉnh",
        );
        return;
      }
    }

    const updatedItem: HoSoDieuChinh09Item = {
      ...item,
      dsChiPhiDieuChinh: validRows.map((r, i) => ({
        ...r,
        stt: i + 1,
        idCp: String(r.idCp ?? "").trim(),
        truongTtGoc: (r.truongTtGoc ?? "").trim(),
        ttGoc: (r.ttGoc ?? "").trim(),
        truongTtDieuChinh: (r.truongTtDieuChinh || r.truongTtGoc || "").trim(),
        ttDieuChinh: (r.ttDieuChinh ?? "").trim(),
        lyDoDieuChinh: (r.lyDoDieuChinh ?? "").trim(),
      })),
      gdDuyet: 0, // 0 = Chưa xử lý (Mục 3.2)
      ttKySo: 0, // 0 = Chưa ký số
      loaiThaoTac: "dang_thao_tac",
    };

    onSave(updatedItem);
    toast.success(
      "Lưu điều chỉnh chi phí thành công! (GD_DUYET=0, TT_KYSO=0)",
      "Thành công",
    );
    onClose();
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      width={1080}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <DollarSign size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Điều chỉnh chi phí (XML2/XML3/XML4/XML5)
              </span>
              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                LK: {item.ttXml1.maLk}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Theo Mục 3.2, 3.3, 3.4 Phụ lục I Thông tư số 12/2026/TT-BTC
            </span>
          </div>
        </div>
      }
    >
      {/* Lock warning */}
      <Hs09LockBanner item={item} />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="p-5 space-y-3 text-xs flex-1 flex flex-col overflow-hidden">
          {/* Thông tin gốc */}
          <div className="bg-slate-50/80 rounded-lg border border-slate-200 p-3 flex flex-wrap gap-x-6 gap-y-1 text-slate-700 shrink-0">
            <span>
              Bệnh nhân: <b>{item.ttXml1.hoTen || "—"}</b>
            </span>
            <span>
              Mã thẻ: <b className="font-mono">{item.ttXml1.maThe || "—"}</b>
            </span>
            <span>
              Ngày vào/ra:{" "}
              <b className="font-mono">
                {formatYmdHmDisplay(item.ttXml1.ngayVao)} →{" "}
                {formatYmdHmDisplay(item.ttXml1.ngayRa)}
              </b>
            </span>
            <span>
              Tiền xuất toán:{" "}
              <b className="text-rose-700">
                {(item.tienXuatToan || 0).toLocaleString("vi-VN")} đ
              </b>
            </span>
          </div>

          {/* Danh sách chi phí điều chỉnh */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Danh sách chi phí điều chỉnh ({rows.length})
            </span>
            <Button
              variant="soft-indigo"
              size="small"
              icon={<Plus size={13} />}
              onClick={handleAddRow}
              disabled={isLocked}
            >
              Thêm mục chi phí
            </Button>
          </div>

          {/* Vùng danh sách chi phí cuộn (hiển thị ~1.5 - 2 mục rồi cuộn) */}
          <div
            ref={listRef}
            className="space-y-3 max-h-[460px] overflow-y-auto pr-1 flex-1"
          >
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="p-3 bg-indigo-50/30 rounded-lg border border-indigo-100 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-800">
                    Mục #{idx + 1}
                  </span>
                  <IconButton
                    icon={<Trash2 size={14} />}
                    tooltip="Xóa mục này"
                    danger
                    disabled={isLocked}
                    onClick={() => handleRemoveRow(idx)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bảng XML <span className="text-rose-600">*</span>
                    </label>
                    <Select
                      disabled={isLocked}
                      value={row.soBangXml}
                      onChange={(val) =>
                        updateRow(idx, { soBangXml: Number(val) })
                      }
                      containerClassName="mb-0"
                      height={32}
                      className="!text-xs"
                      options={SO_BANG_OPTIONS}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ID chi phí (ID_CP){" "}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isLocked}
                      placeholder="Số 18 ký tự"
                      value={row.idCp}
                      maxLength={25}
                      onChange={handleRowField(idx, "idCp")}
                      className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs font-mono focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      STT trong XML gốc
                    </label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={row.sttXml || ""}
                      onChange={(e) =>
                        updateRow(idx, { sttXml: Number(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs font-mono focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Ngày y lệnh (YYYYMMDDHHmm)
                    </label>
                    <input
                      type="text"
                      disabled={isLocked}
                      placeholder="YYYYMMDDHHmm"
                      value={row.ngayYl}
                      onChange={handleRowField(idx, "ngayYl")}
                      className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs font-mono focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Thao tác chi phí <span className="text-rose-600">*</span>
                    </label>
                    <Select
                      disabled={isLocked}
                      value={row.trangThai}
                      onChange={(val) =>
                        updateRow(idx, { trangThai: Number(val) })
                      }
                      containerClassName="mb-0"
                      height={32}
                      className="!text-xs"
                      options={[
                        { value: 2, label: "2 - Sửa thông tin chi phí" },
                        { value: 1, label: "1 - Thu hồi riêng dòng này" },
                        { value: 4, label: "4 - Xin ý kiến cấp có thẩm quyền" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Trường sai gốc
                    </label>
                    <input
                      type="text"
                      disabled={isLocked}
                      placeholder="vd: DON_GIA, SO_LUONG"
                      value={row.truongTtGoc}
                      onChange={handleRowField(idx, "truongTtGoc")}
                      className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs font-mono focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Giá trị cũ
                    </label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={row.ttGoc}
                      onChange={handleRowField(idx, "ttGoc")}
                      className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs font-mono focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Giá trị mới
                    </label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={row.ttDieuChinh}
                      onChange={handleRowField(idx, "ttDieuChinh")}
                      className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs font-mono font-bold focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Trường điều chỉnh{" "}
                      <span className="text-slate-400 font-normal">
                        (tự động)
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={row.truongTtDieuChinh || row.truongTtGoc || ""}
                      className="w-full h-8 px-2.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500 cursor-not-allowed"
                      title="Tự động = Trường sai gốc (QĐ 326 Mục 3.2)"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Mã lỗi / nội dung từ chối
                    </label>
                    <input
                      type="text"
                      disabled={isLocked}
                      placeholder="vd: SAI_GIA_CA_BHYT"
                      value={row.tuChoi || ""}
                      onChange={(e) => handleTuChoiChange(idx, e.target.value)}
                      className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs font-mono focus:border-indigo-600 outline-none uppercase"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Lý do điều chỉnh <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      disabled={isLocked}
                      rows={2}
                      placeholder="Bắt buộc: cơ sở KCB giải trình lý do điều chỉnh (Mục 3.2)..."
                      value={row.lyDoDieuChinh}
                      onChange={handleRowField(idx, "lyDoDieuChinh")}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between w-full pt-3 border-t border-slate-200 mt-2">
          <span className="text-[11px] text-slate-500">
            Sau khi lưu: <b className="text-slate-700">GD_DUYET = 0</b> (Chưa xử
            lý), <b className="text-slate-700">TT_KYSO = 0</b> (Chưa ký số)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="neutral" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              htmlType="submit"
              icon={<Save size={14} />}
              disabled={isLocked}
            >
              Lưu Điều Chỉnh Chi Phí
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
