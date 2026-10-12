import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ParseTbytThdvExcelResult } from '../services/tbyttHdvService';
import { DanhMucDropzone } from '../../common';
import { TBYTTHDV_SCHEMA_FIELDS } from '../services/tbyttHdvService';

interface TbytThdvDropzoneProps {
  isLoadingFile: boolean;
  fileUploadStats: ParseTbytThdvExcelResult | null;
  itemsCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchSheet: (sheetName: string) => void;
  onDownloadTemplate: () => void;
  onClearData: () => void;
  onOpenXmlModal: () => void;
  onOpenApiTab: () => void;
  onAddNew: () => void;
}

export const TbytThdvDropzone: React.FC<TbytThdvDropzoneProps> = ({
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
  const totalSchemaFields = TBYTTHDV_SCHEMA_FIELDS.length;

  return (
    <DanhMucDropzone
      themeColor="blue"
      isLoadingFile={isLoadingFile}
      loadingTitle="Đang đọc và phân tích file Excel TBYT..."
      title="Nạp Tệp Excel Danh Mục TBYT Thực Hiện DVKT (Mẫu 06/DM)"
      description={
        <>Kéo thả hoặc nhấp để chọn file (.xlsx, .xls, .csv). Hỗ trợ chuẩn hóa {totalSchemaFields} cột theo QĐ 3176 &amp; NĐ 07/2025</>
      }
      uploadStats={
        fileUploadStats
          ? {
              selectedSheet: fileUploadStats.selectedSheet,
              totalRows: fileUploadStats.totalRows,
              rowUnitLabel: 'thiết bị',
              matchedColumnsCount: fileUploadStats.matchedFields.length,
              totalColumnsCount: totalSchemaFields,
              fileName: fileUploadStats.fileName,
              availableSheets: fileUploadStats.availableSheets,
              extraBadge: (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-sm text-[11px] font-mono">
                  <CheckCircle2 size={13} />
                  <span>Sẵn sàng sinh chuỗi XML Loại 72</span>
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
      addNewLabel="Thêm Thiết Bị"
    />
  );
};
