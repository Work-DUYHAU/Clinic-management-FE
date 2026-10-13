import { useState, useMemo, useCallback } from "react";
import type {
  Hs01TongHopItem,
  ParseHs01ExcelResult,
  SendHs01GatewayResult,
} from "../../../../types/hs01TongHopTypes";
import {
  parseHs01ExcelFile,
  parseHs01Worksheet,
  parseHs01AllSheets,
  downloadHs01ExcelTemplate,
} from "../../../../utils/hs01TongHopXmlEngine";
import { useToast } from "../../../../context/ToastContext";
import { getTodayIsoDate } from "../../../../utils/shared/excelXmlShared";
import { useRegisterSignModal } from "../../../../context/SignModalContext";

export function useHs01TongHopTab() {
  const toast = useToast();
  const [items, setItems] = useState<Hs01TongHopItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLoaiKcb, setFilterLoaiKcb] = useState("all");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseHs01ExcelResult | null>(null);

  // Modals state
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<"smartca" | "base64">(
    "smartca",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Hs01TongHopItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Hs01TongHopItem | null>(null);

  // Modal open/close handlers
  const handleOpenXmlModal = useCallback(() => {
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  }, []);

  const handleOpenApiTab = useCallback(() => {
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  }, []);

  const handleCloseXmlModal = useCallback(() => {
    setIsXmlModalOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  // Đăng ký mở modal ký số từ Navbar
  useRegisterSignModal(true, handleOpenXmlModal);

  // File Upload handler
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoadingFile(true);
      try {
        const result = await parseHs01ExcelFile(file);
        setItems(result.items);
        setFileUploadStats(result);
        toast.success(
          `Đã nạp thành công ${result.items.length} hồ sơ tổng hợp từ tệp "${file.name}"\nSheet: "${result.selectedSheet}"`,
          "Nạp File Excel Mẫu 01/BH Thành Công",
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Lỗi đọc tệp Excel Hồ sơ tổng hợp!";
        toast.error(msg, "Lỗi Đọc File");
      } finally {
        setIsLoadingFile(false);
        e.target.value = "";
      }
    },
    [toast],
  );

  // Switch sheet handler
  const handleSwitchSheet = useCallback(
    (sheetName: string) => {
      if (!fileUploadStats?.workbook) return;
      try {
        let result: ParseHs01ExcelResult;
        if (sheetName === "__ALL__") {
          result = parseHs01AllSheets(
            fileUploadStats.workbook,
            fileUploadStats.fileName,
          );
          toast.info(
            `Đã nạp toàn bộ các sheet trong file (${result.items.length} hồ sơ)`,
            "Đọc Full File Excel",
          );
        } else {
          const ws = fileUploadStats.workbook.Sheets[sheetName];
          result = parseHs01Worksheet(
            ws,
            sheetName,
            fileUploadStats.availableSheets,
            fileUploadStats.fileName,
            fileUploadStats.workbook,
          );
          toast.info(
            `Đã chuyển sang Sheet "${sheetName}" (${result.items.length} hồ sơ)`,
            "Chuyển Sheet Dữ Liệu",
          );
        }
        setItems(result.items);
        setFileUploadStats(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi chuyển sheet";
        toast.error(msg, "Lỗi Đọc Sheet");
      }
    },
    [fileUploadStats, toast],
  );

  // Download template handler
  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadHs01ExcelTemplate();
      toast.success(
        "Đã tải tệp Excel mẫu chuẩn 20 cột (Mẫu 01/BH) thành công!",
        "Tải File Mẫu",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi tải tệp mẫu";
      toast.error(msg, "Lỗi");
    }
  }, [toast]);

  // Clear data handler
  const handleClearData = useCallback(() => {
    toast.showConfirm({
      title: "Xác nhận xóa toàn bộ hồ sơ",
      content:
        "Bạn có chắc chắn muốn xóa toàn bộ danh sách hồ sơ 01/BH hiện tại?",
      danger: true,
      okText: "Xóa tất cả",
      cancelText: "Hủy",
      onOk: () => {
        setItems([]);
        setFileUploadStats(null);
        toast.warning(
          "Đã xóa toàn bộ dữ liệu bảng hồ sơ tổng hợp",
          "Xóa Dữ Liệu",
        );
      },
    });
  }, [toast]);

  // CRUD Handlers
  const handleAddNew = useCallback(() => {
    setEditingItem(null);
    setIsEditModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: Hs01TongHopItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (item: Hs01TongHopItem) => {
      toast.showConfirm({
        title: "Xác nhận xóa hồ sơ",
        content: `Bạn có chắc chắn muốn xóa hồ sơ của bệnh nhân "${item.hoTen}"?`,
        danger: true,
        okText: "Xóa",
        cancelText: "Hủy",
        onOk: () => {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          toast.success(`Đã xóa hồ sơ bệnh nhân "${item.hoTen}"`, "Xóa Hồ Sơ");
        },
      });
    },
    [toast],
  );

  const handleSaveItem = useCallback(
    (savedItem: Hs01TongHopItem) => {
      if (editingItem) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id ? { ...savedItem, id: editingItem.id } : i,
          ),
        );
        toast.success(
          `Đã cập nhật hồ sơ bệnh nhân "${savedItem.hoTen}"`,
          "Cập Nhật Thành Công",
        );
      } else {
        const newItem: Hs01TongHopItem = {
          ...savedItem,
          id: `hs01-${Date.now()}`,
        };
        setItems((prev) => [newItem, ...prev]);
        toast.success(
          `Đã thêm mới hồ sơ bệnh nhân "${savedItem.hoTen}"`,
          "Thêm Mới Thành Công",
        );
      }
      setIsEditModalOpen(false);
    },
    [editingItem, toast],
  );

  const handleViewDetail = useCallback((item: Hs01TongHopItem) => {
    setDetailItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const handleSendSuccess = useCallback((result: SendHs01GatewayResult) => {
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        trangThai: "da_gui_cong",
        ngayGuiCong: getTodayIsoDate(),
        maGiaoDichBhxh: result.maGiaoDich,
      })),
    );
  }, []);

  // Filtered Items memo
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.hoTen.toLowerCase().includes(q) ||
        item.maTheBhyt.toLowerCase().includes(q) ||
        item.maBenhChinh.toLowerCase().includes(q) ||
        item.maCskcb.toLowerCase().includes(q);

      const matchType =
        filterLoaiKcb === "all" || item.maLoaiKcb === filterLoaiKcb;
      const matchStatus =
        filterTrangThai === "all" ||
        (filterTrangThai === "hop_le" &&
          item.isValid !== false &&
          item.trangThai !== "da_gui_cong") ||
        (filterTrangThai === "canh_bao" && item.isValid === false) ||
        (filterTrangThai === "da_gui_cong" && item.trangThai === "da_gui_cong");

      return matchSearch && matchType && matchStatus;
    });
  }, [items, searchTerm, filterLoaiKcb, filterTrangThai]);

  return {
    items,
    filteredItems,
    searchTerm,
    setSearchTerm,
    filterLoaiKcb,
    setFilterLoaiKcb,
    filterTrangThai,
    setFilterTrangThai,
    isLoadingFile,
    fileUploadStats,
    isXmlModalOpen,
    xmlModalTab,
    isEditModalOpen,
    editingItem,
    isDetailModalOpen,
    detailItem,
    // Handlers
    handleFileUpload,
    handleSwitchSheet,
    handleDownloadTemplate,
    handleClearData,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleSaveItem,
    handleViewDetail,
    handleSendSuccess,
    handleOpenXmlModal,
    handleOpenApiTab,
    handleCloseXmlModal,
    handleCloseEditModal,
    handleCloseDetailModal,
  };
}
