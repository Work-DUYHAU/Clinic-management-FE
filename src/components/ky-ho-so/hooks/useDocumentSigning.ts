import { useState, useRef } from "react";
import { useToast } from "../../../context/ToastContext";
import { parseDocxAndConvertToPdf } from "../utils/docx";
import {
  signPdfWithBackend,
  sendBhxhGiayToDienTuWithBackend,
} from "../../../services/kySoBackendApi";

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

  // 1. Tải lên tệp hồ sơ (Chỉ cho phép PDF và DOCX. Ảnh chỉ dùng để đổi Con dấu / Chữ ký)
  const handleFileSelect = async (doc: KyHoSoDocInfo) => {
    try {
      if (doc.file) {
        const isDocx =
          doc.fileName.toLowerCase().endsWith(".docx") ||
          doc.fileType.includes("wordprocessingml") ||
          doc.fileType.includes("docx");

        const isPdf =
          doc.fileName.toLowerCase().endsWith(".pdf") ||
          doc.fileType.includes("pdf");

        const isImage =
          /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(doc.fileName) ||
          (doc.file.type.startsWith("image/") && doc.file.type !== "");

        if (isImage) {
          toast.warning(
            "Tệp hình ảnh (.png, .jpg, .jpeg...) chỉ dùng để tải lên Con dấu hoặc Chữ ký. Hồ sơ tài liệu cần ký chỉ chấp nhận tệp .pdf hoặc .docx!",
            "Chỉ Chấp Nhận PDF & DOCX",
          );
          return;
        }

        if (!isPdf && !isDocx) {
          toast.error(
            "Định dạng tệp không được hỗ trợ! Hồ sơ ký chỉ chấp nhận tệp .pdf hoặc .docx.",
            "Lỗi Định Dạng Tệp",
          );
          return;
        }

        if (doc.file.size > 25 * 1024 * 1024) {
          toast.error(
            "Dung lượng tệp vượt quá 25MB!",
            "Tệp Quá Lớn",
          );
          return;
        }

        setDocInfo(doc);

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
        } else {
          rawBuffer = await doc.file.arrayBuffer();
          finalUrl = URL.createObjectURL(doc.file);
        }

        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        setPositions([]);
        setSignatureMeta({
          signerName: "",
          signTime: "",
          certSerial: "",
          caProvider: "",
          bhxhCode: "",
        });
        setPdfBytes(rawBuffer);
        setPdfUrl(finalUrl);
        setStep("uploaded");
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

  const handlePositionsInit = (newPositions: SignaturePosition[]) => {
    setPositions(newPositions);
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

  // 3. Ký số SmartCA qua Backend (chuẩn Q2 + dán con dấu và chữ ký trực tiếp vào PDF)
  const handleSignSmartCS = async () => {
    setIsSigning(true);
    const startTime = Date.now();
    try {
      if (!docInfo?.file && !pdfBytes) {
        throw new Error("Chưa có tệp tài liệu để thực hiện ký số");
      }

      const bufferToSign = pdfBytes || (await docInfo!.file!.arrayBuffer());
      const pdfBlob = new Blob([bufferToSign], { type: "application/pdf" });
      const finalFileName =
        (docInfo?.fileName.replace(/\.[^/.]+$/, "") || "document") + ".pdf";

      toast.info("Đang gửi tài liệu lên hệ thống ký số SmartCA...", "Ký Số SmartCA");

      // Gọi Backend ký số và đóng dấu tập trung
      const signResult = await signPdfWithBackend({
        pdfBlobOrFile: pdfBlob,
        fileName: finalFileName,
        positions,
        stampImageUrl,
        signatureImageUrl,
      });

      // Đảm bảo thời gian hiển thị hiệu ứng ký số khoảng 1s như người dùng yêu cầu
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }

      if (signResult.success && signResult.signedPdfBase64) {
        // Chuyển đổi chuỗi signedPdfBase64 nhận từ Backend sang ArrayBuffer
        const binaryStr = atob(signResult.signedPdfBase64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const signedPdfArrayBuffer = bytes.buffer;

        // Khóa cố định snapshot hình ảnh con dấu & chữ ký ngay tại thời điểm ký vào từng vị trí
        // Giúp tài liệu đã ký không bao giờ bị đổi dấu khi người dùng tải ảnh mới lên
        setPositions((prev) =>
          prev.map((pos) => ({
            ...pos,
            imageSrc: pos.type === "stamp" ? stampImageUrl : signatureImageUrl,
          })),
        );

        // Lưu buffer PDF đã ký từ Backend để sẵn sàng xuất file
        setPdfBytes(signedPdfArrayBuffer);
        setSignatureMeta(signResult.meta);
        setStep("signed");

        toast.success(
          `Ký số SmartCA thành công! Chứng thư số ${signResult.meta.certSerial} (${signResult.meta.caProvider || "VNPT-CA"}). Đã đóng dấu & dán chữ ký thật vào PDF.`,
          "Ký Số Thành Công (Mã 200)",
        );
      } else {
        throw new Error(signResult.message || "Dịch vụ ký số phản hồi không thành công.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối ký số SmartCA";
      console.error("Lỗi ký số Backend:", err);
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

      // Tải trực tiếp tệp PDF đã được Backend ký và đóng dấu chuẩn
      const signedPdfBlob = new Blob([bufferToExport], {
        type: "application/pdf",
      });
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

  // 5. Gửi hồ sơ lên Cổng BHXH (Giấy tờ điện tử - Mã loại HS: 60)
  const handleSendBhxh = async () => {
    if (!pdfBytes) {
      toast.error("Chưa có tệp hồ sơ PDF đã ký để gửi lên Cổng BHXH", "Lỗi Dữ Liệu");
      return;
    }

    setIsSending(true);
    try {
      toast.info("Đang gửi Giấy tờ điện tử lên Cổng Tiếp Nhận BHXH...", "Gửi Cổng BHXH");

      const res = await sendBhxhGiayToDienTuWithBackend({
        pdfBlobOrFile: new Blob([pdfBytes], { type: "application/pdf" }),
        loaiHs: "60",
        maLienThong: signatureMeta.bhxhCode || `GD_${Date.now()}`,
      });

      if (res.success || String(res.maKetQua) === "200" || String(res.maKetQua) === "0") {
        setStep("sent");
        toast.success(
          `Gửi hồ sơ lên Cổng BHXH thành công!\nMã giao dịch: ${res.maGiaoDich || "Đã tiếp nhận"}`,
          "Cổng Tiếp Nhận BHXH",
        );
      } else {
        toast.error(
          `Cổng BHXH từ chối tiếp nhận (Mã ${res.maKetQua}): ${res.thongDiep || res.ghiChu || "Thất bại"}`,
          "Lỗi Gửi Cổng BHXH",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi gửi Cổng BHXH";
      console.error("Lỗi gửi BHXH:", err);
      toast.error(`Gửi Cổng BHXH thất bại: ${msg}`, "Lỗi Gửi Cổng BHXH");
    } finally {
      setIsSending(false);
    }
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
    handlePositionsInit,
    handlePositionChange,
    handleSignSmartCS,
    handleExportPdf,
    handleSendBhxh,
    handleReset,
  };
}

export type UseDocumentSigningReturn = ReturnType<typeof useDocumentSigning>;
