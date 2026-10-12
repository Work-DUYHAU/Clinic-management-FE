import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { KyHoSoSignatureMeta, KyHoSoStep } from '../types';

interface SigningInfoCardProps {
  step: KyHoSoStep;
  meta: KyHoSoSignatureMeta;
}

export const SigningInfoCard: React.FC<SigningInfoCardProps> = ({ step, meta }) => {
  const isSigned = step === 'signed' || step === 'sent';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-3">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        Thông tin sau khi ký
      </h3>

      {!isSigned ? (
        <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex items-center gap-2 text-xs text-slate-400 font-medium">
          <AlertCircle size={15} className="text-slate-400 flex-shrink-0" />
          <span>Chưa có thông tin — hồ sơ chưa được ký số</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Người ký</span>
            <span className="font-semibold text-slate-800">{meta.signerName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Thời gian ký</span>
            <span className="font-mono text-slate-800">{meta.signTime}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Số serial CTS</span>
            <span className="font-mono font-semibold text-slate-800">
              {meta.certSerial}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">Tổ chức cấp CTS</span>
            <span className="font-semibold text-slate-800">{meta.caProvider}</span>
          </div>
        </div>
      )}
    </div>
  );
};
