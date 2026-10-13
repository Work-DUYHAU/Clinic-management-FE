import React, { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layout,
  Hand,
} from "lucide-react";
import { DraggableImage } from "./DraggableImage";
import { useToast } from "../../../context/ToastContext";
import { detectSignAnchor, createDefaultPositions } from "../utils/pdf";
import type { KyHoSoStep, SignaturePosition } from "../types";

// 1. Cấu hình worker được Vite tự động đóng gói từ node_modules
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// 2. Tùy chọn cố định BÊN NGOÀI component, không tạo mới mỗi lần render
const PDF_OPTIONS = {
  cMapUrl: "/cmaps/",
  cMapPacked: true,
};

interface PageMeta {
  isLandscape: boolean;
  originalWidth: number;
  originalHeight: number;
}

interface DocumentPreviewProps {
  step: KyHoSoStep;
  pdfUrl: string | null;
  positions: SignaturePosition[];
  onPositionsInit?: (positions: SignaturePosition[]) => void;
  onPositionChange: (
    id: string,
    x: number,
    y: number,
    percentX?: number,
    percentY?: number,
    percentWidth?: number,
    percentHeight?: number,
  ) => void;
  onPageRendered?: (pageIndex: number, width: number, height: number) => void;
  stampSrc?: string;
  signatureSrc?: string;
}

// Khóa chống quét trùng lặp ở cấp độ module (miễn nhiễm với React StrictMode remount)
let lastDetectedPdfUrl = "";
let lastDetectedPdfTime = 0;

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  step,
  pdfUrl,
  positions,
  onPositionsInit,
  onPositionChange,
  onPageRendered,
  stampSrc = "/assets/Mau_Dau_Trung_Tam.png",
  signatureSrc = "/assets/H-removebg-preview.png",
}) => {
  const toast = useToast();
  const isSigned = step === "signed" || step === "sent";

  // Quản lý đồng thời numPages và pagesInfo để render đúng khổ ngay frame đầu tiên, không bị giật nháy
  const [docState, setDocState] = useState<{
    numPages: number;
    pagesInfo: Record<number, PageMeta>;
  }>({
    numPages: 0,
    pagesInfo: {},
  });
  const { numPages, pagesInfo } = docState;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number | null>(null);

  // Guard ngăn chặn quét vị trí ký trùng lặp (tránh lặp toast khi React render 2 lần trong StrictMode)
  const detectedPdfUrlRef = useRef<string | null>(null);

  // Đặt lại trạng thái khi xóa tài liệu hoặc không còn pdfUrl
  useEffect(() => {
    if (!pdfUrl) {
      setDocState({ numPages: 0, pagesInfo: {} });
    }
    detectedPdfUrlRef.current = null;
  }, [pdfUrl]);

  // Trạng thái & tọa độ kéo di chuyển bàn tay (Pan / Drag-to-scroll giống Hồ sơ 09)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [scrollTopPos, setScrollTopPos] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Chỉ xử lý nút chuột trái
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    // Bỏ qua nếu nhấn vào nút bấm, ô nhập hoặc con dấu/chữ ký đang ở chế độ kéo thả
    if (
      target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.tagName === "SELECT" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("a") ||
      target.closest('[data-draggable-stamp="true"]')
    ) {
      return;
    }

    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setStartY(e.pageY - scrollContainerRef.current.offsetTop);
    setScrollLeftPos(scrollContainerRef.current.scrollLeft);
    setScrollTopPos(scrollContainerRef.current.scrollTop);
  }, []);

  const handleMouseLeaveOrUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const y = e.pageY - scrollContainerRef.current.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;
      scrollContainerRef.current.scrollLeft = scrollLeftPos - walkX;
      scrollContainerRef.current.scrollTop = scrollTopPos - walkY;
    },
    [isDragging, startX, startY, scrollLeftPos, scrollTopPos],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleResize = () => {
      if (el.clientWidth) {
        setContainerWidth(el.clientWidth);
      }
    };

    handleResize();

    const ro = new ResizeObserver(handleResize);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const handleDocumentLoadSuccess = useCallback(
    async (pdf: any) => {
      const infoMap: Record<number, PageMeta> = {};
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1.0 });
          infoMap[i] = {
            isLandscape: vp.width > vp.height,
            originalWidth: Math.round(vp.width),
            originalHeight: Math.round(vp.height),
          };
        } catch (err) {
          console.warn(`Không thể lấy thông tin trang ${i}:`, err);
        }
      }

      // Tự động nhận diện vị trí ký DUY NHẤT 1 LẦN cho mỗi tài liệu (chống lặp toast)
      const now = Date.now();
      const isRecentlyDetected =
        lastDetectedPdfUrl === pdfUrl && now - lastDetectedPdfTime < 4000;

      if (
        pdfUrl &&
        !isRecentlyDetected &&
        detectedPdfUrlRef.current !== pdfUrl &&
        positions.length === 0 &&
        onPositionsInit
      ) {
        lastDetectedPdfUrl = pdfUrl;
        lastDetectedPdfTime = now;
        detectedPdfUrlRef.current = pdfUrl;
        try {
          const targetWidth =
            scrollContainerRef.current?.clientWidth &&
            scrollContainerRef.current.clientWidth > 320
              ? scrollContainerRef.current.clientWidth - 48
              : 800;
          const anchor = await detectSignAnchor(pdf, { targetWidth });
          const targetPageNum = anchor.pageIndex + 1;
          const pageMeta = infoMap[targetPageNum] || infoMap[1];
          const defaultPositions = createDefaultPositions(
            anchor,
            pageMeta?.originalWidth || 842,
            pageMeta?.originalHeight || 595,
          );
          onPositionsInit(defaultPositions);

          if (anchor.found) {
            toast.success(
              `Đã tự động xác định vị trí ký tại Trang ${anchor.pageIndex + 1} (${anchor.matchedText}).`,
              "Nhận Diện Vị Trí Ký",
            );
          } else {
            toast.info(
              "Đặt vị trí con dấu mặc định ở góc phải trang cuối. Bạn có thể kéo thả để căn chỉnh.",
              "Vị Trí Ký Mặc Định",
            );
          }
        } catch (err) {
          console.warn("Lỗi nhận diện vị trí ký:", err);
        }
      }

      // Cập nhật đồng thời cả số trang và thông tin kích thước để render chuẩn ngay từ frame đầu tiên
      setDocState({
        numPages: pdf.numPages,
        pagesInfo: infoMap,
      });
    },
    [pdfUrl, positions.length, onPositionsInit, toast],
  );

  const hasLandscapePage = Object.values(pagesInfo).some((p) => p.isLandscape);

  const calculatePageWidth = (pageNum: number): number | undefined => {
    const meta = pagesInfo[pageNum];
    const availableWidth = containerWidth > 320 ? containerWidth - 48 : 800;

    if (zoomScale !== null) {
      const baseW = meta?.originalWidth || 595;
      return Math.round(baseW * zoomScale);
    }

    if (meta?.isLandscape) {
      return Math.floor(availableWidth);
    }

    const targetPortraitWidth = meta
      ? Math.round(meta.originalWidth * 1.25)
      : 760;
    return Math.min(availableWidth, targetPortraitWidth);
  };

  if (!pdfUrl) return null;

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none overflow-hidden">
      {/* THANH ĐIỀU KHIỂN XEM TRƯỚC VÀ THÔNG BÁO TỰ ĐỘNG CO DÃN */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-slate-200/90 shadow-2xs text-xs flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Layout size={14} className="text-blue-600" />
              <span>
                {hasLandscapePage
                  ? "Tài liệu khổ ngang (Landscape)"
                  : "Tài liệu khổ dọc (Portrait)"}
              </span>
            </span>

            {hasLandscapePage && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tự động vừa màn hình
              </span>
            )}

            {/* Gợi ý kéo bằng con trỏ bàn tay */}
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200"
              title="Nhấn giữ chuột trái để kéo di chuyển tài liệu giống bảng Hồ sơ 09"
            >
              <Hand size={12} className="text-blue-500" />
              <span>Kéo chuột để di chuyển</span>
            </span>
          </div>

          {/* Cụm nút phóng to / thu nhỏ / vừa màn hình */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomScale(null)}
              title="Tự động co vừa khung hiển thị"
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                zoomScale === null
                  ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Maximize2 size={12} />
              <span>Vừa khung</span>
            </button>

            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

            <button
              type="button"
              onClick={() =>
                setZoomScale((prev) => Math.max(0.6, (prev ?? 1.0) - 0.15))
              }
              title="Thu nhỏ"
              className="p-1 rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <ZoomOut size={14} />
            </button>

            <span className="text-[11px] text-slate-600 font-mono px-1 min-w-10 text-center">
              {zoomScale === null
                ? "Tự động"
                : `${Math.round(zoomScale * 100)}%`}
            </span>

            <button
              type="button"
              onClick={() =>
                setZoomScale((prev) => Math.min(2.0, (prev ?? 1.0) + 0.15))
              }
              title="Phóng to"
              className="p-1 rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <ZoomIn size={14} />
            </button>

            {zoomScale !== null && (
              <button
                type="button"
                onClick={() => setZoomScale(null)}
                title="Đặt lại vừa màn hình"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer ml-0.5"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        </div>

        {/* KHUNG CUỘN CHỨA TÀI LIỆU PDF (KÉO BÀN TAY DI CHUYỂN GIỐNG HỒ SƠ 09) */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={`flex-1 min-h-0 w-full overflow-x-auto overflow-y-auto p-4 md:p-6 pdf-scrollbar ${
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          title="Nhấn giữ chuột để kéo di chuyển tài liệu hoặc dùng con lăn chuột"
        >
          <div className="w-fit min-w-full flex flex-col items-center">
              <Document
                file={pdfUrl}
                options={PDF_OPTIONS}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={(err) => {
                  console.error("Lỗi khi nạp tệp PDF:", err);
                }}
                loading={
                  numPages === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-500">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">
                        Đang nạp và phân tích tệp tài liệu PDF...
                      </span>
                    </div>
                  ) : null
                }
                error={
                  <div className="bg-red-50 text-red-600 p-6 rounded-lg text-xs max-w-md text-center border border-red-200">
                    Không thể tải nội dung tệp PDF. Vui lòng kiểm tra lại định dạng
                    tệp.
                  </div>
                }
                className="flex flex-col items-center gap-6 w-full"
              >
          {Array.from({ length: numPages }, (_, idx) => {
            const pageNum = idx + 1;
            const pagePositions = positions.filter((p) => p.pageIndex === idx);
            const calculatedWidth = calculatePageWidth(pageNum) || 800;
            const meta = pagesInfo[pageNum];
            const aspectRatio =
              meta && meta.originalWidth > 0
                ? meta.originalHeight / meta.originalWidth
                : 0.707;
            const calculatedHeight = Math.round(calculatedWidth * aspectRatio);

            return (
              <div
                key={`react_pdf_page_${pageNum}`}
                ref={(el) => {
                  if (el && onPageRendered) {
                    onPageRendered(idx, el.clientWidth, el.clientHeight);
                  }
                }}
                className="relative bg-white shadow-xl rounded-sm border border-slate-300/80 overflow-hidden transition-all duration-150"
              >
                {/* Lớp hiển thị PDF từ react-pdf (Tự co giãn vừa khít width) */}
                <Page
                  pageNumber={pageNum}
                  width={calculatedWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="block"
                  onRenderSuccess={(page) => {
                    if (onPageRendered) {
                      onPageRendered(idx, page.width, page.height);
                    }
                  }}
                />

                {/* Lớp overlay chứa các vị trí con dấu và chữ ký có thể kéo thả (Bám chặt theo % khi zoom) */}
                <div className="absolute inset-0 pointer-events-none">
                  {pagePositions.map((pos) => {
                    const src =
                      isSigned && pos.imageSrc
                        ? pos.imageSrc
                        : pos.type === "stamp"
                          ? stampSrc
                          : signatureSrc;

                    // Tính tọa độ pixel hiển thị theo tỷ lệ phần trăm bất biến của trang hiện tại
                    const displayX =
                      pos.percentX !== undefined
                        ? Math.round(pos.percentX * calculatedWidth)
                        : pos.x;
                    const displayY =
                      pos.percentY !== undefined
                        ? Math.round(pos.percentY * calculatedHeight)
                        : pos.y;
                    const displayW =
                      pos.percentWidth !== undefined
                        ? Math.round(pos.percentWidth * calculatedWidth)
                        : pos.width;
                    const displayH =
                      pos.percentHeight !== undefined
                        ? Math.round(pos.percentHeight * calculatedHeight)
                        : pos.height;

                    return (
                      <DraggableImage
                        key={pos.id}
                        id={pos.id}
                        type={pos.type}
                        src={src}
                        x={displayX}
                        y={displayY}
                        width={displayW}
                        height={displayH}
                        disabled={isSigned}
                        isSigned={isSigned}
                        onChange={(id, newX, newY) => {
                          const newPercentX = Math.max(
                            0,
                            Math.min(
                              1 - displayW / calculatedWidth,
                              newX / calculatedWidth,
                            ),
                          );
                          const newPercentY = Math.max(
                            0,
                            Math.min(
                              1 - displayH / calculatedHeight,
                              newY / calculatedHeight,
                            ),
                          );
                          const newPercentW = displayW / calculatedWidth;
                          const newPercentH = displayH / calculatedHeight;

                          onPositionChange(
                            id,
                            newX,
                            newY,
                            newPercentX,
                            newPercentY,
                            newPercentW,
                            newPercentH,
                          );
                        }}
                      />
                    );
                  })}
                </div>

                {/* Huy hiệu số trang và kích thước ở góc dưới */}
                <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-500 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-sm border border-slate-200/80 font-mono shadow-xs pointer-events-none flex items-center gap-1.5">
                  {pagesInfo[pageNum]?.isLandscape && (
                    <span className="text-emerald-600 font-semibold">
                      Ngang
                    </span>
                  )}
                  <span>
                    Trang {pageNum} / {numPages}
                  </span>
                </div>
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  </div>
);
};
