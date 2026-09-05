import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const triggerLightHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (err) {
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }
};

export const triggerMediumHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (err) {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
};

export const triggerSuccessHaptic = async () => {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (err) {
    if (navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  }
};

export const triggerWarningHaptic = async () => {
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (err) {
    if (navigator.vibrate) {
      navigator.vibrate([80, 50, 100]);
    }
  }
};
