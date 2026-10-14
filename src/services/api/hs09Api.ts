import { httpPost, httpGet } from "./httpClient";

export interface SendBhxhHoSo09Params {
  fileBase64Str?: string;
  xmlContent?: string;
  loaiHs?: string;
  kyQT?: string;
  maCskcb?: string;
  maTinh?: string;
  tranId?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo09Result {
  success: boolean;
  statusCode: number;
  maKetQua: string;
  thongDiep: string;
  ghiChu?: string;
  maGiaoDich?: string;
  data?: unknown;
}

export async function sendBhxhHoSo09WithBackend(
  params: SendBhxhHoSo09Params,
): Promise<SendBhxhHoSo09Result> {
  const {
    fileBase64Str,
    xmlContent,
    loaiHs = "73",
    kyQT,
    maCskcb,
    maTinh,
    tranId,
    signal,
  } = params;

  let base64 = fileBase64Str || "";
  if (!base64 && xmlContent) {
    base64 = btoa(unescape(encodeURIComponent(xmlContent)));
  }

  if (!base64) {
    throw new Error("Không có dữ liệu tệp XML / Base64 để gửi lên Cổng BHXH.");
  }

  return await httpPost<SendBhxhHoSo09Result>(
    "/bhxh/gui-ho-so-dieu-chinh-09",
    {
      fileBase64Str: base64,
      loaiHs,
      kyQT,
      maCskcb,
      maTinh,
      tranId,
    },
    { signal },
  );
}

export interface SendBhxhHoSo09HangLoatItem {
  id?: string;
  maLk?: string;
  hoTen?: string;
  fileBase64Str?: string;
  xmlContent?: string;
  kyQT?: string;
  tranId?: string;
  ghiChu?: string;
}

export interface SendBhxhHoSo09HangLoatParams {
  items: SendBhxhHoSo09HangLoatItem[];
  maCskcb?: string;
  maTinh?: string;
  kyQT?: string;
  loaiHs?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo09HangLoatResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  thongDiep: string;
  items: Array<{
    id?: string;
    maLk?: string;
    hoTen?: string;
    maKetQua: string;
    maGiaoDich: string;
    thongDiep: string;
    thoiGianTiepNhan: string;
    kyQT?: string;
  }>;
}

export async function sendBhxhHoSo09HangLoatWithBackend(
  params: SendBhxhHoSo09HangLoatParams,
): Promise<SendBhxhHoSo09HangLoatResult> {
  const { items, maCskcb, maTinh, kyQT, loaiHs = "73", signal } = params;

  return await httpPost<SendBhxhHoSo09HangLoatResult>(
    "/bhxh/gui-ho-so-dieu-chinh-09-hang-loat",
    {
      items,
      maCskcb,
      maTinh,
      kyQT,
      loaiHs,
    },
    { signal },
  );
}

export interface Hs09AuditLogEntry {
  id: string;
  timestamp: string;
  maCskcb: string;
  maTinh: string;
  loaiHs: string;
  kyQT?: string;
  maLk?: string;
  hoTen?: string;
  tranId?: string;
  maKetQua: string;
  maGiaoDich?: string;
  thongDiep: string;
  success: boolean;
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
  type: "single" | "batch";
}

export async function getHs09AuditLogsWithBackend(params?: {
  limit?: number;
  maCskcb?: string;
  signal?: AbortSignal;
}): Promise<Hs09AuditLogEntry[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.maCskcb) searchParams.append("maCskcb", params.maCskcb);

    const queryStr = searchParams.toString();
    const endpoint = `/ho-so/09/audit-logs${queryStr ? `?${queryStr}` : ""}`;
    return await httpGet<Hs09AuditLogEntry[]>(endpoint, {
      signal: params?.signal,
    });
  } catch (err) {
    console.warn("Lỗi khi lấy audit log HS09 từ Backend:", err);
    return [];
  }
}

import type {
  HoSoDieuChinh09Item,
  SendHs09GatewayResult,
  SendHs09BatchItemResult,
  Hs09GatewayCredentials,
} from "../../types/hs09DieuChinhTypes";
import type { SmartCaSignatureResult } from "../../types/smartcaTypes";
import {
  DEFAULT_MA_CSKCB,
  xmlToBase64,
  getThoiGianTiepNhan,
  getTodayYmd,
} from "../../utils/shared/excelXmlShared";
import { signXmlWithBackend } from "./smartCaApi";
import { injectSignatureToXml } from "../../utils/xmlDsigEngine";
import { generateHs09SingleXml } from "../../utils/hs09DieuChinhXmlEngine";

export function extractSignatureBlockFromXml(xml: string): string | null {
  if (!xml) return null;
  const match = xml.match(/<CHUKYDONVI>([\s\S]*?)<\/CHUKYDONVI>/i);
  if (match && match[1] && match[1].includes("<Signature")) {
    return match[1].trim();
  }
  const sigMatch = xml.match(/<Signature[\s\S]*?<\/Signature>/i);
  if (sigMatch) return sigMatch[0].trim();
  return null;
}

export function resolveItemKyQt(
  item: HoSoDieuChinh09Item,
  fallbackKyQt?: string,
): string {
  const rawKyQt = fallbackKyQt?.trim() || item?.ttXml1?.kyQt?.trim() || "";
  let finalKyQt = rawKyQt.replace(/[^0-9]/g, "");
  if (finalKyQt.length === 6) {
    const first2 = Number(finalKyQt.slice(0, 2));
    const last4 = Number(finalKyQt.slice(2));
    if (first2 >= 1 && first2 <= 12 && last4 >= 2000) {
      finalKyQt = `${last4}${String(first2).padStart(2, "0")}`;
    }
    return finalKyQt;
  }
  return getTodayYmd().slice(0, 6);
}

export function saveGatewayAuditLog(entry: {
  loaiHs: string;
  maCskcb: string;
  maGiaoDich: string;
  maKetQua: string;
  thongDiep: string;
  totalRecords: number;
  kyQT?: string;
}): void {
  try {
    const auditEntry = {
      id: `audit-hs09-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    const savedLogs = JSON.parse(
      localStorage.getItem("BHXH_GATEWAY_AUDIT_LOGS") || "[]",
    );
    savedLogs.unshift(auditEntry);
    localStorage.setItem(
      "BHXH_GATEWAY_AUDIT_LOGS",
      JSON.stringify(savedLogs.slice(0, 100)),
    );
  } catch {
    // Ignore localStorage error
  }
}

export interface SendSingleItemParams {
  item: HoSoDieuChinh09Item;
  maCskcb: string;
  isSingleItem?: boolean;
  signatureBlock?: string | null;
  signatureTranId?: string;
  credentialsKyQt?: string;
  maTinh?: string;
  customFileBase64?: string;
  signal?: AbortSignal;
  smartCaOptions?: {
    identityValue?: string;
    password?: string;
    totpSecret?: string;
  };
}

export async function sendSingleHs09ItemRequest({
  item,
  maCskcb,
  isSingleItem = true,
  signatureBlock,
  signatureTranId,
  credentialsKyQt,
  maTinh,
  customFileBase64,
  signal,
  smartCaOptions,
}: SendSingleItemParams): Promise<SendHs09BatchItemResult> {
  const finalKyQt = resolveItemKyQt(item, credentialsKyQt);

  const isSingleValidXml = (xmlStr?: string): boolean => {
    if (!xmlStr) return false;
    const matches = xmlStr.match(/<TT_HOSO[\s>]/gi);
    return matches !== null && matches.length === 1;
  };

  let base64 = "";
  let finalTranId = signatureTranId;
  if (isSingleItem && customFileBase64) {
    try {
      const decoded = atob(customFileBase64);
      if (isSingleValidXml(decoded)) {
        base64 = customFileBase64;
      }
    } catch {
      // ignore
    }
  }

  if (
    !base64 &&
    item.signedXml &&
    isSingleValidXml(item.signedXml) &&
    extractSignatureBlockFromXml(item.signedXml)
  ) {
    base64 = xmlToBase64(item.signedXml);
  }

  if (!base64 && isSingleItem && signatureBlock) {
    let singleXml = generateHs09SingleXml(item, maCskcb);
    singleXml = injectSignatureToXml(singleXml, signatureBlock);
    base64 = xmlToBase64(singleXml);
  }

  if (!base64) {
    const singleXml = generateHs09SingleXml(item, maCskcb);
    try {
      const signRes = await signXmlWithBackend({
        rawXml: singleXml,
        fileName: `HSDC09BH_${maCskcb}_${item.ttXml1.maLk}.xml`,
        userId: smartCaOptions?.identityValue,
      });

      if (signRes.success && signRes.signedXml) {
        item.signedXml = signRes.signedXml;
        item.signedAt = signRes.meta?.signTime || new Date().toISOString();
        item.ttKySo = 2;
        if (signRes.signatureId) {
          finalTranId = signRes.signatureId;
        }
        base64 = xmlToBase64(signRes.signedXml);
      } else {
        throw new Error(
          signRes.message || "Không nhận được phản hồi chữ ký số từ Backend",
        );
      }
    } catch (signErr: unknown) {
      if (isSingleItem && signatureBlock) {
        let singleXmlFallback = generateHs09SingleXml(item, maCskcb);
        singleXmlFallback = injectSignatureToXml(
          singleXmlFallback,
          signatureBlock,
        );
        base64 = xmlToBase64(singleXmlFallback);
      } else {
        const signMsg =
          signErr instanceof Error ? signErr.message : "Lỗi ký số tự động";
        throw new Error(
          `Ký số hồ sơ LK ${item.ttXml1.maLk} thất bại: ${signMsg}`,
        );
      }
    }
  }

  const beRes = await sendBhxhHoSo09WithBackend({
    fileBase64Str: base64,
    loaiHs: "73",
    kyQT: finalKyQt,
    maCskcb,
    maTinh,
    tranId: finalTranId,
    signal,
  });

  const isOk =
    String(beRes.maKetQua) === "200" ||
    String(beRes.maKetQua) === "0" ||
    beRes.success;

  return {
    id: item.id,
    maLk: item.ttXml1.maLk,
    hoTen: item.ttXml1.hoTen,
    maKetQua: String(beRes.maKetQua || (isOk ? "200" : "500")),
    maGiaoDich:
      beRes.maGiaoDich ||
      (isOk
        ? `HSDC09BH_${maCskcb}_${finalKyQt}_${Date.now().toString().slice(-6)}`
        : ""),
    thongDiep:
      beRes.thongDiep ||
      beRes.ghiChu ||
      (isOk
        ? `Tiếp nhận thành công hồ sơ điều chỉnh LK ${item.ttXml1.maLk}`
        : `Cổng BHXH phản hồi mã: ${beRes.maKetQua}`),
    thoiGianTiepNhan: getThoiGianTiepNhan(),
    kyQT: finalKyQt,
  };
}

/** Options to pass to sendHs09ToBhxhGateway (alias for positional args) */
export interface SendHs09Options {
  items: HoSoDieuChinh09Item[];
  credentials?: Partial<Hs09GatewayCredentials>;
  signature?: SmartCaSignatureResult;
  customFileBase64?: string;
  onProgress?: (
    current: number,
    total: number,
    currentItem: HoSoDieuChinh09Item,
  ) => void;
}

/** Progress info emitted during a batch send */
export interface BatchSendHs09Progress {
  current: number;
  total: number;
  currentItem: HoSoDieuChinh09Item;
}

export async function sendHs09ToBhxhGateway(
  items: HoSoDieuChinh09Item[],
  credentials?: Partial<Hs09GatewayCredentials>,
  signature?: SmartCaSignatureResult,
  customFileBase64?: string,
  onProgress?: (
    current: number,
    total: number,
    currentItem: HoSoDieuChinh09Item,
  ) => void,
): Promise<SendHs09GatewayResult> {
  if (items.length === 0) {
    return {
      maKetQua: "400",
      maGiaoDich: "",
      thongDiep: "Không có hồ sơ nào để gửi",
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: 0,
      loaiHs: "73",
      successCount: 0,
      failureCount: 0,
    };
  }

  const maCskcb =
    credentials?.maCskcb || items[0]?.ttMau?.maCskcb || DEFAULT_MA_CSKCB;

  const signedXmlFromSig =
    signature?.signedXml ||
    items.find((i) => i.signedXml)?.signedXml;
  let signatureBlock = extractSignatureBlockFromXml(signedXmlFromSig || "");
  if (!signatureBlock && customFileBase64) {
    try {
      const decoded = atob(customFileBase64);
      signatureBlock = extractSignatureBlockFromXml(decoded);
    } catch {
      // ignore
    }
  }

  try {
    if (items.length === 1) {
      onProgress?.(1, 1, items[0]);
      const singleRes = await sendSingleHs09ItemRequest({
        item: items[0],
        maCskcb,
        isSingleItem: true,
        signatureBlock,
        signatureTranId: signature?.tranId,
        credentialsKyQt: credentials?.kyQT,
        maTinh: credentials?.maTinh,
        customFileBase64,
        smartCaOptions: credentials?.smartCaOptions,
      });

      const isOk =
        String(singleRes.maKetQua) === "200" ||
        String(singleRes.maKetQua) === "0";

      const result: SendHs09GatewayResult = {
        maKetQua: singleRes.maKetQua,
        maGiaoDich: singleRes.maGiaoDich || "",
        thongDiep:
          singleRes.thongDiep ||
          (isOk
            ? "Tiếp nhận thành công hồ sơ điều chỉnh Mẫu 09/BH vào Hệ thống Giám định BHYT"
            : "Cổng BHXH từ chối tiếp nhận"),
        thoiGianTiepNhan: singleRes.thoiGianTiepNhan || getThoiGianTiepNhan(),
        totalRecords: 1,
        loaiHs: "73",
        kyQT: singleRes.kyQT,
        batchResults: [singleRes],
        successCount: isOk ? 1 : 0,
        failureCount: isOk ? 0 : 1,
      };

      saveGatewayAuditLog({
        loaiHs: "73",
        maCskcb,
        maGiaoDich: result.maGiaoDich,
        maKetQua: result.maKetQua,
        thongDiep: result.thongDiep,
        totalRecords: 1,
        kyQT: singleRes.kyQT,
      });

      return result;
    }

    const isSingleValidXml = (xmlStr?: string): boolean => {
      if (!xmlStr) return false;
      const matches = xmlStr.match(/<TT_HOSO[\s>]/gi);
      return matches !== null && matches.length === 1;
    };

    const overallKyQt =
      credentials?.kyQT || resolveItemKyQt(items[0], credentials?.kyQT);
    const batchResults: SendHs09BatchItemResult[] = [];
    const batchItemsToDispatch: Array<{
      id?: string;
      maLk?: string;
      hoTen?: string;
      fileBase64Str?: string;
      xmlContent?: string;
      kyQT?: string;
      tranId?: string;
    }> = [];

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      onProgress?.(i + 1, items.length, currentItem);

      let itemBase64 = "";
      let itemTranId = signature?.tranId;

      if (
        currentItem.signedXml &&
        isSingleValidXml(currentItem.signedXml) &&
        extractSignatureBlockFromXml(currentItem.signedXml)
      ) {
        itemBase64 = xmlToBase64(currentItem.signedXml);
      }

      if (!itemBase64) {
        const singleXml = generateHs09SingleXml(currentItem, maCskcb);
        try {
          const signRes = await signXmlWithBackend({
            rawXml: singleXml,
            fileName: `HSDC09BH_${maCskcb}_${currentItem.ttXml1.maLk}.xml`,
            userId: credentials?.smartCaOptions?.identityValue,
          });
          if (signRes.success && signRes.signedXml) {
            currentItem.signedXml = signRes.signedXml;
            currentItem.signedAt =
              signRes.meta?.signTime || new Date().toISOString();
            currentItem.ttKySo = 2;
            if (signRes.signatureId) {
              itemTranId = signRes.signatureId;
            }
            itemBase64 = xmlToBase64(signRes.signedXml);
          }
        } catch {
          // Bỏ qua lỗi ký sơ bộ
        }
      }

      batchItemsToDispatch.push({
        id: currentItem.id,
        maLk: currentItem.ttXml1.maLk,
        hoTen: currentItem.ttXml1.hoTen,
        fileBase64Str: itemBase64,
        xmlContent: itemBase64
          ? undefined
          : generateHs09SingleXml(currentItem, maCskcb),
        kyQT: resolveItemKyQt(currentItem, credentials?.kyQT),
        tranId: itemTranId,
      });
    }

    try {
      const batchBeRes = await sendBhxhHoSo09HangLoatWithBackend({
        items: batchItemsToDispatch,
        maCskcb,
        maTinh: credentials?.maTinh,
        kyQT: overallKyQt,
        signal: credentials?.signal,
      });

      if (batchBeRes.items && batchBeRes.items.length > 0) {
        batchBeRes.items.forEach((itemRes) => {
          batchResults.push({
            id: itemRes.id || "",
            maLk: itemRes.maLk || "",
            hoTen: itemRes.hoTen || "",
            maKetQua: String(itemRes.maKetQua || "500"),
            maGiaoDich: itemRes.maGiaoDich || "",
            thongDiep: itemRes.thongDiep || "",
            thoiGianTiepNhan: itemRes.thoiGianTiepNhan || getThoiGianTiepNhan(),
            kyQT: itemRes.kyQT || overallKyQt,
          });
        });
      }
    } catch (batchErr) {
      console.warn(
        "Gửi hàng loạt qua Backend API thất bại, fallback sang gửi tuần tự:",
        batchErr,
      );
      batchResults.length = 0;
      for (let i = 0; i < items.length; i++) {
        const currentItem = items[i];
        try {
          const itemRes = await sendSingleHs09ItemRequest({
            item: currentItem,
            maCskcb,
            isSingleItem: false,
            signatureBlock: null,
            signatureTranId: signature?.tranId,
            credentialsKyQt: credentials?.kyQT,
            maTinh: credentials?.maTinh,
            smartCaOptions: credentials?.smartCaOptions,
            signal: credentials?.signal,
          });
          batchResults.push(itemRes);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "Lỗi gửi hồ sơ";
          batchResults.push({
            id: currentItem.id,
            maLk: currentItem.ttXml1.maLk,
            hoTen: currentItem.ttXml1.hoTen,
            maKetQua: "500",
            thongDiep: errMsg,
            thoiGianTiepNhan: getThoiGianTiepNhan(),
            kyQT: resolveItemKyQt(currentItem, credentials?.kyQT),
          });
        }
      }
    }

    const successCount = batchResults.filter(
      (r) => String(r.maKetQua) === "200" || String(r.maKetQua) === "0",
    ).length;
    const failureCount = items.length - successCount;
    const allSuccess = successCount === items.length;
    const allFailed = successCount === 0;

    const overallMaKetQua = allSuccess
      ? "200"
      : allFailed
        ? batchResults[0]?.maKetQua || "500"
        : "207";
    const primaryGiaoDich =
      batchResults.find((r) => r.maGiaoDich)?.maGiaoDich || "";
    const finalBatchKyQt = batchResults[0]?.kyQT || overallKyQt;

    let summaryMessage = "";
    if (allSuccess) {
      summaryMessage = `Tiếp nhận thành công toàn bộ ${items.length}/${items.length} hồ sơ điều chỉnh Mẫu 09/BH vào Hệ thống Giám định BHYT`;
    } else if (allFailed) {
      summaryMessage = `Toàn bộ ${items.length} hồ sơ bị Cổng BHXH từ chối: ${batchResults[0]?.thongDiep || "Lỗi tiếp nhận"}`;
    } else {
      summaryMessage = `Tiếp nhận thành công ${successCount}/${items.length} hồ sơ. Có ${failureCount} hồ sơ bị từ chối`;
    }

    const result: SendHs09GatewayResult = {
      maKetQua: overallMaKetQua,
      maGiaoDich: primaryGiaoDich,
      thongDiep: summaryMessage,
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      loaiHs: "73",
      kyQT: finalBatchKyQt,
      batchResults,
      successCount,
      failureCount,
    };

    saveGatewayAuditLog({
      loaiHs: "73",
      maCskcb,
      maGiaoDich: result.maGiaoDich,
      maKetQua: result.maKetQua,
      thongDiep: result.thongDiep,
      totalRecords: items.length,
      kyQT: finalBatchKyQt,
    });

    return result;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Tiến trình gửi hồ sơ đã được người dùng hủy bỏ."
          : err.message
        : "Không thể kết nối đến máy chủ Backend hoặc Cổng BHXH. Vui lòng kiểm tra dịch vụ và thử lại.";
    return {
      maKetQua: "500",
      maGiaoDich: "",
      thongDiep: errorMsg,
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      loaiHs: "73",
      failureCount: items.length,
      successCount: 0,
    };
  }
}
