import { useState, useEffect, useCallback } from "react";
import type { MainTabType, HoSoTabType } from "../components/Sidebar";
import type { CatalogTab } from "../pages/DanhMucPage";

const VALID_MAIN_TABS: MainTabType[] = ["danh-muc", "ho-so", "chung-tu"];
const VALID_HOSO_TABS: HoSoTabType[] = ["01_tonghop", "09_xuattoan"];
const VALID_CATALOG_TABS: CatalogTab[] = [
  "01_bpcm",
  "02_nhanluc",
  "03_thuoc",
  "04_thietbi",
  "05_dichvu",
  "06_tbdvkt",
];

export interface AppRouterState {
  activeTab: MainTabType;
  hoSoTab: HoSoTabType;
  catalogTab: CatalogTab;
  navigate: (
    tab: MainTabType,
    subTab?: HoSoTabType,
    catTab?: CatalogTab,
  ) => void;
  setHoSoTab: (subTab: HoSoTabType) => void;
  setCatalogTab: (catTab: CatalogTab) => void;
}

interface ParsedRoute {
  activeTab: MainTabType;
  hoSoTab: HoSoTabType;
  catalogTab: CatalogTab;
  isCanonical: boolean;
  canonicalHash: string;
}

function parseHash(hashStr: string): ParsedRoute {
  // Chuẩn hóa hash: bỏ ký tự '#' và '/' đầu
  const raw = (hashStr || "").replace(/^#\/?/, "").trim();
  const [pathPart, queryPart] = raw.split("?");
  const params = new URLSearchParams(queryPart || "");

  let activeTab: MainTabType = "danh-muc";
  let hoSoTab: HoSoTabType = "01_tonghop";
  let catalogTab: CatalogTab = "01_bpcm";

  if (VALID_MAIN_TABS.includes(pathPart as MainTabType)) {
    activeTab = pathPart as MainTabType;
  }

  const querySub = params.get("sub");
  if (querySub && VALID_HOSO_TABS.includes(querySub as HoSoTabType)) {
    hoSoTab = querySub as HoSoTabType;
  }

  const queryTab = params.get("tab");
  if (queryTab && VALID_CATALOG_TABS.includes(queryTab as CatalogTab)) {
    catalogTab = queryTab as CatalogTab;
  }

  // Tạo URL canonical tương ứng
  let canonicalHash = "#/danh-muc?tab=01_bpcm";
  if (activeTab === "danh-muc") {
    canonicalHash = `#/danh-muc?tab=${catalogTab}`;
  } else if (activeTab === "ho-so") {
    canonicalHash = `#/ho-so?sub=${hoSoTab}`;
  } else if (activeTab === "chung-tu") {
    canonicalHash = "#/chung-tu";
  }

  const isCanonical =
    Boolean(hashStr) &&
    (hashStr === canonicalHash || hashStr.replace(/^#\/?/, "") === canonicalHash.replace(/^#\/?/, ""));

  return { activeTab, hoSoTab, catalogTab, isCanonical, canonicalHash };
}

export function useAppRouter(): AppRouterState {
  const [route, setRoute] = useState<ParsedRoute>(() => {
    if (typeof window === "undefined") {
      return {
        activeTab: "danh-muc",
        hoSoTab: "01_tonghop",
        catalogTab: "01_bpcm",
        isCanonical: true,
        canonicalHash: "#/danh-muc?tab=01_bpcm",
      };
    }
    return parseHash(window.location.hash);
  });

  // Lắng nghe sự kiện hashchange và popstate để hỗ trợ nút Back/Forward
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashSync = () => {
      const parsed = parseHash(window.location.hash);
      setRoute(parsed);
      // Nếu hash hiện tại chưa chuẩn (ví dụ rỗng hoặc thiếu param), chuẩn hóa lại URL mà không đẩy history mới
      if (!parsed.isCanonical && window.location.hash !== parsed.canonicalHash) {
        window.history.replaceState(null, "", parsed.canonicalHash);
      }
    };

    // Khởi tạo lần đầu
    handleHashSync();

    window.addEventListener("hashchange", handleHashSync);
    window.addEventListener("popstate", handleHashSync);

    return () => {
      window.removeEventListener("hashchange", handleHashSync);
      window.removeEventListener("popstate", handleHashSync);
    };
  }, []);

  const navigate = useCallback(
    (tab: MainTabType, subTab?: HoSoTabType, catTab?: CatalogTab) => {
      let targetHash = "#/danh-muc?tab=01_bpcm";

      if (tab === "danh-muc") {
        const targetCat = catTab || route.catalogTab || "01_bpcm";
        targetHash = `#/danh-muc?tab=${targetCat}`;
      } else if (tab === "ho-so") {
        const targetSub = subTab || route.hoSoTab || "01_tonghop";
        targetHash = `#/ho-so?sub=${targetSub}`;
      } else if (tab === "chung-tu") {
        targetHash = "#/chung-tu";
      }

      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    },
    [route.catalogTab, route.hoSoTab],
  );

  const setHoSoTab = useCallback(
    (subTab: HoSoTabType) => {
      const targetHash = `#/ho-so?sub=${subTab}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    },
    [],
  );

  const setCatalogTab = useCallback(
    (catTab: CatalogTab) => {
      const targetHash = `#/danh-muc?tab=${catTab}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    },
    [],
  );

  return {
    activeTab: route.activeTab,
    hoSoTab: route.hoSoTab,
    catalogTab: route.catalogTab,
    navigate,
    setHoSoTab,
    setCatalogTab,
  };
}
