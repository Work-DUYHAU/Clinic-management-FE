import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ParseThuocExcelResult } from '../services/thuocService';
import { DanhMucDropzone } from '../../common';

interface ThuocDropzoneProps {
  isLoadingFile: boolean;
  fileUploadStats: ParseThuocExcelResult | null;
  itemsCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchSheet: (sheetName: string) => void;
  onDownloadTemplate: () => void;
  onClearData: () => void;
  onOpenXmlModal: () => void;
  onOpenApiTab: () => void;
  onOpenSchemaModal: () => void;
  onAddNew: () => void;
}

export const ThuocDropzone: React.FC<ThuocDropzoneProps> = ({
  isLoadingFile,
  fileUploadStats,
  itemsCount,
  onFileUpload,
  onSwitchSheet,
  onDownloadTemplate,
  onClearData,
  onOpenXmlModal,
  onOpenApiTab,
  onOpenSchemaModal,
  onAddNew
}) => {
  return (
    <DanhMucDropzone
      themeColor="blue"
      isLoadingFile={isLoadingFile}
      loadingTitle="Đang đọc và phân tích file Excel thuốc..."
      title="Nạp Tệp Excel Danh Mục Thuốc Từ Máy Tính"
      description={
        <>Kéo thả hoặc nhấp để chọn file (.xlsx, .xls, .csv). Tự động đối soát 37 trường dữ liệu thuốc &amp; chế phẩm chuẩn BHXH.</>
      }
      uploadStats={
        fileUploadStats
          ? {
              selectedSheet: fileUploadStats.selectedSheet,
              totalRows: fileUploadStats.totalRows,
              rowUnitLabel: 'thuốc / chế phẩm',
              matchedColumnsCount: fileUploadStats.matchedFields.length,
              totalColumnsCount: 37,
              fileName: fileUploadStats.fileName,
              availableSheets: fileUploadStats.sheets,
              extraBadge: (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-sm text-[11px] font-mono">
                  <CheckCircle2 size={13} />
                  <span>Sẵn sàng sinh chuỗi XML Loại 10</span>
                </div>
              ),
            }
          : undefined
      }
      itemsCount={itemsCount}
      onFileUpload={onFileUpload}
      onSwitchSheet={onSwitchSheet}
      onOpenSchemaModal={onOpenSchemaModal}
      onDownloadTemplate={onDownloadTemplate}
      onClearData={onClearData}
      onOpenXmlModal={onOpenXmlModal}
      onOpenApiTab={onOpenApiTab}
      onAddNew={onAddNew}
      templateLabel="Tải File Mẫu Excel (03/DM)"
      xmlLabel="Xem & Xuất File XML (03/DM)"
      apiLabel="Gửi Cổng BHXH (GuiDanhMuc03)"
      addNewLabel="Thêm Thuốc Mới"
    />
  );
};
