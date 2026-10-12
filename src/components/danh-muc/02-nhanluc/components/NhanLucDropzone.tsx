import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { ParseNhanLucExcelResult } from "../services/nhanLucService";
import { DanhMucDropzone } from "../../common";

interface NhanLucDropzoneProps {
  isLoadingFile: boolean;
  fileUploadStats: ParseNhanLucExcelResult | null;
  itemsCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchSheet: (sheetName: string) => void;
  onDownloadTemplate: () => void;
  onClearData: () => void;
  onOpenXmlModal: () => void;
  onOpenApiTab: () => void;
  onAddNew: () => void;
}

export const NhanLucDropzone: React.FC<NhanLucDropzoneProps> = ({
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
      loadingTitle="Đang đọc và bóc tách file Excel Nhân lực..."
      title="Nạp Tệp Excel Danh Mục Nhân Lực (Mẫu 02/DM) Từ Máy Tính"
      description={
        <>
          Kéo thả hoặc nhấp để chọn file (.xlsx, .xls). Tự động đối soát 24
          trường thông tin chuẩn BHXH Việt Nam.
        </>
      }
      uploadStats={
        fileUploadStats
          ? {
              selectedSheet: fileUploadStats.selectedSheet || "",
              totalRows: fileUploadStats.totalRows,
              rowUnitLabel: "nhân sự",
              matchedColumnsCount: fileUploadStats.matchedFields.length,
              totalColumnsCount: 24,
              fileName: fileUploadStats.fileName,
              availableSheets: fileUploadStats.sheets,
              extraBadge: (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-sm text-[11px] font-mono">
                  <CheckCircle2 size={13} />
                  <span>Sẵn sàng sinh chuỗi XML &amp; Base64 Loại 71</span>
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
      templateLabel="Tải File Mẫu Excel (02/DM)"
      xmlLabel="Xem & Xuất File XML (02/DM)"
      apiLabel="Gửi Cổng BHXH (GuiDanhMuc02)"
      addNewLabel="Thêm Nhân Lực Mới"
    />
  );
};
