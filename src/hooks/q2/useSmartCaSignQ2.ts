import { useState, useEffect, useCallback, useRef } from 'react';
import { useSmartCa } from '../../context/SmartCaContext';
import { useToast } from '../../context/ToastContext';
import { useClipboard } from '../useClipboard';
import { computeXmlDigest } from '../../utils/xmlDsigEngine';
import {
  initiateSignQ2,
  authorizeSignQ2,
  injectSignedXmlQ2,
  signAutoQ2,
} from '../../services/smartca/q2/smartcaQ2Handlers';
import type { WaitingQ2Transaction } from '../../services/smartca/q2/smartcaQ2Types';
import {
  SMARTCA_DEFAULT_MST,
  SMARTCA_DEFAULT_PASSWORD,
  SMARTCA_TOTP_SECRET,
} from '../../services/smartca/smartcaConfig';
import type { SmartCaSignResponse } from '../../services/smartca/smartcaHandlers';
import {
  type IdentityType,
  sanitizeIdentityInput,
} from '../../utils/validators';

export interface UseSmartCaSignQ2Props {
  effectiveXmlToSign: string;
  effectiveFileName: string;
  isSigned: boolean;
  onSignedSuccess: (signedXml: string, signResponse: SmartCaSignResponse) => void;
  onResetSignature?: () => void;
}

export function useSmartCaSignQ2({
  effectiveXmlToSign,
  effectiveFileName,
  onSignedSuccess,
  onResetSignature,
}: UseSmartCaSignQ2Props) {
  const { config } = useSmartCa();
  const toast = useToast();
  const { copy } = useClipboard();

  // Thông tin tài khoản người ký (mặc định MST doanh nghiệp từ .env)
  const defaultMst = SMARTCA_DEFAULT_MST || config.username || '';
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [idType, setIdType] = useState<'phone' | 'cccd' | 'mst'>(
    defaultMst ? 'mst' : 'phone',
  );
  const [identityValue, setIdentityValue] = useState(defaultMst);
  const [password, setPassword] = useState(SMARTCA_DEFAULT_PASSWORD || '');
  const [showPassword, setShowPassword] = useState(false);

  // Khóa bí mật Smart OTP (TOTP Secret Key) nạp từ .env
  const [totpSecret, setTotpSecret] = useState<string>(SMARTCA_TOTP_SECRET || '');

  const handleSaveTotpSecret = useCallback((secret: string) => {
    setTotpSecret((secret || '').trim());
  }, []);

  // Trạng thái giao dịch Q2
  const [isInitiating, setIsInitiating] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const autoAbortRef = useRef<AbortController | null>(null);

  const handleCancelSignAuto = useCallback(() => {
    if (autoAbortRef.current) {
      autoAbortRef.current.abort();
      autoAbortRef.current = null;
    }
    setIsInitiating(false);
    toast.info('Đã dừng tiến trình ký số.', 'Đã hủy');
  }, [toast]);
  const [waitingTx, setWaitingTx] = useState<WaitingQ2Transaction | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [canRetryOtp, setCanRetryOtp] = useState<boolean>(true);
  const [isExpired, setIsExpired] = useState<boolean>(false);

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
          console.error('Lỗi tính mã băm SHA-256 XML Q2:', err);
          if (!isCancelled) setDigestInfo(null);
        });
    } else {
      setDigestInfo(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [effectiveXmlToSign]);

  const handleIdentityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = sanitizeIdentityInput(e.target.value, idType);
    setIdentityValue(raw);
  };

  const handleSelectIdType = (type: IdentityType) => {
    if (idType !== type) {
      setIdType(type);
      if (type === 'mst' && defaultMst) {
        setIdentityValue(defaultMst);
      } else {
        setIdentityValue('');
      }
    }
  };

  /**
   * Bắt đầu quy trình ký Q2:
   * - Nếu có Secret Key: Tự động sinh mã Smart OTP (RFC 6238) và hoàn tất ký số 1-click ngay lập tức (không cần mở app).
   * - Nếu chưa có Secret Key: Báo người dùng dán Secret Key vào ô nhập liệu hoặc khởi tạo modal thủ công.
   */
  const handleStartSignQ2 = useCallback(async () => {
    if (!effectiveXmlToSign) {
      toast.warning('Chưa có nội dung file XML để ký số.', 'Cảnh báo');
      return;
    }

    if (!identityValue.trim()) {
      toast.warning('Vui lòng nhập định danh tài khoản SmartCA.', 'Thiếu thông tin');
      return;
    }

    const cleanSecret = (totpSecret || SMARTCA_TOTP_SECRET || '').trim();

    // 1. KÝ SỐ TỰ ĐỘNG BẰNG SECRET KEY (1-CLICK KHÔNG CẦN MỞ APP)
    if (cleanSecret) {
      const controller = new AbortController();
      autoAbortRef.current = controller;
      setIsInitiating(true);
      setOtpError(null);

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

        if (autoResult.success && autoResult.signedXml && autoResult.signResponse) {
          onSignedSuccess(autoResult.signedXml, autoResult.signResponse);
          toast.success(
            'Đã tự động xác thực bằng Secret Key và ký số thành công.',
            'Ký số tự động 1-Click thành công',
          );
          return;
        } else {
          toast.error(
            autoResult.error || 'Lỗi ủy quyền ký số tự động.',
            'Ký số thất bại',
          );
          return;
        }
      } catch (err: unknown) {
        setIsInitiating(false);
        autoAbortRef.current = null;
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('Đã hủy')) {
          return;
        }
        toast.error(errMsg, 'Lỗi ký số tự động');
        return;
      }
    }

    // 2. NẾU CHƯA CÓ SECRET KEY
    toast.warning('Chưa có Secret Key ký số.', 'Chưa có Secret Key');
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

  /**
   * Tạo lại giao dịch ký mới ngay trên Modal (khi hết hạn hoặc hết số lần thử OTP)
   */
  const handleReinitiateQ2 = useCallback(async () => {
    if (!effectiveXmlToSign || !identityValue.trim()) return;

    setIsInitiating(true);
    setOtpError(null);

    const initResult = await initiateSignQ2({
      rawXml: effectiveXmlToSign,
      documentDigest: digestInfo?.digestValue,
      fileName: effectiveFileName,
      identityValue: identityValue.trim(),
      password,
      idType,
      signer: undefined,
    });

    setIsInitiating(false);

    if (!initResult.success || !initResult.waitingTx) {
      setOtpError(initResult.error || 'Không thể tạo lại giao dịch mới.');
      return;
    }

    setWaitingTx(initResult.waitingTx);
    setAttemptsLeft(3);
    setCanRetryOtp(true);
    setIsExpired(false);
    toast.info('Đã khởi tạo phiên giao dịch ký số mới.', 'Đã làm mới');
  }, [
    effectiveXmlToSign,
    digestInfo,
    effectiveFileName,
    identityValue,
    password,
    idType,
    toast,
  ]);

  /**
   * Xác nhận mã OTP từ Modal: Ủy quyền ký -> Nhúng chữ ký XML -> Hoàn tất
   */
  const handleConfirmOtp = useCallback(
    async (otpCode: string) => {
      if (!waitingTx) {
        setOtpError('Phiên giao dịch ký không tồn tại hoặc đã kết thúc.');
        return;
      }

      setIsAuthorizing(true);
      setOtpError(null);

      const authRes = await authorizeSignQ2({
        transactionId: waitingTx.transactionId,
        totpCode: otpCode,
        accessToken: waitingTx.accessToken,
        credentialId: waitingTx.credentialId,
        signedInfoDigest: waitingTx.signedInfoDigest,
        signedInfoHex: waitingTx.signedInfoHex,
        fileName: waitingTx.fileName,
        userId: waitingTx.userId || identityValue.trim(),
        password: waitingTx.password || password,
        serialNumber: waitingTx.certInfo?.serialNumber,
      });

      setIsAuthorizing(false);

      if (!authRes.success || !authRes.signatureValue) {
        const nextAttempts = Math.max(0, attemptsLeft - 1);
        setAttemptsLeft(nextAttempts);

        const isExhausted = nextAttempts === 0;
        const finalExpired = (authRes.isExpired ?? false) || isExhausted;

        setIsExpired(finalExpired);
        setCanRetryOtp(!finalExpired);

        if (finalExpired) {
          setOtpError(
            isExhausted
              ? 'Bạn đã nhập sai quá 3 lần. Giao dịch đã bị khóa. Vui lòng bấm [Tạo lại giao dịch ký] bên dưới.'
              : authRes.error || 'Giao dịch đã hết hạn. Vui lòng bấm [Tạo lại giao dịch ký].',
          );
        } else {
          setOtpError(
            `${authRes.error || 'Mã OTP không chính xác.'} (Còn lại ${nextAttempts} lần thử)`,
          );
        }
        return;
      }

      // Ủy quyền thành công: Nhúng chữ ký số vào XML bằng digestValue đã lưu (KHÔNG BĂM LẠI)
      const injectRes = injectSignedXmlQ2(waitingTx, authRes.signatureValue);
      if (!injectRes.success) {
        setOtpError(injectRes.error || 'Lỗi đóng gói chữ ký số XML.');
        return;
      }

      // Đóng modal và gửi dữ liệu đã ký ra component cha
      setIsOtpModalOpen(false);
      setWaitingTx(null);
      onSignedSuccess(injectRes.signedXml, injectRes.signResponse);
      toast.success(
        'Đã ký số bằng Smart OTP và nhúng thẻ Signature vào XML thành công.',
        'Ký số Q2 thành công',
      );
    },
    [waitingTx, attemptsLeft, onSignedSuccess, toast],
  );

  /**
   * Đóng/Hủy Modal nhập OTP
   */
  const handleCancelOtpModal = useCallback(() => {
    setIsOtpModalOpen(false);
    setWaitingTx(null);
    setOtpError(null);
    setIsInitiating(false);
    setIsAuthorizing(false);
  }, []);

  /**
   * Đặt lại trạng thái ký số
   */
  const handleResetSignature = useCallback(() => {
    handleCancelOtpModal();
    onResetSignature?.();
  }, [handleCancelOtpModal, onResetSignature]);

  return {
    // Thông tin tài khoản
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

    // Cấu hình Khóa bí mật Smart OTP (TOTP Secret Key)
    totpSecret,
    setTotpSecret: handleSaveTotpSecret,

    // Trạng thái băm & giao dịch Q2
    digestInfo,
    isInitiating,
    isAuthorizing,
    waitingTx,
    isOtpModalOpen,
    otpError,
    attemptsLeft,
    canRetryOtp,
    isExpired,

    // Actions
    handleStartSignQ2,
    handleCancelSignAuto,
    handleReinitiateQ2,
    handleConfirmOtp,
    handleCancelOtpModal,
    handleResetSignature,
    copy,
  };
}
