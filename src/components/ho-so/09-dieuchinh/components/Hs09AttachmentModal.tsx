import React, { useState, useMemo } from "react";
import {
  Paperclip,
  FileText,
  Trash2,
  Download,
  AlertCircle,
} from "lucide-react";
import type {
  HoSoDieuChinh09Item,
  TaiLieuDinhKemItem,
} from "../../../../types/hs09DieuChinhTypes";
import { useToast } from "../../../../context/ToastContext";
import { Button, IconButton, Modal, Select } from "../../../../shared/components";
import {
  validateAttachmentFile,
  readFileAsDataUrl,
} from "../../../../utils/hs09Helpers";
import { useModalBehavior } from "../../../../hooks/useModalBehavior";

interface Hs09AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HoSoDieuChinh09Item | null;
  onSave: (updatedItem: HoSoDieuChinh09Item) => void;
}

export const Hs09AttachmentModal: React.FC<Hs09AttachmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  useModalBehavior(isOpen, onClose);
  const toast = useToast();

  const [selectedMaLyDo, setSelectedMaLyDo] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Extract unique refusal codes from chi phí or default reasons
  const availableReasons = useMemo(() => {
    if (!item) return ["LD_XUATTOAN_CHUNG", "LD_CHI_PHI_SAI_QUY_DINH", "LD_KHAC"];
    const reasons = Array.from(
      new Set(
        item.dsChiPhiDieuChinh
          .map((cp) => cp.tuChoi)
          .filter((code): code is string => !!code && code.trim().length > 0),
      ),
    );
    if (reasons.length === 0) {
      reasons.push(
        "LD_XUATTOAN_CHUNG",
        "LD_CHI_PHI_SAI_QUY_DINH",
        "LD_KHAC",
      );
    }
    return reasons;
  }, [item]);

  const normalizedAttachments: TaiLieuDinhKemItem[] = useMemo(() => {
    if (!item) return [];
    const rawAttachments = item.taiLieuDinhKem || [];
    return rawAttachments.map((att) => {
      if (typeof att === "string") {
        return {
          tenFile: att,
          maLyDo: availableReasons[0] || "LD_CHUNG",
          kichThuoc: 1024 * 100,
          ngayTao: new Date().toLocaleDateString("vi-VN"),
        };
      }
      return att;
    });
  }, [item, availableReasons]);

  if (!isOpen || !item) return null;

  const isSent = item.tinhTrangGui === 2;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateAttachmentFile(file);
      setSelectedFile(file);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Tệp không hợp lệ!",
        "Tệp không hợp lệ",
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.warning("Vui lòng chọn tệp tài liệu từ máy tính!");
      return;
    }

    const reasonCode = selectedMaLyDo || availableReasons[0];

    // Auto-generate safe file name according to Mục 8:
    // "Tên file: Hệ thống tự sinh theo tên lý do, người dùng không được sửa. Không chứa ký tự đặc biệt."
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeReason = reasonCode.replace(/[^a-zA-Z0-9_]/g, "_");
    const autoFileName = `TLCM_${item.ttXml1.maLk}_${safeReason}_${Date.now().toString().slice(-4)}.${ext}`;

    // Check duplicate reason (Tính duy nhất: Mỗi cặp chỉ được 1 file)
    const exists = normalizedAttachments.some((a) => a.maLyDo === reasonCode);
    if (exists) {
      toast.warning(
        `Mã lý do [${reasonCode}] đã có tài liệu đính kèm! Vui lòng xóa tài liệu cũ trước.`,
      );
      return;
    }

    // Đọc nội dung tệp thành Base64 (Data URL) để tải xuống / gửi cổng là file thật
    readFileAsDataUrl(selectedFile)
      .then((url) => {
        const newAttachment: TaiLieuDinhKemItem = {
          tenFile: autoFileName,
          maLyDo: reasonCode,
          kichThuoc: selectedFile.size,
          ngayTao: new Date().toLocaleDateString("vi-VN"),
          url,
        };

        const updatedAttachments = [...normalizedAttachments, newAttachment];
        const updatedItem: HoSoDieuChinh09Item = {
          ...item,
          taiLieuDinhKem: updatedAttachments,
        };

        onSave(updatedItem);
        toast.success(
          `Đính kèm tệp "${autoFileName}" thành công!`,
          "Lưu file thành công",
        );
        setSelectedFile(null);
      })
      .catch((err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : "Lỗi đọc tệp",
          "Lỗi đọc tệp",
        );
      });
  };

  const handleDeleteAttachment = (indexToDelete: number) => {
    if (isSent) {
      toast.error(
        "Chỉ được xóa file khi hồ sơ chưa gửi giám định (TINHTRANGGUI = 0)!",
        "Không thể xóa",
      );
      return;
    }

    const updated = normalizedAttachments.filter((_, i) => i !== indexToDelete);
    const updatedItem: HoSoDieuChinh09Item = {
      ...item,
      taiLieuDinhKem: updated,
    };

    onSave(updatedItem);
    toast.info("Đã xóa tài liệu đính kèm");
  };

  const handleDownloadAttachment = (att: TaiLieuDinhKemItem) => {
    if (att.url) {
      // Tải xuống nội dung tệp thật đã lưu (Data URL Base64)
      const a = document.createElement("a");
      a.href = att.url;
      a.download = att.tenFile;
      a.click();
      toast.success(`Đang tải tệp "${att.tenFile}"...`);
      return;
    }

    // Bản ghi cũ chỉ có tên file (không có nội dung) — báo rõ thay vì trả file giả
    toast.warning(
      `Tệp "${att.tenFile}" không có nội dung lưu trữ (bản ghi cũ). Vui lòng xóa và đính kèm lại tệp gốc!`,
      "Không có nội dung",
    );
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      width={720}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-teal-600 text-white flex items-center justify-center font-bold">
            <Paperclip size={17} />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-tight">
              Đính kèm tài liệu chứng minh
            </span>
            <span className="text-[11px] text-slate-500 block">
              Hồ sơ: <b>{item.ttXml1.hoTen}</b> (LK: {item.ttXml1.maLk}) • Mục 8
              Phụ lục I TT 12/2026/TT-BTC
            </span>
          </div>
        </div>
      }
    >
      {/* Body */}
      <div className="p-5 overflow-y-auto space-y-4 text-xs">
        {/* Upload Box (chỉ cho phép khi chưa gửi cổng) */}
        {!isSent ? (
          <div className="bg-teal-50/50 border border-teal-200 rounded-lg p-4 space-y-3">
            <span className="font-bold text-teal-900 block text-xs uppercase">
              Thêm tài liệu chứng minh mới
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Chọn mã lý do cần chứng minh{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <Select
                  value={selectedMaLyDo || availableReasons[0]}
                  onChange={(val) => setSelectedMaLyDo(val as string)}
                  containerClassName="mb-0"
                  height={32}
                  className="!text-xs"
                  options={availableReasons.map((r) => ({
                    value: r,
                    label: r,
                  }))}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Chọn tệp tài liệu (&le; 5 MB){" "}
                  <span className="text-rose-600">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full h-8 flex items-center text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-teal-100">
                <span className="truncate font-medium text-slate-800">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
                  KB)
                </span>
                <Button
                  variant="teal"
                  size="small"
                  onClick={handleUpload}
                >
                  Lưu File
                </Button>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              Quy định: Định dạng PDF, DOC, DOCX, XLS, XLSX, JPG, PNG &bull;
              Dung lượng &le; 5 MB/file &bull; Tên file tự sinh theo mã lý do.
            </p>
          </div>
        ) : (
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-600 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              Hồ sơ đã gửi giám định — Không thể thêm hoặc xóa file đính kèm.
            </span>
          </div>
        )}

        {/* Danh sách tệp đã đính kèm */}
        <div>
          <h4 className="font-bold text-xs uppercase text-slate-700 mb-2">
            Danh sách tài liệu đã đính kèm ({normalizedAttachments.length})
          </h4>

          {normalizedAttachments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg text-slate-400">
              Chưa có tài liệu chứng minh nào được đính kèm
            </div>
          ) : (
            <div className="space-y-2">
              {normalizedAttachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-slate-800 block truncate text-xs">
                        {att.tenFile}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Mã lý do: <b className="text-teal-700">{att.maLyDo}</b>{" "}
                        • {att.ngayTao || "Hôm nay"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <Button
                      variant="sky"
                      size="small"
                      icon={<Download size={12} />}
                      onClick={() => handleDownloadAttachment(att)}
                      title="Tải xuống tài liệu này"
                    >
                      Tải xuống
                    </Button>
                    {!isSent && (
                      <IconButton
                        icon={<Trash2 size={14} />}
                        tooltip="Xóa tài liệu đính kèm"
                        danger
                        onClick={() => handleDeleteAttachment(idx)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {
        <div className="flex justify-end w-full">
          <Button variant="neutral" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    </Modal>
  );
};
