import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileHeader } from './components/layout/MobileHeader';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { BusinessDashboard } from './components/analytics/BusinessDashboard';
import { DailySalesSubmission } from './components/staff/DailySalesSubmission';
import { VerificationQueue } from './components/admin/VerificationQueue';
import { SalesCalendar } from './components/calendar/SalesCalendar';
import { ReportGenerator } from './components/reports/ReportGenerator';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { PlatformAuditLogs } from './components/superadmin/PlatformAuditLogs';
import { OnboardingWizard } from './components/settings/OnboardingWizard';
import { ShopManagement } from './components/admin/ShopManagement';
import { StaffManagement } from './components/admin/StaffManagement';
import { FinancialOverview } from './components/admin/FinancialOverview';
import { StockOverview } from './components/admin/StockOverview';
import { BusinessSettingsView } from './components/admin/BusinessSettingsView';
import { StaffSubmissionsView } from './components/staff/StaffSubmissionsView';
import { StaffAssignedShopsView } from './components/staff/StaffAssignedShopsView';
import { DocumentVault } from './components/admin/DocumentVault';
import { PullToRefresh } from './components/common/PullToRefresh';

const MainContent: React.FC = () => {
  const { activeTab, currentRole } = useApp();

  const renderTabContent = () => {
    // 1. Super Admin Portal Views
    if (currentRole === 'SUPER_ADMIN') {
      switch (activeTab) {
        case 'super-admin':
          return <SuperAdminDashboard />;
        case 'platform-audit':
          return <PlatformAuditLogs />;
        default:
          return <SuperAdminDashboard />;
      }
    }

    // 2. Staff Portal Views
    if (currentRole === 'STAFF') {
      const allowedStaffTabs = ['daily-sales', 'my-reports', 'vault', 'my-shops'];
      if (!allowedStaffTabs.includes(activeTab)) {
        return <DailySalesSubmission />;
      }
      switch (activeTab) {
        case 'daily-sales':
          return <DailySalesSubmission />;
        case 'my-reports':
          return <StaffSubmissionsView />;
        case 'vault':
          return <DocumentVault />;
        case 'my-shops':
          return <StaffAssignedShopsView />;
        default:
          return <DailySalesSubmission />;
      }
    }

    // 3. Business Admin Portal Views
    const adminAllowedTabs = [
      'dashboard', 'daily-sales', 'verification', 'calendar', 'vault',
      'reports', 'finance', 'stock', 'shops', 'staff', 'onboarding', 'settings'
    ];

    const safeTab = adminAllowedTabs.includes(activeTab) ? activeTab : 'dashboard';

    switch (safeTab) {
      case 'dashboard':
        return <BusinessDashboard />;
      case 'daily-sales':
        return <DailySalesSubmission />;
      case 'verification':
        return <VerificationQueue />;
      case 'calendar':
        return <SalesCalendar />;
      case 'vault':
        return <DocumentVault />;
      case 'reports':
        return <ReportGenerator />;
      case 'finance':
        return <FinancialOverview />;
      case 'stock':
        return <StockOverview />;
      case 'shops':
        return <ShopManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'onboarding':
        return <OnboardingWizard />;
      case 'settings':
        return <BusinessSettingsView />;
      default:
        return <BusinessDashboard />;
    }
  };

  return (
    <PullToRefresh>
      <main key={activeTab} className="flex-1 p-3 sm:p-5 lg:p-8 overflow-y-auto w-full max-w-full animate-slide-up min-h-0 flex flex-col">
        {renderTabContent()}
      </main>
    </PullToRefresh>
  );
};

import { DevicePermissionsModal } from './components/settings/DevicePermissionsModal';
import { useAndroidNative } from './hooks/useAndroidNative';

const AppShell: React.FC = () => {
  const { currentUser, authLoading, darkMode, activeTab, setActiveTab } = useApp();
  
  // Native Android Built-In Hardware Back Button, Gestures & Status Bar
  useAndroidNative({ activeTab, setActiveTab });

  const [showFirstRunPermissions, setShowFirstRunPermissions] = React.useState<boolean>(() => {
    return localStorage.getItem('app_first_run_permissions_prompted') !== 'true';
  });

  if (authLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans p-6 text-center ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-900 text-white'}`}>
        <div className="flex flex-col items-center space-y-5 max-w-sm w-full p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-1">
            <div className="text-base font-black tracking-wide text-white">Verifying Workspace Session</div>
            <p className="text-xs text-slate-400 font-medium">Validating Google identity & business authorizations...</p>
          </div>
          <div className="px-3 py-1 bg-blue-950/80 border border-blue-800 text-[10px] text-blue-300 font-mono rounded-full font-bold uppercase tracking-wider">
            AUTHENTICATING_SESSION...
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={darkMode ? 'dark text-slate-100' : ''}>
        <LoginPage />
      </div>
    );
  }

  return (
    <div className={`min-h-screen min-h-[100dvh] w-full max-w-full flex flex-col font-sans overflow-x-hidden transition-colors ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-trust-100 text-trust-900'}`}>
      <MobileHeader />
      <div className="flex flex-1 w-full max-w-full overflow-x-hidden min-h-0">
        <Sidebar />
        <MainContent />
      </div>
      <DevicePermissionsModal 
        isOpen={showFirstRunPermissions} 
        onClose={() => setShowFirstRunPermissions(false)} 
      />
    </div>
  );
};

import { SplashScreen } from './components/common/SplashScreen';

export function App() {
  return (
    <AppProvider>
      <SplashScreen />
      <AppShell />
    </AppProvider>
  );
}

export default App;
