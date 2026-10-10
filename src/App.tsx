import React, { useState } from 'react';
import { Sidebar, type MainTabType, type HoSoTabType } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DanhMucPage } from './pages/DanhMucPage';
import { Hs01TongHopTab } from './components/ho-so/01-tonghop/Hs01TongHopTab';
import { Hs09DieuChinhTab } from './components/ho-so/09-dieuchinh/Hs09DieuChinhTab';
import { ChungTuPage } from './components/chung-tu/ChungTuPage';
import { ToastProvider } from './context/ToastContext';
import { SmartCaProvider } from './context/SmartCaContext';
import { SignModalProvider } from './context/SignModalContext';
import type { HoSoDieuChinh09Item } from './types/hs09DieuChinhTypes';

import { useAppRouter } from './hooks/useAppRouter';

export const App: React.FC = () => {
  const {
    activeTab,
    hoSoTab,
    catalogTab,
    navigate,
    setCatalogTab,
  } = useAppRouter();
  const [hs09Items, setHs09Items] = useState<HoSoDieuChinh09Item[]>(() => {
    // Xóa sạch cache cũ để reload trang tự động reset
    try {
      sessionStorage.removeItem('clinic_hs09_items_cache');
    } catch {}
    return [];
  });

  const pendingXuattoanCount = hs09Items.filter(
    (x) => x.trangThai === 'cho_xu_ly'
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

              <main className="flex-1 p-3 md:p-4 max-w-[1600px] w-full mx-auto overflow-y-auto no-scrollbar">
                {/* 1. DANH MỤC KCB BHYT (6 BIỂU MẪU) */}
                <div className={activeTab === 'danh-muc' ? 'block' : 'hidden'}>
                  <DanhMucPage
                    isActive={activeTab === 'danh-muc'}
                    activeCatalogTab={catalogTab}
                    onCatalogTabChange={setCatalogTab}
                  />
                </div>

                {/* 2. HỒ SƠ KCB BHYT (01/BH TỔNG HỢP & 09/BH XUẤT TOÁN) */}
                {activeTab === 'ho-so' && (
                  <div className="space-y-3 pb-4">
                    {hoSoTab === '01_tonghop' && <Hs01TongHopTab />}
                    {hoSoTab === '09_xuattoan' && (
                      <Hs09DieuChinhTab
                        items={hs09Items}
                        onItemsChange={setHs09Items}
                      />
                    )}
                  </div>
                )}

                {/* 3. HỒ SƠ CHỨNG TỪ & GIẤY TỜ ĐIỆN TỬ (TT 25 & BHXH 2025) */}
                {activeTab === 'chung-tu' && (
                  <ChungTuPage isActive={activeTab === 'chung-tu'} />
                )}
              </main>
            </div>
          </div>
        </SignModalProvider>
      </SmartCaProvider>
    </ToastProvider>
  );
};

export default App;
