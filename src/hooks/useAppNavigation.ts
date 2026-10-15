import { useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { MainTabType, HoSoTabType } from "../components/Sidebar";
import type { CatalogTab } from "../pages/DanhMucPage";

const VALID_CATALOG_TABS: CatalogTab[] = [
  "01_bpcm",
  "02_nhanluc",
  "03_thuoc",
  "04_thietbi",
  "05_dichvu",
  "06_tbdvkt",
];

const VALID_HOSO_TABS: HoSoTabType[] = ["01_tonghop", "09_xuattoan"];

export interface AppNavigationState {
  activeTab: MainTabType;
  hoSoTab: HoSoTabType;
  catalogTab: CatalogTab;
  navigateTab: (
    tab: MainTabType,
    subTab?: HoSoTabType,
    catTab?: CatalogTab,
  ) => void;
  setHoSoTab: (subTab: HoSoTabType) => void;
  setCatalogTab: (catTab: CatalogTab) => void;
}

export function useAppNavigation(): AppNavigationState {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tương thích ngược: nếu truy cập bằng hash URL cũ (#/danh-muc?tab=...)
  useEffect(() => {
    if (window.location.hash) {
      const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
      const [pathPart, queryPart] = rawHash.split("?");
      const qParams = new URLSearchParams(queryPart || "");

      if (pathPart === "danh-muc") {
        const cat = qParams.get("tab") || "01_bpcm";
        navigate(`/danh-muc/${cat}`, { replace: true });
      } else if (pathPart === "ho-so") {
        const sub = qParams.get("sub") || "01_tonghop";
        navigate(`/ho-so/${sub}`, { replace: true });
      } else if (pathPart === "chung-tu") {
        navigate("/chung-tu", { replace: true });
      } else if (pathPart === "ky-so") {
        navigate("/ky-so", { replace: true });
      }
    }
  }, [navigate]);

  const { activeTab, hoSoTab, catalogTab } = useMemo(() => {
    const rawPath = location.pathname.toLowerCase();
    const segments = rawPath.replace(/^\/+/, "").split("/");
    const rootSegment = segments[0] || "";
    const subSegment = segments[1] || "";

    let tab: MainTabType = "danh-muc";
    let cat: CatalogTab = "01_bpcm";
    let sub: HoSoTabType = "01_tonghop";

    if (rootSegment === "ho-so") {
      tab = "ho-so";
      const candidateSub = subSegment || searchParams.get("sub") || "";
      if (VALID_HOSO_TABS.includes(candidateSub as HoSoTabType)) {
        sub = candidateSub as HoSoTabType;
      }
    } else if (rootSegment === "chung-tu") {
      tab = "chung-tu";
    } else if (rootSegment === "ky-so") {
      tab = "ky-so";
    } else {
      tab = "danh-muc";
      const candidateCat = subSegment || searchParams.get("tab") || "";
      if (VALID_CATALOG_TABS.includes(candidateCat as CatalogTab)) {
        cat = candidateCat as CatalogTab;
      }
    }

    return { activeTab: tab, hoSoTab: sub, catalogTab: cat };
  }, [location.pathname, searchParams]);

  const navigateTab = useCallback(
    (tab: MainTabType, subTab?: HoSoTabType, catTab?: CatalogTab) => {
      if (tab === "danh-muc") {
        const targetCat = catTab || catalogTab || "01_bpcm";
        navigate(`/danh-muc/${targetCat}`);
      } else if (tab === "ho-so") {
        const targetSub = subTab || hoSoTab || "01_tonghop";
        navigate(`/ho-so/${targetSub}`);
      } else if (tab === "chung-tu") {
        navigate("/chung-tu");
      } else if (tab === "ky-so") {
        navigate("/ky-so");
      }
    },
    [navigate, catalogTab, hoSoTab],
  );

  const setHoSoTab = useCallback(
    (subTab: HoSoTabType) => {
      navigate(`/ho-so/${subTab}`);
    },
    [navigate],
  );

  const setCatalogTab = useCallback(
    (catTab: CatalogTab) => {
      navigate(`/danh-muc/${catTab}`);
    },
    [navigate],
  );

  return {
    activeTab,
    hoSoTab,
    catalogTab,
    navigateTab,
    setHoSoTab,
    setCatalogTab,
  };
}
