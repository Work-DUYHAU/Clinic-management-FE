import React, { useRef, useState } from "react";
import { GripVertical, Stamp, Feather } from "lucide-react";
import type { SignatureElementType } from "../types";

interface DraggableImageProps {
  id: string;
  type: SignatureElementType;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  disabled?: boolean;
  isSigned?: boolean;
  onChange: (id: string, x: number, y: number) => void;
}

export const DraggableImage: React.FC<DraggableImageProps> = ({
  id,
  type,
  src,
  x,
  y,
  width,
  height,
  disabled = false,
  isSigned = false,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  }>({
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
  });

  const isStamp = type === "stamp";

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.stopPropagation();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    // Ghi nhận tọa độ chuột và vị trí phần tử lúc bắt đầu kéo
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: x,
      startY: y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    e.stopPropagation();

    // Tính độ dịch chuyển delta tự do theo cả trục X và trục Y
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    const newX = Math.max(0, Math.round(dragStartRef.current.startX + dx));
    const newY = Math.max(0, Math.round(dragStartRef.current.startY + dy));

    onChange(id, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        touchAction: "none",
      }}
      className={`absolute select-none z-30 pointer-events-auto transition-shadow ${
        disabled
          ? "cursor-default"
          : isDragging
            ? "cursor-grabbing ring-2 ring-blue-500 shadow-xl scale-102 opacity-95"
            : "cursor-grab hover:ring-2 hover:ring-blue-400"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 1. TRƯỜNG HỢP ĐÃ KÝ THÀNH CÔNG: Hiển thị hình ảnh con dấu / chữ ký thật */}
      {isSigned ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={src}
            alt={isStamp ? "Con dấu" : "Chữ ký"}
            onError={(e) => {
              const target = e.currentTarget;
              if (isStamp && !target.dataset.fallbackCount) {
                target.dataset.fallbackCount = "1";
                target.src = "/assets/Mau_Dau _Trung_Tam.png";
              } else if (isStamp && target.dataset.fallbackCount === "1") {
                target.dataset.fallbackCount = "2";
                target.src = "/assets/Mau_Dau_Trung_Tam.png";
              }
            }}
            className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
          />

          {/* Grip handle kéo thả tinh chỉnh */}
          {!disabled && (
            <div
              title="Kéo để di chuyển vị trí"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/95 border border-slate-300 shadow-sm flex items-center justify-center text-slate-600 hover:text-blue-600 cursor-grab"
            >
              <GripVertical size={13} className="stroke-[2.5]" />
            </div>
          )}
        </div>
      ) : (
        /* 2. TRƯỜNG HỢP CHƯA KÝ: Hiển thị khung định vị (Placeholder Bounding Box) */
        <div
          className={`w-full h-full rounded-md border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-colors shadow-xs ${
            isStamp
              ? "border-rose-400 bg-rose-50/75 text-rose-700"
              : "border-blue-400 bg-blue-50/75 text-blue-700"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-[11px] leading-tight mb-1">
            {isStamp ? <Stamp size={14} /> : <Feather size={14} />}
            <span>{isStamp ? "Vị trí con dấu" : "Vị trí chữ ký"}</span>
          </div>
          <span className="text-[9px] text-slate-500 leading-tight">
            Kéo thả để căn chỉnh
          </span>

          {!disabled && (
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center text-slate-500">
              <GripVertical size={11} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
