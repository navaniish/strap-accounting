// Mobile Device Permissions & Hardware Consent Engine

export interface MobileDevicePermissions {
  camera: 'GRANTED' | 'DENIED' | 'PROMPT';
  gallery: 'GRANTED' | 'DENIED' | 'PROMPT';
  biometric: 'GRANTED' | 'DENIED' | 'PROMPT';
  notifications: 'GRANTED' | 'DENIED' | 'PROMPT';
  location: 'GRANTED' | 'DENIED' | 'PROMPT';
}

const STORAGE_KEY = 'genz_mobile_permissions';

export const getStoredPermissions = (): MobileDevicePermissions => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    camera: 'GRANTED',
    gallery: 'GRANTED',
    biometric: 'GRANTED',
    notifications: 'GRANTED',
    location: 'GRANTED'
  };
};

export const updatePermissionState = (
  permissionKey: keyof MobileDevicePermissions,
  state: 'GRANTED' | 'DENIED'
): MobileDevicePermissions => {
  const current = getStoredPermissions();
  const updated = { ...current, [permissionKey]: state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Canvas Image Compression Engine (Max 1920x1080 @ 75% JPEG/WebP quality)
export const compressReceiptImage = (file: File): Promise<{ compressedDataUrl: string; originalSizeKb: number; compressedSizeKb: number; savingsPct: number }> => {
  return new Promise((resolve) => {
    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1024;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.60);
        const headLength = 'data:image/jpeg;base64,'.length;
        const compressedSizeKb = Math.round(((compressedDataUrl.length - headLength) * 3) / 4 / 1024);
        const savingsPct = originalSizeKb > 0 ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100)) : 0;

        resolve({
          compressedDataUrl,
          originalSizeKb,
          compressedSizeKb,
          savingsPct
        });
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};
