import { BusinessTenant, Shop, StaffMember, DailySalesEntry, NotificationItem, AuditLog, PlatformMetrics } from '../types';

export const sampleSalesImages: string[] = [
  'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556742049-0a67daf4095a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80'
];

export const initialBusinesses: BusinessTenant[] = [
  {
    id: 'business_primary',
    name: 'My Business Workspace',
    workspaceId: 'my_business',
    businessType: 'Retail & Multi-Branch Store',
    currency: '₹',
    timeZone: 'Asia/Kolkata (GMT+5:30)',
    dateFormat: 'DD/MM/YYYY',
    reminderTime: '18:00',
    planTier: 'PROFESSIONAL',
    subscriptionStatus: 'ACTIVE',
    trialDaysLeft: 14,
    maxShops: 999,
    maxStaff: 999,
    maxStorageGb: 100,
    usedStorageGb: 0.0,
    createdAt: new Date().toISOString().split('T')[0]
  }
];

export const initialShops: Shop[] = [
  {
    id: 'shop_primary',
    businessId: 'business_primary',
    name: 'Main Store Outlet',
    code: 'STORE-01',
    location: 'Main Branch Location',
    contact: '9160859169',
    status: 'ACTIVE',
    assignedStaffIds: [],
    createdAt: new Date().toISOString().split('T')[0]
  }
];

export const initialStaff: StaffMember[] = [];

export const initialSalesEntries: DailySalesEntry[] = [];

export const initialNotifications: NotificationItem[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const initialPlatformMetrics: PlatformMetrics = {
  totalBusinesses: 1,
  activeBusinesses: 1,
  trialBusinesses: 0,
  suspendedBusinesses: 0,
  mrr: 0,
  activeUsers: 1
};
