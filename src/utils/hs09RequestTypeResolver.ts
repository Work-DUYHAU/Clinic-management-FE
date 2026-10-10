import type {
  ChiPhiDieuChinhItem,
  HoSoDieuChinh09Item,
  TtXml1DieuChinhItem,
} from "../types/hs09DieuChinhTypes";

export type Hs09UserAction =
  | "THU_HOI" // Người dùng bấm Thu hồi (toàn bộ hồ sơ hoặc chi phí được chọn)
  | "DIEU_CHINH" // Người dùng bấm Lưu / Sửa thông tin dữ liệu gốc
  | "XIN_Y_KIEN" // Người dùng bấm nút Xin ý kiến các cấp có thẩm quyền
  | "SAVE"; // Lưu thông thường

/**
 * Phạm vi dữ liệu áp dụng
 */
export type Hs09ScopeType =
  | "TOAN_BO_HOSO"
  | "DANH_SACH_CHIPHI"
  | "TRUONG_THONG_TIN";

export interface Hs09FieldContext {
  truongTtGoc?: string;
  ttGoc?: string;
  truongTtDieuChinh?: string;
  ttDieuChinh?: string;
  lyDoDieuChinh?: string;
}

export interface Hs09ResolveInput<
  T = ChiPhiDieuChinhItem | TtXml1DieuChinhItem,
> {
  action: Hs09UserAction;
  scope?: "HANH_CHINH" | "CHI_PHI" | "TONG_HOP";
  isRevokeAll?: boolean;
  selectedItems?: T[];
  fieldData?: Hs09FieldContext;
  fieldsList?: Hs09FieldContext[];
  lyDoDieuChinh?: string;
  currentTrangThai?: number;
}

export interface Hs09ResolveResult {
  trangThai: 1 | 2 | 4;
  trangThaiLabel: string;
  isValid: boolean;
  errors: string[];
  errorSummary?: string;
  appliedScope: Hs09ScopeType;
}

export function resolveHs09TrangThai<T = unknown>(
  input: Hs09ResolveInput<T>,
): Hs09ResolveResult {
  const errors: string[] = [];
  const action = input.action;
  const lyDo = (
    input.lyDoDieuChinh ??
    input.fieldData?.lyDoDieuChinh ??
    ""
  ).trim();
  const hasSelectedItems =
    Array.isArray(input.selectedItems) && input.selectedItems.length > 0;
  const isRevokeAll = Boolean(input.isRevokeAll);

  // 1. TRẠNG THÁI 1 - THU HỒI ĐỀ NGHỊ THANH TOÁN
  if (
    action === "THU_HOI" ||
    (action === "SAVE" && input.currentTrangThai === 1)
  ) {
    const appliedScope: Hs09ScopeType = isRevokeAll
      ? "TOAN_BO_HOSO"
      : "DANH_SACH_CHIPHI";

    // Kiểm tra danh sách được chọn hoặc cờ thu hồi toàn bộ
    if (!isRevokeAll && !hasSelectedItems) {
      errors.push(
        "Vui lòng chọn ít nhất một mục chi phí hoặc chọn 'Thu hồi toàn bộ hồ sơ'!",
      );
    }

    // Bắt buộc lý do thu hồi
    if (!lyDo) {
      errors.push(
        "Lý do thu hồi đề nghị thanh toán là bắt buộc theo quy định Mục 3.2 TT 12/2026/TT-BTC!",
      );
    }

    return {
      trangThai: 1,
      trangThaiLabel: "1 - Thu hồi đề nghị thanh toán",
      isValid: errors.length === 0,
      errors,
      errorSummary: errors.join(" \n"),
      appliedScope,
    };
  }
  // 2. TRẠNG THÁI 4 - XIN Ý KIẾN CÁC CẤP CÓ THẨM QUYỀN
  if (
    action === "XIN_Y_KIEN" ||
    (action === "SAVE" && input.currentTrangThai === 4)
  ) {
    const appliedScope: Hs09ScopeType = isRevokeAll
      ? "TOAN_BO_HOSO"
      : "DANH_SACH_CHIPHI";

    // Kiểm tra danh sách chi phí được chọn
    if (!isRevokeAll && !hasSelectedItems) {
      errors.push(
        "Vui lòng tích chọn danh sách các mục chi phí cần xin ý kiến cấp có thẩm quyền!",
      );
    }

    // Bắt buộc nội dung/lý do xin ý kiến
    if (!lyDo) {
      errors.push(
        "Nội dung/Lý do giải trình xin ý kiến là bắt buộc theo quy định!",
      );
    }

    return {
      trangThai: 4,
      trangThaiLabel: "4 - Xin ý kiến các cấp có thẩm quyền",
      isValid: errors.length === 0,
      errors,
      errorSummary: errors.join(" \n"),
      appliedScope,
    };
  }
  // 3. TRẠNG THÁI 2 - ĐIỀU CHỈNH THÔNG TIN DỮ LIỆU GỐC
  const appliedScope: Hs09ScopeType = "TRUONG_THONG_TIN";

  // Kiểm tra trường hợp danh sách trường (nếu truyền fieldsList)
  if (Array.isArray(input.fieldsList) && input.fieldsList.length > 0) {
    input.fieldsList.forEach((f, idx) => {
      const tg = (f.truongTtGoc ?? "").trim();
      const tdc = (f.truongTtDieuChinh ?? "").trim();
      if (!tg) {
        errors.push(
          `Mục #${idx + 1}: Trường thông tin gốc (TRUONG_TT_GOC) không được để trống!`,
        );
      }
      if (!tdc) {
        errors.push(
          `Mục #${idx + 1}: Trường thông tin điều chỉnh (TRUONG_TT_DIEUCHINH) không được để trống!`,
        );
      }
      const itemLyDo = (f.lyDoDieuChinh ?? lyDo).trim();
      if (!itemLyDo) {
        errors.push(
          `Mục #${idx + 1}: Lý do điều chỉnh (LYDO_DIEUCHINH) là bắt buộc!`,
        );
      }
    });
  } else if (input.fieldData) {
    // Kiểm tra trường đơn lẻ
    const truongGoc = (input.fieldData.truongTtGoc ?? "").trim();
    const truongDc = (input.fieldData.truongTtDieuChinh ?? "").trim();

    if (!truongGoc) {
      errors.push(
        "Trường thông tin gốc (TRUONG_TT_GOC) không được để trống khi thực hiện điều chỉnh!",
      );
    }
    if (!truongDc) {
      errors.push(
        "Trường thông tin điều chỉnh (TRUONG_TT_DIEUCHINH) không được để trống khi thực hiện điều chỉnh!",
      );
    }
    if (!lyDo) {
      errors.push(
        "Lý do điều chỉnh (LYDO_DIEUCHINH) là bắt buộc theo Mục 3.2 Thông tư 12/2026/TT-BTC!",
      );
    }
  } else {
    if (!lyDo) {
      errors.push("Lý do điều chỉnh (LYDO_DIEUCHINH) là bắt buộc!");
    }
    if (input.scope === "HANH_CHINH" || input.scope === "CHI_PHI") {
      errors.push(
        "Vui lòng nhập/thay đổi ít nhất một trường thông tin để thực hiện điều chỉnh!",
      );
    }
  }

  return {
    trangThai: 2,
    trangThaiLabel: "2 - Điều chỉnh thông tin dữ liệu gốc",
    isValid: errors.length === 0,
    errors,
    errorSummary: errors.join(" \n"),
    appliedScope,
  };
}

/**
 * Hàm kiểm tra nhanh cho 1 dòng chi phí đơn lẻ
 */
export function validateHs09ChiPhiRow(
  row: Partial<ChiPhiDieuChinhItem>,
  action: Hs09UserAction = "DIEU_CHINH",
): Hs09ResolveResult {
  return resolveHs09TrangThai({
    action,
    scope: "CHI_PHI",
    fieldData: {
      truongTtGoc: row.truongTtGoc,
      ttGoc: row.ttGoc,
      truongTtDieuChinh: row.truongTtDieuChinh || row.truongTtGoc,
      ttDieuChinh: row.ttDieuChinh,
      lyDoDieuChinh: row.lyDoDieuChinh,
    },
    lyDoDieuChinh: row.lyDoDieuChinh,
  });
}

/**
 * Hàm xử lý áp dụng trạng thái hàng loạt cho danh sách chi phí được chọn
 */
export function applyTrangThaiToSelectedChiPhi(
  rows: ChiPhiDieuChinhItem[],
  selectedIndicesOrIds: (number | string)[],
  action: "THU_HOI" | "XIN_Y_KIEN" | "DIEU_CHINH",
  lyDoChung?: string,
): {
  updatedRows: ChiPhiDieuChinhItem[];
  result: Hs09ResolveResult;
} {
  const selectedSet = new Set(selectedIndicesOrIds);
  const selectedItems = rows.filter(
    (r, idx) => selectedSet.has(idx) || (r.idCp && selectedSet.has(r.idCp)),
  );

  const resolveResult = resolveHs09TrangThai({
    action,
    scope: "CHI_PHI",
    selectedItems,
    lyDoDieuChinh: lyDoChung,
  });

  if (!resolveResult.isValid) {
    return { updatedRows: rows, result: resolveResult };
  }

  const newTrangThai = resolveResult.trangThai;
  const updatedRows = rows.map((r, idx) => {
    const isSelected =
      selectedSet.has(idx) || (Boolean(r.idCp) && selectedSet.has(r.idCp!));
    if (!isSelected) return r;

    return {
      ...r,
      trangThai: newTrangThai,
      lyDoDieuChinh: lyDoChung?.trim() || r.lyDoDieuChinh,
    };
  });

  return { updatedRows, result: resolveResult };
}

export function getEffectiveHs09TrangThai(
  item?: Partial<HoSoDieuChinh09Item> | null,
): 1 | 2 | 4 {
  if (!item) return 2;

  const hasXml1Dc =
    Array.isArray(item.dsXml1DieuChinh) && item.dsXml1DieuChinh.length > 0;
  const hasChiPhiDc =
    Array.isArray(item.dsChiPhiDieuChinh) && item.dsChiPhiDieuChinh.length > 0;

  // Nếu có trường dữ liệu điều chỉnh gốc hoặc chi phí -> Chắc chắn là Điều chỉnh (Trạng thái 2)
  if (hasXml1Dc || hasChiPhiDc) {
    return 2;
  }

  // Trường hợp cả hai danh sách rỗng (KB 4):
  const rawTrangThai = Number(item.ttXml1?.trangThai);
  if (rawTrangThai === 4) return 4;
  if (rawTrangThai === 2) return 2;
  return 1;
}
export function getEffectiveHs09TrangThaiLabel(trangThai: 1 | 2 | 4): string {
  switch (trangThai) {
    case 1:
      return "1 - Thu hồi";
    case 4:
      return "4 - Xin ý kiến";
    case 2:
    default:
      return "2 - Điều chỉnh";
  }
}
