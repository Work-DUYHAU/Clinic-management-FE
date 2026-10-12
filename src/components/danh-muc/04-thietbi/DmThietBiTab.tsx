import React, { useState, useMemo } from "react";
import type { DmThietBiItem } from "../../../types";
import {
  parseThietBiExcelFile,
  parseThietBiWorksheet,
  downloadThietBiExcelTemplate,
  type ParseThietBiExcelResult,
} from "./services/thietBiService";
import { useToast } from "../../../context/ToastContext";
import { ThietBiDropzone } from "./components/ThietBiDropzone";
import { ThietBiTable } from "./components/ThietBiTable";
import { ThietBiXmlModal } from "./components/ThietBiXmlModal";
import { ThietBiEditModal } from "./components/ThietBiEditModal";
import { useRegisterSignModal } from "../../../context/SignModalContext";

interface DmThietBiTabProps {
  isActive?: boolean;
}

export const DmThietBiTab: React.FC<DmThietBiTabProps> = ({ isActive = true }) => {
  const toast = useToast();
  const [thietBiItems, setThietBiItems] = useState<DmThietBiItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseThietBiExcelResult | null>(null);

  // Modal State for Mẫu 04/DM
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<"smartca" | "base64">("smartca");

  // Edit / Add Modal State for Mẫu 04/DM
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DmThietBiItem | null>(null);

  // Đăng ký mở modal ký số khi tab này active
  useRegisterSignModal(isActive, () => {
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  });

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const result = await parseThietBiExcelFile(file);
      setThietBiItems(result.items);
      setFileUploadStats(result);
      toast.success(
        `Đã nạp thành công ${result.items.length} thiết bị / vật tư từ file "${file.name}"\nSheet: "${result.selectedSheet}"`,
        "Nạp File Excel TBYT Thành Công",
      );
    } catch (err: any) {
      toast.error(
        err.message || "Lỗi đọc tệp Excel Thiết bị y tế!",
        "Lỗi Đọc File",
      );
    } finally {
      setIsLoadingFile(false);
      e.target.value = "";
    }
  };

  const handleSwitchSheet = (sheetName: string) => {
    if (!fileUploadStats?.workbook) return;
    try {
      const ws = fileUploadStats.workbook.Sheets[sheetName];
      const result = parseThietBiWorksheet(
        ws,
        sheetName,
        fileUploadStats.availableSheets,
        fileUploadStats.fileName,
        fileUploadStats.workbook,
      );
      setThietBiItems(result.items);
      setFileUploadStats(result);
      toast.info(
        `Đã chuyển sang Sheet "${sheetName}" (${result.items.length} thiết bị / vật tư)`,
        "Chuyển Sheet Dữ Liệu",
      );
    } catch (err: any) {
      toast.error(
        `Lỗi khi chuyển sang sheet "${sheetName}": ${err.message}`,
        "Lỗi Đọc Sheet",
      );
    }
  };

  const handleClearData = () => {
    setThietBiItems([]);
    setFileUploadStats(null);
    toast.info("Đã làm trống danh mục thiết bị y tế", "Đã Dọn Dẹp");
  };

  const handleSaveItem = (item: DmThietBiItem) => {
    if (editingItem) {
      setThietBiItems(
        thietBiItems.map((i) => (i.id === editingItem.id ? item : i)),
      );
      toast.success(
        `Đã cập nhật thiết bị: ${item.tenVatTu}`,
        "Cập Nhật Thành Công",
      );
    } else {
      const newItem: DmThietBiItem = {
        ...item,
        id: `tb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stt: thietBiItems.length + 1,
      };
      setThietBiItems([...thietBiItems, newItem]);
      toast.success(`Đã thêm thiết bị: ${item.tenVatTu}`, "Thêm Thành Công");
    }
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: DmThietBiItem) => {
    toast.showConfirm({
      title: "Xác nhận xóa thiết bị",
      content: `Bạn có chắc chắn muốn xóa thiết bị "${item.tenVatTu}" (${item.maVatTu})?`,
      danger: true,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        setThietBiItems((prev) =>
          prev
            .filter((i) => i.id !== item.id)
            .map((i, idx) => ({ ...i, stt: idx + 1 })),
        );
        toast.info(`Đã xóa thiết bị: ${item.tenVatTu}`, "Đã Xóa");
      },
    });
  };

  // XML & Base64 Generation
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return thietBiItems;
    return thietBiItems.filter(
      (i) =>
        i.tenVatTu.toLowerCase().includes(q) ||
        i.maVatTu.toLowerCase().includes(q) ||
        i.nhomVatTu.toLowerCase().includes(q) ||
        (i.hangSx && i.hangSx.toLowerCase().includes(q)) ||
        (i.soLuuHanh && i.soLuuHanh.toLowerCase().includes(q)) ||
        (i.maHieu && i.maHieu.toLowerCase().includes(q)) ||
        (i.nhaThau && i.nhaThau.toLowerCase().includes(q)),
    );
  }, [thietBiItems, searchTerm]);

  return (
    <div className="space-y-2.5">
      {/* 2. Excel Upload Dropzone & Action Toolbar */}
      <ThietBiDropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={thietBiItems.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={downloadThietBiExcelTemplate}
        onClearData={handleClearData}
        onOpenXmlModal={() => {
          setXmlModalTab("smartca");
          setIsXmlModalOpen(true);
        }}
        onOpenApiTab={() => {
          setXmlModalTab("smartca");
          setIsXmlModalOpen(true);
        }}
        onAddNew={() => {
          setEditingItem(null);
          setIsEditModalOpen(true);
        }}
      />

      {/* 4. Table of Devices & Consumables */}
      <ThietBiTable
        items={filteredItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddNew={() => {
          setEditingItem(null);
          setIsEditModalOpen(true);
        }}
        onEdit={(item) => {
          setEditingItem(item);
          setIsEditModalOpen(true);
        }}
        onDelete={handleDeleteItem}
      />

      {/* 5. Add / Edit Modal */}
      <ThietBiEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      {/* 6. XML & Base64 Modal */}
      <ThietBiXmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        items={thietBiItems}
        defaultTab={xmlModalTab}
        fileUploadStats={fileUploadStats}
      />
    </div>
  );
};
