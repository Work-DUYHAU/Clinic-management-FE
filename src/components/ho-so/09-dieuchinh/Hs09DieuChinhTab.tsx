import React, { useState, useMemo } from "react";
import type { WorkBook } from "xlsx";
import type {
  HoSoDieuChinh09Item,
  ParseHs09ExcelResult,
  SendHs09GatewayResult,
  SendHs09BatchItemResult,
  ChiPhiDieuChinhItem,
} from "../../../types/hs09DieuChinhTypes";
import { HS09_SCHEMA_FIELDS } from "../../../utils/constants/hs09DieuChinhConstants";
import {
  parseHs09ExcelFile,
  parseHs09Worksheet,
  downloadHs09ExcelTemplate,
  exportHs09ToExcel,
  sendHs09ToBhxhGateway,
} from "../../../utils/hs09DieuChinhXmlEngine";
import { useToast } from "../../../context/ToastContext";
import {
  Hs09Dropzone,
  Hs09Table,
  Hs09EditModal,
  Hs09XmlModal,
  Hs09DetailModal,
  Hs09HanhChinhModal,
  Hs09ChiPhiModal,
  Hs09AttachmentModal,
  Hs09PrintPdfModal,
} from "./components";
import { SchemaMappingModal } from "../../danh-muc/common/SchemaMappingModal";
import { SchemaMappingCard } from "../../danh-muc/common/SchemaMappingCard";
import { useSchemaMappingProps } from "../../../hooks";
import { useRegisterSignModal } from "../../../context/SignModalContext";
import { BhxhChungTuService } from "../../../services/bhxh/bhxhChungTuService";
import {
  generateUUID,
  getTodayIsoDate,
} from "../../../utils/shared/excelXmlShared";

interface Hs09DieuChinhTabProps {
  items?: HoSoDieuChinh09Item[];
  onItemsChange?: (
    updater:
      | HoSoDieuChinh09Item[]
      | ((prev: HoSoDieuChinh09Item[]) => HoSoDieuChinh09Item[]),
  ) => void;
}

export const Hs09DieuChinhTab: React.FC<Hs09DieuChinhTabProps> = ({
  items: propItems,
  onItemsChange,
}) => {
  const toast = useToast();
  const [internalItems, setInternalItems] = useState<HoSoDieuChinh09Item[]>([]);
  const items = propItems ?? internalItems;
  const setItems = (
    updater:
      | HoSoDieuChinh09Item[]
      | ((prev: HoSoDieuChinh09Item[]) => HoSoDieuChinh09Item[]),
  ) => {
    if (onItemsChange) {
      onItemsChange(updater);
    } else {
      setInternalItems((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNhomLoi, setFilterNhomLoi] = useState("all");
  const [filterSoBangXml, setFilterSoBangXml] = useState("all");
  const [filterTrangThai, setFilterTrangThai] = useState("all");

  // Filters chuẩn Thông tư 12/2026/TT-BTC Mục 2.1
  const [filterTinhTrangGui, setFilterTinhTrangGui] = useState("all");
  const [filterLoaiThaoTac, setFilterLoaiThaoTac] = useState("all");
  const [filterKyQt, setFilterKyQt] = useState("all");
  const [filterTuNgay, setFilterTuNgay] = useState("");
  const [filterDenNgay, setFilterDenNgay] = useState("");

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseHs09ExcelResult | null>(null);

  // Modals
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<"smartca" | "base64">(
    "smartca",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HoSoDieuChinh09Item | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<HoSoDieuChinh09Item | null>(
    null,
  );
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Modals chuyên biệt theo Thông tư 12/2026/TT-BTC
  const [isHanhChinhModalOpen, setIsHanhChinhModalOpen] = useState(false);
  const [hanhChinhItem, setHanhChinhItem] =
    useState<HoSoDieuChinh09Item | null>(null);

  const [isChiPhiModalOpen, setIsChiPhiModalOpen] = useState(false);
  const [chiPhiItem, setChiPhiItem] = useState<HoSoDieuChinh09Item | null>(
    null,
  );

  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachmentItem, setAttachmentItem] =
    useState<HoSoDieuChinh09Item | null>(null);

  const [isPrintPdfModalOpen, setIsPrintPdfModalOpen] = useState(false);
  const [printPdfItem, setPrintPdfItem] = useState<HoSoDieuChinh09Item | null>(
    null,
  );

  const [signingItems, setSigningItems] = useState<HoSoDieuChinh09Item[]>([]);
  const [selectedTableItems, setSelectedTableItems] = useState<
    HoSoDieuChinh09Item[]
  >([]);

  const openSignModal = (selected?: HoSoDieuChinh09Item[]) => {
    if (items.length === 0) {
      toast.warning(
        "Chưa có hồ sơ điều chỉnh nào để ký số! Hãy nạp file hoặc thêm hồ sơ trước.",
        "Không có dữ liệu",
      );
      return;
    }
    const explicitSelected =
      selected && selected.length > 0
        ? selected
        : selectedTableItems.length > 0
          ? selectedTableItems
          : items.length === 1
            ? [items[0]]
            : null;

    const targets = explicitSelected ?? items.slice(0, 10);
    // Luôn map lại targets theo items mới nhất để bảo toàn signedXml và signedAt
    const freshTargets = targets.map(
      (t) => items.find((i) => i.id === t.id) || t,
    );
    setSigningItems(freshTargets);
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
    // Tiền kết nối Cổng BHXH ngay khi mở modal ký số để token sẵn sàng 0ms khi gửi
    BhxhChungTuService.takeToken().catch(() => {});

    // Chỉ thông báo nhắc nhở khi có NHIỀU hồ sơ (> 1) VÀ người dùng CHƯA chọn hồ sơ nào cụ thể
    if (!explicitSelected && items.length > 1) {
      toast.info(
        `Bạn chưa chọn hồ sơ nào — hệ thống sẽ xử lý ${targets.length} hồ sơ đầu tiên trong danh sách. Hãy tick chọn hồ sơ cụ thể trong bảng nếu muốn kiểm soát chính xác.`,
        "Chưa chọn hồ sơ",
      );
    }
  };

  // Dùng chung 1 modal duy nhất: Bấm "Ký Số" ở Navbar hay ở Dropzone đều mở modal này
  useRegisterSignModal(true, () => openSignModal(selectedTableItems));

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const result = await parseHs09ExcelFile(file);
      setItems(result.items);
      setFileUploadStats(result);
      setSelectedTableItems([]);
      setSigningItems([]);
      // Tiền kết nối Cổng BHXH trong lúc người dùng xem dữ liệu
      BhxhChungTuService.takeToken().catch(() => {});

      const isXml = file.name.toLowerCase().endsWith(".xml");
      const signedCount = result.items.filter((i) => i.ttKySo === 2).length;
      const signedNote =
        signedCount > 0 ? ` (${signedCount} hồ sơ đã có chữ ký số)` : "";

      toast.success(
        `Đã nạp thành công ${result.items.length} hồ sơ điều chỉnh 09/BH từ tệp "${file.name}"${signedNote}`,
        isXml
          ? "Nạp Tệp XML 09/BH Thành Công"
          : "Nạp File Excel Mẫu 09/BH Thành Công",
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lỗi đọc tệp dữ liệu Hồ sơ điều chỉnh 09/BH!";
      toast.error(msg, "Lỗi Đọc File");
    } finally {
      setIsLoadingFile(false);
      e.target.value = "";
    }
  };

  const handleSwitchSheet = (sheetName: string) => {
    if (!fileUploadStats?.workbook) return;
    try {
      const wb = fileUploadStats.workbook as WorkBook;
      const ws = wb.Sheets[sheetName];
      const result = parseHs09Worksheet(
        ws,
        sheetName,
        fileUploadStats.availableSheets,
        fileUploadStats.fileName,
        wb,
      );
      setItems(result.items);
      setFileUploadStats(result);
      toast.info(
        `Đã chuyển sang Sheet "${sheetName}" (${result.items.length} hồ sơ)`,
        "Chuyển Sheet Dữ Liệu",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi chuyển sheet";
      toast.error(msg, "Lỗi Đọc Sheet");
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadHs09ExcelTemplate();
      toast.success(
        "Đã tải tệp Excel mẫu chuẩn Mẫu 09/BH thành công!",
        "Tải File Mẫu",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi tải tệp mẫu";
      toast.error(msg, "Lỗi");
    }
  };

  const handleClearData = () => {
    toast.showConfirm({
      title: "Xác nhận xóa toàn bộ hồ sơ",
      content:
        "Bạn có chắc chắn muốn xóa toàn bộ danh sách hồ sơ 09/BH hiện tại?",
      danger: true,
      okText: "Xóa tất cả",
      cancelText: "Hủy",
      onOk: () => {
        setItems([]);
        setFileUploadStats(null);
        setSigningItems([]);
        setSelectedTableItems([]);
        toast.warning(
          "Đã xóa toàn bộ dữ liệu bảng hồ sơ điều chỉnh",
          "Xóa Dữ Liệu",
        );
      },
    });
  };

  // CRUD
  const handleAddNew = () => {
    setEditingItem(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (item: HoSoDieuChinh09Item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: HoSoDieuChinh09Item) => {
    toast.showConfirm({
      title: "Xác nhận xóa hồ sơ",
      content: `Bạn có chắc chắn muốn xóa hồ sơ điều chỉnh của bệnh nhân "${item.ttXml1.hoTen}" (LK: ${item.ttXml1.maLk})?`,
      danger: true,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(
          `Đã xóa hồ sơ điều chỉnh LK "${item.ttXml1.maLk}"`,
          "Xóa Hồ Sơ",
        );
      },
    });
  };

  const handleSaveItem = (savedItem: HoSoDieuChinh09Item) => {
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id ? { ...savedItem, id: editingItem.id } : i,
        ),
      );
      toast.success(
        `Đã cập nhật hồ sơ điều chỉnh LK "${savedItem.ttXml1.maLk}"`,
        "Cập Nhật Thành Công",
      );
    } else {
      const newItem: HoSoDieuChinh09Item = {
        ...savedItem,
        id: `hs09-${generateUUID()}`,
      };
      setItems((prev) => [newItem, ...prev]);
      toast.success(
        `Đã thêm mới hồ sơ điều chỉnh LK "${savedItem.ttXml1.maLk}"`,
        "Thêm Mới Thành Công",
      );
    }
    setIsEditModalOpen(false);
  };

  const handleViewDetail = (item: HoSoDieuChinh09Item) => {
    setDetailItem(item);
    setIsDetailModalOpen(true);
  };

  const handleBulkSign = (selected: HoSoDieuChinh09Item[]) => {
    if (selected.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 hồ sơ để ký số!");
      return;
    }
    if (selected.length > 10) {
      toast.warning("Quy chuẩn BHXH quy định mỗi lần ký tối đa 10 hồ sơ!");
      return;
    }
    setSigningItems(selected);
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  };

  const handleUnsign = (itemsToUnsign: HoSoDieuChinh09Item[]) => {
    if (itemsToUnsign.length === 0) return;
    toast.showConfirm({
      title: "Xác nhận hủy chữ ký số",
      content: `Bạn có chắc chắn muốn hủy chữ ký số của ${itemsToUnsign.length} hồ sơ? Hồ sơ sẽ mở khóa cho phép chỉnh sửa lại thông tin.`,
      okText: "Hủy Chữ Ký",
      cancelText: "Giữ lại",
      danger: true,
      onOk: () => {
        const unsignIds = new Set(itemsToUnsign.map((i) => i.id));
        setItems((prev) =>
          prev.map((i) =>
            unsignIds.has(i.id) && i.tinhTrangGui === 0
              ? { ...i, ttKySo: 0, trangThai: "da_lap_bieu" }
              : i,
          ),
        );
        toast.success(
          `Đã hủy chữ ký số của ${itemsToUnsign.length} hồ sơ thành công!`,
          "Hủy Ký Số",
        );
      },
    });
  };

  const handleSendSuccess = (result: SendHs09GatewayResult) => {
    // Chỉ cập nhật đúng các hồ sơ đã ký — không fallback về toàn bộ items
    const targetIds = new Set(signingItems.map((i) => i.id));
    const resultMap = new Map<string, SendHs09BatchItemResult>();
    if (result.batchResults && result.batchResults.length > 0) {
      result.batchResults.forEach((br) => {
        resultMap.set(br.id, br);
      });
    }

    const updater = (i: HoSoDieuChinh09Item): HoSoDieuChinh09Item => {
      if (!targetIds.has(i.id)) return i;

      const batchItem = resultMap.get(i.id);
      if (batchItem) {
        const isItemSuccess = String(batchItem.maKetQua) === "200";
        if (!isItemSuccess) {
          // Hồ sơ này bị Cổng từ chối, giữ nguyên để cho phép chỉnh sửa lại
          return i;
        }
        return {
          ...i,
          ttKySo: 2 as const,
          tinhTrangGui: 2 as const,
          trangThai: "da_gui_cong" as const,
          ngayGiaiTrinh: getTodayIsoDate(),
          maGiaoDichBhxh: batchItem.maGiaoDich || result.maGiaoDich,
        };
      }

      return {
        ...i,
        ttKySo: 2 as const,
        tinhTrangGui: 2 as const,
        trangThai: "da_gui_cong" as const,
        ngayGiaiTrinh: getTodayIsoDate(),
        maGiaoDichBhxh: result.maGiaoDich,
      };
    };

    setItems((prev) => prev.map(updater));
    // Giữ nguyên danh sách signingItems kèm trạng thái gửi thành công để modal không bị mất dữ liệu
    setSigningItems((prev) => prev.map(updater));
    setSelectedTableItems((prev) => prev.map(updater));
  };

  const handleSignSuccess = (
    signedItems: HoSoDieuChinh09Item[],
    signedXml?: string,
    signResponse?: any,
  ) => {
    const list =
      signedItems && signedItems.length > 0 ? signedItems : signingItems;
    const targetIds = new Set(list.map((i) => i.id));
    const timeStr = signResponse?.signedAt || new Date().toISOString();
    const updater = (i: HoSoDieuChinh09Item): HoSoDieuChinh09Item =>
      targetIds.has(i.id)
        ? {
            ...i,
            ttKySo: 2 as const,
            trangThai:
              i.trangThai === "da_gui_cong" ? "da_gui_cong" : "da_ky_so",
            ...(signedXml ? { signedXml } : {}),
            signedAt: timeStr,
          }
        : i;

    setItems((prev) => prev.map(updater));
    setSigningItems((prev) => prev.map(updater));
    setSelectedTableItems((prev) => prev.map(updater));
    toast.success(
      `Đã cập nhật trạng thái đã ký số cho ${targetIds.size} hồ sơ điều chỉnh!`,
      "Ký Số Thành Công",
    );
  };

  // Handlers theo chuẩn Thông tư 12/2026/TT-BTC
  const handleOpenHanhChinh = (item: HoSoDieuChinh09Item) => {
    setHanhChinhItem(item);
    setIsHanhChinhModalOpen(true);
  };

  const handleOpenChiPhi = (item: HoSoDieuChinh09Item) => {
    setChiPhiItem(item);
    setIsChiPhiModalOpen(true);
  };

  const handleOpenAttachment = (item: HoSoDieuChinh09Item) => {
    setAttachmentItem(item);
    setIsAttachmentModalOpen(true);
  };

  /** A3: 1 handler dùng chung cho cả 3 modal (Hành chính / Chi phí / Đính kèm) */
  const handleUpdateItem = (updatedItem: HoSoDieuChinh09Item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    );
  };

  const handlePrintPdf = (item: HoSoDieuChinh09Item) => {
    setPrintPdfItem(item);
    setIsPrintPdfModalOpen(true);
  };

  const handleExportExcel = (itemsToExport?: HoSoDieuChinh09Item[]) => {
    const target =
      itemsToExport && itemsToExport.length > 0 ? itemsToExport : filteredItems;
    try {
      exportHs09ToExcel(target);
      toast.success(
        `Đã xuất thành công ${target.length} hồ sơ điều chỉnh ra file Excel!`,
        "Xuất Excel thành công",
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi xuất file Excel",
        "Lỗi",
      );
    }
  };

  const handleSendGiamDinh = (selectedItems: HoSoDieuChinh09Item[]) => {
    // Tiền kết nối Cổng BHXH ngay khi mở xác nhận gửi giám định
    BhxhChungTuService.takeToken().catch(() => {});
    toast.showConfirm({
      title: "Xác nhận gửi hồ sơ điều chỉnh",
      content: `Xác nhận gửi ${selectedItems.length} hồ sơ điều chỉnh sang Hệ thống Giám định BHYT? Hồ sơ sau khi gửi sẽ bị khóa hoàn toàn không thể chỉnh sửa.`,
      okText: "Có, Gửi Giám Định",
      cancelText: "Hủy",
      onOk: () => {
        void (async () => {
          try {
            // Gửi thật XML Mẫu 09/BH (Loại HS 73) lên Cổng tiếp nhận Giám định BHXH
            const result = await sendHs09ToBhxhGateway(selectedItems);

            const isSuccess =
              String(result.maKetQua) === "200" ||
              Boolean(result.successCount && result.successCount > 0);

            if (!isSuccess) {
              toast.error(
                `Gửi giám định THẤT BẠI (mã ${result.maKetQua}):\n${result.thongDiep}`,
                "Gửi Giám Định Thất Bại",
              );
              return;
            }

            const targetIds = new Set(selectedItems.map((i) => i.id));
            const resultMap = new Map<string, SendHs09BatchItemResult>();
            if (result.batchResults && result.batchResults.length > 0) {
              result.batchResults.forEach((br) => resultMap.set(br.id, br));
            }

            const updater = (i: HoSoDieuChinh09Item): HoSoDieuChinh09Item => {
              if (!targetIds.has(i.id)) return i;

              const batchItem = resultMap.get(i.id);
              if (batchItem && String(batchItem.maKetQua) !== "200") {
                return i; // Giữ nguyên hồ sơ bị lỗi để cho phép sửa
              }

              return {
                ...i,
                ttKySo: 2,
                tinhTrangGui: 2,
                trangThai: "da_gui_cong",
                ngayGiaiTrinh: getTodayIsoDate(),
                ngayGui: getTodayIsoDate(),
                nguoiGui: i.ttMau.nguoiLapBieu || "CSKCB",
                maGiaoDichBhxh: batchItem?.maGiaoDich || result.maGiaoDich,
              };
            };

            setItems((prev) => prev.map(updater));
            setSelectedTableItems((prev) => prev.map(updater));

            if (result.failureCount && result.failureCount > 0) {
              toast.warning(
                `Đã gửi thành công ${result.successCount}/${selectedItems.length} hồ sơ điều chỉnh!\nCó ${result.failureCount} hồ sơ bị từ chối: ${result.thongDiep}`,
                "Kết Quả Gửi Giám Định",
              );
            } else {
              toast.success(
                `Gửi giám định thành công toàn bộ ${selectedItems.length} hồ sơ!\nMã giao dịch: ${result.maGiaoDich}\nTINHTRANGGUI = 2.`,
                "Gửi Giám Định Thành Công",
              );
            }
          } catch (err: unknown) {
            toast.error(
              err instanceof Error ? err.message : "Lỗi kết nối Cổng BHXH",
              "Gửi Giám Định Thất Bại",
            );
          }
        })();
      },
    });
  };

  const handleHuyPhien = (selectedItems: HoSoDieuChinh09Item[]) => {
    toast.showConfirm({
      title: "Xác nhận hủy phiên làm việc",
      content: `Bạn có chắc muốn hủy phiên làm việc của ${selectedItems.length} hồ sơ? Dữ liệu tạm thời trên cổng tiếp nhận sẽ được xóa và hệ thống giám định tự động sẽ được mở khóa.`,
      okText: "Hủy Phiên Làm Việc",
      cancelText: "Giữ lại",
      danger: true,
      onOk: () => {
        const targetIds = new Set(selectedItems.map((i) => i.id));
        setItems((prev) =>
          prev.map((i) =>
            targetIds.has(i.id)
              ? {
                  ...i,
                  loaiThaoTac: "tong_hop_moi",
                }
              : i,
          ),
        );
        toast.success(
          `Đã hủy phiên làm việc thành công! Loại thao tác chuyển sang 'Tổng hợp mới', mở khóa giám định tự động.`,
          "Hủy Phiên Thành Công",
        );
      },
    });
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.ttXml1.maLk.toLowerCase().includes(q) ||
        item.ttXml1.hoTen.toLowerCase().includes(q) ||
        item.ttXml1.maThe.toLowerCase().includes(q) ||
        item.ttXml1.maBn.toLowerCase().includes(q) ||
        (item.khoaDieuTri && item.khoaDieuTri.toLowerCase().includes(q)) ||
        (item.nhomLoi && item.nhomLoi.toLowerCase().includes(q)) ||
        item.dsChiPhiDieuChinh.some(
          (cp: ChiPhiDieuChinhItem) =>
            (cp.tuChoi && cp.tuChoi.toLowerCase().includes(q)) ||
            (cp.lyDoDieuChinh && cp.lyDoDieuChinh.toLowerCase().includes(q)),
        );

      const matchNhomLoi =
        filterNhomLoi === "all" ||
        item.nhomLoi === filterNhomLoi ||
        item.dsChiPhiDieuChinh.some(
          (cp: ChiPhiDieuChinhItem) => cp.tuChoi === filterNhomLoi,
        );

      const matchSoBangXml =
        filterSoBangXml === "all" ||
        (filterSoBangXml === "xml1" &&
          (item.dsXml1DieuChinh?.length || 0) > 0) ||
        item.dsChiPhiDieuChinh.some(
          (cp: ChiPhiDieuChinhItem) => String(cp.soBangXml) === filterSoBangXml,
        );

      const matchStatus =
        filterTrangThai === "all" || item.trangThai === filterTrangThai;

      return matchSearch && matchNhomLoi && matchSoBangXml && matchStatus;
    });
  }, [items, searchTerm, filterNhomLoi, filterSoBangXml, filterTrangThai]);

  const schemaProps = useSchemaMappingProps(
    HS09_SCHEMA_FIELDS,
    fileUploadStats,
  );

  const effectiveSigningItems = signingItems;

  return (
    <div className="space-y-3">
      {/* 2. Dropzone & Action Toolbar */}
      <Hs09Dropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={items.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={handleDownloadTemplate}
        onClearData={handleClearData}
        // B2: 2 nút (Ký số & Gửi cổng) mở chung 1 modal ký số → dùng chung 1 handler
        onOpenXmlModal={() => openSignModal(selectedTableItems)}
        onOpenApiTab={() => openSignModal(selectedTableItems)}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onAddNew={handleAddNew}
      />

      {/* 3. Schema Mapping Card / Inspector */}
      <SchemaMappingCard
        {...schemaProps}
        loaiHsBadge="Loại HS 73 - GuiHoSoDieuChinh09BH"
        title="Đặc Tả Cấu Trúc Hồ Sơ Điều Chỉnh Giám Định Mẫu 09/BH (XML <HOSO_DIEUCHINH_GD> - Loại HS 73)"
        defaultExpanded={!!fileUploadStats}
      />

      {/* 4. Main Data Table */}
      <Hs09Table
        items={filteredItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterNhomLoi={filterNhomLoi}
        onFilterNhomLoiChange={setFilterNhomLoi}
        filterSoBangXml={filterSoBangXml}
        onFilterSoBangXmlChange={setFilterSoBangXml}
        filterTrangThai={filterTrangThai}
        onFilterTrangThaiChange={setFilterTrangThai}
        filterTinhTrangGui={filterTinhTrangGui}
        onFilterTinhTrangGuiChange={setFilterTinhTrangGui}
        filterLoaiThaoTac={filterLoaiThaoTac}
        onFilterLoaiThaoTacChange={setFilterLoaiThaoTac}
        filterKyQt={filterKyQt}
        onFilterKyQtChange={setFilterKyQt}
        filterTuNgay={filterTuNgay}
        onFilterTuNgayChange={setFilterTuNgay}
        filterDenNgay={filterDenNgay}
        onFilterDenNgayChange={setFilterDenNgay}
        onAddNew={handleAddNew}
        onSelectionChange={setSelectedTableItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
        onBulkSign={handleBulkSign}
        onUnsign={handleUnsign}
        onOpenHanhChinh={handleOpenHanhChinh}
        onOpenChiPhi={handleOpenChiPhi}
        onOpenAttachment={handleOpenAttachment}
        onPrintPdf={handlePrintPdf}
        onSendGiamDinh={handleSendGiamDinh}
        onExportExcel={handleExportExcel}
        onHuyPhien={handleHuyPhien}
      />

      {/* MODALS */}
      {/* 1. Modal Điều chỉnh thông tin hành chính (Mục 3.1) */}
      <Hs09HanhChinhModal
        isOpen={isHanhChinhModalOpen}
        onClose={() => {
          setIsHanhChinhModalOpen(false);
          setHanhChinhItem(null);
        }}
        item={hanhChinhItem}
        onSave={handleUpdateItem}
      />

      {/* 2. Modal Điều chỉnh chi phí (Mục 3.2, 3.3, 3.4) */}
      <Hs09ChiPhiModal
        isOpen={isChiPhiModalOpen}
        onClose={() => {
          setIsChiPhiModalOpen(false);
          setChiPhiItem(null);
        }}
        item={chiPhiItem}
        onSave={handleUpdateItem}
      />

      {/* 3. Modal Đính kèm tài liệu chứng minh (Mục 8) */}
      <Hs09AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => {
          setIsAttachmentModalOpen(false);
          setAttachmentItem(null);
        }}
        item={attachmentItem}
        onSave={handleUpdateItem}
      />

      {/* 4. Modal In Mẫu số 09/BH (Mục 4.2) */}
      <Hs09PrintPdfModal
        isOpen={isPrintPdfModalOpen}
        onClose={() => {
          setIsPrintPdfModalOpen(false);
          setPrintPdfItem(null);
        }}
        item={printPdfItem}
      />

      {/* 5. Modal Sửa Tổng Quát */}
      <Hs09EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
        totalItemsCount={items.length}
      />

      {/* 6. Detail Modal XML gốc */}
      <Hs09DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
      />

      {/* 7. XML / Base64 / SmartCA Modal */}
      <Hs09XmlModal
        isOpen={isXmlModalOpen}
        onClose={() => {
          setIsXmlModalOpen(false);
          // Không xóa signingItems ngay khi đóng để giữ ngữ cảnh nếu cần xem lại
        }}
        items={effectiveSigningItems}
        defaultTab={xmlModalTab}
        onSendSuccess={handleSendSuccess}
        onSignSuccess={handleSignSuccess}
        fileUploadStats={fileUploadStats}
      />

      {/* 8. Schema Mapping Modal */}
      <SchemaMappingModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        {...schemaProps}
        loaiHsBadge="Loại HS 73 - Mẫu 09/BH"
        title="Đặc Tả Kỹ Thuật Hồ Sơ Điều Chỉnh Xử Lý Xuất Toán 09/BH (XML <HOSO_DIEUCHINH_GD>)"
      />
    </div>
  );
};
