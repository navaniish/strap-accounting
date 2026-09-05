export type UserRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF';

export type SubmissionStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'CORRECTION_REQUIRED';

export type SubscriptionTier = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';

export type SubscriptionStatus = 
  | 'TRIAL' 
  | 'ACTIVE' 
  | 'RENEWAL' 
  | 'PAST_DUE' 
  | 'GRACE_PERIOD' 
  | 'SUSPENDED';

export interface Shop {
  id: string;
  businessId: string;
  name: string;
  code: string;
  location: string;
  contact: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedStaffIds: string[];
  createdAt: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  staffIdNumber: string; // Numeric ID only (e.g., "749201")
  password: string;      // Alphanumeric + Special Chars (e.g., "Gz@8392!K")
  name: string;
  email: string;
  phone: string;
  role: 'Manager' | 'Supervisor' | 'Staff' | 'Accountant';
  assignedShopIds: string[];
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
}

export interface AdminUser {
  id: string;
  businessId: string;
  name: string;
  email: string;
  password?: string;
  role: 'BUSINESS_ADMIN' | 'CO_ADMIN' | 'MANAGER';
  status: 'invited' | 'active' | 'inactive' | 'ACTIVE' | 'INACTIVE';
  allowGoogleLogin?: boolean;
  authProvider?: 'google' | 'credentials';
  createdAt: string;
}

export interface DailySalesEntry {
  id: string;
  businessId: string;
  shopId: string;
  shopName: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMode?: 'CASH' | 'ONLINE' | 'MIXED';
  salesImageUrl: string;
  imageFileName?: string;
  optionalNote?: string;
  status: SubmissionStatus;
  correctionReason?: string;
  reviewTimestamp?: string;
  reviewerName?: string;
  createdAt: string;
}

export interface BusinessTenant {
  id: string;
  name: string;
  workspaceId: string;
  logoUrl?: string;
  businessType: string;
  currency: string;
  timeZone: string;
  dateFormat: string;
  reminderTime: string; // e.g. "18:00"
  planTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialDaysLeft: number;
  maxShops: number;
  maxStaff: number;
  maxStorageGb: number;
  usedStorageGb: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  businessId: string;
  targetRole: UserRole;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface PlatformMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  trialBusinesses: number;
  suspendedBusinesses: number;
  mrr: number;
  activeUsers: number;
}

export interface ReportConfig {
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'SHOP' | 'STAFF';
  date: string;
  shopId: string; // 'ALL' or specific shop ID
  includeTable: boolean;
  includeImages: boolean;
  includeChart: boolean;
  includeStaff: boolean;
}

export type VaultCategory = 'LICENSE' | 'GST' | 'LEASE' | 'INVOICE' | 'HR' | 'OTHER';

export interface VaultDocument {
  id: string;
  businessId: string;
  shopId: string;
  shopName: string;
  category: VaultCategory;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: string;
  uploadedBy: string;
  uploadedByRole: 'ADMIN' | 'STAFF';
  createdAt: string;
}

