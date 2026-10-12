const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

export const CACHE_KEYS = {
  STAMP: "clinic_cache_custom_stamp_v1",
  SIGNATURE: "clinic_cache_custom_signature_v1",
};

export const DEFAULT_ASSETS = {
  STAMP: "/assets/Mau_Dau_Trung_Tam.png",
  SIGNATURE: "/assets/H-removebg-preview.png",
};

interface CacheItem {
  dataUrl: string;
  fileName?: string;
  savedAt: number;
}

export async function removeImageBackground(
  imageSource: File | Blob | string,
  type: "stamp" | "signature",
): Promise<string> {
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
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Không thể khởi tạo Canvas 2D để tách nền");

        const origW = img.naturalWidth || img.width || 400;
        const origH = img.naturalHeight || img.height || 400;
        const maxDim = 600;
        let targetW = origW;
        let targetH = origH;
        if (targetW > maxDim || targetH > maxDim) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * maxDim) / targetW);
            targetW = maxDim;
          } else {
            targetW = Math.round((targetW * maxDim) / targetH);
            targetH = maxDim;
          }
        }

        canvas.width = targetW;
        canvas.height = targetH;

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Nếu pixel đã trong suốt sẵn thì bỏ qua
          if (a === 0) continue;

          if (type === "stamp") {
            // CON DẤU ĐỎ:
            // Nét mực dấu đỏ có đặc trưng: R cao và vượt trội so với G và B
            const maxGB = Math.max(g, b);
            const isRedInk =
              r > 75 && ((r - g > 15 && r - b > 15) || r / (maxGB + 1) > 1.25);

            const isLightBg = r > 170 && g > 170 && b > 170;
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            if (isLightBg && !isRedInk) {
              // Nền giấy trắng/xám nhạt: làm trong suốt hoàn toàn
              data[i + 3] = 0;
            } else if (!isRedInk) {
              // Các điểm nền tối khác không phải mực đỏ (nền giấy chụp thiếu sáng, bóng mờ)
              if (brightness > 145) {
                data[i + 3] = 0;
              } else {
                const alphaFactor = Math.max(0, 1 - (brightness - 110) / 35);
                data[i + 3] = Math.round(a * alphaFactor);
              }
            } else {
              // Mực con dấu đỏ: Giữ lại nguyên vẹn và khử các điểm quá sáng
              if (brightness > 235 && r > 230 && maxGB > 210) {
                data[i + 3] = 0;
              } else {
                data[i + 3] = Math.max(a, 245);
              }
            }
          } else {
            // CHỮ KÝ (Mực xanh, mực đen, mực tím):
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            if (brightness > 195) {
              // Nền giấy trắng: làm trong suốt hoàn toàn
              data[i + 3] = 0;
            } else if (brightness > 140) {
              // Vùng chuyển tiếp rìa nét chữ: làm mờ chuyển tiếp mịn để không bị răng cưa
              const factor = (195 - brightness) / 55;
              data[i + 3] = Math.round(a * factor);
            } else {
              // Nét chữ ký đậm: giữ nguyên nét mực
              data[i + 3] = Math.max(a, 245);
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        let minX = targetW;
        let minY = targetH;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            if (data[idx + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        let finalCanvas: HTMLCanvasElement = canvas;
        if (maxX >= minX && maxY >= minY) {
          const padding = 6;
          const cropX = Math.max(0, minX - padding);
          const cropY = Math.max(0, minY - padding);
          const cropW = Math.min(
            targetW - cropX,
            maxX - minX + 1 + padding * 2,
          );
          const cropH = Math.min(
            targetH - cropY,
            maxY - minY + 1 + padding * 2,
          );

          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext("2d");
          if (cropCtx) {
            cropCtx.drawImage(
              canvas,
              cropX,
              cropY,
              cropW,
              cropH,
              0,
              0,
              cropW,
              cropH,
            );
            finalCanvas = cropCanvas;
          }
        }

        const dataUrl = finalCanvas.toDataURL("image/png");

        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve(dataUrl);
      } catch (err) {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      reject(new Error("Không thể tải hình ảnh để xử lý xóa nền"));
    };
  });
}

export function saveImageToCache(
  key: string,
  dataUrl: string,
  fileName?: string,
): void {
  try {
    const item: CacheItem = {
      dataUrl,
      fileName,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (err) {
    console.warn("Không thể lưu cache ảnh vào localStorage:", err);
  }
}

export function getCachedImage(
  key: string,
): { dataUrl: string; fileName?: string; remainingMinutes: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const item: CacheItem = JSON.parse(raw);
    const elapsed = Date.now() - item.savedAt;

    if (elapsed >= CACHE_TTL_MS) {
      // Đã quá 30 phút -> Tự động xóa cache
      localStorage.removeItem(key);
      return null;
    }

    const remainingMinutes = Math.max(
      1,
      Math.round((CACHE_TTL_MS - elapsed) / 60000),
    );
    return {
      dataUrl: item.dataUrl,
      fileName: item.fileName,
      remainingMinutes,
    };
  } catch {
    return null;
  }
}

export function clearImageCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getRemainingMinutes(key: string): number | null {
  const cached = getCachedImage(key);
  return cached ? cached.remainingMinutes : null;
}
