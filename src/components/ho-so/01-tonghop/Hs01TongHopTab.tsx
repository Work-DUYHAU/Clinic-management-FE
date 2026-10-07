import React, { useState, useMemo } from "react";
import type { Hs01TongHopItem } from "./services/hs01TongHopService";
import {
  HS01_SCHEMA_FIELDS,
  parseHs01ExcelFile,
  parseHs01Worksheet,
  parseHs01AllSheets,
  downloadHs01ExcelTemplate,
  type ParseHs01ExcelResult,
  type SendHs01GatewayResult,
} from "./services/hs01TongHopService";
import { useToast } from "../../../context/ToastContext";
import {
  Hs01Dropzone,
  Hs01Table,
  Hs01EditModal,
  Hs01XmlModal,
  Hs01DetailModal,
} from "./components";
import { SchemaMappingModal } from "../../danh-muc/common/SchemaMappingModal";
import { SchemaMappingCard } from "../../danh-muc/common/SchemaMappingCard";
import { useSchemaMappingProps } from "../../../hooks";
import { getTodayIsoDate } from "../../../utils/shared/excelXmlShared";
import { useRegisterSignModal } from "../../../context/SignModalContext";
import { BhxhChungTuService } from "../../../services/bhxh/bhxhChungTuService";

export const Hs01TongHopTab: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<Hs01TongHopItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLoaiKcb, setFilterLoaiKcb] = useState("all");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseHs01ExcelResult | null>(null);

  // Modals
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<"smartca" | "base64">(
    "smartca",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Hs01TongHopItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Hs01TongHopItem | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Dùng chung 1 modal duy nhất: Bấm "Ký Số" ở Navbar hay ở Dropzone đều mở modal này
  useRegisterSignModal(true, () => {
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  });

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const result = await parseHs01ExcelFile(file);
      setItems(result.items);
      setFileUploadStats(result);
      // Tiền kết nối Cổng BHXH trong lúc người dùng xem dữ liệu
      BhxhChungTuService.takeToken().catch(() => {});
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
  };

  const handleSwitchSheet = (sheetName: string) => {
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
  };

  const handleDownloadTemplate = () => {
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
  };

  const handleClearData = () => {
    toast.showConfirm({
      title: "Xác nhận xóa toàn bộ hồ sơ",
      content: "Bạn có chắc chắn muốn xóa toàn bộ danh sách hồ sơ 01/BH hiện tại?",
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
  };

  // CRUD
  const handleAddNew = () => {
    setEditingItem(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (item: Hs01TongHopItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: Hs01TongHopItem) => {
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
  };

  const handleSaveItem = (savedItem: Hs01TongHopItem) => {
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
  };

  const handleViewDetail = (item: Hs01TongHopItem) => {
    setDetailItem(item);
    setIsDetailModalOpen(true);
  };

  const handleSendSuccess = (result: SendHs01GatewayResult) => {
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        trangThai: "da_gui_cong",
        ngayGuiCong: getTodayIsoDate(),
        maGiaoDichBhxh: result.maGiaoDich,
      })),
    );
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
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

  const schemaProps = useSchemaMappingProps(HS01_SCHEMA_FIELDS, fileUploadStats);

  return (
    <div className="space-y-6">
      {/* 2. Dropzone & Action Toolbar */}
      <Hs01Dropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={items.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={handleDownloadTemplate}
        onClearData={handleClearData}
        onOpenXmlModal={() => {
          setXmlModalTab("smartca");
          setIsXmlModalOpen(true);
        }}
        onOpenApiTab={() => {
          setXmlModalTab("smartca");
          setIsXmlModalOpen(true);
        }}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onAddNew={handleAddNew}
      />

      {/* 3. Schema Mapping Card / Inspector */}
      <SchemaMappingCard
        {...schemaProps}
        loaiHsBadge="Loại HS 5 - 20 Trường"
        title="Đặc Tả Cấu Trúc 20 Trường Hồ Sơ Tổng Hợp Chi Phí KCB (Mẫu 01/BH - XML <HSTH01BH> - Loại HS 5)"
        defaultExpanded={!!fileUploadStats}
      />
      {/* 4. Main Data Table */}
      <Hs01Table
        items={filteredItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterLoaiKcb={filterLoaiKcb}
        onFilterLoaiKcbChange={setFilterLoaiKcb}
        filterTrangThai={filterTrangThai}
        onFilterTrangThaiChange={setFilterTrangThai}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
      />
      {/* MODALS */}
      {/* Edit / Add Modal */}
      <Hs01EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
        totalItemsCount={items.length}
      />

      {/* Detail Modal */}
      <Hs01DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
      />

      {/* XML / Base64 / API Modal */}
      <Hs01XmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        items={items}
        defaultTab={xmlModalTab}
        onSendSuccess={handleSendSuccess}
        fileUploadStats={fileUploadStats}
      />

      {/* Schema Mapping Modal */}
      <SchemaMappingModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        {...schemaProps}
        loaiHsBadge="Loại HS 5 - 20 Trường"
        title="Đặc Tả Kỹ Thuật 20 Cột Chuẩn Mẫu 01/BH (XML <HSTH01BH> - Loại HS 5)"
      />
    </div>
  );
};
