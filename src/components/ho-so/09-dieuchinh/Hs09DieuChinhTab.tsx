import React, { useState, useMemo } from "react";
import type { WorkBook } from "xlsx";
import type {
  HoSoDieuChinh09Item,
  ParseHs09ExcelResult,
  SendHs09GatewayResult,
  ChiPhiDieuChinhItem,
} from "../../../types/hs09DieuChinhTypes";
import { HS09_SCHEMA_FIELDS } from "../../../utils/constants/hs09DieuChinhConstants";
import {
  parseHs09ExcelFile,
  parseHs09Worksheet,
  downloadHs09ExcelTemplate,
} from "../../../utils/hs09DieuChinhXmlEngine";
import { useToast } from "../../../context/ToastContext";
import {
  Hs09Dropzone,
  Hs09Table,
  Hs09EditModal,
  Hs09XmlModal,
  Hs09DetailModal,
} from "./components";
import { SchemaMappingModal } from "../../danh-muc/common/SchemaMappingModal";
import { SchemaMappingCard } from "../../danh-muc/common/SchemaMappingCard";
import { useSchemaMappingProps } from "../../../hooks";
import { useRegisterSignModal } from "../../../context/SignModalContext";
import { BhxhChungTuService } from "../../../services/bhxh/bhxhChungTuService";
import { getTodayIsoDate } from "../../../utils/shared/excelXmlShared";

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
      setInternalItems(updater);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNhomLoi, setFilterNhomLoi] = useState("all");
  const [filterSoBangXml, setFilterSoBangXml] = useState("all");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
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

  const [signingItems, setSigningItems] = useState<HoSoDieuChinh09Item[]>([]);

  // Dùng chung 1 modal duy nhất: Bấm "Ký Số" ở Navbar hay ở Dropzone đều mở modal này
  useRegisterSignModal(true, () => {
    setSigningItems(items.slice(0, 10));
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  });

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const result = await parseHs09ExcelFile(file);
      setItems(result.items);
      setFileUploadStats(result);
      // Tiền kết nối Cổng BHXH trong lúc người dùng xem dữ liệu
      BhxhChungTuService.takeToken().catch(() => {});
      toast.success(
        `Đã nạp thành công ${result.items.length} hồ sơ điều chỉnh 09/BH từ tệp "${file.name}"\nSheet: "${result.selectedSheet}"`,
        "Nạp File Excel Mẫu 09/BH Thành Công",
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lỗi đọc tệp Excel Hồ sơ điều chỉnh 09/BH!";
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
      content: "Bạn có chắc chắn muốn xóa toàn bộ danh sách hồ sơ 09/BH hiện tại?",
      danger: true,
      okText: "Xóa tất cả",
      cancelText: "Hủy",
      onOk: () => {
        setItems([]);
        setFileUploadStats(null);
        setSigningItems([]);
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
        id: `hs09-${Date.now()}`,
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
    const targetIds = new Set(
      (signingItems.length > 0 ? signingItems : items).map((i) => i.id),
    );
    setItems((prev) =>
      prev.map((i) =>
        targetIds.has(i.id)
          ? {
              ...i,
              ttKySo: 2,
              tinhTrangGui: 2,
              trangThai: "da_gui_cong",
              ngayGiaiTrinh: getTodayIsoDate(),
              maGiaoDichBhxh: result.maGiaoDich,
            }
          : i,
      ),
    );
    setSigningItems([]);
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

  const schemaProps = useSchemaMappingProps(HS09_SCHEMA_FIELDS, fileUploadStats);

  const effectiveSigningItems = useMemo(() => {
    if (signingItems.length > 0) return signingItems;
    return items.slice(0, 10);
  }, [signingItems, items]);

  return (
    <div className="space-y-6">
      {/* 2. Dropzone & Action Toolbar */}
      <Hs09Dropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={items.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={handleDownloadTemplate}
        onClearData={handleClearData}
        onOpenXmlModal={() => {
          setSigningItems(items.slice(0, 10));
          setXmlModalTab("smartca");
          setIsXmlModalOpen(true);
        }}
        onOpenApiTab={() => {
          setSigningItems(items.slice(0, 10));
          setXmlModalTab("smartca");
          setIsXmlModalOpen(true);
        }}
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
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
        onBulkSign={handleBulkSign}
        onUnsign={handleUnsign}
      />

      {/* MODALS */}
      {/* Edit / Add Modal */}
      <Hs09EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
        totalItemsCount={items.length}
      />

      {/* Detail Modal */}
      <Hs09DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
      />

      {/* XML / Base64 / API Modal */}
      <Hs09XmlModal
        isOpen={isXmlModalOpen}
        onClose={() => {
          setIsXmlModalOpen(false);
          setSigningItems([]);
        }}
        items={effectiveSigningItems}
        defaultTab={xmlModalTab}
        onSendSuccess={handleSendSuccess}
        fileUploadStats={fileUploadStats}
      />

      {/* Schema Mapping Modal */}
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
