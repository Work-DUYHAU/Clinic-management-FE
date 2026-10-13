import { PDFDocument } from "pdf-lib";
import type { SignaturePosition, SignAnchorTarget } from "../types";

export interface AnchorDetectionResult {
  found: boolean;
  pageIndex: number;
  canvasX: number;
  canvasY: number;
  percentX: number;
  percentY: number;
  matchedText: string;
  targets: SignAnchorTarget[];
  selectedTargetId?: string;
}

export async function detectSignAnchor(
  pdfDoc: any,
  scaleOrOptions: number | { targetWidth?: number } = 1.0,
): Promise<AnchorDetectionResult> {
  const numPages = pdfDoc.numPages;
  const discoveredTargets: SignAnchorTarget[] = [];

  // Quét từ trang cuối cùng trở về trước (ưu tiên trang cuối vì khối chữ ký luôn ở cuối tài liệu)
  for (let pageNum = numPages; pageNum >= 1; pageNum--) {
    const page = await pdfDoc.getPage(pageNum);
    const baseVp = page.getViewport({ scale: 1.0 });

    let canvasScale = 1.0;
    if (typeof scaleOrOptions === "number") {
      canvasScale = scaleOrOptions;
    } else {
      const targetWidth = scaleOrOptions.targetWidth || 800;
      canvasScale = Math.min(
        1.5,
        Math.max(0.6, (targetWidth - 16) / baseVp.width),
      );
    }

    const viewport = page.getViewport({ scale: canvasScale });
    const textContent = await page.getTextContent();

    interface TextItemWithCoord {
      text: string;
      cleanText: string;
      rawText: string;
      percentX: number;
      percentY: number;
      canvasX: number;
      canvasY: number;
      pdfX: number;
      pdfY: number;
    }

    const pageItems: TextItemWithCoord[] = [];

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const rawText = item.str.trim();
      if (!rawText) continue;

      const pdfX = item.transform[4];
      const pdfY = item.transform[5];
      const [canvasX, canvasY] = viewport.convertToViewportPoint(pdfX, pdfY);
      const percentX = canvasX / viewport.width;
      const percentY = canvasY / viewport.height;

      pageItems.push({
        text: rawText.toUpperCase(),
        cleanText: rawText.toUpperCase().replace(/\s+/g, " "),
        rawText,
        percentX,
        percentY,
        canvasX,
        canvasY,
        pdfX,
        pdfY,
      });
    }

    // 1. Kiểm tra xem trang có xuất hiện tiêu đề Cơ quan BHXH không để LOẠI TRỪ phần của BHXH
    const bhxhHeaderItem = pageItems.find(
      (it) =>
        it.text.includes("BẢO HIỂM XÃ HỘI") ||
        it.text.includes("CƠ QUAN BHXH") ||
        it.text.includes("BÊN B"),
    );

    // Nếu có khối BHXH, xác định ranh giới (thường X >= 0.48) để tuyệt đối không quét vào bên BHXH
    const bhxhBoundaryX = bhxhHeaderItem
      ? Math.min(0.52, bhxhHeaderItem.percentX - 0.05)
      : 1.0;

    // 2. Tìm kiếm DUY NHẤT các vị trí: THỦ TRƯỞNG ĐƠN VỊ và ĐẠI DIỆN CƠ SỞ KCB
    for (let i = 0; i < pageItems.length; i++) {
      const it = pageItems[i];
      const upper = it.text;

      // NẾU NẰM TRONG KHU VỰC CỦA CƠ QUAN BHXH THÌ BỎ QUA HOÀN TOÀN
      if (bhxhHeaderItem && it.percentX >= bhxhBoundaryX) {
        continue;
      }

      const isDongDauLabel =
        upper.includes("ĐÓNG DẤU") ||
        upper.includes("DONG DAU") ||
        upper.includes("ĐÓNG  DẤU");

      const isThuTruong =
        upper.includes("THỦ TRƯỞNG ĐƠN VỊ") ||
        upper.includes("THU TRUONG DON VI") ||
        upper.includes("THỦ TRƯỞNG") ||
        upper.includes("THU TRUONG") ||
        upper.includes("GIÁM ĐỐC") ||
        upper.includes("GIAM DOC");

      const isDaiDienKcb =
        upper.includes("ĐẠI DIỆN CƠ SỞ KCB") ||
        upper.includes("ĐẠI DIỆN CƠ SỞ KHÁM BỆNH") ||
        upper.includes("DAI DIEN CO SO KCB");

      // Nếu không phải trang cuối, chỉ xét text ở nửa dưới trang (percentY > 0.6)
      if (pageNum < numPages && it.percentY < 0.6) continue;

      if (isDongDauLabel || isThuTruong || isDaiDienKcb) {
        // Tìm họ tên người ký nằm bên dưới dòng này (trong phạm vi cùng cột X ± 0.08, delta Y từ 0.02 đến 0.16)
        let signerName = "";
        for (const other of pageItems) {
          const deltaX = Math.abs(other.percentX - it.percentX);
          const deltaY = other.percentY - it.percentY;
          if (deltaX < 0.1 && deltaY > 0.015 && deltaY < 0.16) {
            // Không lấy các dòng chú thích như (Ký, họ tên...)
            if (
              !other.text.includes("KÝ") &&
              !other.text.includes("HỌ TÊN") &&
              !other.text.includes("ĐÓNG DẤU") &&
              !other.text.includes("THỦ TRƯỞNG") &&
              !other.text.includes("GIÁM ĐỐC") &&
              !other.text.includes("ĐẠI DIỆN") &&
              other.rawText.length >= 3
            ) {
              signerName = other.rawText;
              break;
            }
          }
        }

        // Tạo nhãn: Chỉ thể hiện chức danh Thủ trưởng đơn vị / Đại diện cơ sở KCB
        let role = isDaiDienKcb
          ? "Đại diện cơ sở KCB"
          : isThuTruong
            ? "Thủ trưởng đơn vị"
            : "Thủ trưởng đơn vị";

        let label = signerName
          ? `🏢 ${role} (${signerName})`
          : `🏢 ${role}`;

        // Tránh trùng lặp target nếu cùng một cột (cùng X ± 0.08)
        const alreadyExists = discoveredTargets.some(
          (t) =>
            t.pageIndex === pageNum - 1 &&
            Math.abs(t.percentX - it.percentX) < 0.08,
        );

        if (!alreadyExists) {
          const targetY = isDongDauLabel
            ? it.percentY + 0.02
            : it.percentY + 0.04;

          discoveredTargets.push({
            id: `target_kcb_${pageNum}_${discoveredTargets.length}`,
            label,
            role,
            signerName: signerName || undefined,
            side: "kcb",
            pageIndex: pageNum - 1,
            percentX: Math.max(0.05, Math.min(0.92, it.percentX)),
            percentY: Math.max(0.05, Math.min(0.92, targetY)),
            canvasX: it.canvasX,
            canvasY: Math.round(it.canvasY + (isDongDauLabel ? 15 : 25)),
            matchedText: it.rawText,
            isPrimary: true,
          });
        }
      }
    }

    // Nếu đã tìm thấy ít nhất 1 target ở trang cuối, dừng quét
    if (discoveredTargets.length > 0) {
      break;
    }
  }

  // Thêm mục dự phòng chuẩn góc dưới bên phải trang cuối vào danh sách
  const lastPage = await pdfDoc.getPage(numPages);
  const lastVp = lastPage.getViewport({ scale: 1.0 });

  discoveredTargets.push({
    id: `target_fallback_corner`,
    label: `📍 Góc phải trang cuối (Góc chuẩn)`,
    role: "Thủ trưởng đơn vị",
    side: "default",
    pageIndex: numPages - 1,
    percentX: 0.72,
    percentY: 0.82,
    canvasX: Math.round(lastVp.width * 0.72),
    canvasY: Math.round(lastVp.height * 0.82),
    matchedText: "Góc dưới bên phải",
    isPrimary: discoveredTargets.length === 0,
  });

  const primaryTarget =
    discoveredTargets.find((t) => t.isPrimary && t.side === "kcb") ||
    discoveredTargets[0];

  return {
    found:
      discoveredTargets.length > 1 ||
      discoveredTargets[0].id !== "target_fallback_corner",
    pageIndex: primaryTarget.pageIndex,
    canvasX: primaryTarget.canvasX,
    canvasY: primaryTarget.canvasY,
    percentX: primaryTarget.percentX,
    percentY: primaryTarget.percentY,
    matchedText: primaryTarget.matchedText,
    targets: discoveredTargets,
    selectedTargetId: primaryTarget.id,
  };
}

export function createDefaultPositions(
  anchor: AnchorDetectionResult,
  baseWidth = 842,
  baseHeight = 595,
): SignaturePosition[] {
  // Con dấu tròn chuẩn cơ quan/y tế (~36mm ngoài đời thực): kích thước ~100px x 100px
  const stampWidth = 100;
  const stampHeight = 100;
  const stampPercentW = stampWidth / baseWidth;
  const stampPercentH = stampHeight / baseHeight;

  // Chữ ký chữ nhật: kích thước ~110px x 58px
  const signWidth = 110;
  const signHeight = 58;
  const signPercentW = signWidth / baseWidth;
  const signPercentH = signHeight / baseHeight;

  // Vị trí chữ ký: nằm ngay dưới chức danh (hoặc góc phải)
  const signPercentX = Math.min(0.85, Math.max(0.1, anchor.percentX));
  const signPercentY = Math.min(0.88, Math.max(0.1, anchor.percentY + 0.03));

  // Vị trí con dấu: nằm hơi chếch sang trái chức danh một chút, đóng đè lên 1/3 chữ ký chuẩn NĐ 30/2020
  const stampPercentX = Math.max(0.05, signPercentX - 0.04);
  const stampPercentY = Math.min(0.86, Math.max(0.05, signPercentY - 0.02));

  return [
    {
      id: "stamp_pos",
      pageIndex: anchor.pageIndex,
      type: "stamp",
      x: Math.round(stampPercentX * baseWidth),
      y: Math.round(stampPercentY * baseHeight),
      width: stampWidth,
      height: stampHeight,
      percentX: stampPercentX,
      percentY: stampPercentY,
      percentWidth: stampPercentW,
      percentHeight: stampPercentH,
    },
    {
      id: "sign_pos",
      pageIndex: anchor.pageIndex,
      type: "signature",
      x: Math.round(signPercentX * baseWidth),
      y: Math.round(signPercentY * baseHeight),
      width: signWidth,
      height: signHeight,
      percentX: signPercentX,
      percentY: signPercentY,
      percentWidth: signPercentW,
      percentHeight: signPercentH,
    },
  ];
}

export async function convertImageToPngBytes(
  imageSource: string | File | Blob,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    let objectUrlToRevoke: string | null = null;
    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      objectUrlToRevoke = URL.createObjectURL(imageSource);
      img.src = objectUrlToRevoke;
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Không thể khởi tạo Canvas 2D để xử lý hình ảnh");
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          if (!blob) {
            reject(new Error("Lỗi khi chuyển đổi định dạng ảnh"));
            return;
          }
          blob
            .arrayBuffer()
            .then((buf) => resolve(new Uint8Array(buf)))
            .catch(reject);
        }, "image/png");
      } catch (err) {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      reject(new Error("Không thể tải hoặc giải mã tệp hình ảnh"));
    };
  });
}

/**
 * Chuyển đổi tệp ảnh bất kỳ (PNG, JPG, WEBP, BMP, GIF,...) thành một tệp PDF chuẩn
 */
export async function convertImageToPdf(
  imageFile: File,
): Promise<{ pdfBlob: Blob; numPages: number }> {
  const pngBytes = await convertImageToPngBytes(imageFile);
  const pdfDoc = await PDFDocument.create();
  const embeddedImage = await pdfDoc.embedPng(pngBytes);
  const { width, height } = embeddedImage;

  // Tự động nhận diện khổ ngang (Landscape) hay khổ dọc (Portrait)
  const isLandscape = width > height;
  const page = isLandscape
    ? pdfDoc.addPage([841.89, 595.28]) // A4 Landscape
    : pdfDoc.addPage([595.28, 841.89]); // A4 Portrait

  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  // Căn chỉnh ảnh ở giữa trang với lề 24pt
  const margin = 24;
  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2;
  const scale = Math.min(maxW / width, maxH / height, 1.0);

  const drawW = width * scale;
  const drawH = height * scale;
  const drawX = (pageWidth - drawW) / 2;
  const drawY = (pageHeight - drawH) / 2;

  page.drawImage(embeddedImage, {
    x: drawX,
    y: drawY,
    width: drawW,
    height: drawH,
  });

  const pdfBytes = await pdfDoc.save();
  return {
    pdfBlob: new Blob([pdfBytes as unknown as BlobPart], {
      type: "application/pdf",
    }),
    numPages: 1,
  };
}

