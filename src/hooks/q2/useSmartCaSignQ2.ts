import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../../context/ToastContext";
import { useClipboard } from "../useClipboard";
import { computeXmlDigest } from "../../utils/xmlDsigEngine";
import { signAutoQ2 } from "../../services/smartca/q2/smartcaQ2Handlers";
import { SMARTCA_TOTP_SECRET } from "../../services/smartca/smartcaConfig";
import type { SmartCaSignResponse } from "../../services/smartca/smartcaHandlers";
import { useSignerFormState, type SignerFormState } from "../useSignerFormState";

export interface UseSmartCaSignQ2Props {
  effectiveXmlToSign: string;
  effectiveFileName: string;
  isSigned: boolean;
  onSignedSuccess: (
    signedXml: string,
    signResponse: SmartCaSignResponse,
  ) => void;
  onResetSignature?: () => void;
  signerForm?: SignerFormState;
}

export function useSmartCaSignQ2({
  effectiveXmlToSign,
  effectiveFileName,
  onSignedSuccess,
  onResetSignature,
  signerForm,
}: UseSmartCaSignQ2Props) {
  const toast = useToast();
  const { copy } = useClipboard();

  const internalForm = useSignerFormState();
  const form = signerForm || internalForm;
  const {
    signerName,
    setSignerName,
    signerEmail,
    setSignerEmail,
    idType,
    identityValue,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    handleIdentityChange,
    handleSelectIdType,
  } = form;

  // Khóa bí mật Smart OTP (TOTP Secret Key) nạp từ .env
  const [totpSecret, setTotpSecret] = useState<string>(
    SMARTCA_TOTP_SECRET || "",
  );

  const handleSaveTotpSecret = useCallback((secret: string) => {
    setTotpSecret((secret || "").trim());
  }, []);

  // Trạng thái giao dịch Ký tự động Q2
  const [isInitiating, setIsInitiating] = useState(false);
  const autoAbortRef = useRef<AbortController | null>(null);

  const handleCancelSignAuto = useCallback(() => {
    if (autoAbortRef.current) {
      autoAbortRef.current.abort();
      autoAbortRef.current = null;
    }
    setIsInitiating(false);
    toast.info("Đã dừng tiến trình ký số.", "Đã hủy");
  }, [toast]);

  // Băm SHA-256 nội dung XML một lần duy nhất
  const [digestInfo, setDigestInfo] = useState<{
    digestValue: string;
    hexDigest: string;
  } | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (effectiveXmlToSign) {
      computeXmlDigest(effectiveXmlToSign, { preserveOtherSignatures: true })
        .then((res) => {
          if (!isCancelled) {
            setDigestInfo(res);
          }
        })
        .catch((err) => {
          console.error("Lỗi tính mã băm SHA-256 XML Q2:", err);
          if (!isCancelled) setDigestInfo(null);
        });
    } else {
      setDigestInfo(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [effectiveXmlToSign]);



  const handleStartSignQ2 = useCallback(async () => {
    if (!effectiveXmlToSign) {
      toast.warning("Chưa có nội dung file XML để ký số.", "Cảnh báo");
      return;
    }

    if (!identityValue.trim()) {
      toast.warning(
        "Vui lòng nhập định danh tài khoản SmartCA.",
        "Thiếu thông tin",
      );
      return;
    }

    const cleanSecret = (totpSecret || SMARTCA_TOTP_SECRET || "").trim();

    if (!cleanSecret) {
      toast.warning(
        "Vui lòng cấu hình Secret Key để sử dụng chế độ Ký Tự Động Q2.",
        "Chưa có Secret Key",
      );
      return;
    }

    const controller = new AbortController();
    autoAbortRef.current = controller;
    setIsInitiating(true);

    try {
      const autoResult = await signAutoQ2({
        rawXml: effectiveXmlToSign,
        documentDigest: digestInfo?.digestValue,
        fileName: effectiveFileName,
        identityValue: identityValue.trim(),
        password,
        idType,
        signer: undefined,
        totpSecret: cleanSecret,
        abortSignal: controller.signal,
      });

      setIsInitiating(false);
      autoAbortRef.current = null;

      if (
        autoResult.success &&
        autoResult.signedXml &&
        autoResult.signResponse
      ) {
        onSignedSuccess(autoResult.signedXml, autoResult.signResponse);
        toast.success(
          "Đã tự động xác thực bằng Secret Key và ký số thành công.",
          "Ký số tự động Q2 thành công",
        );
      } else {
        toast.error(
          autoResult.error || "Lỗi ủy quyền ký số tự động.",
          "Ký số thất bại",
        );
      }
    } catch (err: unknown) {
      setIsInitiating(false);
      autoAbortRef.current = null;
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("Đã hủy")) {
        return;
      }
      toast.error(errMsg, "Lỗi ký số tự động");
    }
  }, [
    effectiveXmlToSign,
    digestInfo,
    effectiveFileName,
    identityValue,
    password,
    idType,
    totpSecret,
    onSignedSuccess,
    toast,
  ]);

  const handleResetSignature = useCallback(() => {
    onResetSignature?.();
  }, [onResetSignature]);

  return {
    signerName,
    setSignerName,
    signerEmail,
    setSignerEmail,
    idType,
    identityValue,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    handleIdentityChange,
    handleSelectIdType,
    totpSecret,
    setTotpSecret: handleSaveTotpSecret,
    digestInfo,
    isInitiating,
    handleStartSignQ2,
    handleCancelSignAuto,
    handleResetSignature,
    copy,
  };
}
