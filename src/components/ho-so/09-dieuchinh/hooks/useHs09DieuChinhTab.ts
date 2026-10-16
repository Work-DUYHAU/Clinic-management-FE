import { useState, useMemo, useCallback, useEffect } from "react";
import type { WorkBook } from "xlsx";
import type {
  HoSoDieuChinh09Item,
  ParseHs09ExcelResult,
  SendHs09GatewayResult,
  SendHs09BatchItemResult,
  ChiPhiDieuChinhItem,
} from "../../../../types/hs09DieuChinhTypes";
import {
  parseHs09ExcelFile,
  parseHs09Worksheet,
  downloadHs09ExcelTemplate,
  exportHs09ToExcel,
  sendHs09ToBhxhGateway,
  getHs09DraftsApi,
  syncHs09DraftsApi,
  clearHs09DraftsApi,
} from "../../../../utils/hs09DieuChinhXmlEngine";
import { useToast } from "../../../../context/ToastContext";
import { useRegisterSignModal } from "../../../../context/SignModalContext";
import {
  generateUUID,
  getTodayIsoDate,
} from "../../../../utils/shared/excelXmlShared";

const HS09_FILE_STATS_KEY = "hs09_file_upload_stats";

export interface UseHs09DieuChinhTabProps {
  items?: HoSoDieuChinh09Item[];
  onItemsChange?: (
    updater:
      | HoSoDieuChinh09Item[]
      | ((prev: HoSoDieuChinh09Item[]) => HoSoDieuChinh09Item[]),
  ) => void;
}

export function useHs09DieuChinhTab({
  items: propItems,
  onItemsChange,
}: UseHs09DieuChinhTabProps = {}) {
  const toast = useToast();
  const items = propItems ?? [];
  const setItems = useCallback(
    (
      updater:
        | HoSoDieuChinh09Item[]
        | ((prev: HoSoDieuChinh09Item[]) => HoSoDieuChinh09Item[]),
    ) => {
      if (onItemsChange) {
        onItemsChange(updater);
      }
    },
    [onItemsChange],
  );

  const [searchTerm, setSearchTerm] = useState("");

  // Filters chuẩn Thông tư 12/2026/TT-BTC Mục 2.1
  const [filterTinhTrangGui, setFilterTinhTrangGui] = useState("all");
  const [filterLoaiThaoTac, setFilterLoaiThaoTac] = useState("all");
  const [filterKyQt, setFilterKyQt] = useState("all");
  const [filterTuNgay, setFilterTuNgay] = useState("");
  const [filterDenNgay, setFilterDenNgay] = useState("");

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseHs09ExcelResult | null>(() => {
      try {
        const raw = localStorage.getItem(HS09_FILE_STATS_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        const rows = Number(cached.totalRows) || 0;
        return {
          items: [],
          detectedHeaders: cached.detectedHeaders || {},
          totalRows: rows,
          validRows: rows,
          invalidRows: 0,
          missingRequiredFields: [],
          fileName: cached.fileName || "Tệp đã nạp",
          selectedSheet: cached.selectedSheet || "09-BH",
          availableSheets: cached.availableSheets || ["09-BH"],
        };
      } catch {
        return null;
      }
    });

  // Tự động suy luận thông tin file nếu bảng có hồ sơ nhưng chưa có cache file
  const effectiveFileUploadStats = useMemo<ParseHs09ExcelResult | null>(() => {
    if (fileUploadStats) {
      return {
        ...fileUploadStats,
        totalRows: items.length || fileUploadStats.totalRows,
        validRows: items.length || fileUploadStats.validRows,
      };
    }
    if (items.length > 0) {
      return {
        items,
        detectedHeaders: {},
        totalRows: items.length,
        validRows: items.length,
        invalidRows: 0,
        missingRequiredFields: [],
        fileName: "Hồ sơ lưu từ máy chủ (Mẫu 09/BH)",
        selectedSheet: "09-BH",
        availableSheets: ["09-BH"],
      };
    }
    return null;
  }, [fileUploadStats, items]);

  const [isSyncingDraft, setIsSyncingDraft] = useState(false);

  // Tự động khôi phục bản nháp từ Backend khi mở tab (chỉ khi bảng chưa có dữ liệu)
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const drafts = await getHs09DraftsApi();
        if (isMounted && drafts && drafts.length > 0) {
          setItems((currentItems) => {
            if (currentItems.length === 0) {
              toast.info(
                `Đã khôi phục ${drafts.length} hồ sơ điều chỉnh nháp từ máy chủ.`,
                "Khôi Phục Bản Nháp",
              );
              return drafts;
            }
            return currentItems;
          });
        }
      } catch {
        // bỏ qua nếu máy chủ chưa có dữ liệu hoặc offline
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [setItems, toast]);

  // Modals state
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

  const openSignModal = useCallback(
    (selected?: HoSoDieuChinh09Item[]) => {
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
      const freshTargets = targets.map(
        (t) => items.find((i) => i.id === t.id) || t,
      );
      setSigningItems(freshTargets);
      setXmlModalTab("smartca");
      setIsXmlModalOpen(true);

      if (!explicitSelected && items.length > 1) {
        toast.info(
          `Bạn chưa chọn hồ sơ nào — hệ thống sẽ xử lý ${targets.length} hồ sơ đầu tiên trong danh sách. Hãy tick chọn hồ sơ cụ thể trong bảng nếu muốn kiểm soát chính xác.`,
          "Chưa chọn hồ sơ",
        );
      }
    },
    [items, selectedTableItems, toast],
  );

  // Đăng ký mở modal ký số từ Navbar
  useRegisterSignModal(true, () => openSignModal(selectedTableItems));

  // File Upload
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoadingFile(true);
      try {
        const result = await parseHs09ExcelFile(file);
        setItems(result.items);
        setFileUploadStats(result);
        setSelectedTableItems([]);
        setSigningItems([]);

        try {
          const statsToCache = {
            fileName: file.name,
            selectedSheet: result.selectedSheet,
            availableSheets: result.availableSheets,
            totalRows: result.items.length,
            detectedHeaders: result.detectedHeaders,
          };
          localStorage.setItem(HS09_FILE_STATS_KEY, JSON.stringify(statsToCache));
        } catch {}

        const isXml = file.name.toLowerCase().endsWith(".xml");
        const signedCount = result.items.filter(
          (i: HoSoDieuChinh09Item) => i.ttKySo === 2,
        ).length;
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
    },
    [setItems, toast],
  );

  const handleSwitchSheet = useCallback(
    (sheetName: string) => {
      if (!fileUploadStats?.workbook) {
        toast.info(
          "Để chuyển sheet khác, vui lòng nạp lại tệp Excel gốc.",
          "Chuyển Sheet Dữ Liệu",
        );
        return;
      }
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

        try {
          const statsToCache = {
            fileName: fileUploadStats.fileName,
            selectedSheet: sheetName,
            availableSheets: fileUploadStats.availableSheets,
            totalRows: result.items.length,
            detectedHeaders: result.detectedHeaders,
          };
          localStorage.setItem(HS09_FILE_STATS_KEY, JSON.stringify(statsToCache));
        } catch {}

        toast.info(
          `Đã chuyển sang Sheet "${sheetName}" (${result.items.length} hồ sơ)`,
          "Chuyển Sheet Dữ Liệu",
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi chuyển sheet";
        toast.error(msg, "Lỗi Đọc Sheet");
      }
    },
    [fileUploadStats, setItems, toast],
  );

  const handleDownloadTemplate = useCallback(() => {
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
  }, [toast]);

  const handleSaveDrafts = useCallback(async () => {
    if (items.length === 0) {
      toast.warning("Chưa có hồ sơ điều chỉnh nào để lưu nháp!", "Lưu Nháp");
      return;
    }
    setIsSyncingDraft(true);
    try {
      await syncHs09DraftsApi(items);
      toast.success(
        `Đã lưu an toàn ${items.length} hồ sơ điều chỉnh lên máy chủ!`,
        "Lưu Nháp Thành Công",
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể kết nối máy chủ để lưu nháp.",
        "Lỗi Lưu Nháp",
      );
    } finally {
      setIsSyncingDraft(false);
    }
  }, [items, toast]);

  const handleClearData = useCallback(() => {
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
        try {
          localStorage.removeItem(HS09_FILE_STATS_KEY);
        } catch {}
        setSigningItems([]);
        setSelectedTableItems([]);
        void clearHs09DraftsApi().catch(() => {});
        toast.warning(
          "Đã xóa toàn bộ dữ liệu bảng hồ sơ điều chỉnh",
          "Xóa Dữ Liệu",
        );
      },
    });
  }, [setItems, toast]);

  // CRUD
  const handleAddNew = useCallback(() => {
    setEditingItem(null);
    setIsEditModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: HoSoDieuChinh09Item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (item: HoSoDieuChinh09Item) => {
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
    },
    [setItems, toast],
  );

  const handleSaveItem = useCallback(
    (savedItem: HoSoDieuChinh09Item) => {
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
    },
    [editingItem, setItems, toast],
  );

  const handleViewDetail = useCallback((item: HoSoDieuChinh09Item) => {
    setDetailItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const handleBulkSign = useCallback(
    (selected: HoSoDieuChinh09Item[]) => {
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
    },
    [toast],
  );

  const handleUnsign = useCallback(
    (itemsToUnsign: HoSoDieuChinh09Item[]) => {
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
    },
    [setItems, toast],
  );

  const applySendResults = useCallback(
    (result: SendHs09GatewayResult, targetItems: HoSoDieuChinh09Item[]) => {
      const targetIds = new Set(targetItems.map((i) => i.id));
      const resultMap = new Map<string, SendHs09BatchItemResult>();
      if (result.batchResults && result.batchResults.length > 0) {
        result.batchResults.forEach((br: SendHs09BatchItemResult) => {
          resultMap.set(br.id, br);
        });
      }

      const updater = (i: HoSoDieuChinh09Item): HoSoDieuChinh09Item => {
        if (!targetIds.has(i.id)) return i;

        const batchItem = resultMap.get(i.id);
        if (batchItem && String(batchItem.maKetQua) !== "200") {
          return i;
        }

        return {
          ...i,
          ttKySo: (batchItem?._signUpdate?.ttKySo ?? 2) as 0 | 2,
          tinhTrangGui: 2 as const,
          trangThai: "da_gui_cong" as const,
          ngayGiaiTrinh: getTodayIsoDate(),
          ngayGui: getTodayIsoDate(),
          nguoiGui: i.ttMau.nguoiLapBieu || "CSKCB",
          maGiaoDichBhxh: batchItem?.maGiaoDich || result.maGiaoDich,
          signedXml: batchItem?._signUpdate?.signedXml || i.signedXml,
          signedAt: batchItem?._signUpdate?.signedAt || i.signedAt,
        };
      };

      setItems((prev) => prev.map(updater));
      setSigningItems((prev) => prev.map(updater));
      setSelectedTableItems((prev) => prev.map(updater));
    },
    [setItems],
  );

  const handleSendSuccess = useCallback(
    (result: SendHs09GatewayResult) => {
      applySendResults(result, signingItems);
    },
    [applySendResults, signingItems],
  );

  const handleSignSuccess = useCallback(
    (
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
    },
    [setItems, signingItems, toast],
  );

  const handleOpenHanhChinh = useCallback((item: HoSoDieuChinh09Item) => {
    setHanhChinhItem(item);
    setIsHanhChinhModalOpen(true);
  }, []);

  const handleCloseHanhChinh = useCallback(() => {
    setIsHanhChinhModalOpen(false);
    setHanhChinhItem(null);
  }, []);

  const handleOpenChiPhi = useCallback((item: HoSoDieuChinh09Item) => {
    setChiPhiItem(item);
    setIsChiPhiModalOpen(true);
  }, []);

  const handleCloseChiPhi = useCallback(() => {
    setIsChiPhiModalOpen(false);
    setChiPhiItem(null);
  }, []);

  const handleOpenAttachment = useCallback((item: HoSoDieuChinh09Item) => {
    setAttachmentItem(item);
    setIsAttachmentModalOpen(true);
  }, []);

  const handleCloseAttachment = useCallback(() => {
    setIsAttachmentModalOpen(false);
    setAttachmentItem(null);
  }, []);

  const handleUpdateItem = useCallback(
    (updatedItem: HoSoDieuChinh09Item) => {
      setItems((prev) =>
        prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
      );
    },
    [setItems],
  );

  const handlePrintPdf = useCallback((item: HoSoDieuChinh09Item) => {
    setPrintPdfItem(item);
    setIsPrintPdfModalOpen(true);
  }, []);

  const handleClosePrintPdf = useCallback(() => {
    setIsPrintPdfModalOpen(false);
    setPrintPdfItem(null);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  const handleCloseXmlModal = useCallback(() => {
    setIsXmlModalOpen(false);
  }, []);

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((item) =>
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
      ),
    );
  }, [items, searchTerm]);

  const handleExportExcel = useCallback(
    (itemsToExport?: HoSoDieuChinh09Item[]) => {
      const target =
        itemsToExport && itemsToExport.length > 0
          ? itemsToExport
          : filteredItems;
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
    },
    [filteredItems, toast],
  );

  const handleSendGiamDinh = useCallback(
    (selectedItems: HoSoDieuChinh09Item[]) => {
      toast.showConfirm({
        title: "Xác nhận gửi hồ sơ điều chỉnh",
        content: `Xác nhận gửi ${selectedItems.length} hồ sơ điều chỉnh sang Hệ thống Giám định BHYT? Hồ sơ sau khi gửi sẽ bị khóa hoàn toàn không thể chỉnh sửa.`,
        okText: "Có, Gửi Giám Định",
        cancelText: "Hủy",
        danger: true,
        onOk: () => {
          void (async () => {
            try {
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

              applySendResults(result, selectedItems);

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
    },
    [applySendResults, toast],
  );

  const handleHuyPhien = useCallback(
    (selectedItems: HoSoDieuChinh09Item[]) => {
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
    },
    [setItems, toast],
  );

  return {
    items,
    filteredItems,
    searchTerm,
    setSearchTerm,
    filterTinhTrangGui,
    setFilterTinhTrangGui,
    filterLoaiThaoTac,
    setFilterLoaiThaoTac,
    filterKyQt,
    setFilterKyQt,
    filterTuNgay,
    setFilterTuNgay,
    filterDenNgay,
    setFilterDenNgay,
    isLoadingFile,
    fileUploadStats: effectiveFileUploadStats,
    isSyncingDraft,
    handleSaveDrafts,
    // Modals
    isXmlModalOpen,
    xmlModalTab,
    isEditModalOpen,
    editingItem,
    isDetailModalOpen,
    detailItem,
    isHanhChinhModalOpen,
    hanhChinhItem,
    isChiPhiModalOpen,
    chiPhiItem,
    isAttachmentModalOpen,
    attachmentItem,
    isPrintPdfModalOpen,
    printPdfItem,
    signingItems,
    selectedTableItems,
    setSelectedTableItems,
    // Handlers
    openSignModal,
    handleFileUpload,
    handleSwitchSheet,
    handleDownloadTemplate,
    handleClearData,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleSaveItem,
    handleViewDetail,
    handleBulkSign,
    handleUnsign,
    handleSendSuccess,
    handleSignSuccess,
    handleOpenHanhChinh,
    handleCloseHanhChinh,
    handleOpenChiPhi,
    handleCloseChiPhi,
    handleOpenAttachment,
    handleCloseAttachment,
    handleUpdateItem,
    handlePrintPdf,
    handleClosePrintPdf,
    handleExportExcel,
    handleSendGiamDinh,
    handleHuyPhien,
    handleCloseEditModal,
    handleCloseDetailModal,
    handleCloseXmlModal,
  };
}
