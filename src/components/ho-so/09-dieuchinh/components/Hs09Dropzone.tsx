import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { ParseHs09ExcelResult } from "../../../../types/hs09DieuChinhTypes";
import { DanhMucDropzone } from "../../../danh-muc/common";
import { HS09_SCHEMA_FIELDS } from "../../../../utils/constants/hs09DieuChinhConstants";

interface Hs09DropzoneProps {
  isLoadingFile: boolean;
  fileUploadStats: ParseHs09ExcelResult | null;
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

export const Hs09Dropzone: React.FC<Hs09DropzoneProps> = ({
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
  onAddNew,
}) => {
  const totalSchemaFields = HS09_SCHEMA_FIELDS.length;

  return (
    <DanhMucDropzone
      themeColor="indigo"
      isLoadingFile={isLoadingFile}
      loadingTitle="Đang đọc và phân tích file Excel / XML Hồ sơ điều chỉnh 09/BH..."
      title="Nạp Tệp Excel / XML Hồ Sơ Điều Chỉnh Mẫu 09/BH (Loại HS 73)"
      description={
        <>Kéo thả hoặc nhấp để chọn file (.xlsx, .xls, .csv, .xml).</>
      }
      uploadStats={
        fileUploadStats
          ? {
              selectedSheet: fileUploadStats.selectedSheet,
              totalRows: fileUploadStats.totalRows,
              rowUnitLabel: "hồ sơ điều chỉnh",
              matchedColumnsCount: Object.keys(fileUploadStats.detectedHeaders)
                .length,
              totalColumnsCount: totalSchemaFields,
              fileName: fileUploadStats.fileName,
              availableSheets: fileUploadStats.availableSheets,
              extraBadge: (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[11px]">
                  <CheckCircle2 size={13} />
                  <span>Sẵn sàng sinh XML &amp; Base64 Loại HS 73</span>
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
      templateLabel="Tải Mẫu Excel 09/BH"
      xmlLabel="Ký Số & Gửi Cổng"
      apiLabel="Gửi Cổng BHXH (Loại 73)"
      addNewLabel="Thêm Hồ Sơ 09"
    />
  );
};
