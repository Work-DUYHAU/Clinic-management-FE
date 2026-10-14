import React, { useState, useRef, useMemo } from "react";
import { FileSignature, Layers, Upload, ChevronRight } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useRegisterSignModal } from "../../context/SignModalContext";
import { XmlExportModal } from "../common/XmlExportModal";
import {
  TT25_DOC_DEFINITIONS,
  detectXmlDocType,
} from "../../utils/constants/tt25Constants";
import type { DocSignOptionType } from "../../types/tt25ChungTuTypes";
import { parseUniversalChungTuExcelFile } from "../../utils/tt25ExcelParser";
import {
  xmlToBase64,
  downloadXmlFile,
  DEFAULT_MA_CSKCB,
  isBhxhGatewaySuccess,
} from "../../utils/shared/excelXmlShared";
import { extractXmlSignature } from "../../utils/xmlDsigEngine";
import { sendBhxhChungTu2025WithBackend } from "../../services/api";

interface ChungTuPageProps {
  isActive?: boolean;
}

export const ChungTuPage: React.FC<ChungTuPageProps> = ({
  isActive = true,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetUploadType, setTargetUploadType] = useState<
    DocSignOptionType | "MULTI"
  >("MULTI");

  const [modalConfig, setModalConfig] = useState<{
    title: string;
    badge: string;
    code: string;
    fileName: string;
    xmlContent: string;
    preSignedXml?: string | null;
    itemsCount: number;
  }>({
    title: "Gói Hồ Sơ Chứng Từ TT25",
    badge: "TT 25",
    code: "39",
    fileName: `HSCHUNGTU_${DEFAULT_MA_CSKCB}.xml`,
    xmlContent: "",
    preSignedXml: null,
    itemsCount: 0,
  });

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"smartca" | "base64">("smartca");
  const [isSendingApi, setIsSendingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Nút [Ký Số] trên Navbar mở modal ký số tệp hiện tại
  useRegisterSignModal(isActive, () => {
    setIsSignModalOpen(true);
  });

  // Kích hoạt nạp tệp tổng hợp nhiều sheet
  const handleTriggerMultiSheetUpload = () => {
    setTargetUploadType("MULTI");
    fileInputRef.current?.click();
  };

  // Kích hoạt nạp tệp cho một mẫu cụ thể
  const handleTriggerDocUpload = (doc: (typeof TT25_DOC_DEFINITIONS)[0]) => {
    setTargetUploadType(doc.id);
    fileInputRef.current?.click();
  };

  // Xử lý khi người dùng chọn tệp từ máy tính
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setApiResponse(null);
    const fileNameLower = file.name.toLowerCase();
    try {
      if (fileNameLower.endsWith(".xml")) {
        const text = await file.text();
        const upper = text.toUpperCase();
        const fileHoSoCount = (upper.match(/<FILEHOSO>/g) || []).length;
        const isMultiPackage =
          upper.includes("<HSCHUNGTU>") && fileHoSoCount > 1;
        const detected = detectXmlDocType(text);
        const docDef = TT25_DOC_DEFINITIONS.find((d) => d.id === detected);
        const matchLoai = upper.match(/<LOAIHOSO>([^<]+)<\/LOAIHOSO>/);
        const loaiFromXml = matchLoai ? matchLoai[1].trim() : null;
        const resolvedCode = loaiFromXml || (docDef ? docDef.code : "39");

        const sigInfo = extractXmlSignature(text);
        const hasSignature = sigInfo.hasSignature;

        setModalConfig({
          title: isMultiPackage
            ? `Gói Hồ Sơ Tổng Hợp (${fileHoSoCount} chứng từ)`
            : docDef
              ? docDef.title
              : `Tệp XML ${file.name}`,
          badge: isMultiPackage ? "Tổng hợp" : docDef ? docDef.badge : "XML",
          code: resolvedCode,
          fileName: file.name,
          xmlContent: text,
          preSignedXml: hasSignature ? text : null,
          itemsCount: fileHoSoCount || 1,
        });

        if (hasSignature) {
          toast.success(
            `Đã nạp tệp XML (${sigInfo.signatureCount || 1} chữ ký điện tử hợp lệ): ${file.name}`,
            "Tệp Đã Có Chữ Ký Số",
          );
        } else {
          toast.success(`Đã nạp tệp XML: ${file.name}`, "Nạp Tệp Thành Công");
        }
        setIsSignModalOpen(true);
      } else if (
        fileNameLower.endsWith(".xlsx") ||
        fileNameLower.endsWith(".xls")
      ) {
        // Phân tích tệp Excel (hỗ trợ đọc cả file nhiều sheet hoặc file 1 sheet)
        const parseType =
          targetUploadType === "MULTI" ? "CURRENT" : targetUploadType;
        const res = await parseUniversalChungTuExcelFile(file, parseType);

        if (!res.success) {
          throw new Error(
            res.error || "Không nhận diện được cấu trúc tệp Excel",
          );
        }

        const isMulti =
          res.detectedType === "MULTI" || Object.keys(res.breakdown).length > 1;
        const docDef = TT25_DOC_DEFINITIONS.find(
          (d) => d.id === res.detectedType,
        );
        const breakdownKeys = Object.keys(res.breakdown);
        const singleDefFromBreakdown =
          breakdownKeys.length === 1
            ? TT25_DOC_DEFINITIONS.find((d) => d.id === breakdownKeys[0])
            : null;
        const derivedCode =
          docDef?.code || singleDefFromBreakdown?.code || "39";

        const xmlFileName = `${file.name.replace(/\.[^/.]+$/, "")}.xml`;

        setModalConfig({
          title: isMulti
            ? `Tệp Excel Tổng Hợp Nhiều Sheet (${res.totalRows} bản ghi)`
            : docDef?.title || `Hồ Sơ ${res.detectedType}`,
          badge: isMulti ? "Tổng hợp" : docDef?.badge || "Mẫu",
          code: derivedCode,
          fileName: xmlFileName,
          xmlContent: res.xmlPackage,
          itemsCount: res.totalRows,
        });

        const breakdownText = Object.entries(res.breakdown)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");

        toast.success(
          `Đã chuyển đổi ${res.totalRows} bản ghi ${breakdownText ? `(${breakdownText})` : ""} thành gói XML chuẩn`,
          "Chuyển Đổi Excel Thành Công",
        );
        setIsSignModalOpen(true);
      } else {
        throw new Error("Chỉ hỗ trợ tệp Excel (.xlsx, .xls) hoặc XML (.xml)");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi đọc tệp dữ liệu";
      toast.error(msg, "Lỗi Nạp Tệp");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const effectiveBase64 = useMemo(() => {
    return isSignModalOpen && modalConfig.xmlContent
      ? xmlToBase64(modalConfig.xmlContent)
      : "";
  }, [isSignModalOpen, modalConfig.xmlContent]);

  const handleExportXml = () => {
    if (!modalConfig.xmlContent) {
      toast.warning("Chưa có nội dung XML để tải xuống!", "Cảnh Báo");
      return;
    }
    downloadXmlFile(modalConfig.xmlContent, modalConfig.fileName);
    toast.success("Đã tải tệp XML thành công!", "Tải Tệp XML");
  };

  const handleSendApi = async (signaturePayload?: any) => {
    const fileBase64 =
      signaturePayload?.fileBase64 ||
      effectiveBase64 ||
      (modalConfig.xmlContent ? xmlToBase64(modalConfig.xmlContent) : "");
    if (!fileBase64) {
      toast.error(
        "Không tìm thấy nội dung tệp XML để gửi lên Cổng!",
        "Lỗi Dữ Liệu",
      );
      return;
    }

    setIsSendingApi(true);
    setApiResponse(null);
    try {
      const res = await sendBhxhChungTu2025WithBackend({
        fileBase64Str: fileBase64,
        loaiHs: modalConfig.code || "39",
      });

      const isSuccess = isBhxhGatewaySuccess(res);
      const formattedResponse = {
        maKetQua: String(res.maKetQua),
        maGiaoDich:
          res.maGiaoDich ||
          (isSuccess
            ? `GDCT_${DEFAULT_MA_CSKCB}_${Date.now().toString().slice(-6)}`
            : ""),
        thongDiep:
          res.ghiChu ||
          res.thongDiep ||
          (isSuccess
            ? "Tiếp nhận hồ sơ chứng từ điện tử thành công!"
            : `Cổng BHXH phản hồi mã: ${res.maKetQua}`),
        thoiGianTiepNhan: new Date().toLocaleString("vi-VN"),
      };

      setApiResponse(formattedResponse);

      if (isSuccess) {
        toast.success(
          `Gửi hồ sơ chứng từ điện tử thành công!\nMã giao dịch: ${formattedResponse.maGiaoDich}`,
          "Cổng Tiếp Nhận BHXH",
        );
      } else {
        toast.error(
          `Cổng BHXH từ chối tiếp nhận: ${formattedResponse.thongDiep}`,
          "Lỗi Gửi Cổng BHXH",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối Cổng BHXH";
      const errorResponse = {
        maKetQua: "500",
        maGiaoDich: "",
        thongDiep: msg,
        thoiGianTiepNhan: new Date().toLocaleString("vi-VN"),
      };
      setApiResponse(errorResponse);
      toast.error(msg, "Lỗi Gửi Cổng BHXH");
    } finally {
      setIsSendingApi(false);
    }
  };

  return (
    <div className="space-y-3 pb-1 antialiased select-none">
      {/* Ẩn input file dùng chung */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.xml"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* 1. Header Banner Gọn Gàng, Góc Cạnh */}
      <div className="bg-[#0f172a] rounded-md py-3 px-5 text-white shadow-sm flex items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
              Phân Hệ 3
            </span>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
              TT 25/2025/TT-BYT & QĐ 2025
            </span>
          </div>
          <h1 className="text-sm md:text-base font-bold tracking-tight flex items-center gap-2 text-white truncate">
            <FileSignature size={17} className="text-blue-400 flex-shrink-0" />
            <span>Hồ Sơ Chứng Từ &amp; Giấy Tờ Điện Tử</span>
          </h1>
        </div>

        {/* NÚT NỘP FILE TỔNG HỢP NHIỀU SHEET */}
        <button
          type="button"
          onClick={handleTriggerMultiSheetUpload}
          className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0 border border-blue-500/50"
          title="Nạp tệp Excel chứa nhiều Sheet chứng từ để ký số và gửi Cổng BHXH"
        >
          <Layers size={14} />
          <span>Nộp Tệp Tổng Hợp (Nhiều Sheet)</span>
        </button>
      </div>

      {/* Thông báo trạng thái tệp đang sẵn sàng nếu người dùng đóng modal */}
      {modalConfig.xmlContent && !isSignModalOpen && (
        <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-md flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-slate-900 truncate">
              Hồ sơ đã nạp sẵn sàng:{" "}
              <span className="font-semibold text-blue-800">
                {modalConfig.fileName}
              </span>{" "}
              ({modalConfig.itemsCount} chứng từ - Loại {modalConfig.code})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportXml}
              className="px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm font-bold text-[11px] cursor-pointer transition-colors"
            >
              Tải XML
            </button>
            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-bold text-[11px] cursor-pointer transition-colors shadow-xs"
            >
              Mở Cửa Sổ Ký &amp; Gửi Cổng
            </button>
          </div>
        </div>
      )}

      {/* 2. Tiêu đề khu vực danh mục 9 mẫu */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>Danh Mục 9 Biểu Mẫu Chứng Từ</span>
          <span className="text-[11px] text-slate-400 font-normal lowercase hidden sm:inline">
            (chọn mẫu để nạp tệp &amp; ký số)
          </span>
        </span>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm font-mono">
          9 Biểu Mẫu Chuẩn
        </span>
      </div>

      {/* 3. Lưới 9 mẫu chứng từ thiết kế góc cạnh, vững chãi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {TT25_DOC_DEFINITIONS.map((doc) => (
          <div
            key={doc.id}
            onClick={() => handleTriggerDocUpload(doc)}
            className="p-3 rounded-md border border-slate-200/90 hover:border-blue-500 bg-white hover:bg-blue-50/15 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700 font-mono">
                {doc.badge}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {doc.code}
              </span>
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {doc.title}
              </h4>
              <p className="text-[11px] text-slate-500 group-hover:text-slate-700 truncate mt-0.5 font-normal">
                {doc.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
              <span className="flex items-center gap-1 text-[10px]">
                <Upload size={11} /> Nạp tệp &amp; ký số
              </span>
              <ChevronRight
                size={12}
                className="text-slate-400 group-hover:text-blue-600 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Modal Ký Số & Gửi Cổng BHXH (KHÔNG CÒN DROPDOWN SELECT OPTION NỮA!) */}
      <XmlExportModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title={modalConfig.title}
        loaiHsBadge={modalConfig.badge}
        loaiHsCode={modalConfig.code}
        itemsCount={modalConfig.itemsCount}
        itemLabel="chứng từ"
        customFileName={modalConfig.fileName}
        xmlContent={modalConfig.xmlContent}
        initialSignedXml={modalConfig.preSignedXml}
        base64Content={effectiveBase64}
        tab={modalTab}
        onTabChange={setModalTab}
        onExportXml={handleExportXml}
        onSendApi={handleSendApi}
        isSendingApi={isSendingApi}
        apiResponse={apiResponse}
        onResetApiResponse={() => setApiResponse(null)}
      />
    </div>
  );
};
