import type { HoSoDieuChinh09Item } from "../../types/hs09DieuChinhTypes";
import { getTodayYmd } from "../../utils/shared/excelXmlShared";

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

export function isSingleValidXml(xmlStr?: string): boolean {
  if (!xmlStr) return false;
  const matches = xmlStr.match(/<TT_HOSO[\s>]/gi);
  return matches !== null && matches.length === 1;
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
