import React, { useState, useMemo } from "react";
import type { DmDichVuItem, DmThuocPxItem } from "../../../types";
import {
  parseDichVuExcelFile,
  parseDichVuWorksheet,
  generateDichVuTemplate,
  type ParseDichVuExcelResult,
} from "./services/dichVuService";
import { useToast } from "../../../context/ToastContext";
import {
  DichVuDropzone,
  DichVuTable,
  DichVuEditModal,
  ThuocPxModal,
  DichVuXmlModal,
} from "./components";
import { useRegisterSignModal } from "../../../context/SignModalContext";

interface DmDichVuTabProps {
  isActive?: boolean;
}

export const DmDichVuTab: React.FC<DmDichVuTabProps> = ({ isActive = true }) => {
  const toast = useToast();
  const [dichVuItems, setDichVuItems] = useState<DmDichVuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] =
    useState<ParseDichVuExcelResult | null>(null);

  // Modal State for Mẫu 05/DM
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<"smartca" | "base64">("smartca");

  // Edit / Add Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DmDichVuItem | null>(null);

  // Đăng ký mở modal ký số khi tab này active
  useRegisterSignModal(isActive, () => {
    setXmlModalTab("smartca");
    setIsXmlModalOpen(true);
  });

  // Thuốc phóng xạ Modal State
  const [isThuocPxModalOpen, setIsThuocPxModalOpen] = useState(false);
  const [selectedServiceForPx, setSelectedServiceForPx] =
    useState<DmDichVuItem | null>(null);

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const result = await parseDichVuExcelFile(file);
      setDichVuItems(result.items);
      setFileUploadStats(result);
      toast.success(
        `Đã nạp thành công ${result.items.length} dịch vụ kỹ thuật từ file "${file.name}"\nSheet: "${result.selectedSheet}"`,
        "Nạp File Excel DVKT Thành Công",
      );
    } catch (err: any) {
      toast.error(
        err.message || "Lỗi đọc tệp Excel Dịch vụ kỹ thuật!",
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
      const result = parseDichVuWorksheet(
        ws,
        sheetName,
        fileUploadStats.availableSheets,
        fileUploadStats.fileName,
        fileUploadStats.workbook,
      );
      setDichVuItems(result.items);
      setFileUploadStats(result);
      toast.info(
        `Đã chuyển sang Sheet "${sheetName}" (${result.items.length} dịch vụ)`,
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
    setDichVuItems([]);
    setFileUploadStats(null);
    toast.info("Đã làm trống danh mục dịch vụ kỹ thuật", "Đã Dọn Dẹp");
  };

  const handleSaveItem = (item: DmDichVuItem) => {
    if (editingItem) {
      setDichVuItems(
        dichVuItems.map((i) => (i.id === editingItem.id ? item : i)),
      );
      toast.success(
        `Đã cập nhật dịch vụ: ${item.tenDichVu}`,
        "Cập Nhật Thành Công",
      );
    } else {
      const newItem: DmDichVuItem = {
        ...item,
        id: `dv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stt: dichVuItems.length + 1,
      };
      setDichVuItems([...dichVuItems, newItem]);
      toast.success(`Đã thêm dịch vụ: ${item.tenDichVu}`, "Thêm Thành Công");
    }
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: DmDichVuItem) => {
    toast.showConfirm({
      title: "Xác nhận xóa dịch vụ",
      content: `Bạn có chắc chắn muốn xóa dịch vụ "${item.tenDichVu}" (${item.maDichVu})?`,
      danger: true,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        setDichVuItems((prev) =>
          prev
            .filter((i) => i.id !== item.id)
            .map((i, idx) => ({ ...i, stt: idx + 1 })),
        );
        toast.info(`Đã xóa dịch vụ: ${item.tenDichVu}`, "Đã Xóa");
      },
    });
  };

  const handleOpenThuocPxModal = (item: DmDichVuItem) => {
    setSelectedServiceForPx(item);
    setIsThuocPxModalOpen(true);
  };

  const handleSaveThuocPx = (pxItems: DmThuocPxItem[]) => {
    if (!selectedServiceForPx) return;
    const totalPx = pxItems.reduce(
      (acc, cur) => acc + (cur.thanhTienThuoc || 0),
      0,
    );
    setDichVuItems((prev) =>
      prev.map((i) => {
        if (i.id === selectedServiceForPx.id) {
          return {
            ...i,
            dsThuocPx: pxItems,
            giaThanhToan: (i.donGia || 0) + totalPx,
          };
        }
        return i;
      }),
    );
    toast.success(
      `Đã cập nhật thuốc phóng xạ cho dịch vụ: ${selectedServiceForPx.tenDichVu}`,
      "Cập Nhật Thuốc PX",
    );
  };

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return dichVuItems;
    return dichVuItems.filter(
      (i) =>
        i.tenDichVu.toLowerCase().includes(q) ||
        i.maDichVu.toLowerCase().includes(q) ||
        (i.tenDvktGia && i.tenDvktGia.toLowerCase().includes(q)) ||
        (i.quyTrinh && i.quyTrinh.toLowerCase().includes(q)) ||
        (i.qdDvkt && i.qdDvkt.toLowerCase().includes(q)) ||
        (i.qdPdGia && i.qdPdGia.toLowerCase().includes(q)) ||
        (i.ghiChu && i.ghiChu.toLowerCase().includes(q)),
    );
  }, [dichVuItems, searchTerm]);

  return (
    <div className="space-y-2.5">
      {/* 2. Excel Upload Dropzone & Action Toolbar */}
      <DichVuDropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={dichVuItems.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={generateDichVuTemplate}
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

      {/* 4. Table of Services */}
      <DichVuTable
        items={filteredItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddNew={() => {
          setEditingItem(null);
          setIsEditModalOpen(true);
        }}
        onEdit={(item: DmDichVuItem) => {
          setEditingItem(item);
          setIsEditModalOpen(true);
        }}
        onDelete={handleDeleteItem}
        onManageThuocPx={handleOpenThuocPxModal}
      />

      {/* 5. Add / Edit Modal */}
      <DichVuEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      {/* 6. Thuốc Phóng Xạ Modal */}
      {selectedServiceForPx && (
        <ThuocPxModal
          isOpen={isThuocPxModalOpen}
          onClose={() => {
            setIsThuocPxModalOpen(false);
            setSelectedServiceForPx(null);
          }}
          serviceName={selectedServiceForPx.tenDichVu}
          serviceCode={selectedServiceForPx.maDichVu}
          items={selectedServiceForPx.dsThuocPx || []}
          onSave={handleSaveThuocPx}
        />
      )}

      {/* 7. XML & API Sandbox Modal */}
      <DichVuXmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        items={dichVuItems}
        defaultTab={xmlModalTab}
        fileUploadStats={fileUploadStats}
      />
    </div>
  );
};
