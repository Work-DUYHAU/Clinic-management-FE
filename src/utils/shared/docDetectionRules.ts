import type { DocSignOptionType } from "../../types/tt25ChungTuTypes";
import { normalizeKeyword } from "./excelXmlShared";
import {
  DOC_DETECTION_RULES,
  type DocDetectionRule,
} from "../constants/tt25Constants";

export type { DocDetectionRule };
export { DOC_DETECTION_RULES, normalizeKeyword };

export function detectDocTypeFromHeader(
  headerKeys: string[],
  sheetName = "",
  fallbackType: DocSignOptionType | null = null,
): DocSignOptionType | null {
  const normSheet = normalizeKeyword(sheetName);
  const hStr = headerKeys.map(normalizeKeyword).join(" ");

  let bestType: DocSignOptionType | null = null;
  let maxScore = 0;

  for (const r of DOC_DETECTION_RULES) {
    let score = 0;
    if (normSheet && r.sheetKeywords.some((kw) => normSheet.includes(kw))) {
      score += 3;
    }
    for (const kw of r.headerKeywords) {
      if (hStr.includes(kw)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestType = r.type;
    }
  }

  return maxScore > 0 ? bestType : fallbackType;
}
