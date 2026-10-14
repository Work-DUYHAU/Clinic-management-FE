import React, { useState, lazy, Suspense } from "react";
import {
  Sidebar,
  type MainTabType,
  type HoSoTabType,
} from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { ToastProvider } from "./context/ToastContext";
import { SmartCaProvider } from "./context/SmartCaContext";
import { SignModalProvider } from "./context/SignModalContext";
import type { HoSoDieuChinh09Item } from "./types/hs09DieuChinhTypes";
import { useAppRouter } from "./hooks/useAppRouter";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const DanhMucPage = lazy(() =>
  import("./pages/DanhMucPage").then((m) => ({ default: m.DanhMucPage })),
);
const Hs01TongHopTab = lazy(() =>
  import("./components/ho-so/01-tonghop/Hs01TongHopTab").then((m) => ({
    default: m.Hs01TongHopTab,
  })),
);
const Hs09DieuChinhTab = lazy(() =>
  import("./components/ho-so/09-dieuchinh/Hs09DieuChinhTab").then((m) => ({
    default: m.Hs09DieuChinhTab,
  })),
);
const ChungTuPage = lazy(() =>
  import("./components/chung-tu/ChungTuPage").then((m) => ({
    default: m.ChungTuPage,
  })),
);
import { KyHoSoPage } from "./pages/KyHoSoPage";

const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-64 w-full">
    <div className="flex flex-col items-center gap-2">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-medium">
        Đang tải dữ liệu mô-đun...
      </span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { activeTab, hoSoTab, catalogTab, navigate, setCatalogTab } =
    useAppRouter();
  const [hs09Items, setHs09Items] = useState<HoSoDieuChinh09Item[]>(() => {
    try {
      sessionStorage.removeItem("clinic_hs09_items_cache");
    } catch {}
    return [];
  });

  const pendingXuattoanCount = hs09Items.filter(
    (x) => x.trangThai === "cho_xu_ly",
  ).length;

  const handleNavigate = (tab: MainTabType, subTab?: HoSoTabType) => {
    navigate(tab, subTab);
  };

  return (
    <ToastProvider>
      <SmartCaProvider>
        <SignModalProvider>
          <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased font-sans overflow-hidden">
            {/* Left Sidebar Navigation */}
            <Sidebar
              activeTab={activeTab}
              hoSoTab={hoSoTab}
              onNavigate={handleNavigate}
              pendingXuattoanCount={pendingXuattoanCount}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] h-full overflow-hidden">
              <Navbar
                activeTab={activeTab}
                hoSoTab={hoSoTab}
                catalogTab={catalogTab}
              />

              <main
                className={`flex-1 p-2.5 md:p-3 max-w-[1600px] w-full mx-auto ${activeTab === "ky-so" ? "overflow-hidden flex flex-col min-h-0" : "overflow-y-auto no-scrollbar"}`}
              >
                <ErrorBoundary>
                  {/* 1. DANH MỤC KCB BHYT (6 BIỂU MẪU) */}
                  {activeTab === "danh-muc" && (
                    <Suspense fallback={<PageLoadingFallback />}>
                      <DanhMucPage
                        isActive={activeTab === "danh-muc"}
                        activeCatalogTab={catalogTab}
                        onCatalogTabChange={setCatalogTab}
                      />
                    </Suspense>
                  )}

                  {/* 2. HỒ SƠ KCB BHYT (01/BH TỔNG HỢP & 09/BH XUẤT TOÁN) */}
                  {activeTab === "ho-so" && (
                    <Suspense fallback={<PageLoadingFallback />}>
                      <div className="space-y-3 pb-4">
                        {hoSoTab === "01_tonghop" && <Hs01TongHopTab />}
                        {hoSoTab === "09_xuattoan" && (
                          <Hs09DieuChinhTab
                            items={hs09Items}
                            onItemsChange={setHs09Items}
                          />
                        )}
                      </div>
                    </Suspense>
                  )}

                  {/* 3. HỒ SƠ CHỨNG TỪ & GIẤY TỜ ĐIỆN TỬ (TT 25 & BHXH 2025) */}
                  {activeTab === "chung-tu" && (
                    <Suspense fallback={<PageLoadingFallback />}>
                      <ChungTuPage isActive={activeTab === "chung-tu"} />
                    </Suspense>
                  )}

                  {/* 4. KÝ SỐ & GỬI BHXH (KÝ HỒ SƠ TỔNG HỢP) */}
                  {activeTab === "ky-so" && (
                    <KyHoSoPage isActive={activeTab === "ky-so"} />
                  )}
                </ErrorBoundary>
              </main>
            </div>
          </div>
        </SignModalProvider>
      </SmartCaProvider>
    </ToastProvider>
  );
};

export default App;
