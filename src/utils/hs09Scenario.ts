import type { HoSoDieuChinh09Item } from "../types/hs09DieuChinhTypes";

export type Hs09Scenario =
  | "DCHanhChinh_Only"
  | "DCChiPhi_Only"
  | "DC_Mixed"
  | "ThuHoi_Hoac_XinYK";

export function detectScenario(item: HoSoDieuChinh09Item): Hs09Scenario {
  const hasXml1Dc = (item.dsXml1DieuChinh?.length ?? 0) > 0;
  const hasChiPhiDc = (item.dsChiPhiDieuChinh?.length ?? 0) > 0;

  if (hasXml1Dc && hasChiPhiDc) return "DC_Mixed";
  if (hasXml1Dc) return "DCHanhChinh_Only";
  if (hasChiPhiDc) return "DCChiPhi_Only";
  return "ThuHoi_Hoac_XinYK";
}
