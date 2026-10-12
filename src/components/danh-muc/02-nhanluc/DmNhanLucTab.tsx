import React, { useState, useMemo } from 'react';
import type { DmNhanLucItem } from '../../../types';
import {
  parseNhanLucExcelFile,
  parseNhanLucWorksheet,
  downloadNhanLucExcelTemplate,
  type ParseNhanLucExcelResult
} from './services/nhanLucService';
import { useToast } from '../../../context/ToastContext';
import { NhanLucDropzone } from './components/NhanLucDropzone';
import { NhanLucTable } from './components/NhanLucTable';
import { NhanLucXmlModal } from './components/NhanLucXmlModal';
import { NhanLucEditModal } from './components/NhanLucEditModal';
import { useRegisterSignModal } from '../../../context/SignModalContext';

interface DmNhanLucTabProps {
  isActive?: boolean;
}

export const DmNhanLucTab: React.FC<DmNhanLucTabProps> = ({ isActive = true }) => {
  const toast = useToast();
  const [nhanLucItems, setNhanLucItems] = useState<DmNhanLucItem[]>([]);
  const [searchNhanLuc, setSearchNhanLuc] = useState('');
  const [isLoadingNhanLucFile, setIsLoadingNhanLucFile] = useState(false);
  const [nhanLucFileUploadStats, setNhanLucFileUploadStats] = useState<ParseNhanLucExcelResult | null>(null);

  // Modal State for Mẫu 02/DM
  const [isNhanLucXmlModalOpen, setIsNhanLucXmlModalOpen] = useState(false);
  const [xmlModalTab, setXmlModalTab] = useState<'smartca' | 'base64'>('smartca');

  // Edit / Add Modal State for Mẫu 02/DM
  const [isNhanLucEditModalOpen, setIsNhanLucEditModalOpen] = useState(false);
  const [editingNhanLucItem, setEditingNhanLucItem] = useState<DmNhanLucItem | null>(null);

  // Đăng ký mở modal ký số khi tab này active
  useRegisterSignModal(isActive, () => {
    setXmlModalTab('smartca');
    setIsNhanLucXmlModalOpen(true);
  });

  // File Upload Handler
  const handleNhanLucFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingNhanLucFile(true);
    try {
      const result = await parseNhanLucExcelFile(file);
      setNhanLucItems(result.items);
      setNhanLucFileUploadStats(result);
      toast.success(
        `Đã nạp thành công ${result.items.length} nhân sự từ file "${file.name}"\nSheet: "${result.selectedSheet}"`,
        'Nạp File Excel Nhân Lực Thành Công'
      );
    } catch (err: any) {
      toast.error(err.message || 'Lỗi đọc tệp Excel Nhân Lực!', 'Lỗi Đọc File');
    } finally {
      setIsLoadingNhanLucFile(false);
      e.target.value = '';
    }
  };

  const handleNhanLucSwitchSheet = (sheetName: string) => {
    if (!nhanLucFileUploadStats?.workbook) return;
    try {
      const ws = nhanLucFileUploadStats.workbook.Sheets[sheetName];
      const result = parseNhanLucWorksheet(
        ws,
        sheetName,
        nhanLucFileUploadStats.availableSheets,
        nhanLucFileUploadStats.fileName,
        nhanLucFileUploadStats.workbook
      );
      setNhanLucItems(result.items);
      setNhanLucFileUploadStats(result);
      toast.info(`Đã chuyển sang Sheet "${sheetName}" (${result.items.length} nhân sự)`, 'Chuyển Sheet Dữ Liệu');
    } catch (err: any) {
      toast.error(`Lỗi khi chuyển sang sheet "${sheetName}": ${err.message}`, 'Lỗi Đọc Sheet');
    }
  };

  const handleNhanLucClearData = () => {
    setNhanLucItems([]);
    setNhanLucFileUploadStats(null);
    toast.info('Đã làm trống danh mục nhân lực', 'Đã Dọn Dẹp');
  };

  const handleSaveNhanLucItem = (item: DmNhanLucItem) => {
    if (editingNhanLucItem) {
      setNhanLucItems(nhanLucItems.map((i) => (i.id === editingNhanLucItem.id ? item : i)));
      toast.success(`Đã cập nhật nhân sự: ${item.hoTen}`, 'Cập Nhật Thành Công');
    } else {
      const newItem = {
        ...item,
        id: `nl-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stt: nhanLucItems.length + 1
      };
      setNhanLucItems([...nhanLucItems, newItem]);
      toast.success(`Đã thêm nhân sự: ${item.hoTen}`, 'Thêm Thành Công');
    }
    setIsNhanLucEditModalOpen(false);
    setEditingNhanLucItem(null);
  };

  const handleDeleteNhanLucItem = (item: DmNhanLucItem) => {
    toast.showConfirm({
      title: 'Xác nhận xóa nhân sự',
      content: `Bạn có chắc chắn muốn xóa nhân sự "${item.hoTen}" (${item.soDinhDanh})?`,
      danger: true,
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: () => {
        setNhanLucItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.info(`Đã xóa nhân sự: ${item.hoTen}`, 'Đã Xóa');
      },
    });
  };

  const filteredNhanLucItems = useMemo(() => {
    const q = searchNhanLuc.trim().toLowerCase();
    if (!q) return nhanLucItems;
    return nhanLucItems.filter(
      (i) =>
        i.hoTen.toLowerCase().includes(q) ||
        i.soDinhDanh.toLowerCase().includes(q) ||
        i.maKhoa.toLowerCase().includes(q) ||
        (i.macchn && i.macchn.toLowerCase().includes(q)) ||
        (i.phamviCm && i.phamviCm.toLowerCase().includes(q)),
    );
  }, [nhanLucItems, searchNhanLuc]);

  return (
    <div className="space-y-2.5">
      <NhanLucDropzone
        isLoadingFile={isLoadingNhanLucFile}
        fileUploadStats={nhanLucFileUploadStats}
        itemsCount={nhanLucItems.length}
        onFileUpload={handleNhanLucFileUpload}
        onSwitchSheet={handleNhanLucSwitchSheet}
        onDownloadTemplate={downloadNhanLucExcelTemplate}
        onClearData={handleNhanLucClearData}
        onOpenXmlModal={() => {
          setIsNhanLucXmlModalOpen(true);
          setXmlModalTab('smartca');
        }}
        onOpenApiTab={() => {
          setIsNhanLucXmlModalOpen(true);
          setXmlModalTab('smartca');
        }}
        onAddNew={() => {
          setEditingNhanLucItem(null);
          setIsNhanLucEditModalOpen(true);
        }}
      />

      <NhanLucTable
        items={filteredNhanLucItems}
        searchTerm={searchNhanLuc}
        totalCount={nhanLucItems.length}
        onSearchChange={setSearchNhanLuc}
        onEdit={(item) => {
          setEditingNhanLucItem(item);
          setIsNhanLucEditModalOpen(true);
        }}
        onDelete={handleDeleteNhanLucItem}
      />

      <NhanLucXmlModal
        isOpen={isNhanLucXmlModalOpen}
        onClose={() => setIsNhanLucXmlModalOpen(false)}
        items={nhanLucItems}
        defaultTab={xmlModalTab}
        fileUploadStats={nhanLucFileUploadStats}
      />

      <NhanLucEditModal
        isOpen={isNhanLucEditModalOpen}
        onClose={() => {
          setIsNhanLucEditModalOpen(false);
          setEditingNhanLucItem(null);
        }}
        onSave={handleSaveNhanLucItem}
        initialData={editingNhanLucItem}
      />
    </div>
  );
};
