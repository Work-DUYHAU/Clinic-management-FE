import React from "react";
import {
  ShieldCheck,
  Info,
  Check,
  Copy,
  Download,
  RefreshCw,
  UserPlus,
  Send,
} from "lucide-react";
import type { ExtractedSignatureInfo } from "../../../utils/xmlDsigEngine";
import type { SmartCaCredential } from "../../../types/smartcaTypes";

export interface SignedResultViewProps {
  signatureInfo: ExtractedSignatureInfo;
  credential?: SmartCaCredential | null;
  signerName: string;
  identityValue: string;
  signerEmail?: string;
  copiedKey: string | null;
  onCopySignedXml: () => void;
  onDownloadSignedXml?: () => void;
  onResetAndResign: () => void;
  onCountersign?: () => void;
  onDirectSendBhxh?: () => void;
  isSendingApi?: boolean;
  hasApiResponse?: boolean;
}

export const SignedResultView: React.FC<SignedResultViewProps> = ({
  signatureInfo,
  credential,
  signerName,
  identityValue,
  signerEmail,
  copiedKey,
  onCopySignedXml,
  onDownloadSignedXml,
  onResetAndResign,
  onCountersign,
  onDirectSendBhxh,
  isSendingApi,
  hasApiResponse,
}) => {
  const isMultiSigned = Boolean(
    signatureInfo.signatures && signatureInfo.signatures.length > 1,
  );
  const sigCount = signatureInfo.signatureCount || 1;

  return (
    <div className="p-3.5 sm:p-4 bg-emerald-50/50 border border-emerald-200/90 rounded-md space-y-3 animate-fadeIn">
      {/* Header trạng thái chữ ký số W3C */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                {isMultiSigned
                  ? `Hồ sơ đã được đồng ký (${sigCount} chữ ký hợp lệ)`
                  : "Chữ ký số hợp lệ (Chuẩn W3C XMLDSig)"}
              </h4>
              {isMultiSigned && (
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-sm text-[10px] font-bold">
                  Đồng ký
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-700">
              Thẻ &lt;CHUKYDONVI&gt; đã được đóng gói trực tiếp vào tệp XML.
            </p>
          </div>
        </div>

        {/* Thông tin nhanh về chủ thể ký */}
        <div className="text-right text-[11px] text-slate-600 hidden sm:block">
          <span className="text-slate-500">Chủ thể: </span>
          <b className="font-semibold text-slate-800">
            {signatureInfo.subjectDN || credential?.cert?.subjectDN || signerName || "—"}
          </b>
        </div>
      </div>

      {/* Chi tiết các chữ ký (hỗ trợ hiển thị gọn nếu đồng ký) */}
      {isMultiSigned && signatureInfo.signatures ? (
        <div className="space-y-2">
          {signatureInfo.signatures.map((sig, idx) => (
            <div
              key={sig.signatureId || idx}
              className="p-2.5 bg-white rounded-sm border border-emerald-200 text-xs text-slate-700 shadow-2xs"
            >
              <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                  <Info size={12} />
                  Chữ ký #{idx + 1}
                  {idx === 0
                    ? " (Người lập biểu / Bác sĩ)"
                    : " (Thủ trưởng đơn vị / CSKCB)"}
                </span>
                {sig.signingTime && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {sig.signingTime}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div className="truncate" title={sig.subjectDN || ""}>
                  <b className="text-slate-500">Chủ thể:</b>{" "}
                  <span className="font-semibold text-slate-900">
                    {sig.subjectDN || "Hợp lệ"}
                  </span>
                </div>
                <div>
                  <b className="text-slate-500">Serial:</b>{" "}
                  <span className="font-mono text-slate-900">
                    {sig.serialNumber || "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tóm tắt 1 dòng cho chữ ký đơn để giao diện cực kỳ tinh gọn */
        <div className="p-2.5 sm:p-3 bg-white rounded-sm border border-emerald-200/80 shadow-2xs text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div
            className="sm:col-span-1 truncate"
            title={`Chủ thể: ${signatureInfo.subjectDN || signerName || "—"}${
              signerEmail ? ` (${signerEmail})` : ""
            }${identityValue ? ` - TK: ${identityValue}` : ""}`}
          >
            <span className="text-slate-500">Chủ thể: </span>
            <b className="text-slate-900 font-semibold">
              {signatureInfo.subjectDN || credential?.cert?.subjectDN || signerName || "—"}
            </b>
            {signerEmail && (
              <span className="text-[10px] text-slate-500 ml-1 font-normal">
                ({signerEmail})
              </span>
            )}
          </div>
          <div
            className="truncate"
            title={`Mã Serial: ${signatureInfo.serialNumber || credential?.cert?.serialNumber || "—"}${
              identityValue ? ` - Tài khoản: ${identityValue}` : ""
            }`}
          >
            <span className="text-slate-500">Serial: </span>
            <span className="font-mono text-slate-800">
              {signatureInfo.serialNumber || credential?.cert?.serialNumber || "—"}
            </span>
          </div>
          <div title={identityValue ? `Tài khoản: ${identityValue}` : undefined}>
            <span className="text-slate-500">Thời gian ký: </span>
            <span className="font-mono text-slate-800">
              {signatureInfo.signingTime || "—"}
            </span>
          </div>
        </div>
      )}

      {/* Thanh Action Toolbar tinh gọn */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        {onDirectSendBhxh && !hasApiResponse && (
          <button
            type="button"
            disabled={isSendingApi}
            onClick={onDirectSendBhxh}
            className={`px-3.5 py-1.5 text-white rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
              isSendingApi
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            }`}
            title="Gửi ngay hồ sơ XML đã ký này lên Cổng Tiếp Nhận BHXH"
          >
            <Send size={13} className={isSendingApi ? "animate-pulse" : ""} />
            <span>{isSendingApi ? "Đang Gửi Cổng..." : "Gửi Lên Cổng BHXH"}</span>
          </button>
        )}

        {onDownloadSignedXml && (
          <button
            type="button"
            onClick={onDownloadSignedXml}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Download size={13} />
            <span>Tải XML Đã Ký</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCopySignedXml}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          {copiedKey === "signedXml" ? (
            <Check size={13} className="text-emerald-600" />
          ) : (
            <Copy size={13} />
          )}
          <span>
            {copiedKey === "signedXml" ? "Đã Sao Chép" : "Sao Chép XML"}
          </span>
        </button>

        {onCountersign && (
          <button
            type="button"
            onClick={onCountersign}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Ký thêm chữ ký (bác sĩ hoặc thủ trưởng CSKCB) bảo toàn chữ ký cũ"
          >
            <UserPlus size={13} />
            <span>Đồng Ký Tiếp</span>
          </button>
        )}

        <button
          type="button"
          onClick={onResetAndResign}
          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all ml-auto cursor-pointer active:scale-95"
        >
          <RefreshCw size={12} />
          <span>Ký Lại</span>
        </button>
      </div>
    </div>
  );
};

