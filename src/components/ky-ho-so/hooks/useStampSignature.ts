import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import {
  removeImageBackground,
  saveImageToCache,
  getCachedImage,
  clearImageCache,
  getRemainingMinutes,
  CACHE_KEYS,
  DEFAULT_ASSETS,
} from "../utils/imageProcessing";

export function useStampSignature() {
  const toast = useToast();

  const [stampImageUrl, setStampImageUrl] = useState<string>(
    () => getCachedImage(CACHE_KEYS.STAMP)?.dataUrl || DEFAULT_ASSETS.STAMP,
  );
  const [signatureImageUrl, setSignatureImageUrl] = useState<string>(
    () =>
      getCachedImage(CACHE_KEYS.SIGNATURE)?.dataUrl || DEFAULT_ASSETS.SIGNATURE,
  );
  const [hasCustomStamp, setHasCustomStamp] = useState<boolean>(
    () => !!getCachedImage(CACHE_KEYS.STAMP),
  );
  const [hasCustomSignature, setHasCustomSignature] = useState<boolean>(
    () => !!getCachedImage(CACHE_KEYS.SIGNATURE),
  );
  const [isProcessingStamp, setIsProcessingStamp] = useState(false);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);

  const [stampRemainingMin, setStampRemainingMin] = useState<number | null>(
    () => getRemainingMinutes(CACHE_KEYS.STAMP),
  );
  const [sigRemainingMin, setSigRemainingMin] = useState<number | null>(() =>
    getRemainingMinutes(CACHE_KEYS.SIGNATURE),
  );
  const [hoveredPreview, setHoveredPreview] = useState<
    "stamp" | "signature" | null
  >(null);

  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Định kỳ mỗi 20 giây kiểm tra xem cache con dấu hoặc chữ ký đã quá 30 phút chưa
  useEffect(() => {
    const timer = setInterval(() => {
      const stampCached = getCachedImage(CACHE_KEYS.STAMP);
      if (hasCustomStamp && !stampCached) {
        setStampImageUrl(DEFAULT_ASSETS.STAMP);
        setHasCustomStamp(false);
        setStampRemainingMin(null);
        toast.info(
          "Con dấu tùy chỉnh đã hết hạn lưu tạm 30 phút và tự động đặt lại về mặc định.",
          "Hết Hạn Cache 30 Phút",
        );
      } else {
        setStampRemainingMin(stampCached?.remainingMinutes ?? null);
      }

      const sigCached = getCachedImage(CACHE_KEYS.SIGNATURE);
      if (hasCustomSignature && !sigCached) {
        setSignatureImageUrl(DEFAULT_ASSETS.SIGNATURE);
        setHasCustomSignature(false);
        setSigRemainingMin(null);
        toast.info(
          "Chữ ký tùy chỉnh đã hết hạn lưu tạm 30 phút và tự động đặt lại về mặc định.",
          "Hết Hạn Cache 30 Phút",
        );
      } else {
        setSigRemainingMin(sigCached?.remainingMinutes ?? null);
      }
    }, 20000);

    return () => clearInterval(timer);
  }, [hasCustomStamp, hasCustomSignature, toast]);

  // Tải ảnh con dấu mới: Tự động tách phông nền trắng/xám thành trong suốt + Cache 30 phút
  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setIsProcessingStamp(true);
    toast.info(
      `Đang tự động xóa phông nền (Remove background) cho ảnh con dấu: ${file.name}...`,
      "Tách Nền Tự Động",
    );

    try {
      const cleanDataUrl = await removeImageBackground(file, "stamp");
      saveImageToCache(CACHE_KEYS.STAMP, cleanDataUrl, file.name);
      setStampImageUrl(cleanDataUrl);
      setHasCustomStamp(true);
      setStampRemainingMin(30);
      toast.success(
        `Đã tách nền con dấu thành công và lưu tạm 30 phút. Nền giấy đã trở nên trong suốt.`,
        "Con Dấu Đã Xử Lý",
      );
    } catch (err: unknown) {
      console.error("Lỗi tách nền con dấu:", err);
      const fallbackUrl = URL.createObjectURL(file);
      setStampImageUrl(fallbackUrl);
      setHasCustomStamp(true);
      setStampRemainingMin(30);
      toast.warning(
        `Không thể tách nền tự động, sử dụng ảnh gốc: ${file.name}`,
        "Cảnh Báo",
      );
    } finally {
      setIsProcessingStamp(false);
    }
  };

  // Tải ảnh chữ ký mới: Tự động tách phông nền trắng/xám thành trong suốt + Cache 30 phút
  const handleSignatureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setIsProcessingSignature(true);
    toast.info(
      `Đang tự động xóa phông nền (Remove background) cho ảnh chữ ký: ${file.name}...`,
      "Tách Nền Tự Động",
    );

    try {
      const cleanDataUrl = await removeImageBackground(file, "signature");
      saveImageToCache(CACHE_KEYS.SIGNATURE, cleanDataUrl, file.name);
      setSignatureImageUrl(cleanDataUrl);
      setHasCustomSignature(true);
      setSigRemainingMin(30);
      toast.success(
        `Đã tách nền chữ ký thành công và lưu tạm 30 phút. Nền giấy đã trở nên trong suốt.`,
        "Chữ Ký Đã Xử Lý",
      );
    } catch (err: unknown) {
      console.error("Lỗi tách nền chữ ký:", err);
      const fallbackUrl = URL.createObjectURL(file);
      setSignatureImageUrl(fallbackUrl);
      setHasCustomSignature(true);
      setSigRemainingMin(30);
      toast.warning(
        `Không thể tách nền tự động, sử dụng ảnh gốc: ${file.name}`,
        "Cảnh Báo",
      );
    } finally {
      setIsProcessingSignature(false);
    }
  };

  // Đặt lại con dấu về mặc định của trung tâm & xóa cache 30 phút
  const handleResetStamp = () => {
    clearImageCache(CACHE_KEYS.STAMP);
    setStampImageUrl(DEFAULT_ASSETS.STAMP);
    setHasCustomStamp(false);
    setStampRemainingMin(null);
    toast.success(
      "Đã đặt lại con dấu về con dấu mặc định của trung tâm.",
      "Đặt Lại Con Dấu",
    );
  };

  // Đặt lại chữ ký về mặc định & xóa cache 30 phút
  const handleResetSignature = () => {
    clearImageCache(CACHE_KEYS.SIGNATURE);
    setSignatureImageUrl(DEFAULT_ASSETS.SIGNATURE);
    setHasCustomSignature(false);
    setSigRemainingMin(null);
    toast.success("Đã đặt lại chữ ký về chữ ký mặc định.", "Đặt Lại Chữ Ký");
  };

  return {
    stampImageUrl,
    signatureImageUrl,
    hasCustomStamp,
    hasCustomSignature,
    isProcessingStamp,
    isProcessingSignature,
    stampRemainingMin,
    sigRemainingMin,
    hoveredPreview,
    setHoveredPreview,
    stampInputRef,
    signatureInputRef,
    handleStampUpload,
    handleSignatureUpload,
    handleResetStamp,
    handleResetSignature,
  };
}

export type UseStampSignatureReturn = ReturnType<typeof useStampSignature>;
