import React from "react";
import { Check, CheckCircle2, Clock, Copy } from "lucide-react";

export interface DigestInfoCardProps {
  effectiveFileName: string;
  isSigned: boolean;
  isWaiting: boolean;
  isDigestComputing?: boolean;
  digestValue?: string | null;
  copiedKey: string | null;
  onCopyDigest: (digest: string) => void;
}

export const DigestInfoCard: React.FC<DigestInfoCardProps> = ({
  effectiveFileName,
  isSigned,
  isWaiting,
  isDigestComputing,
  digestValue,
  copiedKey,
  onCopyDigest,
}) => {
  return (
    <div className="p-2.5 sm:p-3 bg-slate-50/60 border border-slate-200 rounded-xl space-y-1">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            Tệp Tin Ký Số (Quy Trình 1 - SmartCA)
          </span>
          <h4 className="text-xs font-bold text-slate-800 font-mono truncate">
            {effectiveFileName || (
              <span className="text-slate-400 font-normal italic text-xs font-sans">
                (Chưa có tệp tin - Vui lòng nạp tệp Excel / XML)
              </span>
            )}
          </h4>
        </div>
        <div className="flex-shrink-0">
          {isSigned ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} /> ĐÃ KÝ SỐ
            </span>
          ) : isWaiting ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              CHỜ DUYỆT APP
            </span>
          ) : isDigestComputing ? (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Clock size={13} className="animate-spin" /> ĐANG TÍNH MÃ BĂM...
            </span>
          ) : !digestValue ? (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold flex items-center gap-1.5">
              <Clock size={13} /> CHƯA NẠP TỆP
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1.5">
              <Clock size={13} /> CHỜ KÝ SỐ
            </span>
          )}
        </div>
      </div>

      {/* Mã băm SHA-256 DigestValue */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs pt-0.5">
        <span className="text-slate-500 font-medium text-[11.5px] flex-shrink-0">
          Mã băm SHA-256 (Base64 - 44 ký tự):
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <code className="font-mono text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 select-all break-all shadow-2xs font-semibold">
            {digestValue ? (
              digestValue
            ) : isDigestComputing ? (
              <span className="text-indigo-600 font-normal italic animate-pulse">
                Đang băm mã SHA-256 nội dung XML...
              </span>
            ) : (
              <span className="text-slate-400 font-normal italic">
                (Chưa có tệp tin - Vui lòng nạp tệp Excel / XML)
              </span>
            )}
          </code>
          {digestValue && (
            <button
              type="button"
              onClick={() => onCopyDigest(digestValue)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer flex-shrink-0"
              title="Sao chép toàn bộ mã băm DigestValue"
            >
              {copiedKey === "digest" ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
