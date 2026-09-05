import { LocalNotifications } from '@capacitor/local-notifications';

export const setupHighImportanceNotificationChannel = async () => {
  try {
    await LocalNotifications.createChannel({
      id: 'strap_admin_sales_alerts',
      name: 'Sales Submissions Alerts',
      description: 'High importance notifications for store sales submissions',
      importance: 5,
      visibility: 1,
      vibration: true
    });
  } catch (err) {
    console.warn('Failed to create LocalNotification channel:', err);
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    await setupHighImportanceNotificationChannel();
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      return request.display === 'granted';
    }
    return true;
  } catch (err) {
    console.warn('LocalNotifications permission request warning:', err);
    return false;
  }
};

export const sendNativeNotification = async (
  title: string,
  body: string,
  id = Math.floor(Math.random() * 100000)
) => {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 300) },
          sound: 'beep.wav',
          smallIcon: 'ic_launcher',
          iconColor: '#0F172A',
          channelId: 'strap_admin_sales_alerts',
          actionTypeId: 'OPEN_APP'
        }
      ]
    });
  } catch (err) {
    console.warn('Failed to schedule native notification:', err);
  }
};

export const sendAndroidNativeNotification = sendNativeNotification;

export const notifySalesSubmitted = async (shopName: string, amount: number) => {
  await sendNativeNotification(
    '✅ Daily Sales Submitted',
    `Daily sales entry of ₹${amount.toLocaleString('en-IN')} for ${shopName} has been submitted for verification.`
  );
};

export const notifyAdminNewSalesReceived = async (shopName: string, staffName: string, amount: number) => {
  await sendNativeNotification(
    '🚨 New Sales Entry Received for Review',
    `Staff ${staffName} submitted ₹${amount.toLocaleString('en-IN')} for ${shopName}. Tap to verify in queue.`
  );
};

export const notifySalesApproved = async (shopName: string, amount: number) => {
  await sendNativeNotification(
    '🎉 Sales Entry Approved',
    `Admin approved ₹${amount.toLocaleString('en-IN')} sales submission for ${shopName}.`
  );
};

export const notifySalesCorrected = async (shopName: string, reason: string) => {
  await sendNativeNotification(
    '⚠️ Sales Entry Revision Requested',
    `Submission for ${shopName} requires revision: "${reason}"`
  );
};

export const notifyDocumentExpiring = async (docTitle: string, shopName: string, daysLeft: number) => {
  const urgencyEmoji = daysLeft <= 7 ? '🚨' : '⚠️';
  await sendNativeNotification(
    `${urgencyEmoji} Document Expiring Soon: ${docTitle}`,
    `${docTitle} for ${shopName} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Tap to review in Document Vault.`
  );
};

