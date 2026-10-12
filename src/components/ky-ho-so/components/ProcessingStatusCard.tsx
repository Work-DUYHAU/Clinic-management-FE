import React from 'react';
import type { KyHoSoStep } from '../types';

interface ProcessingStatusCardProps {
  step: KyHoSoStep;
  bhxhCode?: string;
}

export const ProcessingStatusCard: React.FC<ProcessingStatusCardProps> = ({
  step,
  bhxhCode = '',
}) => {
  const isSigned = step === 'signed' || step === 'sent';
  const isSent = step === 'sent';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-3">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        Trạng thái xử lý
      </h3>

      <div className="flex flex-col gap-2.5 text-xs">
        {/* Hàng 1: Ký số */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Ký số</span>
          {isSigned ? (
            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Đã ký
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
              Chưa ký
            </span>
          )}
        </div>

        {/* Hàng 2: Gửi BHXH */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Gửi BHXH</span>
          {isSent ? (
            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Thành công
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
              Chưa gửi
            </span>
          )}
        </div>

        {/* Mã hồ sơ BHXH sau khi gửi thành công */}
        {isSent && bhxhCode && (
          <div className="mt-2 pt-2.5 border-t border-slate-100 flex flex-col gap-1">
            <span className="text-slate-500 font-medium">Mã hồ sơ BHXH</span>
            <span className="font-mono font-bold text-slate-900 tracking-wide text-xs">
              {bhxhCode}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
