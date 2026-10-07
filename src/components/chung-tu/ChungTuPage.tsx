import React, { useState, useRef, useMemo } from "react";
import {
  FileSignature,
  Layers,
  Upload,
  ChevronRight,
} from "lucide-react";
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
import { BhxhChungTuService } from "../../services/bhxh/bhxhChungTuService";

interface ChungTuPageProps {
  isActive?: boolean;
}

export const ChungTuPage: React.FC<ChungTuPageProps> = ({ isActive = true }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lưu loại chứng từ đang thao tác nạp tệp ("MULTI" hoặc ID cụ thể như "CT03", "CT07"...)
  const [targetUploadType, setTargetUploadType] = useState<DocSignOptionType | "MULTI">("MULTI");

  // State dữ liệu chuẩn bị ký số trong Modal
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    badge: string;
    code: string;
    fileName: string;
    xmlContent: string;
    itemsCount: number;
  }>({
    title: "Gói Hồ Sơ Chứng Từ TT25",
    badge: "TT 25",
    code: "39",
    fileName: `HSCHUNGTU_${DEFAULT_MA_CSKCB}.xml`,
    xmlContent: "",
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
        const isMultiPackage = upper.includes("<HSCHUNGTU>") && fileHoSoCount > 1;
        const detected = detectXmlDocType(text);
        const docDef = TT25_DOC_DEFINITIONS.find((d) => d.id === detected);
        const matchLoai = upper.match(/<LOAIHOSO>([^<]+)<\/LOAIHOSO>/);
        const loaiFromXml = matchLoai ? matchLoai[1].trim() : null;
        const resolvedCode = loaiFromXml || (docDef ? docDef.code : "39");

        setModalConfig({
          title: isMultiPackage
            ? `Gói Hồ Sơ Tổng Hợp (${fileHoSoCount} chứng từ)`
            : (docDef ? docDef.title : `Tệp XML ${file.name}`),
          badge: isMultiPackage ? "Tổng hợp" : (docDef ? docDef.badge : "XML"),
          code: resolvedCode,
          fileName: file.name,
          xmlContent: text,
          itemsCount: fileHoSoCount || 1,
        });

        toast.success(`Đã nạp tệp XML: ${file.name}`, "Nạp Tệp Thành Công");
        setIsSignModalOpen(true);
      } else if (fileNameLower.endsWith(".xlsx") || fileNameLower.endsWith(".xls")) {
        // Phân tích tệp Excel (hỗ trợ đọc cả file nhiều sheet hoặc file 1 sheet)
        const parseType = targetUploadType === "MULTI" ? "CURRENT" : targetUploadType;
        const res = await parseUniversalChungTuExcelFile(file, parseType);

        if (!res.success) {
          throw new Error(res.error || "Không nhận diện được cấu trúc tệp Excel");
        }

        const isMulti = res.detectedType === "MULTI" || Object.keys(res.breakdown).length > 1;
        const docDef = TT25_DOC_DEFINITIONS.find((d) => d.id === res.detectedType);
        const breakdownKeys = Object.keys(res.breakdown);
        const singleDefFromBreakdown =
          breakdownKeys.length === 1
            ? TT25_DOC_DEFINITIONS.find((d) => d.id === breakdownKeys[0])
            : null;
        const derivedCode = docDef?.code || singleDefFromBreakdown?.code || "39";

        const xmlFileName = `${file.name.replace(/\.[^/.]+$/, "")}.xml`;

        setModalConfig({
          title: isMulti
            ? `Tệp Excel Tổng Hợp Nhiều Sheet (${res.totalRows} bản ghi)`
            : (docDef?.title || `Hồ Sơ ${res.detectedType}`),
          badge: isMulti ? "Tổng hợp" : (docDef?.badge || "Mẫu"),
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
      toast.error("Không tìm thấy nội dung tệp XML để gửi lên Cổng!", "Lỗi Dữ Liệu");
      return;
    }

    setIsSendingApi(true);
    setApiResponse(null);
    try {
      const tokenRes = await BhxhChungTuService.takeToken();
      if (String(tokenRes.maKetQua) !== "200" || !tokenRes.apiToken) {
        throw new Error(
          tokenRes.thongDiep || "Không thể xác thực với Cổng Tiếp Nhận BHXH (Mã token thất bại)",
        );
      }

      const res = await BhxhChungTuService.guiHoSoChungTu2025({
        token: tokenRes.apiToken,
        fileBase64Str: fileBase64,
        loaiHs: modalConfig.code || "39",
      });

      const isSuccess = isBhxhGatewaySuccess(res);
      const formattedResponse = {
        maKetQua: String(res.maKetQua),
        maGiaoDich:
          res.maGiaoDich ||
          (isSuccess ? `GDCT_${DEFAULT_MA_CSKCB}_${Date.now().toString().slice(-6)}` : ""),
        thongDiep:
          res.ghiChu ||
          res.message ||
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

      {/* 1. Header Banner Siêu Gọn (Không chiếm chỗ, tích hợp nút nộp tệp nhiều sheet) */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-xl py-3 px-5 text-white shadow-md flex items-center justify-between gap-4 border border-indigo-800/40">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/25 text-indigo-300 border border-indigo-400/30">
              Phân Hệ 3
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Thông Tư 25/2025/TT-BYT & QĐ 2025
            </span>
          </div>
          <h1 className="text-sm md:text-base font-extrabold tracking-tight flex items-center gap-2 text-white truncate">
            <FileSignature size={18} className="text-indigo-400 flex-shrink-0" />
            <span>Hồ Sơ Chứng Từ & Giấy Tờ Điện Tử</span>
          </h1>
        </div>

        {/* NÚT NỘP FILE TỔNG HỢP NHIỀU SHEET */}
        <button
          type="button"
          onClick={handleTriggerMultiSheetUpload}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1677ff] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
          title="Nạp tệp Excel chứa nhiều Sheet chứng từ để ký số và gửi Cổng BHXH"
        >
          <Layers size={15} />
          <span>Nộp Tệp Tổng Hợp (Nhiều Sheet)</span>
        </button>
      </div>

      {/* Thông báo trạng thái tệp đang sẵn sàng nếu người dùng đóng modal */}
      {modalConfig.xmlContent && !isSignModalOpen && (
        <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-indigo-950 truncate">
              Hồ sơ đã nạp sẵn sàng:{" "}
              <span className="font-semibold text-indigo-800">
                {modalConfig.fileName}
              </span>{" "}
              ({modalConfig.itemsCount} chứng từ - Loại {modalConfig.code})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportXml}
              className="px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
            >
              Tải XML
            </button>
            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-colors shadow-xs"
            >
              Mở Cửa Sổ Ký & Gửi Cổng
            </button>
          </div>
        </div>
      )}

      {/* 2. Tiêu đề khu vực danh mục 9 mẫu */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>Danh Mục 9 Biểu Mẫu Chứng Từ</span>
          <span className="text-[11px] text-slate-400 font-normal lowercase hidden sm:inline">
            (chọn mẫu để nạp tệp & ký số)
          </span>
        </span>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
          9 Biểu Mẫu Chuẩn
        </span>
      </div>

      {/* 3. Lưới 9 mẫu chứng từ thiết kế siêu gọn (3 cột x 3 dòng, vừa vặn không scrollbar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {TT25_DOC_DEFINITIONS.map((doc) => (
          <div
            key={doc.id}
            onClick={() => handleTriggerDocUpload(doc)}
            className="p-3 rounded-xl border border-slate-200/90 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition-all cursor-pointer group flex flex-col justify-between gap-1.5 shadow-2xs hover:shadow-xs active:scale-98"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-slate-700">
                {doc.badge}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {doc.code}
              </span>
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-950 transition-colors truncate">
                {doc.title}
              </h4>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-600 truncate">
                {doc.desc}
              </p>
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-700">
              <span className="flex items-center gap-1 text-[10px]">
                <Upload size={11} /> Nạp tệp & ký số
              </span>
              <ChevronRight size={12} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
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
