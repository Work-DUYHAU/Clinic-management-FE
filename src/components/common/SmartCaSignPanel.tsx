import React, { useState, useMemo } from "react";
import { SmartCaErrorModal } from "./ErrorModal";
import { extractXmlSignature } from "../../utils/xmlDsigEngine";
import { useSmartCaSignQ1 } from "../../hooks/useSmartCaSignQ1";
import { useSmartCaSignQ2 } from "../../hooks/q2/useSmartCaSignQ2";
import { useSignerFormState } from "../../hooks/useSignerFormState";
import type { DocSignOptionType } from "../../types/tt25ChungTuTypes";
import { downloadXmlFile } from "../../utils/shared";
import {
  DocTypeSelector,
  XmlPreviewModal,
  DigestInfoCard,
  SignedResultView,
  WaitingApprovalView,
  SignerForm,
  BhxhFlowStepper,
} from "./smartca";
import type { SignerProfile } from "../../types/smartcaTypes";
import type { SmartCaSignResponse } from "../../services/smartca/smartcaHandlers";

import type { SourceFileUploadInfo } from "./XmlExportModal";

export interface SmartCaSignAction {
  visible: boolean;
  isInitiating: boolean;
  label: string;
  loadingLabel: string;
  trigger: () => void;
  onCancel?: () => void;
}

export interface SmartCaSignPanelProps {
  xmlContent: string;
  signedXml?: string;
  fileName: string;
  itemsCount?: number;
  itemLabel?: string;
  signers?: SignerProfile[];
  signatureInfo?: ReturnType<typeof extractXmlSignature>;
  sourceFileInfo?: SourceFileUploadInfo | null;
  onSignedSuccess: (
    signedXml: string,
    signResponse: SmartCaSignResponse,
  ) => void;
  onResetSignature: () => void;
  onDownloadSignedXml?: () => void;
  onViewXml?: () => void;
  autoSendOnSign?: boolean;
  onToggleAutoSend?: (val: boolean) => void;
  onDirectSendBhxh?: () => void;
  isSendingApi?: boolean;
  apiResponse?: any;
  onRegisterSignAction?: (action: SmartCaSignAction | null) => void;
  hideSubmitButton?: boolean;
  signMode?: "Q1" | "Q2";
  onSignModeChange?: (mode: "Q1" | "Q2") => void;
  hideSignModeSwitcher?: boolean;
  hideAutoSendCheckbox?: boolean;
}

export const SmartCaSignPanel: React.FC<SmartCaSignPanelProps> = ({
  xmlContent,
  signedXml,
  fileName,
  itemsCount,
  itemLabel = "bản ghi",
  signatureInfo: externalSignatureInfo,
  sourceFileInfo,
  onSignedSuccess,
  onResetSignature,
  onDownloadSignedXml,
  onViewXml: _onViewXml,
  autoSendOnSign = true,
  onToggleAutoSend,
  onDirectSendBhxh,
  isSendingApi,
  apiResponse,
  onRegisterSignAction,
  hideSubmitButton = false,
  signMode: propSignMode,
  onSignModeChange,
  hideSignModeSwitcher = false,
  hideAutoSendCheckbox = false,
}) => {
  // Chế độ ký số SmartCA: Mặc định Q2 (Smart OTP nhanh) | Q1 (Phê duyệt qua App)
  const [internalSignMode, setInternalSignMode] = useState<"Q1" | "Q2">("Q2");
  const signMode = propSignMode ?? internalSignMode;
  const setSignMode = onSignModeChange ?? setInternalSignMode;

  // 1. Quản lý trạng thái chọn loại hồ sơ / chứng từ
  const [selectedDocType, setSelectedDocType] =
    useState<DocSignOptionType>("CURRENT");
  const [showXmlPreview, setShowXmlPreview] = useState(false);

  // State nạp file từ máy tính
  const [uploadedCustomXml, setUploadedCustomXml] = useState<string | null>(
    null,
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // 2. Tính toán XML hiệu lực cần ký (chỉ có khi đã nạp file hoặc có dữ liệu thực tế)
  const effectiveXmlToSign = useMemo(() => {
    if (uploadedCustomXml) return uploadedCustomXml;
    if (selectedDocType === "CURRENT") return xmlContent || signedXml || "";
    return "";
  }, [selectedDocType, xmlContent, uploadedCustomXml, signedXml]);

  // State ký nối tiếp (Countersign)
  const [isCountersigning, setIsCountersigning] = useState(false);

  // Tên file hiệu lực hiển thị (ưu tiên file tải lên, sau đó fileName từ props hoặc template)
  const effectiveFileName = useMemo(() => {
    if (uploadedFileName) {
      return `${uploadedFileName.replace(/\.[^/.]+$/, "")}.xml`;
    }
    if (selectedDocType === "CURRENT" && fileName) {
      return fileName;
    }
    if (uploadedCustomXml) {
      return `${selectedDocType}_TaiLen.xml`;
    }
    return "";
  }, [uploadedFileName, fileName, selectedDocType, uploadedCustomXml]);

  // XML đưa vào quy trình ký: nếu đang ở chế độ đồng ký thì ký tiếp trên bản đã có chữ ký
  const actualXmlForHook = useMemo(() => {
    if (isCountersigning && (signedXml || effectiveXmlToSign)) {
      return signedXml || effectiveXmlToSign;
    }
    return effectiveXmlToSign;
  }, [isCountersigning, signedXml, effectiveXmlToSign]);

  // Trích xuất chữ ký số nếu đã ký
  const signatureInfo = useMemo(() => {
    if (
      !uploadedCustomXml &&
      selectedDocType === "CURRENT" &&
      externalSignatureInfo
    ) {
      return externalSignatureInfo;
    }
    return extractXmlSignature(signedXml || effectiveXmlToSign);
  }, [
    uploadedCustomXml,
    selectedDocType,
    externalSignatureInfo,
    signedXml,
    effectiveXmlToSign,
  ]);

  const isSigned = signatureInfo.hasSignature && !isCountersigning;

  // Single Source of Truth cho toàn bộ thông tin tài khoản người ký
  const signerForm = useSignerFormState();

  // 3. Custom Hook quản lý quy trình ký Q1 (App Phê Duyệt - BẢO VỆ NGUYÊN TRẠNG 100%)
  const q1 = useSmartCaSignQ1({
    effectiveXmlToSign: actualXmlForHook,
    effectiveFileName,
    isSigned,
    onSignedSuccess: (newSignedXml, res) => {
      setIsCountersigning(false);
      onSignedSuccess(newSignedXml, res);
    },
    onResetSignature: () => {
      setIsCountersigning(false);
      onResetSignature?.();
    },
    signerForm,
  });

  // 4. Custom Hook quản lý quy trình ký Q2 (Smart OTP - TÁCH BIỆT ĐỘC LẬP)
  const q2 = useSmartCaSignQ2({
    effectiveXmlToSign: actualXmlForHook,
    effectiveFileName,
    isSigned,
    onSignedSuccess: (newSignedXml, res) => {
      setIsCountersigning(false);
      onSignedSuccess(newSignedXml, res);
    },
    onResetSignature: () => {
      setIsCountersigning(false);
      onResetSignature?.();
    },
    signerForm,
  });

  const handleResetAndResignAll = () => {
    q1.handleResetAndResign();
    q2.handleResetSignature();
  };

  const handleDefaultDownloadSignedXml = () => {
    const content = signedXml || effectiveXmlToSign;
    if (!content) return;
    downloadXmlFile(content, effectiveFileName || "Signed_Document.xml");
  };

  const isInitiatingSign =
    signMode === "Q2" ? q2.isInitiating : q1.isInitiating;
  const handleInitiateSignAction =
    signMode === "Q2" ? q2.handleStartSignQ2 : q1.handleInitiateQ1Sign;
  const handleCancelSignAction =
    signMode === "Q2" && q2.isInitiating ? q2.handleCancelSignAuto : undefined;

  const currentButtonLabel = autoSendOnSign
    ? signMode === "Q2"
      ? "Ký Số & Gửi Cổng BHXH"
      : "Ký & Gửi Cổng BHXH"
    : signMode === "Q2"
      ? "Ký Số Tự Động Q2"
      : "Gửi Yêu Cầu Ký Số Lên App SmartCA";

  const currentLoadingLabel =
    signMode === "Q2"
      ? autoSendOnSign
        ? "Đang Tự Động Ký & Chuẩn Bị Gửi Cổng..."
        : "Đang Tự Động Sinh Mã & Ký Số..."
      : "Đang Khởi Tạo Ký Q1...";

  const isDigestComputing = useMemo(() => {
    if (!effectiveXmlToSign || isSigned) return false;
    const currentDigest =
      signMode === "Q2" ? q2.digestInfo : q1.digestInfo;
    return currentDigest === null;
  }, [effectiveXmlToSign, isSigned, signMode, q2.digestInfo, q1.digestInfo]);

  React.useEffect(() => {
    if (onRegisterSignAction) {
      if (!isSigned && !q1.waitingTransaction) {
        onRegisterSignAction({
          visible: true,
          isInitiating: isInitiatingSign || isDigestComputing,
          label: isDigestComputing ? "Đang Tính Mã Băm..." : currentButtonLabel,
          loadingLabel: isDigestComputing
            ? "Đang Tính Mã Băm..."
            : currentLoadingLabel,
          trigger: handleInitiateSignAction,
          onCancel: handleCancelSignAction,
        });
      } else {
        onRegisterSignAction(null);
      }
    }
  }, [
    onRegisterSignAction,
    isSigned,
    q1.waitingTransaction,
    isInitiatingSign,
    isDigestComputing,
    currentButtonLabel,
    currentLoadingLabel,
    handleInitiateSignAction,
    handleCancelSignAction,
  ]);

  return (
    <div className="space-y-4">
      {/* 0. Tiến trình quy trình khép kín: Lập hồ sơ -> Ký số -> Gửi Cổng BHXH -> Hoàn tất */}
      <BhxhFlowStepper
        isSigned={isSigned}
        isSigning={Boolean(
          signMode === "Q2"
            ? q2.isInitiating
            : q1.isInitiating || q1.waitingTransaction,
        )}
        isSendingApi={Boolean(isSendingApi)}
        apiResponse={apiResponse}
        itemsCount={itemsCount}
        itemLabel={itemLabel}
        fileName={effectiveFileName}
        hasCustomUploadedFile={Boolean(uploadedCustomXml)}
        signatureInfo={signatureInfo}
        onResendApi={onDirectSendBhxh}
        onDownloadSignedXml={
          onDownloadSignedXml || handleDefaultDownloadSignedXml
        }
        onResetAll={handleResetAndResignAll}
      />

      {/* 1. Khối chọn loại hồ sơ & Nạp file Excel / XML */}
      <DocTypeSelector
        fileName={fileName}
        itemsCount={itemsCount}
        itemLabel={itemLabel}
        selectedDocType={selectedDocType}
        isSigned={isSigned}
        hasFile={Boolean(effectiveXmlToSign)}
        sourceFileInfo={sourceFileInfo}
        onSelectDocType={(type) => {
          setSelectedDocType(type);
          if (isSigned) onResetSignature();
        }}
        onUploadedFileParsed={({ xmlContent: parsedXml, fileName: name }) => {
          setUploadedCustomXml(parsedXml);
          setUploadedFileName(name);
          const sig = extractXmlSignature(parsedXml);
          if (sig.hasSignature) {
            onSignedSuccess(parsedXml, {
              success: true,
              tranId: "UPLOADED_SIGNED_XML",
              signatureValue: sig.signatureValue || "",
              subjectDN: sig.subjectDN || "",
              serialNumber: sig.serialNumber || "",
              issuerDN: "",
              x509Certificate: "",
              signedAt: sig.signingTime || new Date().toISOString(),
              digestValue: sig.digestValue || "",
              signedXml: parsedXml,
            });
          } else if (isSigned) {
            onResetSignature();
          }
        }}
        onClearUploaded={() => {
          setUploadedCustomXml(null);
          setUploadedFileName(null);
          if (isSigned) onResetSignature();
        }}
        onOpenPreviewXml={() => {
          setShowXmlPreview(true);
        }}
      />

      {/* Modal Popup Xem Trước Cấu Trúc XML */}
      <XmlPreviewModal
        isOpen={showXmlPreview}
        onClose={() => setShowXmlPreview(false)}
        fileName={effectiveFileName || `${selectedDocType}_Template.xml`}
        xmlContent={isSigned && signedXml ? signedXml : effectiveXmlToSign}
        copiedKey={q1.copiedKey}
        onCopy={q1.handleCopy}
        isSigned={isSigned}
      />

      {/* 2. Thẻ hiển thị tệp tin & Mã băm SHA-256 DigestValue */}
      <DigestInfoCard
        effectiveFileName={effectiveFileName}
        isSigned={isSigned}
        isWaiting={Boolean(q1.waitingTransaction)}
        isDigestComputing={isDigestComputing}
        digestValue={
          isSigned
            ? signatureInfo.digestValue
            : signMode === "Q2"
              ? q2.digestInfo?.digestValue || q1.digestInfo?.digestValue
              : q1.digestInfo?.digestValue
        }
        copiedKey={q1.copiedKey}
        onCopyDigest={(digest) => q1.handleCopy(digest, "digest")}
      />

      {/* Thanh chuyển đổi chế độ ký Q1 / Q2 tinh gọn, không bể layout */}
      {!hideSignModeSwitcher &&
        !isSigned &&
        !q1.waitingTransaction && (
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setSignMode("Q2")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                signMode === "Q2"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Ký Tự Động</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                Q2
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSignMode("Q1")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                signMode === "Q1"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Ký Xác Nhận</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                Q1
              </span>
            </button>
          </div>
        )}

      {/* 3. Hiển thị tương ứng: Đã ký / Chờ App phê duyệt (Q1) / Form nhập liệu */}
      {isSigned ? (
        <SignedResultView
          signatureInfo={signatureInfo}
          credential={q1.credential}
          signerName={signerForm.signerName}
          identityValue={signerForm.identityValue}
          signerEmail={signerForm.signerEmail}
          copiedKey={q1.copiedKey}
          onCopySignedXml={() =>
            q1.handleCopy(signedXml || effectiveXmlToSign, "signedXml")
          }
          onDownloadSignedXml={
            onDownloadSignedXml || handleDefaultDownloadSignedXml
          }
          onResetAndResign={handleResetAndResignAll}
          onCountersign={() => setIsCountersigning(true)}
          onDirectSendBhxh={onDirectSendBhxh}
          isSendingApi={isSendingApi}
          hasApiResponse={Boolean(apiResponse)}
        />
      ) : signMode === "Q1" && q1.waitingTransaction ? (
        <WaitingApprovalView
          config={q1.config}
          waitingTransaction={q1.waitingTransaction}
          countdown={q1.countdown}
          formatCountdown={q1.formatCountdown}
          identityValue={signerForm.identityValue}
          idType={signerForm.idType}
          effectiveFileName={effectiveFileName}
          copiedKey={q1.copiedKey}
          onCopyTranId={() =>
            q1.handleCopy(q1.waitingTransaction!.tranId, "tranId")
          }
          onCheckNow={q1.handleCheckNow}
          onCancelWaiting={q1.handleCancelWaiting}
        />
      ) : (
        <div className="space-y-3">
          {isCountersigning && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
              <div>
                <b>Chế độ Đồng ký (Countersign):</b> Đang thêm chữ ký tiếp theo
                (Thủ trưởng đơn vị / Cơ sở KCB). Chữ ký trước đó được bảo toàn.
              </div>
              <button
                type="button"
                onClick={() => setIsCountersigning(false)}
                className="text-amber-700 hover:text-amber-950 underline font-bold text-xs ml-3 shrink-0 cursor-pointer"
              >
                Hủy đồng ký
              </button>
            </div>
          )}
          <SignerForm
            config={q1.config}
            signerName={signerForm.signerName}
            setSignerName={signerForm.setSignerName}
            signerEmail={signerForm.signerEmail}
            setSignerEmail={signerForm.setSignerEmail}
            idType={signerForm.idType}
            identityValue={signerForm.identityValue}
            onIdentityChange={signerForm.handleIdentityChange}
            onSelectIdType={signerForm.handleSelectIdType}
            password={signerForm.password}
            setPassword={signerForm.setPassword}
            showPassword={signerForm.showPassword}
            setShowPassword={signerForm.setShowPassword}
            isInitiating={signMode === "Q2" ? q2.isInitiating : q1.isInitiating}
            onInitiateSign={
              signMode === "Q2" ? q2.handleStartSignQ2 : q1.handleInitiateQ1Sign
            }
            onCancelSign={
              signMode === "Q2" && q2.isInitiating
                ? q2.handleCancelSignAuto
                : undefined
            }
            authMethodLabel={
              signMode === "Q2"
                ? "Tự Động Bằng Secret Key (RFC 6238 TOTP)"
                : "Ứng dụng VNPT SmartCA (Q1)"
            }
            buttonLabel={
              autoSendOnSign
                ? signMode === "Q2"
                  ? "Ký Số & Gửi Cổng BHXH"
                  : "Ký & Gửi Cổng BHXH"
                : signMode === "Q2"
                  ? "Ký Số Tự Động Q2"
                  : "Gửi Yêu Cầu Ký Số Lên App SmartCA"
            }
            loadingLabel={
              signMode === "Q2"
                ? autoSendOnSign
                  ? "Đang Tự Động Ký & Chuẩn Bị Gửi Cổng..."
                  : "Đang Tự Động Sinh Mã & Ký Số..."
                : "Đang Khởi Tạo Ký Q1..."
            }
            signMode={signMode}
            autoSendOnSign={autoSendOnSign}
            onToggleAutoSend={onToggleAutoSend}
            hideSubmitButton={hideSubmitButton || Boolean(onRegisterSignAction)}
            hideAutoSendCheckbox={hideAutoSendCheckbox}
            isDigestComputing={isDigestComputing}
          />
        </div>
      )}


      {/* Error Modal khi kết nối VNPT thật gặp lỗi (Q1) */}
      <SmartCaErrorModal
        isOpen={q1.authErrorModalData.isOpen}
        onClose={q1.handleCloseAuthErrorModal}
        errorMessage={q1.authErrorModalData.errorMessage}
        env={q1.config.env}
        clientId={q1.config.clientId}
        username={signerForm.identityValue}
      />
    </div>
  );
};
