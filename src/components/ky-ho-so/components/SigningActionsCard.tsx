import React from 'react';
import { Shield, Send, Check, Download } from 'lucide-react';
import type { KyHoSoStep } from '../types';

interface SigningActionsCardProps {
  step: KyHoSoStep;
  isSigning: boolean;
  isSending: boolean;
  isExporting?: boolean;
  onSignSmartCS: () => void;
  onSendBhxh: () => void;
  onExportPdf?: () => void;
}

export const SigningActionsCard: React.FC<SigningActionsCardProps> = ({
  step,
  isSigning,
  isSending,
  isExporting = false,
  onSignSmartCS,
  onSendBhxh,
  onExportPdf,
}) => {
  const isSigned = step === 'signed' || step === 'sent';
  const isSent = step === 'sent';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-3">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        Thao tác ký số & xuất hồ sơ
      </h3>

      <div className="flex flex-col gap-2.5">
        {/* Nút 1: Ký số SmartCS */}
        {isSigned ? (
          <div className="w-full py-2.5 px-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/90 font-semibold text-xs flex items-center justify-center gap-2">
            <Check size={16} className="stroke-[2.5]" />
            <span>Đã ký số SmartCS thành công</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={step === 'empty' || isSigning}
            onClick={onSignSmartCS}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 ${
              step === 'uploaded' && !isSigning
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang gửi xác thực SmartCS...</span>
              </>
            ) : (
              <>
                <Shield size={16} className="stroke-[2.2]" />
                <span>Ký số SmartCS</span>
              </>
            )}
          </button>
        )}

        {/* Nút 2: Xuất file PDF kèm con dấu và chữ ký */}
        <button
          type="button"
          disabled={!isSigned || isExporting}
          onClick={onExportPdf}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 ${
            isSigned && !isExporting
              ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm cursor-pointer'
              : 'bg-slate-50/80 text-slate-400 border border-slate-200/80 cursor-not-allowed'
          }`}
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang nhúng dấu & xuất PDF...</span>
            </>
          ) : (
            <>
              <Download size={16} className="stroke-[2.2]" />
              <span>Xuất file kèm con dấu & chữ ký</span>
            </>
          )}
        </button>

        {/* Nút 3: Gửi Cổng BHXH */}
        {isSent ? (
          <div className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
            <Check size={16} className="stroke-[2.5]" />
            <span>Đã gửi Cổng BHXH thành công</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={!isSigned || isSending}
            onClick={onSendBhxh}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 ${
              isSigned && !isSending
                ? 'bg-slate-800 hover:bg-slate-900 active:bg-black text-white shadow-sm cursor-pointer'
                : 'bg-slate-50/80 text-slate-400 border border-slate-200/80 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang gửi đến Cổng BHXH...</span>
              </>
            ) : (
              <>
                <Send size={16} className="stroke-[2.2]" />
                <span>Gửi Cổng BHXH</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Dòng ghi chú hướng dẫn */}
      <div className="text-[11px] text-slate-400 leading-relaxed font-medium">
        {step === 'empty' && 'Tải lên hồ sơ PDF để kích hoạt tính năng ký số.'}
        {step === 'uploaded' &&
          'Kéo thả khung để căn chỉnh vị trí con dấu & chữ ký, sau đó nhấn "Ký số SmartCS".'}
        {step === 'signed' &&
          'Đã ký số thành công. Nhấn "Xuất file" để tải tệp đã đóng dấu, hoặc "Gửi Cổng BHXH".'}
        {step === 'sent' && 'Hồ sơ đã được gửi thành công đến Cổng Giám định BHXH.'}
      </div>
    </div>
  );
};
