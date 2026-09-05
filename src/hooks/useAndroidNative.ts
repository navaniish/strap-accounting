import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { requestNotificationPermissions } from '../utils/nativeNotifications';
import { checkAndTriggerPendingNotifications } from '../utils/crossAppNotificationSync';

interface AndroidNativeOptions {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  activeModal?: boolean;
  closeActiveModal?: () => void;
}

export const useAndroidNative = ({
  activeTab,
  setActiveTab,
  activeModal,
  closeActiveModal
}: AndroidNativeOptions = {}) => {
  const lastBackPressTime = useRef<number>(0);

  // 1. Android Native Status Bar Styling & Notification Permission Setup
  useEffect(() => {
    const initPermissionsAndBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0F172A' });
      } catch (err) {}
      await requestNotificationPermissions();
      await checkAndTriggerPendingNotifications();
    };
    initPermissionsAndBar();

    let stateListener: any;
    const initAppStateListener = async () => {
      try {
        stateListener = await CapApp.addListener('appStateChange', (state) => {
          if (state.isActive) {
            checkAndTriggerPendingNotifications();
          }
        });
      } catch (_) {}
    };

    initAppStateListener();

    return () => {
      if (stateListener && typeof stateListener.remove === 'function') {
        stateListener.remove();
      }
    };
  }, []);

  // 2. Android Native Network Status Listener
  useEffect(() => {
    let networkListener: any;

    const initNetworkListener = async () => {
      try {
        networkListener = await Network.addListener('networkStatusChange', (status: { connected: boolean }) => {
          if (!status.connected) {
            alert('⚠️ Device Offline: Strap will sync data automatically when back online.');
          }
        });
      } catch (err) {
        // Web fallback
      }
    };

    initNetworkListener();

    return () => {
      if (networkListener && typeof networkListener.remove === 'function') {
        networkListener.remove();
      }
    };
  }, []);

  // 3. Android Native Hardware Back Button & Gesture Navigation
  useEffect(() => {
    let backButtonListener: any;

    const initBackButton = async () => {
      try {
        backButtonListener = await CapApp.addListener('backButton', () => {
          // Rule 1: If a modal is open, close modal first!
          if (activeModal && closeActiveModal) {
            closeActiveModal();
            return;
          }

          // Rule 2: If not on home tab, go back to main dashboard!
          if (activeTab && activeTab !== 'dashboard' && activeTab !== 'submissions' && setActiveTab) {
            setActiveTab('dashboard');
            return;
          }

          // Rule 3: On main dashboard, double-tap back button exits the app!
          const now = Date.now();
          if (now - lastBackPressTime.current < 2000) {
            CapApp.exitApp();
          } else {
            lastBackPressTime.current = now;
            // Native Android Toast effect
            const exitBanner = document.createElement('div');
            exitBanner.innerText = 'Press back again to exit Strap';
            exitBanner.className = 'fixed bottom-12 left-1/2 -translate-x-1/2 bg-trust-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl z-50 animate-bounce';
            document.body.appendChild(exitBanner);
            setTimeout(() => {
              if (document.body.contains(exitBanner)) {
                document.body.removeChild(exitBanner);
              }
            }, 2000);
          }
        });
      } catch (err) {
        // Web browser environment
      }
    };

    initBackButton();

    return () => {
      if (backButtonListener && typeof backButtonListener.remove === 'function') {
        backButtonListener.remove();
      }
    };
  }, [activeTab, setActiveTab, activeModal, closeActiveModal]);
};
