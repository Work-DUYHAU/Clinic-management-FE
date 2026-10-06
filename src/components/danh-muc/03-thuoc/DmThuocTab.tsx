import React, { useState } from 'react';
import type { DmThuocItem } from '../../../types';
import {
  THUOC_SCHEMA_FIELDS,
  parseThuocExcelFile,
  parseThuocWorksheet,
  downloadThuocExcelTemplate,
  type ParseThuocExcelResult
} from './services/thuocService';
import { useToast } from '../../../context/ToastContext';
import { ThuocDropzone } from './components/ThuocDropzone';
import { ThuocTable } from './components/ThuocTable';
import { ThuocEditModal } from './components/ThuocEditModal';
import { ThuocXmlModal } from './components/ThuocXmlModal';
import { SchemaMappingModal, SchemaMappingCard } from '../common';
import { useSchemaMappingProps } from '../../../hooks';
import { useRegisterSignModal } from '../../../context/SignModalContext';

interface DmThuocTabProps {
  isActive?: boolean;
}

export const DmThuocTab: React.FC<DmThuocTabProps> = ({ isActive = true }) => {
  const toast = useToast();
  const [thuocItems, setThuocItems] = useState<DmThuocItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileUploadStats, setFileUploadStats] = useState<ParseThuocExcelResult | null>(null);

  // Modal States
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<'smartca' | 'base64'>('smartca');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DmThuocItem | null>(null);

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Đăng ký mở modal ký số khi tab này active
  useRegisterSignModal(isActive, () => {
    setXmlModalTab('smartca');
    setIsXmlModalOpen(true);
  });

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const result = await parseThuocExcelFile(file);
      setThuocItems(result.items);
      setFileUploadStats(result);
      toast.success(
        `Đã nạp thành công ${result.items.length} mặt hàng thuốc (${result.matchedFields.length}/37 trường chuẩn)\nSheet: "${result.selectedSheet}"`,
        'Nạp File Excel Thuốc Thành Công'
      );
    } catch (err: any) {
      toast.error(err.message || 'Lỗi đọc tệp Excel Thuốc!', 'Lỗi Đọc File');
    } finally {
      setIsLoadingFile(false);
      e.target.value = '';
    }
  };

  const handleSwitchSheet = (sheetName: string) => {
    if (!fileUploadStats?.workbook) return;
    try {
      const result = parseThuocWorksheet(fileUploadStats.workbook, sheetName, fileUploadStats.fileName);
      setThuocItems(result.items);
      setFileUploadStats(result);
      toast.info(`Đã chuyển sang Sheet "${sheetName}" (${result.items.length} mặt hàng)`, 'Chuyển Sheet Dữ Liệu');
    } catch (err: any) {
      toast.error(`Lỗi khi chuyển sang sheet "${sheetName}": ${err.message}`, 'Lỗi Đọc Sheet');
    }
  };

  const handleClearData = () => {
    setThuocItems([]);
    setFileUploadStats(null);
    toast.info('Đã làm trống bảng danh mục thuốc', 'Đã Dọn Dẹp');
  };

  const handleSaveItem = (item: DmThuocItem) => {
    if (editingItem) {
      setThuocItems(thuocItems.map((i) => (i.id === editingItem.id ? item : i)));
      toast.success(`Đã cập nhật thuốc: ${item.tenThuoc}`, 'Cập Nhật Thành Công');
    } else {
      const newItem: DmThuocItem = {
        ...item,
        id: `thuoc-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stt: thuocItems.length + 1
      };
      setThuocItems([...thuocItems, newItem]);
      toast.success(`Đã thêm thuốc mới: ${item.tenThuoc}`, 'Thêm Thành Công');
    }
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: DmThuocItem) => {
    toast.showConfirm({
      title: 'Xác nhận xóa thuốc',
      content: `Bạn có chắc chắn muốn xóa thuốc "${item.tenThuoc}" (${item.maThuoc})?`,
      danger: true,
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: () => {
        const updated = thuocItems
          .filter((i) => i.id !== item.id)
          .map((i, idx) => ({ ...i, stt: idx + 1 }));
        setThuocItems(updated);
        toast.info(`Đã xóa: ${item.tenThuoc}`, 'Đã Xóa');
      },
    });
  };

  const filteredItems = thuocItems.filter((i) => {
    const q = searchTerm.toLowerCase();
    return (
      i.tenThuoc.toLowerCase().includes(q) ||
      (i.tenHoatChat && i.tenHoatChat.toLowerCase().includes(q)) ||
      i.maThuoc.toLowerCase().includes(q) ||
      i.soDangKy.toLowerCase().includes(q) ||
      (i.nhaThau && i.nhaThau.toLowerCase().includes(q))
    );
  });

  const schemaProps = useSchemaMappingProps(THUOC_SCHEMA_FIELDS, fileUploadStats);

  return (
    <div className="space-y-6">
      <ThuocDropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={thuocItems.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={downloadThuocExcelTemplate}
        onClearData={handleClearData}
        onOpenXmlModal={() => {
          setIsXmlModalOpen(true);
          setXmlModalTab('smartca');
        }}
        onOpenApiTab={() => {
          setIsXmlModalOpen(true);
          setXmlModalTab('smartca');
        }}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onAddNew={() => {
          setEditingItem(null);
          setIsEditModalOpen(true);
        }}
      />

      {/* Schema Mapping & Column Comparison Card */}
      <SchemaMappingCard
        title="Đối Soát Khớp Cột Chuẩn Mẫu 03/DM (Thuốc, Máu & Chế Phẩm Máu)"
        loaiHsBadge="Loại HS 10 - 37 Trường"
        {...schemaProps}
        defaultExpanded={!!fileUploadStats}
      />

      <ThuocTable
        items={filteredItems}
        searchTerm={searchTerm}
        totalCount={thuocItems.length}
        onSearchChange={setSearchTerm}
        onEdit={(item) => {
          setEditingItem(item);
          setIsEditModalOpen(true);
        }}
        onDelete={handleDeleteItem}
      />

      <ThuocXmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        items={thuocItems}
        defaultTab={xmlModalTab}
        fileUploadStats={fileUploadStats}
      />

      <ThuocEditModal
        key={editingItem?.id ?? 'new-thuoc-item'}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      {/* Reusable Schema Inspector Modal */}
      <SchemaMappingModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        title="Mẫu 03/DM: Danh Mục Thuốc, Máu & Chế Phẩm Máu BHYT"
        loaiHsBadge="Loại HS 10 - 37 Trường"
        {...schemaProps}
      />
    </div>
  );
};
