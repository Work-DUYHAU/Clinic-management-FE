import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileCode,
  Copy,
  Check,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  DEFAULT_MA_CSKCB,
  xmlToBase64,
  downloadXmlFile,
} from "../../utils/shared/excelXmlShared";
import { useClipboard } from "../../hooks/useClipboard";
import { useModalBehavior } from "../../hooks/useModalBehavior";
import { SmartCaSignPanel, type SmartCaSignAction } from "./SmartCaSignPanel";
import type { SmartCaSignResponse } from "../../services/smartca/smartcaHandlers";
import { extractXmlSignature } from "../../utils/xmlDsigEngine";

export interface SourceFileUploadInfo {
  fileName: string;
  selectedSheet?: string;
  totalRows?: number;
}

export interface XmlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  loaiHsBadge: string;
  itemsCount: number;
  itemLabel?: string;
  xmlContent: string;
  base64Content: string;
  loaiHsCode?: string;
  tab: "base64" | "smartca";
  onTabChange: (tab: "base64" | "smartca") => void;
  isKeyCopied?: (key: string) => boolean;
  onCopy?: (text: string, message?: string, key?: string) => void;
  onExportXml: () => void;
  onSendApi: (signatureResult?: any) => void;
  isSendingApi: boolean;
  apiResponse: any;
  onResetApiResponse?: () => void;
  customFileName?: string;
  enableSmartCa?: boolean;
  sourceFileInfo?: SourceFileUploadInfo | null;
}

export const XmlExportModal: React.FC<XmlExportModalProps> = ({
  isOpen,
  onClose,
  title,
  loaiHsBadge,
  itemsCount,
  itemLabel = "bản ghi",
  xmlContent,
  base64Content: initialBase64,
  loaiHsCode = "70",
  tab,
  onTabChange,
  isKeyCopied: externalIsKeyCopied,
  onCopy: externalOnCopy,
  onExportXml,
  onSendApi,
  isSendingApi,
  apiResponse,
  onResetApiResponse,
  customFileName,
  enableSmartCa = true,
  sourceFileInfo,
}) => {
  const { isKeyCopied: internalIsKeyCopied, copy: internalCopy } =
    useClipboard();
  const {
    handleBackdropMouseDown,
    handleBackdropClick,
    handleStopPropagation,
  } = useModalBehavior(isOpen, onClose);

  // Trạng thái phản hồi Cổng BHXH cục bộ (tự động xóa khi nạp tệp mới)
  const [localApiResponse, setLocalApiResponse] = useState<any>(apiResponse);

  useEffect(() => {
    setLocalApiResponse(apiResponse);
  }, [apiResponse]);

  const clearApiResponse = useCallback(() => {
    setLocalApiResponse(null);
    onResetApiResponse?.();
  }, [onResetApiResponse]);

  // Trạng thái nội bộ cho tệp XML đã ký số
  const [signedXml, setSignedXml] = useState<string | null>(null);
  const [signResponse, setSignResponse] = useState<SmartCaSignResponse | null>(
    null,
  );
  const [footerSignAction, setFooterSignAction] =
    useState<SmartCaSignAction | null>(null);
  const toast = useToast();

  // Tùy chọn gộp quy trình: Tự động gửi lên Cổng BHXH ngay khi ký số hoàn tất
  const [autoSendOnSign, setAutoSendOnSign] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("smartca_auto_send_bhxh");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  // Chế độ ký số SmartCA: Mặc định Q2 (Tự động) | Q1 (Xác nhận qua App)
  const [signMode, setSignMode] = useState<"Q1" | "Q2">("Q2");

  const handleToggleAutoSend = useCallback((val: boolean) => {
    setAutoSendOnSign(val);
    try {
      localStorage.setItem("smartca_auto_send_bhxh", String(val));
    } catch {
      // Ignore
    }
  }, []);

  const isKeyCopied = externalIsKeyCopied || internalIsKeyCopied;
  const handleCopy = externalOnCopy || internalCopy;

  // Tên file hiển thị chuẩn
  const effectiveFileName = useMemo(() => {
    if (customFileName) return customFileName;
    return `HS_BHYT_LOAI${loaiHsCode}_${DEFAULT_MA_CSKCB}.xml`;
  }, [customFileName, loaiHsCode]);

  // Nội dung XML hiệu lực (Ưu tiên bản đã ký số nếu có)
  const effectiveXml = signedXml || xmlContent;

  const effectiveBase64 = useMemo(() => {
    if (signedXml) {
      return xmlToBase64(signedXml);
    }
    return initialBase64 || (xmlContent ? xmlToBase64(xmlContent) : "");
  }, [signedXml, initialBase64, xmlContent]);

  // Kiểm tra xem XML hiện tại đã có chữ ký chuẩn chưa
  const signatureInfo = useMemo(() => {
    return extractXmlSignature(effectiveXml);
  }, [effectiveXml]);

  const isSigned = signatureInfo.hasSignature;

  // Xử lý khi ký số thành công
  const handleSignedSuccess = (
    newSignedXml: string,
    res: SmartCaSignResponse,
  ) => {
    setSignedXml(newSignedXml);
    setSignResponse(res);
    clearApiResponse();

    // Gộp quy trình: Tự động gửi luôn lên Cổng BHXH nếu bật tùy chọn và không phải là tệp tĩnh tải lên
    if (autoSendOnSign && res?.tranId !== "UPLOADED_SIGNED_XML") {
      toast.info(
        "Ký số thành công! Đang tự động gửi hồ sơ lên Cổng Tiếp Nhận BHXH...",
        "Quy Trình 2: Ký & Gửi",
      );
      const fileBase64 = xmlToBase64(newSignedXml);
      setTimeout(() => {
        onSendApi({
          signResponse: res,
          fileBase64,
          signedXml: newSignedXml,
        });
      }, 300);
    }
  };

  // Gửi trực tiếp lên Cổng BHXH từ tab SmartCA
  const handleDirectSendBhxh = useCallback(() => {
    const fileBase64 = signedXml ? xmlToBase64(signedXml) : effectiveBase64;
    onSendApi({
      signResponse,
      fileBase64,
      signedXml: signedXml || effectiveXml,
    });
  }, [signedXml, effectiveBase64, onSendApi, signResponse, effectiveXml]);

  // Reset về trạng thái chưa ký
  const handleResetSignature = () => {
    setSignedXml(null);
    setSignResponse(null);
    clearApiResponse();
  };

  // Tải file XML (tự động tải bản chuẩn hóa C14N 1 dòng để bảo toàn chữ ký 100%)
  const handleDownloadEffectiveXml = () => {
    if (signedXml) {
      downloadXmlFile(signedXml, effectiveFileName);
    } else {
      onExportXml();
    }
    toast.success(
      "Đã tải tệp XML chuẩn hóa 1 dòng (W3C C14N - Bảo toàn chữ ký Cổng BHXH)",
      "Tải Tệp XML Thành Công",
    );
  };

  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  const handlePreventDrag = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const effectiveTab = tab;
  const handleSelectTabBase64 = () => onTabChange("base64");
  const handleSelectTabSmartCa = () => onTabChange("smartca");

  const handleCopyBase64 = () => {
    handleCopy(
      effectiveBase64,
      "Đã sao chép chuỗi Base64 vào bộ nhớ đệm!",
      "base64",
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 ant-modal-anim"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden border border-slate-200 select-none"
        onMouseDown={handleStopPropagation}
        onClick={handleStopPropagation}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isSigned
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-[#1677ff]"
              }`}
            >
              {isSigned ? <ShieldCheck size={20} /> : <FileCode size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900">
                  {title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {loaiHsBadge}
                </span>
                {isSigned && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
                    <Check size={11} /> ĐÃ KÝ SỐ XMLDSIG
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <span>
                  Dữ liệu hiện hành • {itemsCount} {itemLabel}
                </span>
                {sourceFileInfo?.fileName && (
                  <>
                    {" "}
                    • Nguồn:{" "}
                    <b className="font-semibold text-slate-700">
                      {sourceFileInfo.fileName}
                      {sourceFileInfo.selectedSheet
                        ? ` [${sourceFileInfo.selectedSheet}]`
                        : ""}
                    </b>
                  </>
                )}{" "}
                • Tệp:{" "}
                <b className="font-mono text-slate-700">{effectiveFileName}</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onMouseDown={handleCloseModal}
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 active:scale-95 text-slate-400 hover:text-slate-800 flex items-center justify-center font-bold text-lg cursor-pointer select-none transition-colors"
            title="Đóng (Esc)"
          >
            &times;
          </button>
        </div>

        {/* Tab Selector & Nút Tải Lên XML Đã Ký (Luôn hiển thị trên 1 hàng duy nhất) */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0 select-none">
          {/* TAB KÝ SỐ & GỬI CỔNG BHXH (Primary 1-Click Flow) */}
          {enableSmartCa && (
            <button
              type="button"
              onClick={handleSelectTabSmartCa}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                effectiveTab === "smartca"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : isSigned
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              }`}
            >
              <Fingerprint size={14} />
              <span>Ký Số & Gửi Cổng BHXH</span>
              {isSigned && (
                <ShieldCheck size={14} className="text-emerald-500" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleSelectTabBase64}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              effectiveTab === "base64"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileCode size={14} />
            <span>Chuỗi Base64 {isSigned ? "Đã Ký Số" : ""}</span>
          </button>

          {/* CỤM ĐIỀU KHIỂN GỌN GÀNG TRÊN CÙNG 1 HÀNG: RADIO CHẾ ĐỘ KÝ & CHECKBOX GỬI CỔNG */}
          {effectiveTab === "smartca" && !isSigned && (
            <div className="flex items-center gap-3 shrink-0 text-xs">
              <div className="h-4 w-px bg-slate-300 hidden sm:block" />

              {/* Radio chọn Ký tự động Q2 / Xác nhận qua App Q1 */}
              <div className="flex items-center gap-3 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-blue-600 font-semibold transition-colors">
                  <input
                    type="radio"
                    name="modal_smartca_sign_mode"
                    value="Q2"
                    checked={signMode === "Q2"}
                    onChange={() => setSignMode("Q2")}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span>Tự động (Q2)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-blue-600 font-semibold transition-colors">
                  <input
                    type="radio"
                    name="modal_smartca_sign_mode"
                    value="Q1"
                    checked={signMode === "Q1"}
                    onChange={() => setSignMode("Q1")}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span>Xác nhận App (Q1)</span>
                </label>
              </div>

              {/* Checkbox: Tự động gửi Cổng BHXH */}
              <label
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-700 hover:text-emerald-700 font-semibold transition-colors shadow-2xs select-none"
                title="Tự động gửi hồ sơ lên Cổng BHXH ngay khi ký số thành công"
              >
                <input
                  type="checkbox"
                  checked={autoSendOnSign}
                  onChange={(e) => handleToggleAutoSend(e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 rounded"
                />
                <span>Tự động gửi BHXH</span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {itemsCount === 0 && !signedXml && effectiveTab !== "smartca" ? (
            <div className="p-8 m-auto text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-4 max-w-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Chưa có dữ liệu trên bảng
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bảng danh mục hiện chưa có bản ghi. Bạn có thể{" "}
                  <b>nạp tệp XML đã ký sẵn từ máy tính</b> để gửi Cổng BHXH
                  ngay, hoặc chuyển sang tab <b>Ký Số SmartCA (Q1)</b> để ký
                  tệp.
                </p>
              </div>
              {enableSmartCa && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSelectTabSmartCa}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Fingerprint size={15} />
                    <span>Ký Số SmartCA</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tab Content: KÝ SỐ SMARTCA & GỬI CỔNG BHXH (SHOPEEFOOD FLOW) */}
              {effectiveTab === "smartca" && (
                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                  <SmartCaSignPanel
                    xmlContent={xmlContent}
                    signedXml={signedXml || undefined}
                    fileName={effectiveFileName}
                    itemsCount={itemsCount}
                    itemLabel={itemLabel}
                    signatureInfo={signatureInfo}
                    sourceFileInfo={sourceFileInfo}
                    onSignedSuccess={handleSignedSuccess}
                    onResetSignature={handleResetSignature}
                    onDownloadSignedXml={handleDownloadEffectiveXml}
                    autoSendOnSign={autoSendOnSign}
                    onToggleAutoSend={handleToggleAutoSend}
                    onDirectSendBhxh={handleDirectSendBhxh}
                    isSendingApi={isSendingApi}
                    apiResponse={localApiResponse}
                    onRegisterSignAction={setFooterSignAction}
                    signMode={signMode}
                    onSignModeChange={setSignMode}
                    hideSignModeSwitcher={true}
                    hideAutoSendCheckbox={true}
                  />
                </div>
              )}

              {/* Tab Content: Base64 */}
              {effectiveTab === "base64" && (
                <div className="flex-1 min-h-0 p-6 flex flex-col space-y-3">
                  <div className="flex items-center justify-between shrink-0 select-none">
                    <span className="text-xs text-slate-500 font-semibold">
                      Chuỗi Base64 UTF-8 (dùng cho trường{" "}
                      <code>fileHsBase64</code> trong API Cổng BHXH):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBase64}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      {isKeyCopied("base64") ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                      {isKeyCopied("base64") ? "Đã chép" : "Sao chép Base64"}
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <textarea
                      readOnly
                      draggable={false}
                      onDragStart={handlePreventDrag}
                      spellCheck={false}
                      value={effectiveBase64}
                      className="w-full h-full p-4 bg-slate-900 text-sky-400 font-mono text-[11px] rounded-2xl resize-none outline-none leading-relaxed border border-slate-800 selection:bg-blue-600 selection:text-white no-drag-select"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer (Cố định ở dưới, nút Đóng luôn phản hồi) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 select-none">
          <div className="text-xs text-slate-500">
            <span>
              Tổng số: <b>{itemsCount}</b> {itemLabel}
            </span>
            {isSigned && (
              <span className="ml-2 font-bold text-emerald-700 inline-flex items-center gap-1">
                <Check size={12} /> Đã ký số
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onMouseDown={handleCloseModal}
              onClick={handleCloseModal}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer select-none"
            >
              Đóng
            </button>

            {/* Nút Ký Số & Gửi Cổng BHXH ở Footer theo yêu cầu */}
            {footerSignAction &&
              footerSignAction.visible &&
              effectiveTab === "smartca" && (
                <button
                  type="button"
                  disabled={footerSignAction.isInitiating}
                  onClick={footerSignAction.trigger}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-60 ${
                    footerSignAction.isInitiating
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
                  }`}
                >
                  {footerSignAction.isInitiating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>{footerSignAction.loadingLabel}</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>{footerSignAction.label}</span>
                    </>
                  )}
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
