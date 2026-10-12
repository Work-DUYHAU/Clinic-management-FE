import { useState, useEffect, useCallback } from "react";
import type { Hs01TongHopItem } from "../../../../types/hs01TongHopTypes";
import { validateHs01Data } from "../../../../utils/validators";
import { DEFAULT_MA_CSKCB, getTodayYmd } from "../../../../utils/shared/excelXmlShared";
import { useToast } from "../../../../context/ToastContext";

export const getDefaultHs01FormData = (count = 0): Hs01TongHopItem => {
  const ymd = getTodayYmd();
  return {
    id: "",
    stt: count + 1,
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "1",
    maTheBhyt: "",
    maBenhChinh: "",
    ngayVao: `${ymd}0800`,
    ngayVaoNoiTru: "",
    ngayRa: `${ymd}1100`,
    soNgayDtri: 1,
    maLoaiKcb: "01",
    tTongchiBv: 0,
    tTongchiBh: 0,
    tBhtt: 0,
    tBncct: 0,
    tBntt: 0,
    tNguonkhac: 0,
    maCskcb: DEFAULT_MA_CSKCB,
    namQt: Number(ymd.slice(0, 4)),
    thangQt: ymd.slice(4, 6),
    trangThai: "hop_le",
    isValid: true,
    errors: [],
  };
};

export interface UseHs01EditModalHandlersParams {
  isOpen: boolean;
  initialData: Hs01TongHopItem | null;
  totalItemsCount?: number;
  onSave: (item: Hs01TongHopItem) => void;
  onClose: () => void;
}

/**
 * Hook quản lý form state và toàn bộ action handlers cho modal chỉnh sửa/thêm mới Hs01.
 * Đưa toàn bộ các hàm onChange, onSubmit, updateCost ra ngoài file riêng để dễ tái sử dụng và kiểm thử.
 */
export function useHs01EditModalHandlers({
  isOpen,
  initialData,
  totalItemsCount = 0,
  onSave,
  onClose,
}: UseHs01EditModalHandlersParams) {
  const toast = useToast();
  const [form, setForm] = useState<Hs01TongHopItem>(() =>
    getDefaultHs01FormData(totalItemsCount),
  );

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...initialData } : getDefaultHs01FormData(totalItemsCount));
    }
  }, [isOpen, initialData, totalItemsCount]);

  const updateCost = useCallback((field: keyof Hs01TongHopItem, val: number) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === "tTongchiBh") {
        updated.tBhtt = Math.round(val * 0.8);
        updated.tBncct = Math.max(0, val - updated.tBhtt);
        updated.tTongchiBv =
          updated.tTongchiBh + (updated.tBntt || 0) + (updated.tNguonkhac || 0);
      } else if (field === "tBhtt") {
        updated.tBncct = Math.max(0, (updated.tTongchiBh || 0) - val);
      } else if (field === "tBntt" || field === "tNguonkhac") {
        updated.tTongchiBv =
          (updated.tTongchiBh || 0) + (updated.tBntt || 0) + (updated.tNguonkhac || 0);
      }
      return updated;
    });
  }, []);

  // Handlers cho từng trường thông tin
  const handleHoTenChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, hoTen: v.toUpperCase() }));
  }, []);

  const handleMaTheChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, maTheBhyt: v.toUpperCase() }));
  }, []);

  const handleGioiTinhChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, gioiTinh: v }));
  }, []);

  const handleNgaySinhChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, ngaySinh: v }));
  }, []);

  const handleSttChange = useCallback((v: string | number) => {
    setForm((prev) => ({ ...prev, stt: Number(v) }));
  }, []);

  const handleMaCskcbChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, maCskcb: v }));
  }, []);

  const handleThangQtChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setForm((prev) => ({ ...prev, thangQt: val }));
    },
    [],
  );

  const handleNamQtChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setForm((prev) => ({ ...prev, namQt: val }));
    },
    [],
  );

  const handleMaBenhChinhChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, maBenhChinh: v.toUpperCase() }));
  }, []);

  const handleMaLoaiKcbChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, maLoaiKcb: v }));
  }, []);

  const handleNgayVaoChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, ngayVao: v }));
  }, []);

  const handleNgayVaoNoiTruChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, ngayVaoNoiTru: v }));
  }, []);

  const handleNgayRaChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, ngayRa: v }));
  }, []);

  const handleSoNgayDtriChange = useCallback((v: string | number) => {
    setForm((prev) => ({ ...prev, soNgayDtri: Number(v) }));
  }, []);

  const handleTTongchiBvChange = useCallback(
    (v: string | number) => updateCost("tTongchiBv", Number(v)),
    [updateCost],
  );

  const handleTTongchiBhChange = useCallback(
    (v: string | number) => updateCost("tTongchiBh", Number(v)),
    [updateCost],
  );

  const handleTBhttChange = useCallback(
    (v: string | number) => updateCost("tBhtt", Number(v)),
    [updateCost],
  );

  const handleTBncctChange = useCallback((v: string | number) => {
    setForm((prev) => ({ ...prev, tBncct: Number(v) }));
  }, []);

  const handleTBnttChange = useCallback(
    (v: string | number) => updateCost("tBntt", Number(v)),
    [updateCost],
  );

  const handleTNguonkhacChange = useCallback(
    (v: string | number) => updateCost("tNguonkhac", Number(v)),
    [updateCost],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validateHs01Data(form);
      if (errors.length > 0)
        return toast.warning(errors[0], "Dữ Liệu Chưa Hợp Lệ");

      onSave({
        ...form,
        hoTen: form.hoTen.trim(),
        maTheBhyt: form.maTheBhyt.trim().toUpperCase(),
        isValid: true,
        errors: [],
      });
    },
    [form, onSave, toast],
  );

  return {
    form,
    handleSubmit,
    handleClose: onClose,
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
  };
}
