import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, X, Bell, Building2, ShieldCheck, CheckCircle, Clock, Sun, Moon } from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const { 
    isMobileSidebarOpen, 
    toggleMobileSidebar, 
    currentBusiness, 
    notifications, 
    markNotificationRead,
    darkMode,
    toggleDarkMode
  } = useApp();

  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-trust-900 text-white border-b border-trust-800 sticky top-0 z-30 md:hidden font-sans pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
      <div className="px-4 py-3 flex items-center justify-between">
        
        {/* Left Section: Mobile Menu Hamburger Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-xl bg-trust-800 hover:bg-trust-700 text-white border border-trust-700 flex items-center justify-center min-w-[38px] min-h-[38px]"
            title="Toggle Sidebar Menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div>
            <div className="font-extrabold text-sm tracking-tight text-white">GenZ</div>
            <div className="text-[10px] text-trust-400 font-mono truncate max-w-[140px]">
              {currentBusiness.name}
            </div>
          </div>
        </div>

        {/* Right Section: Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-trust-800 hover:bg-trust-700 text-trust-300 hover:text-white border border-trust-700 relative min-w-[38px] min-h-[38px]"
          >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-urgency-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border border-trust-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

          {/* Notifications Dropdown Container */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-trust-900 rounded-2xl shadow-2xl border border-trust-200 p-4 space-y-3 z-50 animate-scale-up font-sans">
              <div className="flex items-center justify-between border-b border-trust-100 pb-2">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-trust-900">
                  <Bell className="w-4 h-4 text-sapphire-600" />
                  <span>Realtime Notifications</span>
                </div>
                <button onClick={() => setShowNotifications(false)} className="text-trust-400 hover:text-trust-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-trust-400 text-center py-4">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 rounded-xl text-xs space-y-1 cursor-pointer transition-all ${
                        n.read ? 'bg-trust-50 text-trust-600' : 'bg-sapphire-50 border border-sapphire-200 text-sapphire-900 font-medium'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span>{n.title}</span>
                        <span className="text-[10px] opacity-60 font-mono">{n.timestamp.substring(11, 16)}</span>
                      </div>
                      <p className="text-[11px] leading-tight opacity-90">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
