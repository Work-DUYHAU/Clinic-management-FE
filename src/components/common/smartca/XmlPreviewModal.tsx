import React, { useState, useMemo, useRef } from "react";
import { Check, Copy, XCircle, FileCode, Layers, User } from "lucide-react";

export interface XmlPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  xmlContent: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  isSigned?: boolean;
}

interface DecodedHoSoItem {
  index: number;
  loaiHoSo: string;
  decodedXml: string;
  hoTen?: string;
  identifier?: string;
}

function decodeBase64Utf8(base64Str: string): string {
  try {
    const binary = atob(base64Str.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return atob(base64Str.trim());
  }
}

export const XmlPreviewModal: React.FC<XmlPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  xmlContent,
  copiedKey,
  onCopy,
  isSigned = false,
}) => {
  const [activeTab, setActiveTab] = useState<"package" | "rawChild">(
    "rawChild",
  );
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(-1); // -1 = tất cả

  // Kéo ngang bằng chuột (Drag-to-scroll với con trỏ bàn tay)
  const xmlContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("select") ||
      target.closest("input") ||
      target.closest("a")
    ) {
      return;
    }
    if (!xmlContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - xmlContainerRef.current.offsetLeft);
    setScrollLeftPos(xmlContainerRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !xmlContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - xmlContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    xmlContainerRef.current.scrollLeft = scrollLeftPos - walk;
  };

  // Trích xuất và giải mã toàn bộ các FILEHOSO (trước khi băm Base64)
  const decodedFiles = useMemo<DecodedHoSoItem[]>(() => {
    if (!xmlContent || !xmlContent.includes("<NOIDUNGFILE>")) return [];

    const items: DecodedHoSoItem[] = [];
    const regex =
      /<FILEHOSO>[\s\S]*?<LOAIHOSO>(.*?)<\/LOAIHOSO>[\s\S]*?<NOIDUNGFILE>([\s\S]*?)<\/NOIDUNGFILE>[\s\S]*?<\/FILEHOSO>/g;

    let match: RegExpExecArray | null;
    let idx = 1;
    while ((match = regex.exec(xmlContent)) !== null) {
      const loaiHoSo = match[1]?.trim() || "CHUNGTU";
      const rawBase64 = match[2]?.trim() || "";
      const decodedXml = decodeBase64Utf8(rawBase64);

      const hoTenMatch =
        decodedXml.match(/<HO_TEN>(.*?)<\/HO_TEN>/i) ||
        decodedXml.match(/<HOTEN_NND>(.*?)<\/HOTEN_NND>/i) ||
        decodedXml.match(/<TEN_CON>(.*?)<\/TEN_CON>/i);
      const idMatch = decodedXml.match(
        /<(?:SO_LUU_TRU|MA_CT|SO_SERI|MA_YTE|MA_GBT|MA_BN|MA_HSBA)>(.*?)<\/(?:SO_LUU_TRU|MA_CT|SO_SERI|MA_YTE|MA_GBT|MA_BN|MA_HSBA)>/i,
      );

      const displayLoaiHoSo =
        loaiHoSo === "60"
          ? "60 - Giấy Báo Tử"
          : loaiHoSo === "61"
            ? "61 - Giấy Chứng Sinh"
            : loaiHoSo;

      items.push({
        index: idx++,
        loaiHoSo: displayLoaiHoSo,
        decodedXml,
        hoTen: hoTenMatch ? hoTenMatch[1] : undefined,
        identifier: idMatch ? idMatch[1] : undefined,
      });
    }

    return items;
  }, [xmlContent]);

  // Nếu có file con, mặc định ưu tiên mở tab xem XML gốc trước Base64
  const hasBase64Files = decodedFiles.length > 0;

  // Nội dung XML đang hiển thị
  const currentDisplayXml = useMemo(() => {
    if (!hasBase64Files || activeTab === "package") {
      return xmlContent;
    }
    if (selectedChildIndex >= 0 && decodedFiles[selectedChildIndex]) {
      return decodedFiles[selectedChildIndex].decodedXml;
    }
    // Hiển thị tất cả chứng từ ghép lại
    return decodedFiles
      .map(
        (f) =>
          `<!-- ========================================== -->\n<!-- HỒ SƠ #${f.index}: [${f.loaiHoSo}] ${f.hoTen || ""} ${f.identifier ? `(${f.identifier})` : ""} -->\n<!-- ========================================== -->\n${f.decodedXml}`,
      )
      .join("\n\n");
  }, [hasBase64Files, activeTab, selectedChildIndex, decodedFiles, xmlContent]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-md w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Xem Trước XML */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0 ${
                isSigned ? "bg-emerald-400" : "bg-blue-400"
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate font-mono">
                  {fileName}
                </h4>
                {isSigned && (
                  <span className="px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0">
                    Đã Ký Số
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {hasBase64Files && activeTab === "rawChild"
                  ? `XML Gốc Trước Base64: ${decodedFiles.length} chứng từ chi tiết`
                  : `Dung lượng: ${(xmlContent.length / 1024).toFixed(1)} KB (${xmlContent.length} ký tự)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(currentDisplayXml, "modalPreviewXml")}
              className="px-3 py-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copiedKey === "modalPreviewXml" ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>Đã Sao Chép</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Sao Chép XML</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
              title="Đóng xem trước"
            >
              <XCircle size={18} />
            </button>
          </div>
        </div>

        {/* Thanh chuyển đổi Tab khi có chứa các file băm Base64 */}
        {hasBase64Files && (
          <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-sm border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("rawChild")}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "rawChild"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FileCode size={13} />
                <span>XML Gốc Trước Khi Băm Base64</span>
                <span className="px-1.5 py-0.2 rounded-sm bg-blue-500/30 text-blue-200 text-[10px]">
                  {decodedFiles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("package")}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "package"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Layers size={13} />
                <span>Gói Ký Số Tổng Hợp (&lt;HSCHUNGTU&gt;)</span>
              </button>
            </div>

            {/* Selector chọn từng bệnh nhân / chứng từ con khi ở tab XML Gốc */}
            {activeTab === "rawChild" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline flex-items-center gap-1">
                  <User size={12} className="inline mr-1" />
                  Xem bệnh nhân:
                </span>
                <select
                  value={selectedChildIndex}
                  onChange={(e) =>
                    setSelectedChildIndex(Number(e.target.value))
                  }
                  className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-sm text-xs font-mono text-emerald-300 focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[260px] truncate"
                >
                  <option value={-1}>
                    Toàn bộ {decodedFiles.length} hồ sơ
                  </option>
                  {decodedFiles.map((f, i) => (
                    <option key={i} value={i}>
                      #{f.index}: [{f.loaiHoSo}] {f.hoTen ? f.hoTen : ""}{" "}
                      {f.identifier ? `(${f.identifier})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Code XML Body (Kéo ngang con trỏ bàn tay + Scrollbar rõ nét) */}
        <div
          ref={xmlContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={`p-4 overflow-y-auto overflow-x-auto flex-1 bg-slate-950 max-h-[62vh] dark-code-scrollbar ${
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          title="Nhấn giữ chuột để kéo ngang xem XML hoặc kéo thanh cuộn bên dưới"
        >
          <pre
            className={`text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre inline-block min-w-full ${
              isDragging ? "pointer-events-none select-none" : "select-all"
            }`}
          >
            {currentDisplayXml}
          </pre>
        </div>

        {/* Footer Modal Xem Trước XML */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {hasBase64Files && activeTab === "rawChild"
                ? "Hiển thị nội dung XML thuần (đã giải mã thẻ <NOIDUNGFILE>) để rà soát chi tiết dữ liệu lâm sàng"
                : isSigned
                  ? "Tài liệu XML đã được đóng gói chữ ký số W3C XMLDSig (<Signature>)"
                  : "Cấu trúc XML chuẩn Thông tư 25/2025/TT-BYT & QĐ 130"}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (🖐 Kéo chuột ngang hoặc dùng thanh cuộn)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
