import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ParseExcelResult } from '../services/bpcmService';
import { DanhMucDropzone } from '../../common';

interface BpcmDropzoneProps {
  isLoadingFile: boolean;
  fileUploadStats: ParseExcelResult | null;
  itemsCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchSheet: (sheetName: string) => void;
  onDownloadTemplate: () => void;
  onClearData: () => void;
  onOpenXmlModal: () => void;
  onOpenApiTab: () => void;
  onAddNew: () => void;
}

export const BpcmDropzone: React.FC<BpcmDropzoneProps> = ({
  isLoadingFile,
  fileUploadStats,
  itemsCount,
  onFileUpload,
  onSwitchSheet,
  onDownloadTemplate,
  onClearData,
  onOpenXmlModal,
  onOpenApiTab,
  onAddNew
}) => {
  return (
    <DanhMucDropzone
      themeColor="blue"
      isLoadingFile={isLoadingFile}
      loadingTitle="Đang đọc và phân tích file Excel..."
      title="Nạp Tệp Excel Danh Mục BPCM Từ Máy Tính"
      description={
        <>Kéo thả hoặc nhấp để chọn file (.xlsx, .xls, .csv). Tự động đối soát 11 trường dữ liệu chuẩn.</>
      }
      uploadStats={
        fileUploadStats
          ? {
              selectedSheet: fileUploadStats.selectedSheet,
              totalRows: fileUploadStats.totalRows,
              rowUnitLabel: 'khoa / phòng',
              matchedColumnsCount: fileUploadStats.matchedFields.length,
              totalColumnsCount: 11,
              fileName: fileUploadStats.fileName,
              availableSheets: fileUploadStats.sheets,
              extraBadge: (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[11px]">
                  <CheckCircle2 size={13} />
                  <span>Sẵn sàng sinh chuỗi XML Loại 70</span>
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
      templateLabel="Tải File Mẫu Excel (01/DM)"
      xmlLabel="Xem & Xuất File XML (01/DM)"
      apiLabel="Gửi Cổng BHXH (GuiDanhMuc01)"
      addNewLabel="Thêm BPCM Mới"
    />
  );
};
