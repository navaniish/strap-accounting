import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoginModal } from '../auth/LoginModal';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Bell, 
  X, 
  User, 
  LogOut, 
  Key,
  Menu,
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Calendar,
  FileText,
  DollarSign,
  Boxes,
  Store,
  Users,
  Settings,
  ShieldAlert,
  History,
  Rocket
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentBusiness, 
    allBusinesses, 
    switchBusiness, 
    notifications, 
    markNotificationRead,
    currentUser,
    logout,
    currentRole,
    activeTab,
    setActiveTab,
    salesEntries,
    isMobileSidebarOpen,
    toggleMobileSidebar
  } = useApp();

  const [showBusinessMenu, setShowBusinessMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingVerificationCount = salesEntries.filter(e => e.status === 'UNDER_REVIEW').length;
  const correctionCount = salesEntries.filter(e => e.status === 'CORRECTION_REQUIRED').length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'daily-sales', label: 'Daily Sales', icon: <Receipt className="w-4 h-4" /> },
    { id: 'verification', label: 'Verification Queue', icon: <CheckSquare className="w-4 h-4" />, badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined },
    { id: 'calendar', label: 'Sales Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'reports', label: 'PDF Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'finance', label: 'Financial Overview', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'stock', label: 'Stock Overview', icon: <Boxes className="w-4 h-4" /> },
    { id: 'shops', label: 'Shops', icon: <Store className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const staffNavItems: NavItem[] = [
    { id: 'daily-sales', label: 'Submit Daily Sales', icon: <Receipt className="w-4 h-4 text-growth-500" /> },
    { id: 'my-reports', label: 'My Submissions', icon: <History className="w-4 h-4" />, badge: correctionCount > 0 ? `${correctionCount} Action` : undefined },
    { id: 'my-shops', label: 'Assigned Shops', icon: <Store className="w-4 h-4" /> }
  ];

  const superAdminNavItems: NavItem[] = [
    { id: 'super-admin', label: 'Platform Operations', icon: <ShieldAlert className="w-4 h-4 text-tier-500" /> },
    { id: 'platform-audit', label: 'Cross-Tenant Audit Logs', icon: <FileText className="w-4 h-4 text-trust-400" /> }
  ];

  const currentNavItems = 
    currentRole === 'SUPER_ADMIN' ? superAdminNavItems :
    currentRole === 'STAFF' ? staffNavItems : adminNavItems;

  return (
    <>
      <header className="bg-trust-900 border-b border-trust-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between py-2.5">
          
          {/* Left Section: Mobile Menu Toggle + Logo & Workspace */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Mobile Hamburger Button (Triggers Left Slide-Over Mobile Sidebar) */}
            <button
              onClick={() => {
                toggleMobileSidebar();
                setShowNotifications(false);
                setShowBusinessMenu(false);
              }}
              className="p-2 rounded-xl bg-trust-800 hover:bg-trust-700 text-trust-300 hover:text-white border border-trust-700 md:hidden flex items-center justify-center min-w-[40px] min-h-[40px]"
              title="Mobile Menu Sidebar"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            {/* Brand Title */}
            <div className="flex items-center cursor-pointer">
              <div className="leading-tight">
                <div className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  GenZ
                </div>
                <p className="text-[10px] text-trust-400 font-medium hidden md:block">
                  Shop Management Platform
                </p>
              </div>
            </div>

            <div className="h-5 w-px bg-trust-800 hidden sm:block" />

            {/* Workspace Selector Dropdown */}
            {currentRole !== 'SUPER_ADMIN' && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBusinessMenu(!showBusinessMenu);
                    setShowNotifications(false);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-trust-800/90 hover:bg-trust-800 px-2.5 sm:px-3 py-1.5 rounded-xl border border-trust-700 text-xs font-semibold text-trust-100 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-growth-500 shrink-0" />
                  <span className="max-w-[90px] xs:max-w-[120px] sm:max-w-[170px] truncate">{currentBusiness.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-trust-400 shrink-0" />
                </button>

                {/* Workspace Dropdown */}
                {showBusinessMenu && (
                  <div className="absolute left-0 mt-2 w-72 bg-trust-900 border border-trust-700 rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-trust-400 border-b border-trust-800">
                      Switch Business Workspace
                    </div>
                    <div className="py-1">
                      {allBusinesses.map(b => {
                        const isSelected = b.id === currentBusiness.id;
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              switchBusiness(b.id);
                              setShowBusinessMenu(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-trust-800 transition-colors ${
                              isSelected ? 'bg-trust-800 font-semibold text-sapphire-400' : 'text-trust-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <Building2 className="w-4 h-4 text-trust-400" />
                              <div>
                                <div className="font-semibold text-white">{b.name}</div>
                                <div className="text-[10px] text-trust-400 font-mono">{b.workspaceId}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-growth-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Section: Notifications & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Notification Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowBusinessMenu(false);
                  setShowMobileMenu(false);
                }}
                className="p-2 rounded-xl bg-trust-800 hover:bg-trust-700 text-trust-300 hover:text-white border border-trust-700 transition-colors relative min-w-[38px] min-h-[38px] flex items-center justify-center"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-urgency-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-trust-900 rounded-2xl shadow-2xl border border-trust-200 overflow-hidden z-50">
                  <div className="p-3.5 bg-trust-900 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-sapphire-400" />
                      <span className="font-bold text-xs">Activity Notifications</span>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="text-trust-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-trust-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-trust-400 text-xs">No active notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3.5 text-xs cursor-pointer transition-colors ${
                            n.read ? 'bg-white opacity-70' : 'bg-sapphire-50/40 hover:bg-sapphire-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold ${
                              n.type === 'success' ? 'text-growth-700' : n.type === 'warning' ? 'text-focus-700' : 'text-sapphire-700'
                            }`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-trust-400">{n.timestamp}</span>
                          </div>
                          <p className="text-trust-600 leading-relaxed text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Account Profile Control */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-trust-800/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-trust-700 text-xs">
                <div className="w-6 h-6 rounded-full bg-sapphire-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  {currentUser.name.substring(0, 1)}
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <div className="font-bold text-white max-w-[110px] truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-trust-400 font-mono">
                    {currentUser.staffIdNumber ? `ID: ${currentUser.staffIdNumber}` : currentUser.role}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1 rounded hover:bg-trust-700 text-trust-400 hover:text-urgency-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>

      </header>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};
