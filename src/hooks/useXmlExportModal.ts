import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "../context/ToastContext";
import { extractXmlSignature } from "../utils/xmlDsigEngine";
import { BhxhChungTuService } from "../services/bhxh/bhxhChungTuService";
import { isBhxhGatewaySuccess } from "../utils/shared/excelXmlShared";

export type XmlExportTabType = "base64" | "smartca";

export interface UseXmlExportModalOptions<T, R = any> {
  isOpen: boolean;
  items: T[];
  defaultTab?: XmlExportTabType;
  generateXml: (items: T[]) => string;
  generateBase64?: (items: T[], xml?: string) => string;
  downloadFile: (items: T[], xml?: string) => void;
  sendGateway?: (
    items: T[],
    signature?: any,
    fileBase64?: string,
  ) => Promise<R>;
  downloadSuccessMessage?: string;
  emptyItemsMessage?: string;
  getSendSuccessMessage?: (result: R) => string;
  onSendSuccess?: (result: R) => void;
}

export function useXmlExportModal<T, R = any>({
  isOpen,
  items,
  defaultTab = "smartca",
  generateXml,
  generateBase64,
  downloadFile,
  sendGateway,
  downloadSuccessMessage = "Đã tải xuống tệp XML thành công!",
  emptyItemsMessage = "Không có dữ liệu để gửi!",
  getSendSuccessMessage,
  onSendSuccess,
}: UseXmlExportModalOptions<T, R>) {
  const toast = useToast();
  const [tab, setTab] = useState<XmlExportTabType>(
    defaultTab === "base64" ? "base64" : "smartca",
  );
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<R | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab === "base64" ? "base64" : "smartca");
      // Chủ động tiền kết nối & lấy sẵn Token Cổng BHXH ngay khi mở modal
      BhxhChungTuService.takeToken().catch(() => {});
    } else {
      // Khi đóng modal thì xóa kết quả gửi để sẵn sàng cho phiên mới
      setSendResult(null);
    }
  }, [isOpen, defaultTab]);

  const handleResetSendResult = () => {
    setSendResult(null);
  };

  const generateXmlRef = useRef(generateXml);
  generateXmlRef.current = generateXml;

  const generateBase64Ref = useRef(generateBase64);
  generateBase64Ref.current = generateBase64;

  const xmlContent = useMemo(
    () => (isOpen && items.length > 0 ? generateXmlRef.current(items) : ""),
    [isOpen, items],
  );

  const base64Content = useMemo(() => {
    if (!isOpen || !xmlContent) return "";
    if (generateBase64Ref.current)
      return generateBase64Ref.current(items, xmlContent);
    return "";
  }, [isOpen, items, xmlContent]);

  const handleDownloadXml = () => {
    if (items.length === 0) {
      toast.warning("Chưa có dữ liệu để tải XML!");
      return;
    }
    downloadFile(items, xmlContent);
    toast.success(downloadSuccessMessage, "Tải Tệp XML");
  };

  const handleSendGateway = async (signaturePayload?: any) => {
    const fileBase64 = signaturePayload?.fileBase64 || base64Content;
    const signatureResult = signaturePayload?.signResponse || signaturePayload;

    if (items.length === 0 && !fileBase64) {
      toast.error(emptyItemsMessage, "Lỗi Gửi Dữ Liệu");
      return;
    }

    // Kiểm tra an toàn: Nếu truyền signedXml thì bắt buộc phải có chữ ký điện tử
    if (signaturePayload?.signedXml) {
      const sig = extractXmlSignature(signaturePayload.signedXml);
      if (!sig.hasSignature) {
        toast.warning(
          "Hồ sơ chưa có chữ ký số điện tử hợp lệ (<CHUKYDONVI>). Cổng BHXH bắt buộc gói dữ liệu XML phải được ký số trước khi gửi!",
          "Yêu Cầu Chữ Ký Số",
        );
        return;
      }
    }

    if (!sendGateway) return;

    setIsSending(true);
    try {
      const res = await sendGateway(items, signatureResult, fileBase64);
      setSendResult(res);
      const isSuccess = isBhxhGatewaySuccess(res);

      if (isSuccess) {
        const msg = getSendSuccessMessage
          ? getSendSuccessMessage(res)
          : "Hồ sơ đã được gửi và tiếp nhận thành công trên Cổng BHXH!";
        toast.success(msg, "Gửi Cổng BHXH Thành Công");
        if (onSendSuccess) {
          onSendSuccess(res);
        }
      } else {
        const errMsg =
          (res as any)?.thongDiep ||
          (res as any)?.ghiChu ||
          (res as any)?.message ||
          `Cổng BHXH từ chối tiếp nhận (Mã phản hồi: ${String((res as any)?.maKetQua || "400")})`;
        toast.error(errMsg, "Lỗi Tiếp Nhận Cổng BHXH");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối cổng BHXH";
      setSendResult({
        maKetQua: "500",
        thongDiep: msg,
        isError: true,
      } as any);
      toast.error(msg, "Lỗi Gửi Cổng");
    } finally {
      setIsSending(false);
    }
  };

  return {
    tab,
    setTab,
    isSending,
    sendResult,
    xmlContent,
    base64Content,
    handleDownloadXml,
    handleSendGateway,
    handleResetSendResult,
  };
}
