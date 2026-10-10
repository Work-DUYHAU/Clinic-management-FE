import React from "react";
import { ShieldAlert } from "lucide-react";
import type { HoSoDieuChinh09Item } from "../../../../types/hs09DieuChinhTypes";
import { isHs09Locked } from "../../../../utils/hs09Helpers";

interface Hs09LockBannerProps {
  item: HoSoDieuChinh09Item;
}

/**
 * Banner cảnh báo hồ sơ bị khóa (đã ký số / đã gửi giám định).
 * Dùng chung cho các modal điều chỉnh Mục 3.1 - 3.4 TT 12/2026/TT-BTC.
 */
export const Hs09LockBanner: React.FC<Hs09LockBannerProps> = ({ item }) => {
  if (!isHs09Locked(item)) return null;

  return (
    <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
      <ShieldAlert size={15} className="text-amber-600 shrink-0" />
      <span>
        {item.tinhTrangGui === 2
          ? "Hồ sơ đã gửi giám định (TINHTRANGGUI = 2) — Bị khóa toàn bộ, không thể chỉnh sửa."
          : "Hồ sơ đã ký số (TT_KYSO = 2) — Vui lòng nhấn 'Hủy ký số' tại bảng chính trước khi điều chỉnh."}
      </span>
    </div>
  );
};
