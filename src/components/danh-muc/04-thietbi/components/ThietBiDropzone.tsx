import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ParseThietBiExcelResult } from '../services/thietBiService';
import { DanhMucDropzone } from '../../common';

interface ThietBiDropzoneProps {
  isLoadingFile: boolean;
  fileUploadStats: ParseThietBiExcelResult | null;
  itemsCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchSheet: (sheetName: string) => void;
  onDownloadTemplate: () => void;
  onClearData: () => void;
  onOpenXmlModal: () => void;
  onOpenApiTab: () => void;
  onAddNew: () => void;
}

export const ThietBiDropzone: React.FC<ThietBiDropzoneProps> = ({
  isLoadingFile,
  fileUploadStats,
  itemsCount,
  onFileUpload,
  onSwitchSheet,
  onDownloadTemplate,
  onClearData,
  onOpenXmlModal,
  onOpenApiTab,
  onAddNew,
}) => {
  return (
    <DanhMucDropzone
      themeColor="blue"
      isLoadingFile={isLoadingFile}
      loadingTitle="Đang đọc và phân tích file Excel vật tư / TBYT..."
      title="Nạp Tệp Excel Danh Mục Vật Tư / TBYT Từ Máy Tính"
      description={
        <>Kéo thả hoặc nhấp để chọn file (.xlsx, .xls, .csv). Tự động đối soát 28 trường dữ liệu vật tư / thiết bị y tế chuẩn.</>
      }
      uploadStats={
        fileUploadStats
          ? {
              selectedSheet: fileUploadStats.selectedSheet,
              totalRows: fileUploadStats.totalRows,
              rowUnitLabel: 'thiết bị / vật tư',
              matchedColumnsCount: fileUploadStats.matchedFields.length,
              totalColumnsCount: 28,
              fileName: fileUploadStats.fileName,
              availableSheets: fileUploadStats.availableSheets,
              extraBadge: (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-sm text-[11px] font-mono">
                  <CheckCircle2 size={13} />
                  <span>Sẵn sàng sinh chuỗi XML Loại 20</span>
                </div>
              ),
            }
          : undefined
      }
      itemsCount={itemsCount}
      onFileUpload={onFileUpload}
      onSwitchSheet={onSwitchSheet}
      onDownloadTemplate={onDownloadTemplate}
      onClearData={onClearData}
      onOpenXmlModal={onOpenXmlModal}
      onOpenApiTab={onOpenApiTab}
      onAddNew={onAddNew}
      templateLabel="Tải File Mẫu Excel (04/DM)"
      xmlLabel="Xem & Xuất File XML (04/DM)"
      apiLabel="Gửi Cổng BHXH (GuiDanhMuc02)"
      addNewLabel="Thêm Thiết Bị Mới"
    />
  );
};
