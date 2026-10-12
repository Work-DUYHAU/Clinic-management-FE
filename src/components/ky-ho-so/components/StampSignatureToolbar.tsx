import React from "react";
import { RefreshCw, Stamp, Feather, RotateCcw } from "lucide-react";
import type { KyHoSoStep } from "../types";
import type { UseStampSignatureReturn } from "../hooks/useStampSignature";

interface StampSignatureToolbarProps {
  step: KyHoSoStep;
  onResetDoc: () => void;
  stampSig: UseStampSignatureReturn;
}

export const StampSignatureToolbar: React.FC<StampSignatureToolbarProps> = ({
  step,
  onResetDoc,
  stampSig,
}) => {
  const {
    stampImageUrl,
    signatureImageUrl,
    hasCustomStamp,
    hasCustomSignature,
    isProcessingStamp,
    isProcessingSignature,
    stampRemainingMin,
    sigRemainingMin,
    hoveredPreview,
    setHoveredPreview,
    stampInputRef,
    signatureInputRef,
    handleResetStamp,
    handleResetSignature,
  } = stampSig;

  return (
    <div className="flex items-center gap-2 ml-1 text-xs">
      {step !== "empty" && (
        <>
          <button
            type="button"
            onClick={onResetDoc}
            title="Tải lên tệp hồ sơ khác"
            className="text-slate-400 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw size={12} />
            <span>Đổi tệp</span>
          </button>

          <span className="text-slate-200">|</span>
        </>
      )}

      {/* Nhóm Đổi con dấu & Reset (Tự động xóa nền + Cache 30' + Xem trước) */}
      <div
        className="relative flex items-center gap-1.5 bg-slate-50/90 hover:bg-slate-100/90 px-2 py-1 rounded-md border border-slate-200 transition-colors"
        onMouseEnter={() => setHoveredPreview("stamp")}
        onMouseLeave={() => setHoveredPreview(null)}
      >
        <div className="relative cursor-pointer">
          <img
            src={stampImageUrl}
            alt="Dấu"
            className="w-4 h-4 object-contain rounded-xs border border-rose-200 bg-white flex-shrink-0"
          />
          {hasCustomStamp && (
            <span
              title="Đã lưu tạm con dấu (hết hạn sau 30 phút)"
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"
            />
          )}
        </div>

        <button
          type="button"
          disabled={isProcessingStamp}
          onClick={() => stampInputRef.current?.click()}
          title="Tải ảnh con dấu mới - Tự động xóa phông nền (Remove background) và lưu cache 30 phút"
          className="text-slate-600 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors font-medium disabled:opacity-50"
        >
          <Stamp size={12} className="text-rose-500" />
          <span>
            {isProcessingStamp ? "Đang xóa nền..." : "Đổi con dấu"}
          </span>
          {hasCustomStamp && stampRemainingMin !== null && (
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">
              {stampRemainingMin}'
            </span>
          )}
        </button>

        {hasCustomStamp && (
          <button
            type="button"
            onClick={handleResetStamp}
            title="Đặt lại con dấu mặc định (Xóa cache 30 phút)"
            className="ml-0.5 text-[11px] text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={10} />
            <span>Reset</span>
          </button>
        )}

        {/* Popover phóng to xem trước con dấu trên nền caro */}
        {hoveredPreview === "stamp" && (
          <div className="absolute top-full left-0 mt-2 z-50 p-2.5 bg-white rounded-lg shadow-xl border border-slate-200/90 flex flex-col items-center gap-1.5 w-44 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="w-24 h-24 rounded border border-slate-200 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] bg-slate-50 flex items-center justify-center p-1.5 overflow-hidden">
              <img
                src={stampImageUrl}
                alt="Xem trước con dấu"
                className="max-w-full max-h-full object-contain drop-shadow-xs"
              />
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-800">
                {hasCustomStamp ? "Con dấu tùy chỉnh" : "Con dấu mặc định"}
              </div>
              <div className="text-[10px] text-slate-500">
                {hasCustomStamp
                  ? `Đã tách nền • Còn ${stampRemainingMin ?? 30} phút`
                  : "Mẫu chuẩn của trung tâm"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nhóm Đổi chữ ký & Reset (Tự động xóa nền + Cache 30' + Xem trước) */}
      <div
        className="relative flex items-center gap-1.5 bg-slate-50/90 hover:bg-slate-100/90 px-2 py-1 rounded-md border border-slate-200 transition-colors"
        onMouseEnter={() => setHoveredPreview("signature")}
        onMouseLeave={() => setHoveredPreview(null)}
      >
        <div className="relative cursor-pointer">
          <img
            src={signatureImageUrl}
            alt="Ký"
            className="w-4 h-4 object-contain rounded-xs border border-blue-200 bg-white flex-shrink-0"
          />
          {hasCustomSignature && (
            <span
              title="Đã lưu tạm chữ ký (hết hạn sau 30 phút)"
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"
            />
          )}
        </div>

        <button
          type="button"
          disabled={isProcessingSignature}
          onClick={() => signatureInputRef.current?.click()}
          title="Tải ảnh chữ ký mới - Tự động xóa phông nền (Remove background) và lưu cache 30 phút"
          className="text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors font-medium disabled:opacity-50"
        >
          <Feather size={12} className="text-blue-500" />
          <span>
            {isProcessingSignature ? "Đang xóa nền..." : "Đổi chữ ký"}
          </span>
          {hasCustomSignature && sigRemainingMin !== null && (
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">
              {sigRemainingMin}'
            </span>
          )}
        </button>

        {hasCustomSignature && (
          <button
            type="button"
            onClick={handleResetSignature}
            title="Đặt lại chữ ký mặc định (Xóa cache 30 phút)"
            className="ml-0.5 text-[11px] text-blue-500 hover:text-blue-700 hover:bg-blue-100/70 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={10} />
            <span>Reset</span>
          </button>
        )}

        {/* Popover phóng to xem trước chữ ký trên nền caro */}
        {hoveredPreview === "signature" && (
          <div className="absolute top-full left-0 mt-2 z-50 p-2.5 bg-white rounded-lg shadow-xl border border-slate-200/90 flex flex-col items-center gap-1.5 w-44 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="w-24 h-24 rounded border border-slate-200 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] bg-slate-50 flex items-center justify-center p-1.5 overflow-hidden">
              <img
                src={signatureImageUrl}
                alt="Xem trước chữ ký"
                className="max-w-full max-h-full object-contain drop-shadow-xs"
              />
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-800">
                {hasCustomSignature ? "Chữ ký tùy chỉnh" : "Chữ ký mặc định"}
              </div>
              <div className="text-[10px] text-slate-500">
                {hasCustomSignature
                  ? `Đã tách nền • Còn ${sigRemainingMin ?? 30} phút`
                  : "Chữ ký số mặc định"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
