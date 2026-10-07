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
    <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1.5">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-800 font-mono truncate">
            {effectiveFileName || (
              <span className="text-slate-400 font-normal italic text-xs font-sans">
                (Chưa có tệp tin hồ sơ)
              </span>
            )}
          </h4>
        </div>
        <div className="shrink-0">
          {isSigned ? (
            <span className="px-2 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
              <CheckCircle2 size={12} /> ĐÃ KÝ
            </span>
          ) : isWaiting ? (
            <span className="px-2 py-0.5 rounded-sm bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold flex items-center gap-1 animate-pulse">
              CHỜ DUYỆT APP
            </span>
          ) : isDigestComputing ? (
            <span className="px-2 py-0.5 rounded-sm bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold flex items-center gap-1 animate-pulse">
              <Clock size={12} className="animate-spin" /> ĐANG TÍNH MÃ...
            </span>
          ) : !digestValue ? (
            <span className="px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold flex items-center gap-1">
              <Clock size={12} /> CHƯA NẠP TỆP
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold flex items-center gap-1">
              <Clock size={12} /> CHỜ KÝ SỐ
            </span>
          )}
        </div>
      </div>

      {/* Mã băm SHA-256 DigestValue */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
        <span className="text-slate-500 font-medium text-[11px] shrink-0">
          Mã băm SHA-256:
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <code className="font-mono text-slate-700 text-[11px] bg-white px-2 py-0.5 rounded-sm border border-slate-200 select-all break-all shadow-2xs font-semibold">
            {digestValue ? (
              digestValue
            ) : isDigestComputing ? (
              <span className="text-blue-600 font-normal italic animate-pulse">
                Đang tạo mã băm XML...
              </span>
            ) : (
              <span className="text-slate-400 font-normal italic">
                (Chưa nạp tệp)
              </span>
            )}
          </code>
          {digestValue && (
            <button
              type="button"
              onClick={() => onCopyDigest(digestValue)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-sm transition-colors cursor-pointer shrink-0"
              title="Sao chép mã băm"
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
