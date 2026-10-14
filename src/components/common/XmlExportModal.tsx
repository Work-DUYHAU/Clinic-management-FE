import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  FileCode,
  Copy,
  Check,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Send,
  Eye,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  DEFAULT_MA_CSKCB,
  xmlToBase64,
  downloadXmlFile,
  isBhxhGatewaySuccess,
} from "../../utils/shared/excelXmlShared";
import { useClipboard } from "../../hooks/useClipboard";
import { useModalBehavior } from "../../hooks/useModalBehavior";
import { SmartCaSignPanel, type SmartCaSignAction } from "./SmartCaSignPanel";
import { XmlPreviewModal } from "./smartca/XmlPreviewModal";
import type { SmartCaSignResponse } from "../../services/api";
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
  onSignSuccess?: (signedXml: string, signResponse: SmartCaSignResponse) => void;
  initialSignedXml?: string | null;
  initialSignedAt?: string | null;
  isSendingApi: boolean;
  sendProgress?: { current: number; total: number; label?: string } | null;
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
  onSignSuccess,
  initialSignedXml,
  initialSignedAt,
  isSendingApi,
  sendProgress,
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

  // State mở popup xem trước mã XML
  const [showXmlPreview, setShowXmlPreview] = useState(false);

  // Tên file hiển thị chuẩn
  const effectiveFileName = useMemo(() => {
    if (customFileName) return customFileName;
    return `HS_BHYT_LOAI${loaiHsCode}_${DEFAULT_MA_CSKCB}.xml`;
  }, [customFileName, loaiHsCode]);

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
  const [signedXml, setSignedXml] = useState<string | null>(initialSignedXml || null);
  const [signResponse, setSignResponse] = useState<SmartCaSignResponse | null>(
    null,
  );
  const [signedAt, setSignedAt] = useState<string | null>(initialSignedAt || null);

  // Tự động đồng bộ ngay khi props thay đổi
  useEffect(() => {
    setSignedXml(initialSignedXml || null);
  }, [initialSignedXml]);

  useEffect(() => {
    setSignedAt(initialSignedAt || null);
  }, [initialSignedAt]);

  // Tự động khôi phục hoặc xóa trạng thái ký số khi mở lại modal hoặc đổi tệp dữ liệu khác
  const prevIsOpenRef = useRef(false);
  const prevCustomFileNameRef = useRef(customFileName);

  useEffect(() => {
    const isOpening = !prevIsOpenRef.current && isOpen;
    const isFileChanged =
      isOpen && prevCustomFileNameRef.current !== customFileName;

    if (isOpening || isFileChanged) {
      const detectedPreSigned =
        initialSignedXml ||
        (xmlContent && extractXmlSignature(xmlContent).hasSignature
          ? xmlContent
          : null);

      if (detectedPreSigned) {
        setSignedXml(detectedPreSigned);
        let restored = initialSignedAt || null;
        if (!restored && effectiveFileName) {
          try {
            restored =
              localStorage.getItem(`smartca_signed_at_${effectiveFileName}`) ||
              null;
          } catch {
            // ignore
          }
        }
        setSignedAt(restored);
      } else {
        // Tệp mới hoặc mở modal mới chưa có chữ ký -> RESET toàn bộ trạng thái ký cũ!
        setSignedXml(null);
        setSignedAt(null);
        setSignResponse(null);
      }
    }

    prevIsOpenRef.current = isOpen;
    prevCustomFileNameRef.current = customFileName;
  }, [isOpen, customFileName, initialSignedXml, initialSignedAt, effectiveFileName]);

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

  const isSigned =
    signatureInfo.hasSignature ||
    Boolean(localApiResponse && isBhxhGatewaySuccess(localApiResponse));

  // Xử lý khi ký số thành công
  const handleSignedSuccess = (
    newSignedXml: string,
    res: SmartCaSignResponse,
  ) => {
    const timeStr = res?.signedAt || new Date().toISOString();
    setSignedXml(newSignedXml);
    setSignResponse(res);
    setSignedAt(timeStr);
    try {
      localStorage.setItem(`smartca_signed_at_${effectiveFileName}`, timeStr);
      localStorage.setItem("smartca_signed_at_latest", timeStr);
    } catch {
      // ignore
    }
    clearApiResponse();

    // Thông báo cho component cha biết đã ký số thành công ngay lập tức
    onSignSuccess?.(newSignedXml, res);

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
    setSignedAt(null);
    try {
      localStorage.removeItem(`smartca_signed_at_${effectiveFileName}`);
      localStorage.removeItem("smartca_signed_at_latest");
    } catch {
      // ignore
    }
    clearApiResponse();
  };

  // Tải file XML (tự động tải bản chuẩn hóa C14N 1 dòng để bảo toàn chữ ký 100%)
  const handleDownloadEffectiveXml = () => {
    if (signedXml) {
      downloadXmlFile(signedXml, effectiveFileName);
      toast.success(
        "Đã tải tệp XML chuẩn hóa 1 dòng (W3C C14N - Bảo toàn chữ ký Cổng BHXH)",
        "Tải Tệp XML Thành Công",
      );
    } else {
      onExportXml();
    }
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
        className="bg-white rounded-md max-w-4xl w-full h-[88vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden border border-slate-200 select-none"
        onMouseDown={handleStopPropagation}
        onClick={handleStopPropagation}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-md ${
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 border border-blue-200">
                  {loaiHsBadge}
                </span>
                {isSigned && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Check size={11} /> ĐÃ KÝ SỐ XMLDSIG
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  <b>{itemsCount}</b> {itemLabel}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-700 font-semibold">{effectiveFileName}</span>
                {sourceFileInfo?.fileName && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500 truncate max-w-[200px]" title={sourceFileInfo.fileName}>
                      Nguồn: {sourceFileInfo.fileName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onMouseDown={handleCloseModal}
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-sm hover:bg-slate-200 active:scale-95 text-slate-400 hover:text-slate-800 flex items-center justify-center font-bold text-lg cursor-pointer select-none transition-colors"
            title="Đóng (Esc)"
          >
            &times;
          </button>
        </div>

        {/* Tab Selector & Cụm Điều Khiển */}
        <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 shrink-0 select-none text-[11px]">
          {/* Nhóm Tabs bên trái */}
          <div className="flex items-center gap-1.5 shrink-0">
            {enableSmartCa && (
              <button
                type="button"
                onClick={handleSelectTabSmartCa}
                className={`px-3 py-1.5 rounded-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  effectiveTab === "smartca"
                    ? "bg-blue-600 text-white shadow-xs"
                    : isSigned
                      ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300"
                      : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
                }`}
              >
                <Fingerprint size={13} />
                <span>Ký SmartCA</span>
                {isSigned && (
                  <ShieldCheck size={13} className="text-emerald-500" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleSelectTabBase64}
              className={`px-2.5 py-1.5 rounded-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                effectiveTab === "base64"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <FileCode size={13} />
              <span>Base64</span>
            </button>
          </div>

          {/* Nhóm Điều khiển bên phải: Radio Q1/Q2, Checkbox Tự gửi, Con mắt Xem XML */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {effectiveTab === "smartca" && !isSigned && (
              <>
                {/* Radio chọn Ký tự động Q2 / Xác nhận qua App Q1 */}
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-sm border border-slate-200 shadow-2xs">
                  <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600 font-semibold transition-colors">
                    <input
                      type="radio"
                      name="modal_smartca_sign_mode"
                      value="Q2"
                      checked={signMode === "Q2"}
                      onChange={() => setSignMode("Q2")}
                      className="w-3 h-3 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span>Q2 (Tự động)</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600 font-semibold transition-colors">
                    <input
                      type="radio"
                      name="modal_smartca_sign_mode"
                      value="Q1"
                      checked={signMode === "Q1"}
                      onChange={() => setSignMode("Q1")}
                      className="w-3 h-3 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span>Q1 (App)</span>
                  </label>
                </div>

                {/* Checkbox: Tự động gửi Cổng BHXH */}
                <label
                  className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-sm cursor-pointer text-slate-700 hover:text-emerald-700 font-semibold transition-colors shadow-2xs"
                  title="Tự động gửi hồ sơ lên Cổng BHXH ngay khi ký số thành công"
                >
                  <input
                    type="checkbox"
                    checked={autoSendOnSign}
                    onChange={(e) => handleToggleAutoSend(e.target.checked)}
                    className="w-3 h-3 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 rounded-sm"
                  />
                  <span>Tự gửi BHXH</span>
                </label>
              </>
            )}

            {/* Nút Xem Trước Mã XML (Con mắt - Luôn hiển thị cả khi chưa ký lẫn đã ký, kể cả file tổng hợp) */}
            <button
              type="button"
              onClick={() => setShowXmlPreview(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-sm cursor-pointer text-slate-700 hover:text-blue-600 font-semibold transition-all shadow-2xs"
              title="Xem trước cấu trúc mã XML (hỗ trợ giải mã từng chứng từ tệp tổng hợp)"
            >
              <Eye size={13} className="text-blue-600" />
              <span>Xem XML{isSigned ? " Đã Ký" : ""}</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {itemsCount === 0 && !signedXml && effectiveTab !== "smartca" ? (
            <div className="p-8 m-auto text-center bg-slate-50 rounded-md border border-dashed border-slate-300 space-y-4 max-w-lg">
              <div className="w-12 h-12 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
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
                    className="px-4 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
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
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-3">
                  <SmartCaSignPanel
                    xmlContent={xmlContent}
                    signedXml={signedXml || undefined}
                    fileName={effectiveFileName}
                    itemsCount={itemsCount}
                    itemLabel={itemLabel}
                    signatureInfo={signatureInfo}
                    hasCustomUploadedFile={Boolean(sourceFileInfo)}
                    onSignedSuccess={handleSignedSuccess}
                    onResetSignature={handleResetSignature}
                    onDownloadSignedXml={handleDownloadEffectiveXml}
                    autoSendOnSign={autoSendOnSign}
                    onToggleAutoSend={handleToggleAutoSend}
                    onDirectSendBhxh={handleDirectSendBhxh}
                    isSendingApi={isSendingApi}
                    sendProgress={sendProgress}
                    apiResponse={localApiResponse}
                    onRegisterSignAction={setFooterSignAction}
                    signMode={signMode}
                    onSignModeChange={setSignMode}
                    hideSignModeSwitcher={true}
                    hideAutoSendCheckbox={true}
                    signedAt={
                      signedAt ||
                      signResponse?.signedAt ||
                      initialSignedAt ||
                      undefined
                    }
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
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
                      className="w-full h-full p-4 bg-slate-900 text-sky-400 font-mono text-[11px] rounded-sm resize-none outline-none leading-relaxed border border-slate-800 selection:bg-blue-600 selection:text-white no-drag-select"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer (Cố định ở dưới, nút Đóng luôn phản hồi) */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 select-none">
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
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-sm text-xs font-bold transition-all cursor-pointer select-none"
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
                  className={`px-6 py-2.5 rounded-sm text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60 ${
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

      {/* Popup Xem Trước Mã XML (Tự động nhận diện & giải mã từng chứng từ nếu là tệp tổng hợp) */}
      <XmlPreviewModal
        isOpen={showXmlPreview}
        onClose={() => setShowXmlPreview(false)}
        fileName={effectiveFileName}
        xmlContent={signedXml || effectiveXml}
        copiedKey={null}
        onCopy={handleCopy}
        isSigned={Boolean(signedXml)}
      />
    </div>
  );
};
