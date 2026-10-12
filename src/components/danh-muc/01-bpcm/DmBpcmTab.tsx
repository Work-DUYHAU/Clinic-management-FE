import React, { useState, useMemo } from "react";
import type { DmBpcmItem } from "../../../types";
import {
  parseBpcmExcelFile,
  parseWorksheet,
  downloadBpcmExcelTemplate,
  type ParseExcelResult,
} from "./services/bpcmService";
import { useToast } from "../../../context/ToastContext";
import { BpcmDropzone } from "./components/BpcmDropzone";
import { BpcmTable } from "./components/BpcmTable";
import { BpcmXmlModal } from "./components/BpcmXmlModal";
import { BpcmEditModal } from "./components/BpcmEditModal";
import { useRegisterSignModal } from "../../../context/SignModalContext";

interface DmBpcmTabProps {
  isActive?: boolean;
}

export const DmBpcmTab: React.FC<DmBpcmTabProps> = ({ isActive = true }) => {
  const toast = useToast();
  const [bpcmItems, setBpcmItems] = useState<DmBpcmItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseExcelResult | null>(null);

  // Modal States
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<"smartca" | "base64">("smartca");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DmBpcmItem | null>(null);

  // Đăng ký mở modal ký số khi tab này active
  useRegisterSignModal(isActive, () => {
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const result = await parseBpcmExcelFile(file);
      setBpcmItems(result.items);
      setFileUploadStats(result);
      toast.success(
        `Đã nạp thành công ${result.items.length} bản ghi từ tệp "${file.name}"\nSheet: "${result.selectedSheet}"`,
        "Nạp File Excel Thành Công",
      );
    } catch (err: any) {
      toast.error(err.message || "Lỗi đọc tệp Excel!", "Lỗi Đọc File");
    } finally {
      setIsLoadingFile(false);
      e.target.value = "";
    }
  };

  const handleSwitchSheet = (sheetName: string) => {
    if (!fileUploadStats?.workbook) return;
    try {
      const result = parseWorksheet(
        fileUploadStats.workbook,
        sheetName,
        fileUploadStats.fileName,
      );
      setBpcmItems(result.items);
      setFileUploadStats(result);
      toast.info(
        `Đã chuyển sang Sheet "${sheetName}" (${result.items.length} bản ghi)`,
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
    setBpcmItems([]);
    setFileUploadStats(null);
    toast.info("Đã làm trống bảng dữ liệu BPCM", "Đã Dọn Dẹp");
  };

  const handleSaveItem = (item: DmBpcmItem) => {
    if (editingItem) {
      setBpcmItems(bpcmItems.map((i) => (i.id === editingItem.id ? item : i)));
      toast.success(
        `Đã cập nhật khoa phòng: ${item.tenKhoa}`,
        "Cập Nhật Thành Công",
      );
    } else {
      const newItem = {
        ...item,
        id: `bpcm-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stt: bpcmItems.length + 1,
      };
      setBpcmItems([...bpcmItems, newItem]);
      toast.success(
        `Đã thêm mới khoa phòng: ${item.tenKhoa}`,
        "Thêm Thành Công",
      );
    }
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: DmBpcmItem) => {
    toast.showConfirm({
      title: "Xác nhận xóa khoa/bàn khám",
      content: `Bạn có chắc chắn muốn xóa khoa/bàn khám "${item.tenKhoa}" (${item.maKhoa})?`,
      danger: true,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        setBpcmItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.info(`Đã xóa: ${item.tenKhoa}`, "Đã Xóa");
      },
    });
  };

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return bpcmItems;
    return bpcmItems.filter(
      (i) =>
        i.tenKhoa.toLowerCase().includes(q) ||
        i.maKhoa.toLowerCase().includes(q) ||
        i.maCskcb.toLowerCase().includes(q),
    );
  }, [bpcmItems, searchTerm]);

  return (
    <div className="space-y-2.5">
      <BpcmDropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={bpcmItems.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={downloadBpcmExcelTemplate}
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

      <BpcmTable
        items={filteredItems}
        searchTerm={searchTerm}
        totalCount={bpcmItems.length}
        onSearchChange={setSearchTerm}
        onEdit={(item) => {
          setEditingItem(item);
          setIsEditModalOpen(true);
        }}
        onDelete={handleDeleteItem}
      />

      <BpcmXmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        items={bpcmItems}
        defaultTab={xmlModalTab}
        fileUploadStats={fileUploadStats}
      />

      <BpcmEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
      />
    </div>
  );
};
