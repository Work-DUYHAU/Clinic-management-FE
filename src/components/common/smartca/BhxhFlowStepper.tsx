import React from "react";
import {
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Check,
  Copy,
  Download,
  RotateCcw,
  ExternalLink,
  FileCheck,
  CheckCircle2Icon,
} from "lucide-react";
import { useClipboard } from "../../../hooks/useClipboard";
import type { ExtractedSignatureInfo } from "../../../utils/xmlDsigEngine";
import { isBhxhGatewaySuccess } from "../../../utils/shared/excelXmlShared";

export interface BhxhFlowStepperProps {
  /** Hồ sơ đã có chữ ký số hợp lệ */
  isSigned: boolean;
  /** Đang trong tiến trình ký số (Q1/Q2) */
  isSigning: boolean;
  /** Đang gửi gói tin lên Cổng BHXH */
  isSendingApi: boolean;
  /** Kết quả phản hồi thực tế từ Cổng BHXH */
  apiResponse: any;
  /** Số lượng bản ghi thực tế */
  itemsCount?: number;
  itemLabel?: string;
  /** Tên tệp XML thực tế */
  fileName?: string;
  /** Đã nạp tệp XML / Excel tùy chỉnh từ máy tính */
  hasCustomUploadedFile?: boolean;
  /** Thông tin chữ ký số thực tế trích xuất từ XML */
  signatureInfo?: ExtractedSignatureInfo;
  /** Callback gửi lại lên Cổng BHXH */
  onResendApi?: () => void;
  /** Callback tải tệp XML đã ký */
  onDownloadSignedXml?: () => void;
  /** Callback làm mới/ký lại từ đầu */
  onResetAll?: () => void;
}

type StepState =
  | "completed"
  | "active"
  | "ready"
  | "warning"
  | "error"
  | "pending";

const STEP_STYLES: Record<
  StepState,
  { circle: string; title: string; line: string }
> = {
  completed: {
    circle: "bg-emerald-500 text-white shadow-2xs",
    title: "text-slate-800 font-bold",
    line: "bg-emerald-500",
  },
  active: {
    circle:
      "bg-blue-600 text-white shadow-xs animate-pulse ring-4 ring-blue-100",
    title: "text-blue-700 font-bold",
    line: "bg-blue-500",
  },
  ready: {
    circle: "bg-amber-500 text-white shadow-2xs ring-4 ring-amber-50",
    title: "text-slate-800 font-bold",
    line: "bg-slate-200",
  },
  warning: {
    circle: "bg-amber-600 text-white shadow-2xs ring-4 ring-amber-50",
    title: "text-amber-700 font-bold",
    line: "bg-amber-500",
  },
  error: {
    circle: "bg-rose-600 text-white shadow-xs ring-4 ring-rose-100",
    title: "text-rose-700 font-bold",
    line: "bg-rose-500",
  },
  pending: {
    circle: "bg-white border-2 border-slate-200 text-slate-400",
    title: "text-slate-600 font-semibold",
    line: "bg-slate-200",
  },
};

export const BhxhFlowStepper: React.FC<BhxhFlowStepperProps> = ({
  isSigned,
  isSigning,
  isSendingApi,
  apiResponse,
  itemsCount = 0,
  itemLabel = "bản ghi",
  fileName,
  hasCustomUploadedFile = false,
  signatureInfo: _signatureInfo,
  onResendApi,
  onDownloadSignedXml,
  onResetAll,
}) => {
  const { isKeyCopied, copy } = useClipboard();

  // 1. Phân tích dữ liệu phản hồi THỰC TẾ từ Cổng BHXH (Tuyệt đối không làm cứng)
  const hasApiResponse = Boolean(apiResponse);
  const rawMaKetQua =
    apiResponse?.maKetQua != null
      ? String(apiResponse.maKetQua)
      : apiResponse?.code != null
        ? String(apiResponse.code)
        : null;
  const isApiSuccess = isBhxhGatewaySuccess(apiResponse);

  const maGiaoDich =
    apiResponse?.maGiaoDich ||
    apiResponse?.MaGiaoDich ||
    apiResponse?.data?.maGiaoDich ||
    apiResponse?.data?.MaGiaoDich ||
    "";

  const thoiGianTiepNhan =
    apiResponse?.thoiGianTiepNhan ||
    apiResponse?.ThoiGianTiepNhan ||
    apiResponse?.thoiGianNhan ||
    apiResponse?.data?.thoiGianTiepNhan ||
    apiResponse?.data?.thoiGianNhan ||
    "";

  const thongDiep =
    apiResponse?.thongDiep ||
    apiResponse?.ghiChu ||
    apiResponse?.message ||
    apiResponse?.data?.thongDiep ||
    apiResponse?.data?.ghiChu ||
    (hasApiResponse
      ? isApiSuccess
        ? "Cổng BHXH đã tiếp nhận dữ liệu thành công"
        : `Cổng BHXH từ chối tiếp nhận (Mã: ${rawMaKetQua || "N/A"})`
      : "");

  const kyQT = apiResponse?.kyQT || "";
  const loaiHs = apiResponse?.loaiHs || "";
  const responseTotalRecords =
    apiResponse?.totalRecords != null
      ? Number(apiResponse.totalRecords)
      : itemsCount;
  const soHoSo = apiResponse?.soHoSo || "";

  // 2. Trạng thái các bước theo DỮ LIỆU THỰC TẾ
  const isStep3Done = hasApiResponse;
  const isStep4Done = hasApiResponse && isApiSuccess;
  const isStep4Error = hasApiResponse && !isApiSuccess;
  const isStep1Done =
    (itemsCount != null && itemsCount > 0) ||
    Boolean(hasCustomUploadedFile) ||
    isStep3Done;
  const isStep2Done = Boolean(isSigned) || isStep3Done;
  const isStep2Active = Boolean(isSigning) && !isStep3Done;
  const isStep3Active = isSendingApi && !hasApiResponse;
  const isStep4Active = isSendingApi && !hasApiResponse;

  const steps: Array<{
    step: number;
    title: string;
    subtext: string;
    state: StepState;
    icon: React.ReactNode;
  }> = [
    {
      step: 1,
      title: "Lập Hồ Sơ",
      subtext: isStep1Done ? "Đã có tệp" : "",
      state: isStep1Done ? "completed" : "pending",
      icon: isStep1Done ? (
        <Check size={18} strokeWidth={2.5} />
      ) : (
        <FileCheck size={18} />
      ),
    },
    {
      step: 2,
      title: "Ký SmartCA",
      subtext: isStep2Done ? "Đã ký số" : isStep2Active ? "Đang ký..." : "",
      state: isStep2Done ? "completed" : isStep2Active ? "active" : "pending",
      icon: isStep2Done ? (
        <Check size={18} strokeWidth={2.5} />
      ) : isStep2Active ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <ShieldCheck size={18} />
      ),
    },
    {
      step: 3,
      title: "Gửi BHXH",
      subtext: isStep3Done ? "Đã gửi" : isStep3Active ? "Đang gửi..." : "",
      state: isStep3Done
        ? "completed"
        : isStep3Active
          ? "active"
          : isStep2Done
            ? "ready"
            : "pending",
      icon: isStep3Done ? (
        <Check size={18} strokeWidth={2.5} />
      ) : isStep3Active ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Send size={16} />
      ),
    },
    {
      step: 4,
      title: "Tiếp Nhận",
      subtext: isStep4Done
        ? "Thành công"
        : isStep4Error
          ? "Chưa tiếp nhận"
          : isStep4Active
            ? "Đang xử lý..."
            : "",
      state: isStep4Done
        ? "completed"
        : isStep4Error
          ? "error"
          : isStep4Active
            ? "active"
            : "pending",
      icon: isStep4Done ? (
        <Check size={18} strokeWidth={2.5} />
      ) : isStep4Error ? (
        <AlertTriangle size={18} />
      ) : isStep4Active ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <CheckCircle2Icon size={18} />
      ),
    },
  ];

  // 3. Danh sách thông tin chi tiết thực tế của gói phản hồi
  const infoItems = [
    maGiaoDich
      ? {
          label: "Mã Giao Dịch Tiếp Nhận",
          value: maGiaoDich,
          isMono: true,
          highlight: "blue",
          isCopyable: true,
          copyKey: "maGd",
          span: "sm:col-span-2 lg:col-span-1",
        }
      : null,
    thoiGianTiepNhan
      ? {
          label: "Thời Gian Tiếp Nhận",
          value: thoiGianTiepNhan,
          span: "col-span-1",
        }
      : null,
    fileName
      ? {
          label: "Tệp Hồ Sơ Đã Gửi",
          value: fileName,
          isMono: true,
          isTruncate: true,
          span: "col-span-1",
        }
      : null,
    kyQT
      ? {
          label: "Kỳ Quyết Toán",
          value:
            kyQT.length === 6 ? `${kyQT.slice(4)}/${kyQT.slice(0, 4)}` : kyQT,
          span: "col-span-1",
        }
      : null,
    responseTotalRecords > 0
      ? {
          label: "Số Bản Ghi Tiếp Nhận",
          value: `${responseTotalRecords} ${itemLabel}`,
          span: "col-span-1",
        }
      : null,
    soHoSo
      ? {
          label: "Số Hồ Sơ",
          value: soHoSo,
          isMono: true,
          highlight: "emerald",
          span: "col-span-1",
        }
      : null,
    loaiHs
      ? { label: "Loại Hồ Sơ", value: `Loại ${loaiHs}`, span: "col-span-1" }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    isMono?: boolean;
    isTruncate?: boolean;
    highlight?: "blue" | "emerald";
    isCopyable?: boolean;
    copyKey?: string;
    span?: string;
  }>;

  return (
    <div className="space-y-4">
      {/* Khung Stepper chuẩn theo hình ảnh giao diện */}
      <div className="bg-white border border-slate-200/90 rounded-md p-4 sm:p-5 shadow-2xs select-none">
        <div className="flex items-start">
          {steps.map((st, idx) => {
            const style = STEP_STYLES[st.state];
            const isFirst = idx === 0;
            const isLast = idx === steps.length - 1;
            const nextStep = steps[idx + 1];
            const isLineToThisDone =
              st.state === "completed" || st.state === "active";
            const isLineToNextDone =
              nextStep &&
              (nextStep.state === "completed" ||
                nextStep.state === "active" ||
                nextStep.state === "warning" ||
                nextStep.state === "error");

            return (
              <div
                key={st.step}
                className="flex-1 relative flex flex-col items-center text-center"
              >
                {/* Đường kẻ ngang nửa trái */}
                {!isFirst && (
                  <div
                    className={`absolute top-4 sm:top-5 right-1/2 left-0 h-[2px] -translate-y-1/2 z-0 transition-all duration-300 ${
                      st.state === "error"
                        ? "bg-rose-400"
                        : isLineToThisDone
                          ? "bg-emerald-500"
                          : "bg-slate-200"
                    }`}
                  />
                )}
                {/* Đường kẻ ngang nửa phải */}
                {!isLast && (
                  <div
                    className={`absolute top-4 sm:top-5 left-1/2 right-0 h-[2px] -translate-y-1/2 z-0 transition-all duration-300 ${
                      nextStep?.state === "error"
                        ? "bg-rose-400"
                        : isLineToNextDone
                          ? "bg-emerald-500"
                          : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Circle biểu tượng */}
                <div
                  className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${style.circle}`}
                >
                  {st.icon}
                </div>

                {/* Tên bước & phụ đề bên dưới */}
                <div className="mt-2 text-center px-1">
                  <div
                    className={`text-xs sm:text-sm font-semibold tracking-tight transition-colors ${style.title}`}
                  >
                    {st.title}
                  </div>
                  {st.subtext && (
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      {st.subtext}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isSendingApi && !hasApiResponse && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3.5 animate-fadeIn">
          <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Loader2 size={20} className="animate-spin" />
          </div>
          <div>
            <h5 className="text-xs sm:text-sm font-extrabold text-blue-950">
              Đang Chuyển Phát Hồ Sơ Lên Cổng Tiếp Nhận BHXH...
            </h5>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Hồ sơ đã được ký số hợp lệ và đang được gửi qua API Cổng Giám Định
              BHYT. Vui lòng giữ cửa sổ!
            </p>
          </div>
        </div>
      )}

      {hasApiResponse && (
        <div
          className={`p-4 sm:p-5 rounded-md border transition-all animate-fadeIn space-y-4 shadow-2xs ${
            isApiSuccess
              ? "bg-emerald-50/70 border-emerald-300"
              : "bg-rose-50/70 border-rose-300"
          }`}
        >
          {/* Header kết quả */}
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center text-white shrink-0 ${
                  isApiSuccess ? "bg-emerald-600" : "bg-rose-600"
                }`}
              >
                {isApiSuccess ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className={`text-sm font-black ${
                      isApiSuccess ? "text-emerald-950" : "text-rose-950"
                    }`}
                  >
                    {isApiSuccess
                      ? "CỔNG BHXH TIẾP NHẬN HỒ SƠ THÀNH CÔNG"
                      : "CỔNG BHXH CHƯA TIẾP NHẬN ĐƯỢC HỒ SƠ"}
                  </h4>
                  {rawMaKetQua && (
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${
                        isApiSuccess
                          ? "bg-emerald-200/80 text-emerald-900 border border-emerald-300"
                          : "bg-rose-200/80 text-rose-900 border border-rose-300"
                      }`}
                    >
                      Mã KQ: {rawMaKetQua}
                    </span>
                  )}
                </div>
                {thongDiep && (
                  <p
                    className={`text-xs mt-0.5 ${
                      isApiSuccess ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {thongDiep}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onDownloadSignedXml && isSigned && (
                <button
                  type="button"
                  onClick={onDownloadSignedXml}
                  className="px-3 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download size={13} />
                  <span>Tải XML Đã Ký</span>
                </button>
              )}
              {onResendApi && (
                <button
                  type="button"
                  onClick={onResendApi}
                  disabled={isSendingApi}
                  className="px-3 py-1.5 rounded-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <RotateCcw size={13} />
                  <span>Gửi Lại</span>
                </button>
              )}
              {onResetAll && (
                <button
                  type="button"
                  onClick={onResetAll}
                  className="px-3 py-1.5 rounded-sm bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <span>Làm Mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid thông tin tiếp nhận THỰC TẾ */}
          {infoItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {infoItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 bg-white rounded-sm border border-slate-200 shadow-2xs flex items-center justify-between ${
                    item.span || ""
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {item.label}
                    </div>
                    <div
                      className={`text-xs font-semibold ${item.isMono ? "font-mono font-bold" : ""} ${
                        item.highlight === "blue"
                          ? "text-blue-700"
                          : item.highlight === "emerald"
                            ? "text-emerald-700"
                            : "text-slate-800"
                      } ${item.isTruncate ? "truncate" : "break-all"} select-all`}
                      title={item.value}
                    >
                      {item.value}
                    </div>
                  </div>
                  {item.isCopyable && item.copyKey && (
                    <button
                      type="button"
                      onClick={() =>
                        copy(
                          item.value,
                          `Đã sao chép ${item.label.toLowerCase()}!`,
                          item.copyKey,
                        )
                      }
                      className="p-1.5 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
                      title={`Sao chép ${item.label}`}
                    >
                      {isKeyCopied(item.copyKey) ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Chi tiết JSON phản hồi THỰC TẾ từ Cổng BHXH (Để đối soát kỹ thuật) */}
          <details className="text-[11px] text-slate-600">
            <summary className="cursor-pointer font-bold hover:text-slate-900 select-none flex items-center gap-1.5 py-1">
              <ExternalLink size={12} />
              <span>Xem chi tiết gói phản hồi JSON thực tế từ Cổng BHXH</span>
            </summary>
            <pre className="mt-2 p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[10px] overflow-x-auto select-text border border-slate-800 max-h-48">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};
