import { useState, useEffect, useRef, useCallback } from "react";
import { useSmartCa } from "../context/SmartCaContext";
import { useToast } from "../context/ToastContext";
import { useClipboard } from "./useClipboard";
import {
  computeXmlDigest,
  computeSignedInfoDigest,
} from "../utils/xmlDsigEngine";
import {
  initiateSignQ1,
  checkSignStatusQ1,
  type SmartCaSignResponse,
  type SmartCaQ1InitiateResponse,
} from "../services/smartca/smartcaHandlers";
import { SMARTCA_CLIENT_SECRET } from "../services/smartca/smartcaConfig";
import { DEFAULT_CLINIC_NAME } from "../utils/shared/excelXmlShared";
import { SMARTCA_TRAN_STATUS, type SignerProfile } from "../types/smartcaTypes";
import {
  IDENTITY_LABELS,
  validateIdentity,
  validateEmail,
} from "../utils/validators";

import { useSignerFormState, type SignerFormState } from "./useSignerFormState";

export const COUNTDOWN_SECONDS = 180;

export interface UseSmartCaSignQ1Props {
  effectiveXmlToSign: string;
  effectiveFileName: string;
  isSigned: boolean;
  onSignedSuccess: (signedXml: string, signResponse: SmartCaSignResponse) => void;
  onResetSignature?: () => void;
  signerForm?: SignerFormState;
}

export function useSmartCaSignQ1({
  effectiveXmlToSign,
  effectiveFileName,
  onSignedSuccess,
  onResetSignature,
  signerForm,
}: UseSmartCaSignQ1Props) {
  const { credential, config } = useSmartCa();
  const toast = useToast();

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

  // Trạng thái giao dịch Q1
  const [isInitiating, setIsInitiating] = useState(false);
  const [waitingTransaction, setWaitingTransaction] =
    useState<SmartCaQ1InitiateResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);

  const [authErrorModalData, setAuthErrorModalData] = useState<{
    isOpen: boolean;
    errorMessage: string;
  }>({
    isOpen: false,
    errorMessage: "",
  });
  const [digestInfo, setDigestInfo] = useState<{
    digestValue: string;
    hexDigest: string;
  } | null>(null);
  const { copiedKey, copy } = useClipboard();

  // Timers
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tính SHA-256 Digest của XML (tính duy nhất tại đây)
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
          console.error("Lỗi tính mã băm SHA-256 XML:", err);
          if (!isCancelled) setDigestInfo(null);
        });
    } else {
      setDigestInfo(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [effectiveXmlToSign]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const handleCopy = (text: string, key: string) => {
    copy(text, "Đã sao chép vào khay nhớ tạm", key);
  };


  const handleCloseAuthErrorModal = () => {
    setAuthErrorModalData({ isOpen: false, errorMessage: "" });
  };

  const handleCancelWaiting = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setWaitingTransaction(null);
    setIsInitiating(false);
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  const handleResetAndResign = () => {
    handleCancelWaiting();
    onResetSignature?.();
  };

  /**
   * Xử lý kiểm tra trạng thái giao dịch ký số (dùng chung cho Polling và Kiểm tra ngay)
   */
  const checkTransactionStatus = useCallback(
    async (
      tran: SmartCaQ1InitiateResponse,
      isManualCheck = false,
    ): Promise<boolean> => {
      try {
        const checkRes = await checkSignStatusQ1({
          tranId: tran.tranId,
          accessToken: tran.accessToken,
          digestValue: tran.digestValue,
          rawXml: effectiveXmlToSign,
          certInfo: {
            subjectDN: tran.subjectDN,
            serialNumber: tran.serialNumber,
            issuerDN: tran.issuerDN || "",
            x509Certificate: tran.x509Certificate || "",
            rsaModulus: tran.rsaModulus,
            rsaExponent: tran.rsaExponent,
          },
          signer: tran.signer,
        });

        if (checkRes.success && checkRes.signedXml) {
          handleCancelWaiting();
          toast.success("Ký số thành công!", "Hoàn Tất Ký");
          onSignedSuccess(checkRes.signedXml, checkRes);
          return true;
        }

        if (checkRes.status === SMARTCA_TRAN_STATUS.EXPIRED) {
          handleCancelWaiting();
          toast.error(
            checkRes.error || "Giao dịch ký số đã hết hạn trên App SmartCA.",
            "Hết Hạn",
          );
          return true;
        }

        if (checkRes.status === SMARTCA_TRAN_STATUS.SIGNER_REJECTED) {
          handleCancelWaiting();
          toast.warning(
            checkRes.error ||
              "Người dùng đã từ chối xác nhận ký số trên App VNPT SmartCA.",
            "Từ Chối Ký",
          );
          return true;
        }

        return false;
      } catch (err: unknown) {
        if (isManualCheck) {
          toast.error(
            err instanceof Error ? err.message : "Lỗi kiểm tra trạng thái",
            "Lỗi Kiểm Tra",
          );
        } else {
          console.warn("Polling error:", err);
        }
        return false;
      }
    },
    [effectiveXmlToSign, handleCancelWaiting, onSignedSuccess, toast],
  );

  /**
   * Polling tự động mỗi 2 giây
   */
  const startPollingTransaction = useCallback((tran: SmartCaQ1InitiateResponse) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      await checkTransactionStatus(tran, false);
    }, 2000);
  }, [checkTransactionStatus]);

  /**
   * Khởi tạo yêu cầu ký số Q1
   */
  const handleInitiateQ1Sign = useCallback(async () => {
    if (!effectiveXmlToSign) {
      toast.warning("Nội dung XML trống - không thể ký số!", "Thiếu Dữ Liệu");
      return;
    }

    const trimmedIdentity = identityValue.trim();
    if (!trimmedIdentity) {
      toast.warning(
        `Vui lòng nhập ${IDENTITY_LABELS[idType]} nhận thông báo SmartCA`,
        "Thiếu Thông Tin",
      );
      return;
    }

    const identityCheck = validateIdentity(trimmedIdentity, idType);
    if (!identityCheck.isValid) {
      toast.warning(identityCheck.error || "Định danh không hợp lệ!", "Sai Định Dạng");
      return;
    }

    const trimmedEmail = signerEmail.trim();
    if (trimmedEmail) {
      const emailCheck = validateEmail(trimmedEmail);
      if (!emailCheck.isValid) {
        toast.warning(emailCheck.error || "Địa chỉ Email không hợp lệ!", "Sai Định Dạng");
        return;
      }
    }

    if (
      (config.env === "production" || config.env === "demo") &&
      (!config.clientId || !SMARTCA_CLIENT_SECRET)
    ) {
      const err = `[VNPT_SMARTCA_${config.env.toUpperCase()}_AUTH_FAILED] Chưa cấu hình VITE_SMARTCA_CLIENT_ID hoặc VITE_SMARTCA_CLIENT_SECRET trong file .env`;
      toast.error(err, "Cấu Hình SmartCA");
      setAuthErrorModalData({ isOpen: true, errorMessage: err });
      return;
    }

    setIsInitiating(true);

    const isUnitSign = idType === "mst";
    const customName = signerName.trim();
    const displayName =
      customName ||
      (isUnitSign
        ? DEFAULT_CLINIC_NAME || `Cơ sở KCB (MST: ${trimmedIdentity})`
        : `Bác sĩ (${idType === "phone" ? "SĐT" : "CCCD"}: ${trimmedIdentity})`);

    const dynamicSigner: SignerProfile = {
      id: `signer-${Date.now()}`,
      name: displayName,
      role: isUnitSign ? "DON_VI" : "BAC_SI",
      roleTitle: isUnitSign ? "Chữ ký số Cơ sở KCB (Đơn vị)" : "Bác sĩ điều trị",
      phone: idType === "phone" ? trimmedIdentity : "",
      cccd: idType === "cccd" ? trimmedIdentity : "",
      mst: idType === "mst" ? trimmedIdentity : "",
      email: trimmedEmail || undefined,
      subjectDN: "",
      serialNumber: "",
    };

    try {
      if (!password.trim()) {
        toast.warning("Vui lòng nhập mật khẩu tài khoản SmartCA để xác thực.", "Thiếu Mật Khẩu");
        setIsInitiating(false);
        return;
      }

      const digestValue =
        digestInfo?.digestValue ||
        (
          await computeXmlDigest(effectiveXmlToSign, {
            preserveOtherSignatures: true,
          })
        ).digestValue;

      const siRes = await computeSignedInfoDigest(
        digestValue,
        effectiveXmlToSign,
      );

      const initResponse = await initiateSignQ1({
        username: trimmedIdentity,
        password: password.trim(),
        digestValue,
        signedInfoDigest: siRes.digestValue,
        rawXml: effectiveXmlToSign,
        fileName: effectiveFileName,
        signer: dynamicSigner,
      });

      if (!initResponse.success || !initResponse.tranId) {
        const errText =
          initResponse.error || "Không thể khởi tạo giao dịch ký số với VNPT SmartCA.";
        toast.error(errText, "Lỗi Khởi Tạo");
        setAuthErrorModalData({ isOpen: true, errorMessage: errText });
        setIsInitiating(false);
        return;
      }

      setWaitingTransaction(initResponse);
      setIsInitiating(false);
      setCountdown(COUNTDOWN_SECONDS);
      toast.info("Đã gửi yêu cầu ký số. Vui lòng mở App VNPT SmartCA để xác nhận.", "Chờ Phê Duyệt");

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleCancelWaiting();
            toast.warning("Giao dịch ký số đã hết thời gian chờ (180 giây). Vui lòng thử lại.", "Hết Giờ Chờ");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      startPollingTransaction(initResponse);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi khởi tạo ký số Q1";
      toast.error(errorMsg, "Lỗi Ký Số Q1");
      setIsInitiating(false);
    }
  }, [
    effectiveXmlToSign,
    identityValue,
    idType,
    signerName,
    signerEmail,
    config.env,
    config.clientId,
    password,
    digestInfo,
    effectiveFileName,
    handleCancelWaiting,
    startPollingTransaction,
    toast,
  ]);

  const handleCheckNow = async () => {
    if (!waitingTransaction) return;
    await checkTransactionStatus(waitingTransaction, true);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    credential,
    config,
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
    isInitiating,
    waitingTransaction,
    countdown,
    authErrorModalData,
    digestInfo,
    copiedKey,
    handleCopy,
    handleIdentityChange,
    handleSelectIdType,
    handleCloseAuthErrorModal,
    handleCancelWaiting,
    handleResetAndResign,
    handleInitiateQ1Sign,
    handleCheckNow,
    formatCountdown,
  };
}
