import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { notifyAdminNewSalesReceived, notifySalesApproved, notifySalesCorrected } from './nativeNotifications';
import { getAppTargetMode } from '../config/appTarget';

const SYNC_FILE_NAME = 'strap_cross_app_notifications.json';

export interface PendingNotificationEvent {
  id: string;
  type: 'NEW_SUBMISSION' | 'SALES_APPROVED' | 'SALES_CORRECTED';
  shopName: string;
  staffName?: string;
  amount: number;
  reason?: string;
  timestamp: number;
  adminProcessed?: boolean;
  staffProcessed?: boolean;
}

export const broadcastCrossAppEvent = async (event: Omit<PendingNotificationEvent, 'id' | 'timestamp'>) => {
  const newEvt: PendingNotificationEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    adminProcessed: false,
    staffProcessed: false
  };

  try {
    let existingEvents: PendingNotificationEvent[] = [];
    try {
      const readRes = await Filesystem.readFile({
        path: SYNC_FILE_NAME,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      if (typeof readRes.data === 'string') {
        existingEvents = JSON.parse(readRes.data);
      }
    } catch (_) {
      existingEvents = [];
    }

    const updated = [newEvt, ...existingEvents].slice(0, 50);

    await Filesystem.writeFile({
      path: SYNC_FILE_NAME,
      data: JSON.stringify(updated),
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });
  } catch (err) {
    console.warn('Filesystem broadcast write error:', err);
  }
};

export const checkAndTriggerPendingNotifications = async () => {
  const targetMode = getAppTargetMode();
  try {
    const readRes = await Filesystem.readFile({
      path: SYNC_FILE_NAME,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });

    if (typeof readRes.data !== 'string') return;
    const events: PendingNotificationEvent[] = JSON.parse(readRes.data);
    let modified = false;

    for (const evt of events) {
      // 1. Admin App receiving sales submission notification from Staff App!
      if (evt.type === 'NEW_SUBMISSION' && (targetMode === 'ADMIN' || targetMode === 'ALL') && !evt.adminProcessed) {
        notifyAdminNewSalesReceived(evt.shopName, evt.staffName || 'Staff Member', evt.amount);
        evt.adminProcessed = true;
        modified = true;
      }

      // 2. Staff App receiving approval notification from Admin App!
      if (evt.type === 'SALES_APPROVED' && (targetMode === 'STAFF' || targetMode === 'ALL') && !evt.staffProcessed) {
        notifySalesApproved(evt.shopName, evt.amount);
        evt.staffProcessed = true;
        modified = true;
      }

      // 3. Staff App receiving correction notification from Admin App!
      if (evt.type === 'SALES_CORRECTED' && (targetMode === 'STAFF' || targetMode === 'ALL') && !evt.staffProcessed) {
        notifySalesCorrected(evt.shopName, evt.reason || 'Please review your entry');
        evt.staffProcessed = true;
        modified = true;
      }
    }

    if (modified) {
      await Filesystem.writeFile({
        path: SYNC_FILE_NAME,
        data: JSON.stringify(events),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
    }
  } catch (_) {
    // File may not exist yet
  }
};
