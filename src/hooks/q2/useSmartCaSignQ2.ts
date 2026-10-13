import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../../context/ToastContext";
import { useClipboard } from "../useClipboard";
import { computeXmlDigest } from "../../utils/xmlDsigEngine";
import { signXmlWithBackend } from "../../services/kySoBackendApi";
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

    const controller = new AbortController();
    autoAbortRef.current = controller;
    setIsInitiating(true);

    // 1. ƯU TIÊN: Ký số qua Backend (Server-side SmartCA với TOTP & W3C XMLDSig chuẩn)
    try {
      const beRes = await signXmlWithBackend({
        rawXml: effectiveXmlToSign,
        fileName: effectiveFileName,
        userId: identityValue.trim() || undefined,
      });

      if (beRes.success && beRes.signedXml) {
        setIsInitiating(false);
        autoAbortRef.current = null;

        const signResponse: SmartCaSignResponse = {
          success: true,
          tranId: beRes.signatureId || `BE-${Date.now()}`,
          tranCode: "00",
          status: 1,
          signatureValue: beRes.meta?.signatureValue || "",
          subjectDN: beRes.meta?.signerName || "",
          serialNumber: beRes.meta?.certSerial || "",
          issuerDN: beRes.meta?.caProvider || "VNPT-CA",
          x509Certificate: "",
          signedAt: beRes.meta?.signTime || new Date().toISOString(),
          digestValue:
            beRes.meta?.digestValue || digestInfo?.digestValue || "",
          signedXml: beRes.signedXml,
        };

        onSignedSuccess(beRes.signedXml, signResponse);
        toast.success(
          "Ký số SmartCA qua Backend thành công.",
          "Ký số XML hoàn tất",
        );
        return;
      }
    } catch (backendErr: unknown) {
      setIsInitiating(false);
      autoAbortRef.current = null;
      const errMsg =
        backendErr instanceof Error ? backendErr.message : String(backendErr);
      console.error("[Q2] Lỗi ký số qua Backend:", backendErr);
      toast.error(`Ký số Backend thất bại: ${errMsg}`, "Lỗi Ký Số");
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
