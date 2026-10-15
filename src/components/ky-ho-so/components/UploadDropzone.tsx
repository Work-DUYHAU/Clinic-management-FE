import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import type { KyHoSoDocInfo } from '../types';

interface UploadDropzoneProps {
  onFileSelect: (doc: KyHoSoDocInfo) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const toast = useToast();

  const handleProcessFile = (file?: File) => {
    if (!file) return;

    const isPdf =
      file.name.toLowerCase().endsWith('.pdf') ||
      file.type.includes('pdf');

    const isImage =
      /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(file.name) ||
      (file.type.startsWith('image/') && file.type !== '');

    if (isImage) {
      toast.warning(
        'Tệp hình ảnh (.png, .jpg, .jpeg...) chỉ dùng để tải lên Con dấu hoặc Chữ ký. Hồ sơ tài liệu cần ký chỉ chấp nhận tệp .pdf!',
        'Chỉ Chấp Nhận PDF',
      );
      return;
    }

    if (!isPdf) {
      toast.error(
        'Định dạng tệp không được hỗ trợ! Hồ sơ ký chỉ chấp nhận định dạng .pdf.',
        'Lỗi Định Dạng Tệp',
      );
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error(
        'Dung lượng tệp vượt quá 25MB!',
        'Tệp Quá Lớn',
      );
      return;
    }

    const fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    onFileSelect({
      file,
      fileName: file.name,
      fileSize,
      fileType: file.type,
      uploadedAt: new Date().toLocaleTimeString('vi-VN'),
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-10 md:p-14 flex flex-col items-center justify-center text-center transition-all duration-200 ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/40 scale-[1.01]'
          : 'border-blue-200/90 bg-white/60 hover:border-blue-300 hover:bg-white/90'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleProcessFile(e.target.files[0]);
          }
        }}
      />

      <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3.5 shadow-xs">
        <Upload size={24} className="stroke-[2.2]" />
      </div>

      <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1">
        Kéo thả hoặc chọn tệp hồ sơ
      </h3>
      <p className="text-xs text-slate-500 mb-6 font-medium">
        Hỗ trợ định dạng PDF — tối đa 25MB mỗi tệp (ảnh PNG/JPG chỉ dùng làm con dấu hoặc chữ ký)
      </p>

      <button
        type="button"
        onClick={() => {
          fileInputRef.current?.click();
        }}
        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs md:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all duration-150 cursor-pointer"
      >
        <Upload size={16} className="stroke-[2.2]" />
        <span>Chọn tệp để tải lên</span>
      </button>
    </div>
  );
};
