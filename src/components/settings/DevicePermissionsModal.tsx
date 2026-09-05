import React, { useState } from 'react';
import { getStoredPermissions, updatePermissionState, MobileDevicePermissions } from '../../utils/mobilePermissions';
import { Camera, Image, ShieldCheck, Bell, MapPin, CheckCircle2, X, Smartphone } from 'lucide-react';

export const DevicePermissionsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [perms, setPerms] = useState<MobileDevicePermissions>(getStoredPermissions());
  const [requestingKey, setRequestingKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerNativeOSPermission = async (key: keyof MobileDevicePermissions) => {
    setRequestingKey(key);
    try {
      if (key === 'camera') {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
        }
      } else if (key === 'notifications') {
        if ('Notification' in window) {
          await Notification.requestPermission();
        }
      } else if (key === 'location') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(() => {}, () => {});
        }
      }
    } catch (e) {
      console.warn('Native permission prompt completed/bypassed:', e);
    } finally {
      setRequestingKey(null);
    }
  };

  const handleToggle = async (key: keyof MobileDevicePermissions) => {
    const nextState = perms[key] === 'GRANTED' ? 'DENIED' : 'GRANTED';
    if (nextState === 'GRANTED') {
      await triggerNativeOSPermission(key);
    }
    const updated = updatePermissionState(key, nextState);
    setPerms(updated);
  };

  const permItems = [
    {
      key: 'camera' as const,
      title: 'Live Camera Access',
      subtitle: 'Captures daily sales receipt photo proof via camera viewfinder',
      icon: <Camera className="w-5 h-5 text-sapphire-600 shrink-0" />,
      osKey: 'android.permission.CAMERA'
    },
    {
      key: 'gallery' as const,
      title: 'Media Storage & Photos',
      subtitle: 'Upload saved receipt images from device gallery',
      icon: <Image className="w-5 h-5 text-growth-600 shrink-0" />,
      osKey: 'android.permission.READ_MEDIA_IMAGES'
    },
    {
      key: 'notifications' as const,
      title: 'Push Closing Reminders',
      subtitle: 'Automated 18:00 IST daily sales closing alerts',
      icon: <Bell className="w-5 h-5 text-focus-600 shrink-0" />,
      osKey: 'android.permission.POST_NOTIFICATIONS'
    },
    {
      key: 'location' as const,
      title: 'Shop Proximity Audit',
      subtitle: 'GPS verification when submitting daily sales at store branch',
      icon: <MapPin className="w-5 h-5 text-urgency-600 shrink-0" />,
      osKey: 'android.permission.ACCESS_FINE_LOCATION'
    },
    {
      key: 'biometric' as const,
      title: 'Hardware Biometric Auth',
      subtitle: 'One-touch Fingerprint / Face ID sign in',
      icon: <ShieldCheck className="w-5 h-5 text-tier-600 shrink-0" />,
      osKey: 'android.permission.USE_BIOMETRIC'
    }
  ];

  const handleGrantAll = async () => {
    // Request real native Android OS permissions sequentially
    await triggerNativeOSPermission('camera');
    await triggerNativeOSPermission('notifications');
    await triggerNativeOSPermission('location');

    const allKeys: (keyof MobileDevicePermissions)[] = ['camera', 'gallery', 'biometric', 'notifications', 'location'];
    allKeys.forEach(k => updatePermissionState(k, 'GRANTED'));
    setPerms(getStoredPermissions());
    localStorage.setItem('app_first_run_permissions_prompted', 'true');
    onClose();
  };

  const handleClose = () => {
    localStorage.setItem('app_first_run_permissions_prompted', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-trust-200 animate-scale-up max-h-[90vh] flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-trust-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sapphire-50 border border-sapphire-200 text-sapphire-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-sapphire-600 uppercase tracking-wider">Mobile Android OS Setup</div>
              <h2 className="text-base sm:text-lg font-extrabold text-trust-900 leading-tight">Device Permissions</h2>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 rounded-xl bg-trust-100 hover:bg-trust-200 text-trust-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] sm:text-xs text-trust-600 leading-relaxed bg-sapphire-50/70 p-3 rounded-2xl border border-sapphire-100 shrink-0">
          Please allow Camera and Push Notification permissions so staff can capture daily receipt photo proofs and receive daily store closing reminders.
        </p>

        {/* Permissions Items List - Responsive Scroll */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[300px] sm:max-h-[360px]">
          {permItems.map(item => {
            const isGranted = perms[item.key] === 'GRANTED';
            const isRequesting = requestingKey === item.key;

            return (
              <div 
                key={item.key}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  isGranted ? 'bg-white border-growth-200 shadow-xs' : 'bg-trust-50/80 border-trust-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-trust-100 shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-trust-900 text-xs truncate">{item.title}</div>
                    <div className="text-[10px] text-trust-500 line-clamp-1">{item.subtitle}</div>
                    <div className="text-[8px] font-mono text-trust-400 mt-0.5 truncate">{item.osKey}</div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isRequesting}
                  onClick={() => handleToggle(item.key)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all min-h-[36px] flex items-center justify-center ${
                    isGranted 
                      ? 'bg-growth-500 hover:bg-growth-600 text-white shadow-xs' 
                      : 'bg-trust-200 text-trust-700 hover:bg-trust-300 border border-trust-300'
                  }`}
                >
                  {isRequesting ? 'PROMPTING...' : isGranted ? 'ALLOWED ✓' : 'ALLOW'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions - Stacked on Mobile, Row on Desktop */}
        <div className="pt-3 border-t border-trust-100 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGrantAll}
            className="w-full sm:w-auto px-5 py-3 bg-growth-600 hover:bg-growth-700 active:bg-growth-800 text-white font-extrabold text-xs rounded-xl shadow-growth-glow transition-all flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Allow All Native OS Permissions</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-trust-100 hover:bg-trust-200 text-trust-700 font-bold text-xs rounded-xl transition-colors min-h-[40px]"
          >
            Save & Continue
          </button>
        </div>

      </div>
    </div>
  );
};
