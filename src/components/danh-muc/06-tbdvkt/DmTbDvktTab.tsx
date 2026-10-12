import React, { useState, useMemo } from "react";
import type { DmTbytThdvItem } from "../../../types";
import {
  parseTbytThdvExcelFile,
  parseTbytThdvWorksheet,
  downloadTbytThdvExcelTemplate,
  type ParseTbytThdvExcelResult,
} from "./services/tbyttHdvService";
import { useToast } from "../../../context/ToastContext";
import { TbytThdvDropzone } from "./components/TbytThdvDropzone";
import { TbytThdvTable } from "./components/TbytThdvTable";
import { TbytThdvXmlModal } from "./components/TbytThdvXmlModal";
import { TbytThdvEditModal } from "./components/TbytThdvEditModal";
import { useRegisterSignModal } from "../../../context/SignModalContext";

interface DmTbDvktTabProps {
  isActive?: boolean;
}

export const DmTbDvktTab: React.FC<DmTbDvktTabProps> = ({ isActive = true }) => {
  const toast = useToast();
  const [tbytItems, setTbytItems] = useState<DmTbytThdvItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseTbytThdvExcelResult | null>(null);

  // Modal State for Mẫu 06/DM
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<"smartca" | "base64">("smartca");

  // Edit / Add Modal State for Mẫu 06/DM
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DmTbytThdvItem | null>(null);

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
      const result = await parseTbytThdvExcelFile(file);
      setTbytItems(result.items);
      setFileUploadStats(result);
      toast.success(
        `Đã nạp thành công ${result.items.length} thiết bị thực hiện DVKT từ file "${file.name}"\nSheet: "${result.selectedSheet}"`,
        "Nạp File Excel Mẫu 06 Thành Công",
      );
    } catch (err: any) {
      toast.error(
        err.message || "Lỗi đọc tệp Excel Thiết bị thực hiện DVKT!",
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
      const result = parseTbytThdvWorksheet(
        ws,
        sheetName,
        fileUploadStats.availableSheets,
        fileUploadStats.fileName,
        fileUploadStats.workbook,
      );
      setTbytItems(result.items);
      setFileUploadStats(result);
      toast.info(
        `Đã chuyển sang Sheet "${sheetName}" (${result.items.length} thiết bị)`,
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
    setTbytItems([]);
    setFileUploadStats(null);
    toast.info("Đã làm trống danh mục thiết bị thực hiện DVKT", "Đã Dọn Dẹp");
  };

  const handleSaveItem = (item: DmTbytThdvItem) => {
    if (editingItem) {
      setTbytItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? item : i)),
      );
      toast.success(
        `Đã cập nhật thiết bị: ${item.tenTb}`,
        "Cập Nhật Thành Công",
      );
    } else {
      setTbytItems((prev) => {
        const newItem: DmTbytThdvItem = {
          ...item,
          id: `tbdv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          stt: prev.length + 1,
        };
        return [...prev, newItem];
      });
      toast.success(`Đã thêm thiết bị: ${item.tenTb}`, "Thêm Thành Công");
    }
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: DmTbytThdvItem) => {
    toast.showConfirm({
      title: "Xác nhận xóa thiết bị",
      content: `Bạn có chắc chắn muốn xóa thiết bị "${item.tenTb}" (Mã máy: ${item.maMay})?`,
      danger: true,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        setTbytItems((prev) =>
          prev
            .filter((i) => i.id !== item.id)
            .map((i, idx) => ({ ...i, stt: idx + 1 })),
        );
        toast.info(`Đã xóa thiết bị: ${item.tenTb}`, "Đã Xóa");
      },
    });
  };

  // XML & Base64 Generation
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return tbytItems;
    return tbytItems.filter(
      (i) =>
        i.tenTb.toLowerCase().includes(q) ||
        i.maMay.toLowerCase().includes(q) ||
        (i.kyHieu && i.kyHieu.toLowerCase().includes(q)) ||
        (i.congTySx && i.congTySx.toLowerCase().includes(q)) ||
        (i.nuocSx && i.nuocSx.toLowerCase().includes(q)) ||
        (i.soLuuHanh && i.soLuuHanh.toLowerCase().includes(q)) ||
        (i.maCskcb && i.maCskcb.toLowerCase().includes(q)),
    );
  }, [tbytItems, searchTerm]);

  return (
    <div className="space-y-2.5">
      {/* 2. Excel Upload Dropzone & Action Toolbar */}
      <TbytThdvDropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={tbytItems.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={downloadTbytThdvExcelTemplate}
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

      {/* 4. Table of Medical Equipment */}
      <TbytThdvTable
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
      <TbytThdvEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      {/* 6. XML & Base64 Modal */}
      <TbytThdvXmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        items={tbytItems}
        defaultTab={xmlModalTab}
        fileUploadStats={fileUploadStats}
      />
    </div>
  );
};
