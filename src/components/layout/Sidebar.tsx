import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
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
  Rocket,
  X,
  Building2,
  ChevronDown,
  Check,
  PlusCircle,
  User,
  LogOut,
  Trash2,
  Sun,
  Moon,
  FolderArchive
} from 'lucide-react';

import { AccountDetailsModal } from '../settings/AccountDetailsModal';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    currentRole,
    activeTab,
    setActiveTab,
    salesEntries,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    currentBusiness,
    allBusinesses,
    switchBusiness,
    createNewBusiness,
    deleteBusiness,
    currentUser,
    logout,
    darkMode,
    toggleDarkMode
  } = useApp();

  const [showBusinessDropdown, setShowBusinessDropdown] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState<boolean>(false);
  const [newBizName, setNewBizName] = useState<string>('');
  const [newBizType, setNewBizType] = useState<string>('Fashion & Footwear Store');

  const pendingVerificationCount = salesEntries.filter(e => e.status === 'UNDER_REVIEW').length;
  const correctionCount = salesEntries.filter(e => e.status === 'CORRECTION_REQUIRED').length;

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    await createNewBusiness(newBizName.trim(), newBizType);
    setNewBizName('');
    setShowRegisterModal(false);
    setShowBusinessDropdown(false);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'verification',
      label: 'Verification & Approvals',
      icon: <CheckSquare className="w-4 h-4 text-emerald-500" />,
      badge: pendingVerificationCount > 0 ? `${pendingVerificationCount} Pending` : undefined,
      badgeColor: 'bg-emerald-600 text-white animate-pulse font-extrabold'
    },
    {
      id: 'calendar',
      label: 'Sales Calendar',
      icon: <Calendar className="w-4 h-4" />
    },
    { id: 'vault', label: 'Document Vault', icon: <FolderArchive className="w-4 h-4 text-gold-500" /> },
    { id: 'shops', label: 'Stores & Outlets', icon: <Store className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff Management', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Business Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const staffNavItems: NavItem[] = [
    { id: 'daily-sales', label: 'Submit Daily Sales', icon: <Receipt className="w-4 h-4 text-growth-600" /> },
    {
      id: 'my-reports',
      label: 'My Submissions',
      icon: <History className="w-4 h-4" />,
      badge: correctionCount > 0 ? `${correctionCount} Action` : undefined,
      badgeColor: 'bg-urgency-600 text-white'
    },
    { id: 'vault', label: 'Store Vault', icon: <FolderArchive className="w-4 h-4 text-gold-500" /> },
    { id: 'my-shops', label: 'Assigned Shops', icon: <Store className="w-4 h-4" /> }
  ];

  const superAdminNavItems: NavItem[] = [
    { id: 'super-admin', label: 'Platform Operations', icon: <ShieldAlert className="w-4 h-4 text-tier-600" /> },
    { id: 'platform-audit', label: 'Cross-Tenant Audit Logs', icon: <FileText className="w-4 h-4 text-trust-600" /> }
  ];

  const currentNavItems =
    currentRole === 'SUPER_ADMIN' ? superAdminNavItems :
      currentRole === 'STAFF' ? staffNavItems : adminNavItems;

  const renderBusinessSwitcher = () => (
    <div className="relative">
      <div className="px-3 pb-1 text-[10px] font-bold text-trust-400 uppercase tracking-wider">
        Active Business Tenant
      </div>

      <button
        onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
        className="w-full p-2.5 bg-trust-50 hover:bg-trust-100 border border-trust-200 rounded-xl flex items-center justify-between transition-all group"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sapphire-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
            {currentBusiness.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-left min-w-0">
            <div className="font-extrabold text-xs text-trust-900 truncate">
              {currentBusiness.name}
            </div>
            <div className="text-[10px] text-trust-500 font-mono truncate">
              {currentBusiness.workspaceId}
            </div>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-trust-400 group-hover:text-trust-700 transition-transform ${showBusinessDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Business Dropdown Menu */}
      {showBusinessDropdown && (
        <div className="mt-2 bg-white border border-trust-200 rounded-xl shadow-2xl p-2 space-y-1 z-30 animate-scale-up font-sans">
          <div className="px-2 py-1 text-[10px] font-bold text-trust-400 uppercase border-b border-trust-100">
            Switch Business Workspace
          </div>

          {allBusinesses.map(b => {
            const isCurrent = b.id === currentBusiness.id;
            return (
              <div
                key={b.id}
                className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-all ${
                  isCurrent ? 'bg-sapphire-50 text-sapphire-900 font-bold border border-sapphire-200' : 'hover:bg-trust-50 text-trust-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    switchBusiness(b.id);
                    setShowBusinessDropdown(false);
                  }}
                  className="min-w-0 flex-1 text-left pr-2"
                >
                  <div className="truncate font-extrabold">{b.name}</div>
                  <div className="text-[10px] opacity-70 font-mono">{b.workspaceId}</div>
                </button>

                <div className="flex items-center space-x-1 shrink-0">
                  {isCurrent && <Check className="w-4 h-4 text-sapphire-600" />}
                  {allBusinesses.length > 1 && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete business workspace "${b.name}"?`)) {
                          await deleteBusiness(b.id);
                          setShowBusinessDropdown(false);
                        }
                      }}
                      className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={`Delete ${b.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => {
              setShowRegisterModal(true);
              setShowBusinessDropdown(false);
            }}
            className="w-full p-2 mt-1 rounded-lg text-left text-xs font-bold text-sapphire-600 hover:bg-sapphire-50 border border-dashed border-sapphire-200 flex items-center space-x-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Register New Business</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderUserProfileSection = () => (
    <div className="pt-4 border-t border-trust-200 space-y-3 font-sans">
      <button
        onClick={() => setShowAccountDetailsModal(true)}
        className="w-full flex items-center justify-between p-2.5 bg-trust-50 hover:bg-sapphire-50/80 rounded-xl border border-trust-200 hover:border-sapphire-300 transition-all text-left group"
        title="View Account Details & Settings"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-trust-900 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            <User className="w-4 h-4 text-sapphire-400" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-trust-900 group-hover:text-sapphire-700 truncate">
              {currentUser?.name || 'User'}
            </div>
            <div className="text-[10px] text-trust-500 font-mono truncate">
              {currentUser?.email || currentUser?.staffIdNumber || 'Account Details'}
            </div>
          </div>
        </div>

        <span className="badge-tier text-[9px] px-2 py-0.5 rounded-full shrink-0 font-bold">
          {currentRole}
        </span>
      </button>

      <button
        onClick={() => toggleDarkMode()}
        className="w-full py-2 px-3 bg-trust-100 hover:bg-trust-200 text-trust-800 font-bold text-xs rounded-xl flex items-center justify-between transition-all"
      >
        <span className="flex items-center space-x-2">
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-mono border border-trust-300">
          {darkMode ? 'DARK 🌙' : 'LIGHT ☀️'}
        </span>
      </button>

      <button
        onClick={() => logout()}
        className="w-full py-2.5 px-3 bg-urgency-50 hover:bg-urgency-100 border border-urgency-200 text-urgency-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs"
      >
        <LogOut className="w-4 h-4 text-urgency-600" />
        <span>Sign Out</span>
      </button>

      <AccountDetailsModal
        isOpen={showAccountDetailsModal}
        onClose={() => setShowAccountDetailsModal(false)}
      />
    </div>
  );

  const renderNavButtons = (closeMobileOnClick = false) => (
    <nav className="space-y-1">
      <div className="px-3 pb-2 text-[10px] font-bold text-trust-400 uppercase tracking-wider">
        {currentRole === 'SUPER_ADMIN' ? 'Platform Operations' : currentRole === 'STAFF' ? 'Staff Operations' : 'Business Management'}
      </div>

      {currentNavItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (closeMobileOnClick) setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                ? 'bg-sapphire-600 text-white shadow-sapphire-glow font-bold'
                : 'text-trust-700 hover:bg-trust-100 hover:text-trust-900'
              }`}
          >
            <div className="flex items-center space-x-3">
              <span className={isActive ? 'text-white' : 'text-trust-500'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-trust-200 text-trust-700'}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-trust-200 min-h-screen pt-6 px-5 pb-5 flex flex-col justify-between hidden md:flex shrink-0 font-sans">
        <div className="space-y-6">
          <div className="font-extrabold text-lg tracking-tight text-trust-900 border-b border-trust-100 pb-3">
            GenZ Platform
          </div>
          {currentRole !== 'STAFF' && renderBusinessSwitcher()}
          {renderNavButtons(false)}
        </div>

        {renderUserProfileSection()}
      </aside>

      {/* 2. MOBILE SLIDE-OVER LEFT SIDEBAR DRAWER */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex font-sans">

          {/* Backdrop Filter Overlay */}
          <div
            className="fixed inset-0 bg-trust-950/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Left Slide Drawer Container - Mid-Width with Top Space */}
          <aside className="relative w-[75vw] sm:w-72 max-w-[300px] bg-white h-full min-h-[100dvh] max-h-[100dvh] px-4 sm:px-5 pb-4 flex flex-col justify-between shadow-2xl z-50 border-r border-trust-200 animate-slide-left pt-[max(1.75rem,calc(env(safe-area-inset-top)+1rem))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-hidden">
            <div className="space-y-5 overflow-y-auto flex-1 pr-1">

              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between border-b border-trust-200 pb-4 shrink-0">
                <div>
                  <div className="font-extrabold text-sm text-trust-900">GenZ Platform</div>
                  <div className="text-[11px] text-trust-500 font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-sapphire-600" />
                    <span className="truncate max-w-[180px]">{currentBusiness.name}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 rounded-xl bg-trust-100 text-trust-600 hover:text-trust-900 border border-trust-200 shrink-0"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {currentRole !== 'STAFF' && renderBusinessSwitcher()}

              {/* Mobile Nav Links */}
              {renderNavButtons(true)}

            </div>

            <div className="pt-4 border-t border-trust-100 shrink-0">
              {renderUserProfileSection()}
            </div>
          </aside>

        </div>
      )}

      {/* 3. REGISTER NEW BUSINESS MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-trust-950/75 backdrop-blur-sm animate-fade-in font-sans overflow-y-auto pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-[92vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto shadow-2xl border border-trust-200 space-y-5 animate-scale-up">

            <div className="flex items-center justify-between border-b border-trust-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-sapphire-50 border border-sapphire-200 text-sapphire-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-trust-900">Register New Business</h3>
                  <p className="text-[10px] text-trust-500 font-mono">Create multi-branch tenant workspace</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-xl bg-trust-100 text-trust-600 hover:text-trust-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterBusiness} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-trust-700 mb-1">
                  Business Name <span className="text-urgency-600">*</span>
                </label>
                <input
                  type="text"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Royal Shoe Store, Fashion Hub"
                  className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-extrabold text-trust-900 focus:ring-2 focus:ring-sapphire-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-trust-700 mb-1">Business Type</label>
                <select
                  value={newBizType}
                  onChange={(e) => setNewBizType(e.target.value)}
                  className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-900 focus:ring-2 focus:ring-sapphire-500"
                >
                  <option value="Fashion & Footwear Store">Fashion </option>
                  <option value="Retail Multi-Branch Store">Footwear Store</option>

                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 bg-trust-100 hover:bg-trust-200 text-trust-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-xl shadow-sapphire-glow flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register & Switch Workspace</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
};
