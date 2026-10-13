import React from "react";
import { FileText, Clock, Check, Loader2 } from "lucide-react";
import { UploadDropzone } from "./components/UploadDropzone";
import { DocumentPreview } from "./components/DocumentPreview";
import { SigningActionsCard } from "./components/SigningActionsCard";
import { SigningInfoCard } from "./components/SigningInfoCard";
import { ProcessingStatusCard } from "./components/ProcessingStatusCard";
import { StampSignatureToolbar } from "./components/StampSignatureToolbar";
import { useStampSignature } from "./hooks/useStampSignature";
import { useDocumentSigning } from "./hooks/useDocumentSigning";

interface KyHoSoTongHopPageProps {
  isActive?: boolean;
}

export const KyHoSoTongHopPage: React.FC<KyHoSoTongHopPageProps> = () => {
  const stampSig = useStampSignature();
  const docSigning = useDocumentSigning({
    stampImageUrl: stampSig.stampImageUrl,
    signatureImageUrl: stampSig.signatureImageUrl,
  });

  const {
    step,
    docInfo,
    pdfUrl,
    positions,
    isSigning,
    isSending,
    isExporting,
    signatureMeta,
    canvasSizesRef,
    handleFileSelect,
    handlePositionsInit,
    handlePositionChange,
    handleSignSmartCS,
    handleExportPdf,
    handleSendBhxh,
    handleReset,
  } = docSigning;

  const docFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDocChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      handleFileSelect({
        file,
        fileName: file.name,
        fileSize,
        fileType: file.type,
        uploadedAt: new Date().toLocaleTimeString("vi-VN"),
      });
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-[calc(100vh-84px)] min-h-0 items-start overflow-hidden pb-1">
      {/* Input ẩn để đổi nhanh tệp tài liệu PDF/DOCX/Ảnh */}
      <input
        ref={docFileInputRef}
        type="file"
        accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleDocChangeInput}
      />

      {/* Input ẩn để tải ảnh con dấu và chữ ký (Hỗ trợ PNG, JPG, JPEG, WEBP) */}
      <input
        ref={stampSig.stampInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={stampSig.handleStampUpload}
      />
      <input
        ref={stampSig.signatureInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={stampSig.handleSignatureUpload}
      />

      {/* CỘT TRÁI: KHUNG XEM TRƯỚC HỒ SƠ TỔNG HỢP (CUỘN ĐỘC LẬP TÀI LIỆU PDF) */}
      <div className="flex-1 w-full h-full min-h-0 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
        {/* Header khung xem trước */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <FileText size={18} className="text-slate-400 flex-shrink-0" />
            <span
              onClick={() => step !== "empty" && docFileInputRef.current?.click()}
              title={step !== "empty" ? "Nhấn để đổi tệp tài liệu khác" : undefined}
              className={`font-bold text-sm text-slate-800 truncate max-w-50 md:max-w-xs ${
                step !== "empty" ? "cursor-pointer hover:text-blue-600 transition-colors" : ""
              }`}
            >
              {step === "empty"
                ? "Xem trước hồ sơ tổng hợp"
                : docInfo?.fileName}
            </span>
            <StampSignatureToolbar
              step={step}
              onChangeDoc={() => docFileInputRef.current?.click()}
              onResetDoc={handleReset}
              stampSig={stampSig}
            />
          </div>

          {/* Badge trạng thái ở góc phải header */}
          <div className="flex items-center flex-shrink-0">
            {step === "empty" && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                Chưa có tệp
              </span>
            )}

            {step === "uploaded" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5">
                <Clock size={13} className="stroke-[2.5]" />
                <span>Sẵn sàng ký</span>
              </span>
            )}

            {(step === "signed" || step === "sent") && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5">
                <Check size={13} className="stroke-[2.5]" />
                <span>Đã ký số</span>
              </span>
            )}
          </div>
        </div>

        {/* Khung nội dung chính xem trước tệp tài liệu PDF */}
        <div className="flex-1 min-h-0 bg-slate-100/70 flex flex-col overflow-hidden relative">
          {step === "empty" ? (
            <div className="h-full flex items-center justify-center w-full p-4 md:p-6 overflow-y-auto">
              <UploadDropzone onFileSelect={handleFileSelect} />
            </div>
          ) : (
            <DocumentPreview
              step={step}
              pdfUrl={pdfUrl}
              positions={positions}
              onPositionsInit={handlePositionsInit}
              onPositionChange={handlePositionChange}
              onPageRendered={(pageIdx, w, h) => {
                canvasSizesRef.current[pageIdx] = { width: w, height: h };
              }}
              stampSrc={stampSig.stampImageUrl}
              signatureSrc={stampSig.signatureImageUrl}
            />
          )}

          {/* Loading xoay xoay khi nhấn Ký số */}
          {isSigning && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/95 rounded-lg shadow-md border border-slate-200 text-slate-700 text-sm font-medium">
                <Loader2 size={20} className="text-blue-600 animate-spin" />
                <span>Đang ký số...</span>
              </div>
            </div>
          )}
        </div>

        {/* Dòng hướng dẫn ở đáy khung xem trước (Cố định ở đáy) */}
        {step !== "empty" && (
          <div className="text-center py-2.5 px-4 text-xs text-slate-500 font-medium border-t border-slate-100 bg-white flex-shrink-0">
            {step === "uploaded" &&
              'Kéo thả khung để căn chỉnh vị trí con dấu & chữ ký trước khi nhấn "Ký số SmartCS" bên phải.'}
            {(step === "signed" || step === "sent") &&
              'Đã ký số thành công và hiển thị con dấu, chữ ký. Bạn có thể nhấn "Xuất file" để tải tệp đã đóng dấu.'}
          </div>
        )}
      </div>

      {/* CỘT PHẢI: CÁC KHỐI THAO TÁC VÀ THÔNG TIN TRẠNG THÁI (ĐỨNG IM CỐ ĐỊNH) */}
      <div className="w-full lg:w-80 xl:w-88 flex flex-col gap-4 flex-shrink-0 h-full overflow-y-auto no-scrollbar">
        {/* 1. Thao tác ký số & xuất file */}
        <SigningActionsCard
          step={step}
          isSigning={isSigning}
          isSending={isSending}
          isExporting={isExporting}
          onSignSmartCS={handleSignSmartCS}
          onSendBhxh={handleSendBhxh}
          onExportPdf={handleExportPdf}
        />

        {/* 2. Thông tin sau khi ký */}
        <SigningInfoCard step={step} meta={signatureMeta} />

        {/* 3. Trạng thái xử lý */}
        <ProcessingStatusCard step={step} bhxhCode={signatureMeta.bhxhCode} />
      </div>
    </div>
  );
};
