import { useState, useRef } from "react";
import { useToast } from "../../../context/ToastContext";
import {
  loadPdfDocument,
  detectSignAnchor,
  createDefaultPositions,
  exportPdfWithStamps,
  convertImageToPdf,
} from "../utils/pdf";
import { parseDocxAndConvertToPdf } from "../utils/docx";
import {
  signWithSmartCS,
  isSmartCsSignSuccess,
  toSignatureMeta,
} from "../utils/smartcs";
import type {
  KyHoSoDocInfo,
  KyHoSoSignatureMeta,
  KyHoSoStep,
  SignaturePosition,
} from "../types";

interface UseDocumentSigningOptions {
  stampImageUrl: string;
  signatureImageUrl: string;
}

export function useDocumentSigning({
  stampImageUrl,
  signatureImageUrl,
}: UseDocumentSigningOptions) {
  const toast = useToast();

  const [step, setStep] = useState<KyHoSoStep>("empty");
  const [docInfo, setDocInfo] = useState<KyHoSoDocInfo | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Danh sách tọa độ con dấu và chữ ký trên trang
  const [positions, setPositions] = useState<SignaturePosition[]>([]);
  const canvasSizesRef = useRef<
    Record<number, { width: number; height: number }>
  >({});

  const [isSigning, setIsSigning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [signatureMeta, setSignatureMeta] = useState<KyHoSoSignatureMeta>({
    signerName: "",
    signTime: "",
    certSerial: "",
    caProvider: "",
    bhxhCode: "",
  });

  // 1. Tải lên tệp hồ sơ (Hỗ trợ PDF, DOCX và MỌI LOẠI ẢNH: PNG, JPG, WEBP, BMP...)
  const handleFileSelect = async (doc: KyHoSoDocInfo) => {
    setDocInfo(doc);

    try {
      if (doc.file) {
        const isDocx =
          doc.fileName.toLowerCase().endsWith(".docx") ||
          doc.fileType.includes("wordprocessingml") ||
          doc.fileType.includes("docx");

        const isImage =
          /\.(png|jpe?g|webp)$/i.test(doc.fileName) ||
          (doc.file.type.startsWith("image/") &&
            /(png|jpe?g|webp)/i.test(doc.file.type));

        const isPdf =
          doc.fileName.toLowerCase().endsWith(".pdf") ||
          doc.fileType.includes("pdf");

        if (!isPdf && !isDocx && !isImage) {
          throw new Error(
            "Định dạng tệp không được hỗ trợ. Chỉ chấp nhận các tệp: .pdf, .docx, .png, .jpg, .jpeg, .webp",
          );
        }

        let rawBuffer: ArrayBuffer;
        let finalUrl: string;

        if (isDocx) {
          toast.info(
            "Đang chuyển đổi tệp DOCX sang định dạng PDF chuẩn...",
            "Chuyển Đổi DOCX",
          );
          const docxResult = await parseDocxAndConvertToPdf(doc.file);
          rawBuffer = await docxResult.pdfBlob.arrayBuffer();
          finalUrl = URL.createObjectURL(docxResult.pdfBlob);
        } else if (isImage) {
          toast.info(
            "Đang tối ưu và đóng gói tệp hình ảnh sang định dạng PDF chuẩn...",
            "Chuyển Đổi Hình Ảnh",
          );
          const imageResult = await convertImageToPdf(doc.file);
          rawBuffer = await imageResult.pdfBlob.arrayBuffer();
          finalUrl = URL.createObjectURL(imageResult.pdfBlob);
        } else {
          rawBuffer = await doc.file.arrayBuffer();
          finalUrl = URL.createObjectURL(doc.file);
        }

        // Truyền bản sao slice(0) để worker không làm detached mảng rawBuffer gốc về 0 bytes
        const loadedPdf = await loadPdfDocument(rawBuffer.slice(0));

        // Ước lượng chiều rộng khả dụng của khung xem trước để tính toán anchor chuẩn xác
        const estimatedPreviewWidth =
          typeof window !== "undefined"
            ? Math.max(
                600,
                Math.min(
                  880,
                  window.innerWidth - (window.innerWidth >= 1024 ? 360 : 48),
                ),
              )
            : 800;

        const anchor = await detectSignAnchor(loadedPdf, {
          targetWidth: estimatedPreviewWidth,
        });

        // Lấy kích thước trang chuẩn từ PDF để khởi tạo tọa độ chính xác tuyệt đối
        const targetPage = await loadedPdf.getPage(anchor.pageIndex + 1);
        const targetVp = targetPage.getViewport({ scale: 1.0 });
        const defaultPositions = createDefaultPositions(
          anchor,
          targetVp.width,
          targetVp.height,
        );

        setPositions(defaultPositions);
        setPdfBytes(rawBuffer);
        setPdfUrl(finalUrl);
        setStep("uploaded");

        if (anchor.found) {
          toast.success(
            `Đã tự động xác định vị trí ký tại Trang ${anchor.pageIndex + 1} (${anchor.matchedText}).`,
            "Nhận Diện Vị Trí Ký",
          );
        } else {
          toast.info(
            `Đã tải lên tệp ${doc.fileName}. Đặt vị trí con dấu mặc định ở trang cuối. Bạn có thể chọn vị trí gợi ý bên trên hoặc kéo thả để căn chỉnh.`,
            "Tải Tệp Thành Công",
          );
        }
      } else {
        toast.error("Không tìm thấy tệp tài liệu hợp lệ để xử lý", "Lỗi Tệp");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Lỗi khi đọc file tài liệu";
      console.error("Lỗi nạp file:", err);
      toast.error(`Không thể xử lý tệp: ${msg}`, "Lỗi Nạp Tệp");
    }
  };

  // 2. Kéo thả di chuyển con dấu hoặc chữ ký (Đồng bộ cả tọa độ pixel lẫn tỷ lệ % chuẩn hóa)
  const handlePositionChange = (
    id: string,
    x: number,
    y: number,
    percentX?: number,
    percentY?: number,
    percentWidth?: number,
    percentHeight?: number,
  ) => {
    setPositions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              x,
              y,
              ...(percentX !== undefined ? { percentX } : {}),
              ...(percentY !== undefined ? { percentY } : {}),
              ...(percentWidth !== undefined ? { percentWidth } : {}),
              ...(percentHeight !== undefined ? { percentHeight } : {}),
            }
          : item,
      ),
    );
  };

  // 3. Ký số SmartCS: Validate mã kết quả 200 từ SmartCS
  const handleSignSmartCS = async () => {
    setIsSigning(true);
    try {
      if (!docInfo?.file) {
        throw new Error("Chưa có tệp tài liệu để thực hiện ký số");
      }
      const signResult = await signWithSmartCS(docInfo.file, positions);

      // Validate khi nào bên SmartCS đã ký được (status 200 & có chữ ký) thì mới hiển thị lên
      if (isSmartCsSignSuccess(signResult)) {
        const meta = toSignatureMeta(signResult);
        setSignatureMeta(meta);
        setStep("signed");
        toast.success(
          `Ký số SmartCS thành công! Chứng thư số ${signResult.serialNumber} (${signResult.issuer}). Đã hiển thị con dấu & chữ ký thật.`,
          "Ký Số Thành Công (Mã 200)",
        );
      } else {
        throw new Error(
          "Dịch vụ SmartCS phản hồi không thành công hoặc thiếu chữ ký",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối SmartCS";
      toast.error(`Ký số thất bại: ${msg}`, "Lỗi Ký Số");
    } finally {
      setIsSigning(false);
    }
  };

  // 4. Xuất file PDF hoàn chỉnh kèm con dấu và chữ ký thật
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const bufferToExport = pdfBytes;

      if (!bufferToExport) {
        throw new Error("Chưa có dữ liệu tệp PDF để xuất");
      }

      const signedPdfBlob = await exportPdfWithStamps({
        pdfBytes: bufferToExport,
        positions,
        stampImageUrl,
        signatureImageUrl,
        canvasSizes: canvasSizesRef.current,
      });

      // Tải tệp xuống máy
      const downloadUrl = URL.createObjectURL(signedPdfBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const baseName =
        docInfo?.fileName.replace(/\.[^/.]+$/, "") || "HoSo_DaKySo";
      a.download = `${baseName}_DaKySo.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success(
        `Đã xuất và tải xuống thành công tệp ${baseName}_DaKySo.pdf kèm con dấu và chữ ký.`,
        "Xuất File PDF",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xuất PDF";
      console.error("Lỗi export PDF:", err);
      toast.error(`Không thể xuất file: ${msg}`, "Lỗi Xuất File");
    } finally {
      setIsExporting(false);
    }
  };

  // 5. Gửi hồ sơ lên Cổng BHXH
  const handleSendBhxh = () => {
    toast.info("Chưa thêm chức năng gửi cổng BHXH.", "Gửi Cổng BHXH");
  };

  // 6. Đặt lại / tải tệp khác
  const handleReset = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setStep("empty");
    setDocInfo(null);
    setPdfBytes(null);
    setPositions([]);
    setSignatureMeta({
      signerName: "",
      signTime: "",
      certSerial: "",
      caProvider: "",
      bhxhCode: "",
    });
  };

  return {
    step,
    docInfo,
    pdfBytes,
    pdfUrl,
    positions,
    isSigning,
    isSending,
    isExporting,
    signatureMeta,
    canvasSizesRef,
    handleFileSelect,
    handlePositionChange,
    handleSignSmartCS,
    handleExportPdf,
    handleSendBhxh,
    handleReset,
  };
}

export type UseDocumentSigningReturn = ReturnType<typeof useDocumentSigning>;
