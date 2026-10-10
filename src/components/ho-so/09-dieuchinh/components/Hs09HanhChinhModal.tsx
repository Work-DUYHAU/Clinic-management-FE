import React, { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
import type {
  HoSoDieuChinh09Item,
  TtXml1DieuChinhItem,
} from "../../../../types/hs09DieuChinhTypes";
import { useToast } from "../../../../context/ToastContext";
import { formatYmdHmDisplay } from "../../../../utils/shared/excelXmlShared";
import { Modal, Select } from "../../../../shared/components";
import { isHs09Locked } from "../../../../utils/hs09Helpers";
import {
  resolveHs09TrangThai,
  getEffectiveHs09TrangThai,
  type Hs09UserAction,
} from "../../../../utils/hs09RequestTypeResolver";
import { Hs09LockBanner } from "./Hs09LockBanner";

interface Hs09HanhChinhModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HoSoDieuChinh09Item | null;
  onSave: (updatedItem: HoSoDieuChinh09Item) => void;
}

export const Hs09HanhChinhModal: React.FC<Hs09HanhChinhModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const toast = useToast();

  const [trangThai, setTrangThai] = useState<number>(2);
  const [maTheDc, setMaTheDc] = useState("");
  const [ngayVaoDc, setNgayVaoDc] = useState("");
  const [ngayRaDc, setNgayRaDc] = useState("");
  const [ngaySinhDc, setNgaySinhDc] = useState("");
  const [hoTenDc, setHoTenDc] = useState("");
  const [maBnDc, setMaBnDc] = useState("");
  const [maDkbdDc, setMaDkbdDc] = useState("");
  const [maBenhChinhDc, setMaBenhChinhDc] = useState("");
  const [gioiTinhDc, setGioiTinhDc] = useState<string>("");
  const [lyDoDieuChinh, setLyDoDieuChinh] = useState("");

  useEffect(() => {
    if (isOpen && item) {
      setTrangThai(getEffectiveHs09TrangThai(item));

      // Pre-fill fields from dsXml1DieuChinh if already existing
      const findDc = (truong: string) =>
        item.dsXml1DieuChinh.find(
          (d) =>
            d.truongTtGoc?.toUpperCase() === truong ||
            d.truongTtDieuChinh?.toUpperCase() === truong,
        );

      setMaTheDc(findDc("MA_THE")?.ttDieuChinh || "");
      setNgayVaoDc(findDc("NGAY_VAO")?.ttDieuChinh || "");
      setNgayRaDc(findDc("NGAY_RA")?.ttDieuChinh || "");
      setNgaySinhDc(findDc("NGAY_SINH")?.ttDieuChinh || "");
      setHoTenDc(findDc("HO_TEN")?.ttDieuChinh || "");
      setMaBnDc(findDc("MA_BN")?.ttDieuChinh || "");
      setMaDkbdDc(findDc("MA_DKBD")?.ttDieuChinh || "");
      setMaBenhChinhDc(findDc("MA_BENH_CHINH")?.ttDieuChinh || "");
      setGioiTinhDc(findDc("GIOI_TINH")?.ttDieuChinh || "");

      const existingLydo = item.dsXml1DieuChinh[0]?.lyDoDieuChinh || "";
      setLyDoDieuChinh(existingLydo);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isLocked = isHs09Locked(item);

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

    if (!lyDoDieuChinh.trim()) {
      toast.error(
        "Lý do điều chỉnh là bắt buộc theo quy định Mục 3.1 Thông tư 12/2026/TT-BTC!",
        "Thiếu thông tin",
      );
      return;
    }

    // Build dsXml1DieuChinh list
    const newXml1List: TtXml1DieuChinhItem[] = [];

    const addIfChanged = (
      truong: string,
      ttGoc: string,
      ttDieuChinh: string,
    ) => {
      if (ttDieuChinh && ttDieuChinh !== ttGoc) {
        newXml1List.push({
          stt: newXml1List.length + 1,
          truongTtGoc: truong,
          ttGoc: ttGoc || "",
          truongTtDieuChinh: truong,
          ttDieuChinh,
          lyDoDieuChinh: lyDoDieuChinh.trim(),
        });
      }
    };

    addIfChanged("MA_THE", item.ttXml1.maThe, maTheDc.trim());
    addIfChanged("HO_TEN", item.ttXml1.hoTen, hoTenDc.trim());
    addIfChanged("MA_BN", item.ttXml1.maBn, maBnDc.trim());
    addIfChanged("NGAY_VAO", item.ttXml1.ngayVao, ngayVaoDc.trim());
    addIfChanged("NGAY_RA", item.ttXml1.ngayRa, ngayRaDc.trim());
    addIfChanged("NGAY_SINH", item.ttXml1.ngaySinh || "", ngaySinhDc.trim());
    addIfChanged("MA_DKBD", item.ttXml1.maDkbd || "", maDkbdDc.trim());
    addIfChanged(
      "MA_BENH_CHINH",
      item.ttXml1.maBenhChinh || "",
      maBenhChinhDc.trim(),
    );
    addIfChanged(
      "GIOI_TINH",
      item.ttXml1.gioiTinh ? String(item.ttXml1.gioiTinh) : "",
      gioiTinhDc.trim(),
    );

    // If it's a revocation (1) or petition (4) and no specific field changed, record an entry
    if (newXml1List.length === 0 && (trangThai === 1 || trangThai === 4)) {
      newXml1List.push({
        stt: 1,
        truongTtGoc: "TOAN_BO_HOSO",
        ttGoc: "",
        truongTtDieuChinh: "TOAN_BO_HOSO",
        ttDieuChinh: trangThai === 1 ? "THU_HOI" : "XIN_Y_KIEN",
        lyDoDieuChinh: lyDoDieuChinh.trim(),
      });
    }

    // Xác định và kiểm tra loại yêu cầu (trạng thái 1, 2, 4) kết hợp ngữ cảnh và điều kiện phụ thuộc
    const userAction: Hs09UserAction =
      trangThai === 1
        ? "THU_HOI"
        : trangThai === 4
          ? "XIN_Y_KIEN"
          : "DIEU_CHINH";

    const resolveRes = resolveHs09TrangThai({
      action: userAction,
      scope: "HANH_CHINH",
      isRevokeAll: trangThai === 1 || trangThai === 4,
      fieldsList:
        newXml1List.length > 0
          ? newXml1List.map((x) => ({
              truongTtGoc: x.truongTtGoc,
              ttGoc: x.ttGoc,
              truongTtDieuChinh: x.truongTtDieuChinh,
              ttDieuChinh: x.ttDieuChinh,
              lyDoDieuChinh: x.lyDoDieuChinh,
            }))
          : undefined,
      lyDoDieuChinh: lyDoDieuChinh.trim(),
      currentTrangThai: trangThai,
    });

    if (!resolveRes.isValid) {
      toast.error(
        resolveRes.errors[0] || "Dữ liệu không hợp lệ theo quy định!",
        "Không đúng quy định điều chỉnh",
      );
      return;
    }

    const updatedItem: HoSoDieuChinh09Item = {
      ...item,
      ttXml1: {
        ...item.ttXml1,
        trangThai,
        maThe: maTheDc.trim() || item.ttXml1.maThe,
        hoTen: hoTenDc.trim() || item.ttXml1.hoTen,
        maBn: maBnDc.trim() || item.ttXml1.maBn,
        ngayVao: ngayVaoDc.trim() || item.ttXml1.ngayVao,
        ngayRa: ngayRaDc.trim() || item.ttXml1.ngayRa,
        ngaySinh: ngaySinhDc.trim() || item.ttXml1.ngaySinh,
        maDkbd: maDkbdDc.trim() || item.ttXml1.maDkbd,
        maBenhChinh: maBenhChinhDc.trim() || item.ttXml1.maBenhChinh,
        gioiTinh: gioiTinhDc ? Number(gioiTinhDc) : item.ttXml1.gioiTinh,
      },
      dsXml1DieuChinh:
        newXml1List.length > 0 ? newXml1List : item.dsXml1DieuChinh,
      gdDuyet: 0, // 0 = Chưa xử lý (Mục 3.1)
      ttKySo: 0, // 0 = Chưa ký số
      loaiThaoTac: "dang_thao_tac",
    };

    onSave(updatedItem);
    toast.success(
      "Lưu thông tin điều chỉnh thành công! (GD_DUYET=0, TT_KYSO=0)",
      "Thành công",
    );
    onClose();
  };

  const gioiTinhText =
    item.ttXml1.gioiTinh === 1
      ? "1 - Nam"
      : item.ttXml1.gioiTinh === 2
        ? "2 - Nữ"
        : "Chưa rõ";

  const tinhTrangDuyetText =
    item.ttXml1.tinhTrangDuyet === 1
      ? "Đã duyệt"
      : item.ttXml1.tinhTrangDuyet === 2
        ? "Từ chối"
        : "Chưa duyệt";

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      width={960}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <User size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Điều chỉnh thông tin hành chính (XML1)
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                LK: {item.ttXml1.maLk}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Theo Mục 3.1 Phụ lục I Thông tư số 12/2026/TT-BTC
            </span>
          </div>
        </div>
      }
    >
      {/* Lock warning if signed or sent */}
      <Hs09LockBanner item={item} />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* 1. THÔNG TIN GỐC (CHỈ XEM, KHÔNG SỬA) */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Thông tin gốc
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                XML1_ID: {String(item.ttXml1.xml1Id || "—")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Mã thẻ BHYT
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {item.ttXml1.maThe || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Họ và tên
                </span>
                <span className="font-bold text-slate-900">
                  {item.ttXml1.hoTen || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Mã bệnh nhân
                </span>
                <span className="font-mono font-medium">
                  {item.ttXml1.maBn || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Giới tính
                </span>
                <span className="font-medium">{gioiTinhText}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Ngày vào
                </span>
                <span className="font-mono">
                  {formatYmdHmDisplay(item.ttXml1.ngayVao)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Ngày ra
                </span>
                <span className="font-mono">
                  {formatYmdHmDisplay(item.ttXml1.ngayRa)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Ngày sinh
                </span>
                <span className="font-mono">{item.ttXml1.ngaySinh || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Mã ĐKBĐ
                </span>
                <span className="font-mono font-bold">
                  {item.ttXml1.maDkbd || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Mã bệnh chính
                </span>
                <span className="font-mono font-bold text-indigo-700">
                  {item.ttXml1.maBenhChinh || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Tình trạng duyệt
                </span>
                <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-200 text-slate-700">
                  {tinhTrangDuyetText}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-slate-500 block">
                  Lý do từ chối tự động (nếu có)
                </span>
                <span className="text-rose-700 font-medium">
                  {item.ttXml1.lyDoTuChoi || "Không có từ chối tự động"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. THÔNG TIN ĐIỀU CHỈNH (NGƯỜI DÙNG NHẬP) */}
          <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Thông tin điều chỉnh
              </span>
              <span className="text-[11px] text-rose-600 font-semibold">*</span>
            </div>

            {/* Trạng thái yêu cầu */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Trạng thái điều chỉnh <span className="text-rose-600">*</span>
              </label>
              <Select
                disabled={isLocked}
                value={trangThai}
                onChange={(val) => setTrangThai(Number(val))}
                containerClassName="mb-0 w-full sm:w-80"
                height={32}
                className="!text-xs font-semibold"
                options={[
                  { value: 2, label: "2 - Điều chỉnh thông tin dữ liệu gốc" },
                  { value: 1, label: "1 - Thu hồi đề nghị thanh toán" },
                  { value: 4, label: "4 - Xin ý kiến các cấp có thẩm quyền" },
                ]}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {trangThai === 1
                  ? "Thu hồi toàn bộ hồ sơ khỏi đề nghị thanh toán."
                  : trangThai === 4
                    ? "Đề nghị xin ý kiến cấp có thẩm quyền (sau duyệt không chạy lại giám định)."
                    : "Sửa đổi thông tin hành chính của bệnh nhân."}
              </p>
            </div>

            {/* Các trường điều chỉnh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mã thẻ điều chỉnh
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.maThe}
                  value={maTheDc}
                  onChange={(e) => setMaTheDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-blue-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Họ tên điều chỉnh
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.hoTen}
                  value={hoTenDc}
                  onChange={(e) => setHoTenDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mã bệnh nhân DC
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.maBn}
                  value={maBnDc}
                  onChange={(e) => setMaBnDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ngày vào điều chỉnh (YYYYMMDDHHmm)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.ngayVao}
                  value={ngayVaoDc}
                  onChange={(e) => setNgayVaoDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ngày ra điều chỉnh (YYYYMMDDHHmm)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.ngayRa}
                  value={ngayRaDc}
                  onChange={(e) => setNgayRaDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ngày sinh điều chỉnh (YYYYMMDD)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.ngaySinh || "YYYYMMDD"}
                  value={ngaySinhDc}
                  onChange={(e) => setNgaySinhDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mã ĐKBĐ điều chỉnh
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.maDkbd || "Mã 5 số"}
                  value={maDkbdDc}
                  onChange={(e) => setMaDkbdDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mã bệnh chính DC
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder={item.ttXml1.maBenhChinh || "Mã ICD10"}
                  value={maBenhChinhDc}
                  onChange={(e) => setMaBenhChinhDc(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Giới tính điều chỉnh
                </label>
                <Select
                  disabled={isLocked}
                  value={gioiTinhDc}
                  onChange={(val) => setGioiTinhDc(String(val ?? ""))}
                  containerClassName="mb-0"
                  height={32}
                  className="!text-xs"
                  options={[
                    { value: "", label: "Giữ nguyên" },
                    { value: "1", label: "1 - Nam" },
                    { value: "2", label: "2 - Nữ" },
                  ]}
                />
              </div>
            </div>

            {/* Lý do điều chỉnh (BẮT BUỘC) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Lý do điều chỉnh <span className="text-rose-600">*</span>
              </label>
              <textarea
                disabled={isLocked}
                rows={3}
                placeholder="Nhập lý do cơ sở KCB đề nghị điều chỉnh thông tin hành chính (bắt buộc theo Mục 3.1)..."
                value={lyDoDieuChinh}
                onChange={(e) => setLyDoDieuChinh(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full pt-3 border-t border-slate-200 mt-2">
          <span className="text-[11px] text-slate-500">
            Sau khi lưu: <b className="text-slate-700">GD_DUYET = 0</b> (Chưa xử
            lý), <b className="text-slate-700">TT_KYSO = 0</b> (Chưa ký số)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold text-xs cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLocked}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors ${
                isLocked
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              }`}
            >
              <Save size={14} /> Lưu Thông Tin Điều Chỉnh
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
