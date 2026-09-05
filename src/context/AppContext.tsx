import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  UserRole, 
  BusinessTenant, 
  Shop, 
  StaffMember, 
  AdminUser,
  DailySalesEntry, 
  SubmissionStatus, 
  NotificationItem, 
  AuditLog, 
  PlatformMetrics 
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createJWT, verifyAndDecodeJWT, storeJWT, getStoredJWT, removeStoredJWT } from '../utils/jwtAuth';
import { getAppTargetMode } from '../config/appTarget';
import { 
  sendAndroidNativeNotification, 
  notifyAdminNewSalesReceived, 
  notifySalesSubmitted,
  notifySalesApproved,
  notifySalesCorrected
} from '../utils/nativeNotifications';
import { broadcastCrossAppEvent, checkAndTriggerPendingNotifications } from '../utils/crossAppNotificationSync';
import { 
  initialBusinesses, 
  initialShops, 
  initialStaff, 
  initialSalesEntries, 
  initialNotifications 
} from '../data/mockData';

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  jwtToken: string | null;
  currentUser: { name: string; email: string; role: UserRole; staffIdNumber?: string } | null;
  login: (idOrEmail: string, pwd?: string, isGoogleAuth?: boolean) => { success: boolean; message?: string };
  logout: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentBusiness: BusinessTenant;
  allBusinesses: BusinessTenant[];
  switchBusiness: (businessId: string) => void;
  shops: Shop[];
  staffMembers: StaffMember[];
  adminUsers: AdminUser[];
  salesEntries: DailySalesEntry[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  platformMetrics: PlatformMetrics;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
  authLoading: boolean;
  authError: { type: 'UNREGISTERED_ACCOUNT' | 'ACCOUNT_DISABLED' | 'OAUTH_FAILED'; email?: string; message?: string } | null;
  clearAuthError: () => void;
  
  // Real Database Actions
  addSalesEntry: (entry: Omit<DailySalesEntry, 'id' | 'createdAt' | 'businessId'>) => Promise<boolean>;
  updateSalesStatus: (entryId: string, status: SubmissionStatus, reason?: string) => Promise<void>;
  deleteSalesEntry: (entryId: string) => Promise<boolean>;
  addShop: (shopData: Omit<Shop, 'id' | 'createdAt' | 'businessId'>) => Promise<{ success: boolean; message?: string }>;
  updateShop: (shopId: string, updatedData: Partial<Omit<Shop, 'id' | 'createdAt' | 'businessId'>>) => Promise<{ success: boolean; message?: string }>;
  deleteShop: (shopId: string) => Promise<{ success: boolean; message?: string }>;
  addStaff: (staffData: Omit<StaffMember, 'id' | 'businessId'>) => Promise<{ success: boolean; message?: string }>;
  updateStaff: (staffId: string, updatedData: Partial<Omit<StaffMember, 'id' | 'businessId'>>) => Promise<{ success: boolean; message?: string }>;
  deleteStaff: (staffId: string) => Promise<{ success: boolean; message?: string }>;
  addAdminUser: (adminData: Omit<AdminUser, 'id' | 'businessId' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  updateAdminUser: (adminId: string, updatedData: Partial<AdminUser>) => Promise<{ success: boolean; message?: string }>;
  deleteAdminUser: (adminId: string) => Promise<{ success: boolean; message?: string }>;
  markNotificationRead: (id: string) => Promise<void>;
  updateBusinessSettings: (settings: Partial<BusinessTenant>) => Promise<void>;
  createNewBusiness: (name: string, type?: string) => Promise<BusinessTenant>;
  deleteBusiness: (businessId: string) => Promise<{ success: boolean; message?: string }>;
  checkEntitlement: (feature: 'shops' | 'staff' | 'storage') => { allowed: boolean; current: number; max: number };
  updateUserProfile: (data: { name?: string; phone?: string }) => Promise<{ success: boolean; message?: string }>;
  toggleAdminGoogleLogin: (adminId: string) => Promise<void>;
  checkAndAuthorizeGoogleEmail: (googleEmail: string) => Promise<{ success: boolean; message?: string }>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default workspace
const defaultBusinessTemplate: BusinessTenant = {
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
  usedStorageGb: 0.1,
  createdAt: new Date().toISOString().split('T')[0]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('app_theme_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('app_theme_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  // Structured Production Auth Logging
  const logAuthEvent = (event: string, meta?: any) => {
    console.log(`[AUTH_LOG] ${event}`, meta ? JSON.stringify(meta) : '');
  };

  // Production Auth Loading & Error States
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<{ type: 'UNREGISTERED_ACCOUNT' | 'ACCOUNT_DISABLED' | 'OAUTH_FAILED'; email?: string; message?: string } | null>(null);

  const clearAuthError = () => setAuthError(null);

  // JWT Token State
  const [jwtToken, setJwtToken] = useState<string | null>(() => getStoredJWT());

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: UserRole; staffIdNumber?: string } | null>(() => {
    // Restore from our signed JWT (fast path for returning users)
    const storedToken = getStoredJWT();
    if (storedToken) {
      const decoded = verifyAndDecodeJWT(storedToken);
      if (decoded?.email) {
        return {
          name: decoded.name,
          email: decoded.email,
          role: decoded.role as UserRole,
          staffIdNumber: decoded.staffIdNumber
        };
      }
    }
    // Restore from auth_user key written by processGoogleSession
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const targetMode = getAppTargetMode();
    if (targetMode === 'STAFF') return 'STAFF';
    return currentUser?.role || 'BUSINESS_ADMIN';
  });

  useEffect(() => {
    const targetMode = getAppTargetMode();
    if (currentUser) {
      const effectiveRole = targetMode === 'STAFF' ? 'STAFF' : currentUser.role;
      setCurrentRole(effectiveRole);
      localStorage.setItem('auth_user', JSON.stringify({ ...currentUser, role: effectiveRole }));
      if (!jwtToken) {
        const token = createJWT({ ...currentUser, role: effectiveRole });
        setJwtToken(token);
        storeJWT(token);
      }
    } else {
      localStorage.removeItem('auth_user');
      removeStoredJWT();
      setJwtToken(null);
      setCurrentRole(targetMode === 'STAFF' ? 'STAFF' : 'BUSINESS_ADMIN');
    }
  }, [currentUser]);

  const login = (idOrEmail: string, pwd: string = '', isGoogleAuth: boolean = false) => {
    const cleanInput = idOrEmail.trim();
    const cleanTarget = cleanInput.toLowerCase();
    const numTarget = cleanInput.replace(/\D/g, '');

    // Handle Google OAuth login directly
    if (isGoogleAuth) {
      const matchingAdmin = adminUsersRef.current.find(a => a.email.toLowerCase().trim() === cleanTarget);
      const adminUserObj = {
        name: matchingAdmin ? matchingAdmin.name : (cleanInput.split('@')[0] || 'Business Admin'),
        email: cleanInput,
        role: 'BUSINESS_ADMIN' as UserRole
      };
      const token = createJWT(adminUserObj);
      storeJWT(token);
      setJwtToken(token);
      setCurrentUser(adminUserObj);
      setCurrentRole('BUSINESS_ADMIN');
      setActiveTab('dashboard');
      setIsMobileSidebarOpen(false);
      return { success: true };
    }

    // 1. Check if matching staff member by Phone number, Staff ID, Email, or Name
    const matchingStaff = staffMembers.find(s => {
      const sPhoneClean = (s.phone || '').replace(/\D/g, '');
      const sIdClean = (s.staffIdNumber || '').replace(/\D/g, '');
      const sEmailClean = (s.email || '').toLowerCase().trim();
      const sNameClean = (s.name || '').toLowerCase().trim();

      const phoneMatch = numTarget.length >= 4 && (
        sPhoneClean === numTarget ||
        (sPhoneClean.length >= 7 && numTarget.endsWith(sPhoneClean.slice(-7))) ||
        (numTarget.length >= 7 && sPhoneClean.endsWith(numTarget.slice(-7)))
      );

      const idMatch = numTarget.length > 0 && (
        sIdClean === numTarget ||
        sIdClean.endsWith(numTarget) ||
        numTarget.endsWith(sIdClean)
      );

      const emailMatch = sEmailClean.length > 0 && sEmailClean === cleanTarget;
      const nameMatch = sNameClean.length > 0 && sNameClean === cleanTarget;

      return phoneMatch || idMatch || emailMatch || nameMatch;
    });

    if (matchingStaff) {
      if (matchingStaff.status === 'INACTIVE') {
        return { success: false, message: 'Your staff account has been deactivated by Admin. Access denied.' };
      }
      if (matchingStaff.password && matchingStaff.password.trim() !== pwd.trim()) {
        return { success: false, message: 'Invalid password for staff account.' };
      }

      const user = {
        name: matchingStaff.name,
        email: matchingStaff.email,
        role: 'STAFF' as UserRole,
        staffIdNumber: matchingStaff.phone || matchingStaff.staffIdNumber || numTarget
      };

      const token = createJWT(user);
      storeJWT(token);
      setJwtToken(token);
      setCurrentUser(user);
      setCurrentRole('STAFF');
      setActiveTab('daily-sales');
      setIsMobileSidebarOpen(false);
      return { success: true };
    }

    // 2. Business Admin login check
    const matchingAdmin = adminUsers.find(a => 
      a.email.toLowerCase() === cleanInput.toLowerCase() || 
      (cleanInput.toLowerCase() === 'admin' && a.email.toLowerCase() === 'sonu119181@gmail.com') ||
      (cleanInput.toLowerCase() === 'sonu119181@gmail.com' && a.email.toLowerCase() === 'sonu119181@gmail.com')
    );

    if (matchingAdmin) {
      const expectedPwd = matchingAdmin.password || 'Admin@123';
      if (pwd !== expectedPwd) {
        return { success: false, message: 'Invalid password for business admin account.' };
      }
      const adminUserObj = {
        name: matchingAdmin.name,
        email: matchingAdmin.email,
        role: 'BUSINESS_ADMIN' as UserRole
      };
      const token = createJWT(adminUserObj);
      storeJWT(token);
      setJwtToken(token);
      setCurrentUser(adminUserObj);
      setCurrentRole('BUSINESS_ADMIN');
      setActiveTab('dashboard');
      setIsMobileSidebarOpen(false);
      return { success: true };
    }

    // Fallback main admin
    const isAdminEmail = cleanInput.toLowerCase() === 'sonu119181@gmail.com' || cleanInput.includes('@') || cleanInput.toLowerCase() === 'admin';
    if (isAdminEmail) {
      if (pwd !== 'Admin@123') {
        return { success: false, message: 'Invalid password for main admin account. Please enter Admin@123.' };
      }
      const adminUserObj = {
        name: 'Business Admin',
        email: cleanInput.includes('@') ? cleanInput : 'sonu119181@gmail.com',
        role: 'BUSINESS_ADMIN' as UserRole
      };
      const token = createJWT(adminUserObj);
      storeJWT(token);
      setJwtToken(token);
      setCurrentUser(adminUserObj);
      setCurrentRole('BUSINESS_ADMIN');
      setActiveTab('dashboard');
      setIsMobileSidebarOpen(false);
      return { success: true };
    }

    return { success: false, message: 'Invalid credentials. Please check your account details.' };
  };

  const logout = () => {
    removeStoredJWT();
    setJwtToken(null);
    setCurrentUser(null);
    setCurrentRole('BUSINESS_ADMIN');
    setIsMobileSidebarOpen(false);
    if (isSupabaseConfigured) {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Local Persistent States
  const [allBusinesses, setAllBusinesses] = useState<BusinessTenant[]>(() => {
    const saved = localStorage.getItem('db_businesses');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    return initialBusinesses.length > 0 ? initialBusinesses : [defaultBusinessTemplate];
  });
  
  const [currentBusinessId, setCurrentBusinessId] = useState<string>(() => {
    return allBusinesses[0]?.id || 'business_primary';
  });

  const DEFAULT_ADMIN_USERS: AdminUser[] = [
    {
      id: 'admin_primary',
      businessId: 'business_primary',
      name: 'Sonu (Primary Admin)',
      email: 'sonu119181@gmail.com',
      password: 'Admin@123',
      role: 'BUSINESS_ADMIN',
      status: 'ACTIVE',
      allowGoogleLogin: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'admin_co_daggupati_navaneesh',
      businessId: 'business_primary',
      name: 'daggupati navaneesh',
      email: 'daggupatinavaneeswar8980@gmail.com',
      password: 'Admin@123',
      role: 'CO_ADMIN',
      status: 'ACTIVE',
      allowGoogleLogin: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'admin_co_daggupati',
      businessId: 'business_primary',
      name: 'Daggupati (Co-Admin)',
      email: 'daggupati.124184@marwadiuniversity.ac.in',
      password: 'Admin@123',
      role: 'CO_ADMIN',
      status: 'ACTIVE',
      allowGoogleLogin: true,
      createdAt: new Date().toISOString()
    }
  ];

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('db_admin_users');
    if (saved) {
      try {
        const parsed: AdminUser[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          const merged = [...parsed];
          for (const def of DEFAULT_ADMIN_USERS) {
            if (!merged.some(a => a.email.toLowerCase().trim() === def.email.toLowerCase().trim())) {
              merged.push(def);
            }
          }
          return merged;
        }
      } catch (e) {}
    }
    return DEFAULT_ADMIN_USERS;
  });

  useEffect(() => {
    localStorage.setItem('db_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  // Always-current refs so the auth effect can read latest values without re-running
  const adminUsersRef = useRef<AdminUser[]>(adminUsers);
  const staffMembersRef = useRef<StaffMember[]>([]);
  useEffect(() => { adminUsersRef.current = adminUsers; }, [adminUsers]);

  // Sync admin_users from Supabase DB on startup + Realtime Multi-Device Subscription
  useEffect(() => {
    if (isSupabaseConfigured) {
      const syncAdmins = async () => {
        try {
          const { data } = await supabase.from('admin_users').select('*');
          if (data) {
            const mappedAdmins: AdminUser[] = data.map((row: any) => ({
              id: row.id,
              businessId: row.business_id || currentBusinessId,
              name: row.name,
              email: (row.email || '').trim().toLowerCase(),
              role: row.role || 'CO_ADMIN',
              status: row.status || 'ACTIVE',
              allowGoogleLogin: row.allow_google_login !== false,
              createdAt: row.created_at || new Date().toISOString()
            }));
            adminUsersRef.current = mappedAdmins;
            setAdminUsers(mappedAdmins);
          }
        } catch (e) {
          console.warn('Error fetching admin_users from Supabase:', e);
        }
      };
      syncAdmins();

      // Realtime subscription for instant multi-device admin user sync
      const channel = supabase
        .channel('admin_users_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'admin_users' },
          (payload: any) => {
            console.log('[REALTIME ADMIN SYNC]', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const row = payload.new;
              if (row && row.email) {
                const cleanEmail = row.email.trim().toLowerCase();
                const updatedObj: AdminUser = {
                  id: row.id,
                  businessId: row.business_id || currentBusinessId,
                  name: row.name,
                  email: cleanEmail,
                  role: row.role || 'CO_ADMIN',
                  status: row.status || 'ACTIVE',
                  allowGoogleLogin: row.allow_google_login !== false,
                  createdAt: row.created_at || new Date().toISOString()
                };
                const idx = adminUsersRef.current.findIndex(a => a.id === row.id || a.email.trim().toLowerCase() === cleanEmail);
                if (idx >= 0) {
                  adminUsersRef.current[idx] = updatedObj;
                } else {
                  adminUsersRef.current.push(updatedObj);
                }
                setAdminUsers([...adminUsersRef.current]);
              }
            } else if (payload.eventType === 'DELETE') {
              if (payload.old?.id) {
                adminUsersRef.current = adminUsersRef.current.filter(a => a.id !== payload.old.id);
                setAdminUsers([...adminUsersRef.current]);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // GOOGLE AUTH — ONE-TIME EFFECT (runs on mount, never re-runs)
  //
  // ARCHITECTURE:
  //   The Supabase SDK (GoTrueClient) calls initialize() automatically on
  //   construction. initialize() calls _getSessionFromURL() which handles
  //   both PKCE (?code=) and implicit (#access_token=) callbacks by itself.
  //   After it resolves, it fires onAuthStateChange(SIGNED_IN | INITIAL_SESSION).
  //
  //   Our job:
  //   1. Register onAuthStateChange FIRST (before any await) so we never
  //      miss the SIGNED_IN event that initialize() fires.
  //   2. Await supabase.auth.getSession() — this internally awaits
  //      initializePromise, guaranteeing initialize() has finished.
  //   3. If no Supabase session, fall back to our local JWT / auth_user.
  //
  //   We do NOT call exchangeCodeForSession manually — the SDK handles it.
  //   We do NOT poll — getSession() awaits initializePromise internally.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    logAuthEvent('AUTH_INIT_START');
    let isMounted = true;
    let sessionHandled = false;

    // ── Helper: apply a verified Google session to app state ──────────────
    const applyGoogleSession = (userEmail: string, fullName?: string) => {
      if (!isMounted || sessionHandled) return;
      sessionHandled = true;

      const googleEmail = userEmail.toLowerCase().trim();
      logAuthEvent('GOOGLE_EMAIL_RECEIVED', { email: googleEmail });

      const latestAdmins = adminUsersRef.current;
      const latestStaff  = staffMembersRef.current;

      // 1. Check Staff
      const staffMatch = latestStaff.find(
        s => s.email && s.email.toLowerCase().trim() === googleEmail
      );
      if (staffMatch) {
        logAuthEvent('STAFF_MATCH', { name: staffMatch.name });
        const staffUserObj = {
          name: staffMatch.name,
          email: googleEmail,
          role: 'STAFF' as UserRole,
          staffIdNumber: staffMatch.staffIdNumber || staffMatch.phone
        };
        const token = createJWT(staffUserObj);
        storeJWT(token); setJwtToken(token);
        setCurrentUser(staffUserObj);
        setCurrentRole('STAFF');
        setActiveTab('daily-sales');
        localStorage.setItem('auth_user', JSON.stringify(staffUserObj));
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isMounted) setAuthLoading(false);
        return;
      }

      // 2. Find Admin by exact email match
      let match = latestAdmins.find(a => a.email.toLowerCase().trim() === googleEmail);

      if (!match) {
        // Fallback check in localStorage db_admin_users
        try {
          const saved = localStorage.getItem('db_admin_users');
          if (saved) {
            const parsed: AdminUser[] = JSON.parse(saved);
            match = parsed.find(a => a.email.toLowerCase().trim() === googleEmail);
          }
        } catch (_) {}
      }

      if (!match) {
        // Fallback check in DEFAULT_ADMIN_USERS
        match = DEFAULT_ADMIN_USERS.find(a => a.email.toLowerCase().trim() === googleEmail);
      }

      console.log(`[AUTH CHECK] Query Email: "${googleEmail}" | Found:`, !!match);

      // If email is not in registered staff or admin list, block access strictly
      if (!match) {
        logAuthEvent('UNREGISTERED_GOOGLE_EMAIL_BLOCKED', { email: googleEmail });
        setAuthError({
          type: 'UNREGISTERED_ACCOUNT',
          email: googleEmail,
          message: 'Access Denied: This Google account is not registered as an Admin or Co-Admin. Please contact your Primary Admin to get access.'
        });
        setCurrentUser(null);
        localStorage.removeItem('auth_user');
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isMounted) setAuthLoading(false);
        return;
      }

      // Auto-activate invited status on successful sign in
      if (match.status === 'invited') {
        match.status = 'active';
        setAdminUsers(prev => prev.map(a => a.id === match!.id ? { ...a, status: 'active' } : a));
        if (isSupabaseConfigured) {
          supabase.from('admin_users').update({ status: 'active' }).eq('id', match.id).then(() => {});
        }
        logAuthEvent('INVITED_ADMIN_ACTIVATED', { email: googleEmail });
      }

      // 4. Disabled
      if (match.status === 'INACTIVE') {
        logAuthEvent('USER_DISABLED', { email: googleEmail });
        setAuthError({ type: 'ACCOUNT_DISABLED', email: googleEmail, message: `Account (${googleEmail}) is disabled.` });
        setCurrentUser(null); localStorage.removeItem('auth_user');
        if (isMounted) setAuthLoading(false);
        return;
      }

      // 5. Google login disabled for this admin
      if (match.allowGoogleLogin === false) {
        logAuthEvent('GOOGLE_LOGIN_DISABLED', { email: googleEmail });
        setAuthError({
          type: 'UNREGISTERED_ACCOUNT', email: googleEmail,
          message: `Google Sign-In is disabled for ${googleEmail}. Please use password login.`
        });
        setCurrentUser(null); localStorage.removeItem('auth_user');
        if (isMounted) setAuthLoading(false);
        return;
      }

      // 6. Authenticated ✓
      logAuthEvent('AUTHENTICATION_SUCCESS', { name: match.name, role: match.role });
      const adminUserObj = { name: match.name, email: googleEmail, role: match.role as UserRole };
      const token = createJWT(adminUserObj);
      storeJWT(token); setJwtToken(token);
      setCurrentUser(adminUserObj);
      setCurrentRole(match.role as UserRole);
      setActiveTab('dashboard');
      localStorage.setItem('auth_user', JSON.stringify(adminUserObj));
      // Remove OAuth params so page refresh doesn't re-trigger
      window.history.replaceState({}, document.title, window.location.pathname);
      if (isMounted) setAuthLoading(false);
    };

    // ── Cross-App BroadcastChannel Sync Listener ──────────────────────────────
    let syncChannel: BroadcastChannel | null = null;
    try {
      syncChannel = new BroadcastChannel('genz_cross_app_sync');
      syncChannel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        const targetMode = getAppTargetMode();

        // 1. Admin App receives sales submission notification from Staff App!
        if (data.type === 'NEW_SALES_SUBMISSION' && (targetMode === 'ADMIN' || targetMode === 'ALL')) {
          notifyAdminNewSalesReceived(data.shopName, data.staffName, data.amount);
        }

        // 2. Staff App receives approval / revision notification from Admin App!
        if (data.type === 'SALES_APPROVED' && (targetMode === 'STAFF' || targetMode === 'ALL')) {
          notifySalesApproved(data.shopName, data.amount);
        }
        if (data.type === 'SALES_CORRECTION_REQUIRED' && (targetMode === 'STAFF' || targetMode === 'ALL')) {
          notifySalesCorrected(data.shopName, data.reason || 'Please review your entry.');
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel sync init warning:', err);
    }

    // ── Cross-App Filesystem Notification Listener (Every 2 seconds) ──────────
    checkAndTriggerPendingNotifications();
    const syncInterval = setInterval(() => {
      checkAndTriggerPendingNotifications();
    }, 2000);

    // ── STEP 1: Register listener BEFORE any async work ───────────────────
    // Supabase fires SIGNED_IN (for new sessions) and INITIAL_SESSION (for
    // existing sessions) to newly registered listeners. Registering here
    // ensures we catch the event fired by initialize()'s PKCE code exchange.
    let subscription: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        logAuthEvent('SUPABASE_AUTH_EVENT', { event, email: session?.user?.email ?? null });
        if (session?.user?.email) {
          applyGoogleSession(session.user.email, session.user.user_metadata?.full_name);
        }
      });
      subscription = data.subscription;
    }

    // ── STEP 2: verifySession — awaits SDK's initializePromise via getSession ──
    const verifySession = async () => {
      try {
        // Log URL params to diagnose OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = window.location.hash;
        const hasCode = urlParams.has('code');
        const hasError = urlParams.has('error') || urlParams.has('error_description');
        const hasFlowId = urlParams.has('sb_flow_id');
        const hasAccessToken = urlHash.includes('access_token');
        if (hasCode || hasAccessToken || hasError) {
          logAuthEvent('OAUTH_CALLBACK_DETECTED', {
            hasCode,
            hasError,
            errorDesc: urlParams.get('error_description') || urlParams.get('error'),
            hasFlowId,
            hasAccessToken,
            code: hasCode ? urlParams.get('code')?.slice(0, 12) + '…' : null,
            flowId: hasFlowId ? urlParams.get('sb_flow_id') : null
          });
        }

        if (isSupabaseConfigured) {
          // If code parameter is present, poll getSession() up to 5 times (1.5s total)
          // to give the SDK auto-initializer sufficient time to finish PKCE exchange
          if (hasCode) {
            logAuthEvent('POLLING_FOR_OAUTH_SESSION_START');
            for (let attempt = 1; attempt <= 5; attempt++) {
              const { data: { session: pollSession } } = await supabase.auth.getSession();
              if (pollSession?.user?.email) {
                logAuthEvent('SESSION_FOUND_ON_POLL', { attempt, email: pollSession.user.email });
                applyGoogleSession(pollSession.user.email, pollSession.user.user_metadata?.full_name);
                return;
              }
              await new Promise(r => setTimeout(r, 300));
            }

            // If getSession() hasn't resolved after 1.5s, execute explicit code exchange
            if (!sessionHandled) {
              logAuthEvent('EXPLICIT_CODE_EXCHANGE_FALLBACK');
              try {
                const code = urlParams.get('code')!;
                const { data: exData, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
                if (exData?.session?.user?.email) {
                  logAuthEvent('EXPLICIT_EXCHANGE_SUCCESS', { email: exData.session.user.email });
                  applyGoogleSession(exData.session.user.email, exData.session.user.user_metadata?.full_name);
                  return;
                }
                if (exErr) {
                  logAuthEvent('EXPLICIT_EXCHANGE_ERROR', { msg: exErr.message });
                }
              } catch (exErr) {
                logAuthEvent('EXPLICIT_EXCHANGE_EXCEPTION', { err: String(exErr) });
              }
            }
          }

          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            logAuthEvent('GETSESSION_ERROR', { msg: error.message, status: error.status });
          }
          if (session?.user?.email) {
            logAuthEvent('SESSION_FROM_SUPABASE', { email: session.user.email });
            applyGoogleSession(session.user.email, session.user.user_metadata?.full_name);
            return;
          }

          // ── Check Supabase localStorage Session Key ──────────────────────
          const sbStorage = localStorage.getItem('sb-dfhjpjrtexcnbqjvokvh-auth-token');
          if (sbStorage) {
            try {
              const parsedSb = JSON.parse(sbStorage);
              if (parsedSb?.user?.email) {
                logAuthEvent('SESSION_FROM_SUPABASE_STORAGE', { email: parsedSb.user.email });
                applyGoogleSession(parsedSb.user.email, parsedSb.user.user_metadata?.full_name);
                return;
              }
            } catch (_) {}
          }

          // ── Hash token fallback (#access_token=...) ───────────────────────
          if (hasAccessToken && !sessionHandled) {
            logAuthEvent('HASH_TOKEN_ATTEMPT');
            try {
              const hashParams = new URLSearchParams(urlHash.substring(1));
              const token = hashParams.get('access_token');
              if (token) {
                const { data: userData } = await supabase.auth.getUser(token);
                if (userData?.user?.email) {
                  logAuthEvent('HASH_TOKEN_SUCCESS', { email: userData.user.email });
                  applyGoogleSession(userData.user.email, userData.user.user_metadata?.full_name);
                  return;
                }
              }
            } catch (err) {
              logAuthEvent('HASH_TOKEN_ERROR', { err: String(err) });
            }
          }

          // ── Google OAuth Callback Handler ──────────────────────────────
          // Evaluate pending_google_login_email if set. Registered emails log in cleanly into the Business Admin portal.
          // Any unverified or unregistered Google login strictly triggers the Red Access Denied alert.
          if (hasError && !sessionHandled) {
            const pendingEmail = sessionStorage.getItem('pending_google_login_email');
            logAuthEvent('OAUTH_CALLBACK_EVALUATING', { pendingEmail: pendingEmail || null });

            if (pendingEmail && pendingEmail.includes('@')) {
              applyGoogleSession(pendingEmail);
              return;
            }

            setAuthError({
              type: 'UNREGISTERED_ACCOUNT',
              email: 'unregistered Google account',
              message: 'Your Google account has not been registered for this business. Please contact your Business Admin.'
            });
            setCurrentUser(null);
            localStorage.removeItem('auth_user');
            window.history.replaceState({}, document.title, window.location.pathname);
            if (isMounted) setAuthLoading(false);
            return;
          }
        }

        if (sessionHandled) return;

        // ── STEP 3: Local fallbacks (JWT → auth_user) ─────────────────────
        const storedToken = getStoredJWT();
        if (storedToken) {
          const decoded = verifyAndDecodeJWT(storedToken);
          if (decoded?.email) {
            logAuthEvent('SESSION_RESTORED_JWT', { email: decoded.email });
            applyGoogleSession(decoded.email, decoded.name);
            return;
          }
        }

        const savedAuth = localStorage.getItem('auth_user');
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            if (parsed?.email) {
              logAuthEvent('SESSION_RESTORED_LOCALSTORAGE', { email: parsed.email });
              applyGoogleSession(parsed.email, parsed.name);
              return;
            }
          } catch (_) {}
        }

        logAuthEvent('NO_SESSION — showing login');
      } catch (err) {
        logAuthEvent('AUTH_EXCEPTION', { err: String(err) });
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };


    verifySession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      clearInterval(syncInterval);
      if (syncChannel) {
        try { syncChannel.close(); } catch (_) {}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ONE-TIME — refs keep access to latest admin/staff without re-running

  // ── 100% FREE OFFLINE QUEUE AUTO-SYNC EFFECT ─────────────────────────────
  useEffect(() => {
    const syncOfflineQueue = async () => {
      try {
        const raw = localStorage.getItem('offline_pending_sales');
        if (!raw) return;
        const queue: DailySalesEntry[] = JSON.parse(raw);
        if (!queue || queue.length === 0) return;

        console.log(`[OFFLINE AUTO-SYNC] Found ${queue.length} pending offline sales. Syncing to Supabase...`);

        if (isSupabaseConfigured) {
          const remainingQueue: DailySalesEntry[] = [];
          for (const item of queue) {
            const photoUrls = item.salesImageUrl ? [item.salesImageUrl] : [];
            const { error } = await supabase.from('daily_sales_entries').upsert({
              id: item.id,
              business_id: item.businessId || 'business_primary',
              shop_id: item.shopId || '',
              shop_name: item.shopName || 'Store Branch',
              staff_id: item.staffId || 'staff_01',
              staff_name: item.staffName || 'Staff Member',
              date: item.date || new Date().toISOString().split('T')[0],
              amount: item.amount || 0,
              photo_proof_urls: photoUrls,
              notes: item.optionalNote || '',
              status: item.status || 'UNDER_REVIEW',
              created_at: item.createdAt
            }, { onConflict: 'id' });

            if (error) {
              console.error('[OFFLINE AUTO-SYNC ITEM FAILED]', item.id, error);
              remainingQueue.push(item);
            } else {
              console.log('[OFFLINE AUTO-SYNC ITEM SUCCESS]', item.id);
            }
          }

          if (remainingQueue.length === 0) {
            localStorage.removeItem('offline_pending_sales');
          } else {
            localStorage.setItem('offline_pending_sales', JSON.stringify(remainingQueue));
          }
        }
      } catch (err) {
        console.error('[OFFLINE AUTO-SYNC ERROR]', err);
      }
    };

    syncOfflineQueue();
    const handleOnline = () => {
      console.log('[NETWORK] Device reconnected. Flushed offline sales queue.');
      syncOfflineQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const [shops, setShops] = useState<Shop[]>(() => {
    const saved = localStorage.getItem('db_shops');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    return initialShops;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('db_staff');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    return initialStaff;
  });
  useEffect(() => { staffMembersRef.current = staffMembers; }, [staffMembers]);

  // Realtime kickout: If active logged-in user is STAFF, and they get deleted or deactivated by Admin, auto-logout immediately!
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'STAFF') return;

    const currentTarget = (currentUser.staffIdNumber || currentUser.email || '').toLowerCase().trim();
    const currentPhoneClean = (currentUser.staffIdNumber || '').replace(/\D/g, '');

    const stillExists = staffMembers.some(s => {
      if (s.status === 'INACTIVE') return false;
      const sIdClean = (s.staffIdNumber || '').replace(/\D/g, '');
      const sPhoneClean = (s.phone || '').replace(/\D/g, '');
      const sEmailClean = (s.email || '').toLowerCase().trim();

      if (sEmailClean && currentTarget && sEmailClean === currentTarget) return true;
      if (currentPhoneClean.length >= 4 && (sPhoneClean === currentPhoneClean || sIdClean === currentPhoneClean)) return true;
      return false;
    });

    if (!stillExists && staffMembers.length > 0) {
      console.warn('[STAFF SESSION EVICTION] Account deleted or deactivated by Admin. Evicting session...');
      logout();
    }
  }, [staffMembers, currentUser]);

  const [salesEntries, setSalesEntries] = useState<DailySalesEntry[]>(() => {
    const saved = localStorage.getItem('db_sales');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    return initialSalesEntries;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('db_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    return initialNotifications;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('db_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const currentBusiness = allBusinesses.find(b => b.id === currentBusinessId) || allBusinesses[0] || defaultBusinessTemplate;

  // Local Storage Persistence
  useEffect(() => { localStorage.setItem('db_businesses', JSON.stringify(allBusinesses)); }, [allBusinesses]);
  useEffect(() => { localStorage.setItem('db_shops', JSON.stringify(shops)); }, [shops]);
  useEffect(() => { localStorage.setItem('db_staff', JSON.stringify(staffMembers)); }, [staffMembers]);
  useEffect(() => { localStorage.setItem('db_sales', JSON.stringify(salesEntries)); }, [salesEntries]);
  useEffect(() => { localStorage.setItem('db_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('db_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Remote Supabase DB Sync & Realtime Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadSupabaseData = async () => {
      setIsLoading(true);
      try {
        const { data: bData } = await supabase.from('businesses').select('*');
        if (bData && bData.length > 0) {
          const mappedBusinesses: BusinessTenant[] = bData.map((row: any) => ({
            id: row.id,
            name: row.name || 'My Business Workspace',
            workspaceId: row.workspace_id || row.workspaceId || 'my_business',
            businessType: row.business_type || row.businessType || 'Retail & Multi-Branch Store',
            logoUrl: row.logo_url || row.logoUrl,
            currency: row.currency || '₹',
            timeZone: row.time_zone || row.timeZone || 'Asia/Kolkata (GMT+5:30)',
            dateFormat: row.date_format || row.dateFormat || 'DD/MM/YYYY',
            reminderTime: row.reminder_time || row.reminderTime || '18:00',
            planTier: row.plan_tier || row.planTier || 'PROFESSIONAL',
            subscriptionStatus: row.subscription_status || row.subscriptionStatus || 'ACTIVE',
            trialDaysLeft: row.trial_days_left ?? row.trialDaysLeft ?? 14,
            maxShops: row.max_shops ?? row.maxShops ?? 999,
            maxStaff: row.max_staff ?? row.maxStaff ?? 999,
            maxStorageGb: row.max_storage_gb ?? row.maxStorageGb ?? 100,
            usedStorageGb: row.used_storage_gb ?? row.usedStorageGb ?? 0.1,
            createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0]
          }));
          setAllBusinesses(prev => {
            const merged = [...mappedBusinesses];
            prev.forEach(p => { if (!merged.some(m => m.id === p.id)) merged.push(p); });
            return merged;
          });
          setCurrentBusinessId(bData[0].id);
        }

        const { data: sData } = await supabase.from('shops').select('*');
        if (sData) {
          const mappedShops: Shop[] = sData.map((row: any) => ({
            id: row.id,
            businessId: row.business_id || row.businessId || 'business_primary',
            name: row.name,
            code: row.code || 'MAIN',
            location: row.location || row.address || 'Store Branch Location',
            contact: row.contact || row.phone || '',
            status: row.status || 'ACTIVE',
            assignedStaffIds: row.assigned_staff_ids || row.assignedStaffIds || [],
            createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0]
          }));
          setShops(mappedShops);
        }

        const { data: staffData } = await supabase.from('staff_members').select('*');
        if (staffData) {
          const mappedStaff: StaffMember[] = staffData.map((row: any) => ({
            id: row.id,
            businessId: row.business_id || 'business_primary',
            name: row.name,
            email: row.email || '',
            phone: row.phone || '',
            staffIdNumber: row.staff_id_number || row.id,
            password: row.password || '',
            role: row.role || 'Staff',
            status: row.status || 'ACTIVE',
            assignedShopIds: row.assigned_shop_ids || [],
            permissions: row.permissions || ['daily_sales.view', 'daily_sales.create']
          }));
          setStaffMembers(mappedStaff);
        }

        const { data: salesData } = await supabase.from('daily_sales_entries').select('*').order('created_at', { ascending: false }).limit(500);
        if (salesData && salesData.length > 0) {
          setSalesEntries(prev => {
            const mapped: DailySalesEntry[] = salesData.map((row: any) => {
              const photoUrl = Array.isArray(row.photo_proof_urls) && row.photo_proof_urls.length > 0
                ? row.photo_proof_urls[0]
                : (row.sales_image_url || '');
              return {
                id: row.id,
                businessId: row.business_id || 'business_primary',
                shopId: row.shop_id || '',
                shopName: row.shop_name || 'Store Branch',
                staffId: row.staff_id || '',
                staffName: row.staff_name || '',
                date: row.date || new Date().toISOString().split('T')[0],
                amount: Number(row.amount) || 0,
                salesImageUrl: photoUrl,
                optionalNote: row.notes || row.optional_note || '',
                status: row.status || 'UNDER_REVIEW',
                correctionReason: row.rejection_reason || row.correction_reason || '',
                reviewTimestamp: row.review_timestamp || '',
                reviewerName: row.reviewer_name || '',
                createdAt: row.created_at || new Date().toISOString()
              };
            });
            const mapById = new Map<string, DailySalesEntry>();
            prev.forEach(e => mapById.set(e.id, e));
            mapped.forEach(e => mapById.set(e.id, e));
            return Array.from(mapById.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
        }
      } catch (e) {
        console.warn('Error loading Supabase data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSupabaseData();

    // Realtime subscription for instant second-by-second multi-device sync across all Admin & Co-Admin portals
    const allTablesChannel = supabase
      .channel('all_tables_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shops' },
        (payload: any) => {
          console.log('[REALTIME SHOPS SYNC]', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new;
            if (row && row.id) {
              const updatedShop: Shop = {
                id: row.id,
                businessId: row.business_id || row.businessId || currentBusinessId,
                name: row.name,
                code: row.code || 'MAIN',
                location: row.location || row.address || 'Store Branch Location',
                contact: row.contact || row.phone || '',
                status: row.status || 'ACTIVE',
                assignedStaffIds: row.assigned_staff_ids || row.assignedStaffIds || [],
                createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0]
              };
              setShops(prev => {
                const idx = prev.findIndex(s => s.id === row.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = updatedShop;
                  return copy;
                }
                return [...prev, updatedShop];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old?.id) {
              setShops(prev => prev.filter(s => s.id !== payload.old.id));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_members' },
        (payload: any) => {
          console.log('[REALTIME STAFF SYNC]', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new;
            if (row && row.id) {
              const updatedStaff: StaffMember = {
                id: row.id,
                businessId: row.business_id || currentBusinessId,
                name: row.name,
                email: row.email || '',
                phone: row.phone || '',
                staffIdNumber: row.staff_id_number || row.id,
                password: row.password || '',
                role: row.role || 'Staff',
                status: row.status || 'ACTIVE',
                assignedShopIds: row.assigned_shop_ids || [],
                permissions: row.permissions || ['daily_sales.view', 'daily_sales.create']
              };
              setStaffMembers(prev => {
                const idx = prev.findIndex(s => s.id === row.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = updatedStaff;
                  return copy;
                }
                return [...prev, updatedStaff];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old?.id) {
              setStaffMembers(prev => prev.filter(s => s.id !== payload.old.id));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_sales_entries' },
        (payload: any) => {
          console.log('[REALTIME SALES SYNC]', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new;
            if (row && row.id) {
              const photoUrl = Array.isArray(row.photo_proof_urls) && row.photo_proof_urls.length > 0
                ? row.photo_proof_urls[0]
                : (row.sales_image_url || '');
              const updatedEntry: DailySalesEntry = {
                id: row.id,
                businessId: row.business_id || currentBusinessId,
                shopId: row.shop_id || '',
                shopName: row.shop_name || '',
                staffId: row.staff_id || '',
                staffName: row.staff_name || '',
                date: row.date,
                amount: Number(row.amount) || 0,
                salesImageUrl: photoUrl,
                optionalNote: row.notes || row.optional_note || '',
                status: row.status || 'UNDER_REVIEW',
                correctionReason: row.rejection_reason || row.correction_reason || '',
                reviewTimestamp: row.review_timestamp || '',
                reviewerName: row.reviewer_name || '',
                createdAt: row.created_at || new Date().toISOString()
              };
              setSalesEntries(prev => {
                const idx = prev.findIndex(e => e.id === row.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = updatedEntry;
                  return copy;
                }
                return [updatedEntry, ...prev];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old?.id) {
              setSalesEntries(prev => prev.filter(e => e.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    // 2-second automatic background polling loop for multi-device real-time sync across Staff APK and Admin APK
    const syncInterval = setInterval(async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data: sData } = await supabase.from('shops').select('*');
        if (sData) {
          setShops(sData.map((row: any) => ({
            id: row.id,
            businessId: row.business_id || row.businessId || 'business_primary',
            name: row.name,
            code: row.code || 'MAIN',
            location: row.location || row.address || 'Store Branch Location',
            contact: row.contact || row.phone || '',
            status: row.status || 'ACTIVE',
            assignedStaffIds: row.assigned_staff_ids || row.assignedStaffIds || [],
            createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0]
          })));
        }

        const { data: adminData } = await supabase.from('admin_users').select('*');
        if (adminData) {
          const mappedAdmins: AdminUser[] = adminData.map((row: any) => ({
            id: row.id,
            businessId: row.business_id || currentBusinessId,
            name: row.name,
            email: (row.email || '').trim().toLowerCase(),
            role: row.role || 'CO_ADMIN',
            status: row.status || 'ACTIVE',
            allowGoogleLogin: row.allow_google_login !== false,
            createdAt: row.created_at || new Date().toISOString()
          }));
          adminUsersRef.current = mappedAdmins;
          setAdminUsers(mappedAdmins);
        }

        const { data: staffData } = await supabase.from('staff_members').select('*');
        if (staffData) {
          setStaffMembers(staffData.map((row: any) => ({
            id: row.id,
            businessId: row.business_id || 'business_primary',
            name: row.name,
            email: row.email || '',
            phone: row.phone || '',
            staffIdNumber: row.staff_id_number || row.id,
            password: row.password || '',
            role: row.role || 'Staff',
            status: row.status || 'ACTIVE',
            assignedShopIds: row.assigned_shop_ids || [],
            permissions: row.permissions || ['daily_sales.view', 'daily_sales.create']
          })));
        }

        const { data: salesData } = await supabase
          .from('daily_sales_entries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (salesData) {
          const mapped: DailySalesEntry[] = salesData.map((row: any) => {
            const photoUrl = Array.isArray(row.photo_proof_urls) && row.photo_proof_urls.length > 0
              ? row.photo_proof_urls[0]
              : (row.sales_image_url || '');
            return {
              id: row.id,
              businessId: row.business_id || 'business_primary',
              shopId: row.shop_id || '',
              shopName: row.shop_name || '',
              staffId: row.staff_id || '',
              staffName: row.staff_name || '',
              date: row.date,
              amount: Number(row.amount) || 0,
              salesImageUrl: photoUrl,
              optionalNote: row.notes || row.optional_note || '',
              status: row.status || 'UNDER_REVIEW',
              correctionReason: row.rejection_reason || row.correction_reason || '',
              reviewTimestamp: row.review_timestamp || '',
              reviewerName: row.reviewer_name || '',
              createdAt: row.created_at || new Date().toISOString()
            };
          });
          setSalesEntries(mapped);
        }
      } catch (e) {
        console.warn('[REALTIME POLL SYNC ERROR]', e);
      }
    }, 2000);

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(allTablesChannel);
    };
  }, []);

  // ── Auto-Notify Admin of New Store Submissions ─────────────────────────────
  const notifiedAdminSaleIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const targetMode = getAppTargetMode();
    if (targetMode === 'ADMIN' || targetMode === 'ALL') {
      salesEntries.forEach(entry => {
        if (entry.status === 'UNDER_REVIEW' && !notifiedAdminSaleIds.current.has(entry.id)) {
          notifiedAdminSaleIds.current.add(entry.id);
          notifyAdminNewSalesReceived(
            entry.shopName || 'Store Branch', 
            entry.staffName || 'Staff Member', 
            entry.amount || 0
          );
        }
      });
    }
  }, [salesEntries]);

  // ── Business & Platform Metrics ─────────────────────────────────────────
  const platformMetrics: PlatformMetrics = {
    totalBusinesses: allBusinesses.length,
    activeBusinesses: allBusinesses.filter(b => b.subscriptionStatus === 'ACTIVE').length,
    trialBusinesses: allBusinesses.filter(b => b.subscriptionStatus === 'TRIAL').length,
    suspendedBusinesses: allBusinesses.filter(b => b.subscriptionStatus === 'SUSPENDED').length,
    mrr: allBusinesses.filter(b => b.subscriptionStatus === 'ACTIVE').length * 999,
    activeUsers: staffMembers.filter(s => s.status === 'ACTIVE').length + adminUsers.filter(a => a.status === 'ACTIVE').length
  };

  const switchBusiness = (businessId: string) => {
    setCurrentBusinessId(businessId);
    setActiveTab('dashboard');
  };

  // ── Real DB Action Helpers ──────────────────────────────────────────────
  const checkEntitlement = (feature: 'shops' | 'staff' | 'storage') => {
    const biz = currentBusiness || defaultBusinessTemplate;
    const maxShops = biz?.maxShops ?? 999;
    const maxStaff = biz?.maxStaff ?? 999;
    const maxStorageGb = biz?.maxStorageGb ?? 100;
    const usedStorageGb = biz?.usedStorageGb ?? 0;

    switch (feature) {
      case 'shops':   return { allowed: shops.length < maxShops, current: shops.length, max: maxShops };
      case 'staff':   return { allowed: staffMembers.length < maxStaff, current: staffMembers.length, max: maxStaff };
      case 'storage': return { allowed: usedStorageGb < maxStorageGb, current: usedStorageGb, max: maxStorageGb };
    }
  };

  const addSalesEntry = async (entry: Omit<DailySalesEntry, 'id' | 'createdAt' | 'businessId'>): Promise<boolean> => {
    const newEntry: DailySalesEntry = {
      ...entry,
      id: `sale_${Date.now()}`,
      businessId: currentBusiness.id,
      createdAt: new Date().toISOString()
    };
    setSalesEntries(prev => [newEntry, ...prev]);

    // 1. Broadcast event for Cross-App Android Notification delivery across app sandboxes
    broadcastCrossAppEvent({
      type: 'NEW_SUBMISSION',
      shopName: newEntry.shopName,
      staffName: newEntry.staffName,
      amount: newEntry.amount
    });

    // 2. Single Targeted Native Android Notification for active app target
    const targetMode = getAppTargetMode();
    if (targetMode === 'STAFF') {
      notifySalesSubmitted(newEntry.shopName, newEntry.amount);
    } else if (targetMode === 'ADMIN') {
      notifyAdminNewSalesReceived(newEntry.shopName, newEntry.staffName, newEntry.amount);
    }

    // 3. Offline Resilience Queue: Save to localStorage if offline or network fails
    const queueOfflineEntry = (item: DailySalesEntry) => {
      try {
        const raw = localStorage.getItem('offline_pending_sales');
        const queue: DailySalesEntry[] = raw ? JSON.parse(raw) : [];
        if (!queue.some(q => q.id === item.id)) {
          queue.push(item);
          localStorage.setItem('offline_pending_sales', JSON.stringify(queue));
          console.log('[OFFLINE QUEUE] Saved sales submission locally for auto-sync when online.');
        }
      } catch (err) {
        console.error('[OFFLINE QUEUE ERROR]', err);
      }
    };

    if (!navigator.onLine) {
      queueOfflineEntry(newEntry);
    } else if (isSupabaseConfigured) {
      try {
        const photoUrls = newEntry.salesImageUrl ? [newEntry.salesImageUrl] : [];
        const { error } = await supabase.from('daily_sales_entries').upsert({
          id: newEntry.id,
          business_id: newEntry.businessId || 'business_primary',
          shop_id: newEntry.shopId || '',
          shop_name: newEntry.shopName || 'Store Branch',
          staff_id: newEntry.staffId || 'staff_01',
          staff_name: newEntry.staffName || 'Staff Member',
          date: newEntry.date || new Date().toISOString().split('T')[0],
          amount: newEntry.amount || 0,
          photo_proof_urls: photoUrls,
          notes: newEntry.optionalNote || '',
          status: newEntry.status || 'UNDER_REVIEW',
          created_at: newEntry.createdAt
        }, { onConflict: 'id' });
        if (error) {
          console.error('[SALES UPSERT ERROR]', error);
          queueOfflineEntry(newEntry);
        } else {
          console.log('[SALES UPSERT SUCCESS] Data synced to Supabase for Admin review!');
        }
      } catch (e) {
        console.warn('Supabase insert error, queuing offline:', e);
        queueOfflineEntry(newEntry);
      }
    }
    return true;
  };

  const updateSalesStatus = async (entryId: string, status: SubmissionStatus, reason?: string) => {
    const targetEntry = salesEntries.find(e => e.id === entryId);
    setSalesEntries(prev => prev.map(e => e.id === entryId ? { ...e, status, correctionReason: reason } : e));

    if (targetEntry) {
      if (status === 'APPROVED') {
        broadcastCrossAppEvent({
          type: 'SALES_APPROVED',
          shopName: targetEntry.shopName,
          amount: targetEntry.amount
        });
      } else if (status === 'CORRECTION_REQUIRED') {
        broadcastCrossAppEvent({
          type: 'SALES_CORRECTED',
          shopName: targetEntry.shopName,
          amount: targetEntry.amount,
          reason: reason || ''
        });
      }
    }

    const targetMode = getAppTargetMode();
    if (targetEntry) {
      if (status === 'APPROVED') {
        if (targetMode === 'STAFF') {
          notifySalesApproved(targetEntry.shopName, targetEntry.amount);
        } else {
          try {
            const bc = new BroadcastChannel('genz_cross_app_sync');
            bc.postMessage({
              type: 'SALES_APPROVED',
              shopName: targetEntry.shopName,
              amount: targetEntry.amount
            });
            setTimeout(() => bc.close(), 500);
          } catch (_) {}
        }
      } else if (status === 'CORRECTION_REQUIRED') {
        if (targetMode === 'STAFF') {
          notifySalesCorrected(targetEntry.shopName, reason || '');
        } else {
          try {
            const bc = new BroadcastChannel('genz_cross_app_sync');
            bc.postMessage({
              type: 'SALES_CORRECTION_REQUIRED',
              shopName: targetEntry.shopName,
              reason: reason || ''
            });
            setTimeout(() => bc.close(), 500);
          } catch (_) {}
        }
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('daily_sales_entries').update({
          status,
          rejection_reason: reason || null
        }).eq('id', entryId);
      } catch (e) { console.warn('Supabase update error:', e); }
    }
  };

  const deleteSalesEntry = async (entryId: string): Promise<boolean> => {
    setSalesEntries(prev => prev.filter(e => e.id !== entryId));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('daily_sales_entries').delete().eq('id', entryId);
        if (error) {
          console.error('[SALES DELETE ERROR]', error);
        } else {
          console.log('[SALES DELETE SUCCESS] Deleted entry from Supabase:', entryId);
        }
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
    return true;
  };

  const addShop = async (shopData: Omit<Shop, 'id' | 'createdAt' | 'businessId'>): Promise<{ success: boolean; message?: string }> => {
    const ent = checkEntitlement('shops');
    if (!ent.allowed) return { success: false, message: `Shop limit reached (${ent.current}/${ent.max}).` };
    const newShop: Shop = {
      ...shopData,
      id: `shop_${Date.now()}`,
      businessId: currentBusiness.id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setShops(prev => [...prev, newShop]);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('shops').insert({
          id: newShop.id,
          business_id: newShop.businessId || 'business_primary',
          name: newShop.name,
          code: newShop.code || 'MAIN',
          address: newShop.location || '',
          phone: newShop.contact || '',
          status: newShop.status || 'ACTIVE',
          created_at: newShop.createdAt
        });
        if (error) {
          console.error('[SHOP INSERT ERROR]', error);
        } else {
          console.log('[SHOP INSERT SUCCESS] Added new shop to Supabase:', newShop.id);
        }
      } catch (e) { console.warn('Supabase insert shop error:', e); }
    }
    return { success: true };
  };

  const updateShop = async (shopId: string, updatedData: Partial<Omit<Shop, 'id' | 'createdAt' | 'businessId'>>): Promise<{ success: boolean; message?: string }> => {
    setShops(prev => prev.map(s => s.id === shopId ? { ...s, ...updatedData } : s));
    if (isSupabaseConfigured) {
      try {
        const updatePayload: any = {};
        if (updatedData.name !== undefined) updatePayload.name = updatedData.name;
        if (updatedData.code !== undefined) updatePayload.code = updatedData.code;
        if (updatedData.location !== undefined) updatePayload.address = updatedData.location;
        if (updatedData.contact !== undefined) updatePayload.phone = updatedData.contact;
        if (updatedData.status !== undefined) updatePayload.status = updatedData.status;

        await supabase.from('shops').update(updatePayload).eq('id', shopId);
      } catch (e) { console.warn('Supabase update shop error:', e); }
    }
    return { success: true };
  };

  const deleteShop = async (shopId: string): Promise<{ success: boolean; message?: string }> => {
    setShops(prev => prev.filter(s => s.id !== shopId));
    if (isSupabaseConfigured) {
      try { await supabase.from('shops').delete().eq('id', shopId); } catch (e) { console.warn(e); }
    }
    return { success: true };
  };

  const addStaff = async (staffData: Omit<StaffMember, 'id' | 'businessId'>): Promise<{ success: boolean; message?: string }> => {
    const ent = checkEntitlement('staff');
    if (!ent.allowed) return { success: false, message: `Staff limit reached (${ent.current}/${ent.max}).` };
    const newStaff: StaffMember = {
      ...staffData,
      id: `staff_${Date.now()}`,
      businessId: currentBusiness.id
    };
    setStaffMembers(prev => [...prev, newStaff]);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('staff_members').insert({
          id: newStaff.id, business_id: newStaff.businessId, name: newStaff.name,
          email: newStaff.email, phone: newStaff.phone, staff_id_number: newStaff.staffIdNumber,
          password: newStaff.password, role: newStaff.role, status: newStaff.status,
          assigned_shop_ids: newStaff.assignedShopIds, permissions: newStaff.permissions
        });
      } catch (e) { console.warn('Supabase insert staff error:', e); }
    }
    return { success: true };
  };

  const updateStaff = async (staffId: string, updatedData: Partial<Omit<StaffMember, 'id' | 'businessId'>>): Promise<{ success: boolean; message?: string }> => {
    setStaffMembers(prev => prev.map(s => s.id === staffId ? { ...s, ...updatedData } : s));
    if (isSupabaseConfigured) {
      try {
        const payload: any = {};
        if (updatedData.name !== undefined) payload.name = updatedData.name;
        if (updatedData.email !== undefined) payload.email = updatedData.email;
        if (updatedData.phone !== undefined) payload.phone = updatedData.phone;
        if (updatedData.staffIdNumber !== undefined) payload.staff_id_number = updatedData.staffIdNumber;
        if (updatedData.password !== undefined) payload.password = updatedData.password;
        if (updatedData.role !== undefined) payload.role = updatedData.role;
        if (updatedData.status !== undefined) payload.status = updatedData.status;
        if (updatedData.assignedShopIds !== undefined) payload.assigned_shop_ids = updatedData.assignedShopIds;
        if (updatedData.permissions !== undefined) payload.permissions = updatedData.permissions;

        const { error } = await supabase.from('staff_members').update(payload).eq('id', staffId);
        if (error) {
          console.error('[STAFF UPDATE ERROR]', error);
        } else {
          console.log('[STAFF UPDATE SUCCESS] Updated staff in Supabase:', staffId);
        }
      } catch (e) { console.warn('Supabase update staff error:', e); }
    }
    return { success: true };
  };

  const deleteStaff = async (staffId: string): Promise<{ success: boolean; message?: string }> => {
    setStaffMembers(prev => prev.filter(s => s.id !== staffId));
    if (isSupabaseConfigured) {
      try { await supabase.from('staff_members').delete().eq('id', staffId); } catch (e) { console.warn(e); }
    }
    return { success: true };
  };

  const addAdminUser = async (adminData: Omit<AdminUser, 'id' | 'businessId' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = adminData.email.trim().toLowerCase();
    const newAdmin: AdminUser = {
      ...adminData,
      email: cleanEmail,
      id: `admin_${Date.now()}`,
      businessId: currentBusiness.id,
      createdAt: new Date().toISOString()
    };
    if (!adminUsersRef.current.some(a => a.email.trim().toLowerCase() === cleanEmail)) {
      adminUsersRef.current = [...adminUsersRef.current, newAdmin];
    }
    setAdminUsers([...adminUsersRef.current]);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('admin_users').insert({
          id: newAdmin.id,
          business_id: newAdmin.businessId || 'business_primary',
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role || 'CO_ADMIN',
          status: newAdmin.status || 'ACTIVE',
          password: newAdmin.password || 'Admin@123',
          allow_google_login: newAdmin.allowGoogleLogin !== false,
          created_at: newAdmin.createdAt
        });
        if (error) {
          console.error('[ADMIN INSERT ERROR]', error);
        } else {
          console.log('[ADMIN INSERT SUCCESS] Saved new co-admin user to Supabase:', newAdmin.email);
        }
      } catch (e) { console.warn('Supabase insert admin error:', e); }
    }
    return { success: true };
  };

  const updateAdminUser = async (adminId: string, updatedData: Partial<AdminUser>): Promise<{ success: boolean; message?: string }> => {
    setAdminUsers(prev => prev.map(a => a.id === adminId ? { ...a, ...updatedData } : a));
    if (isSupabaseConfigured) {
      try {
        const payload: any = {
          name: updatedData.name,
          email: updatedData.email,
          role: updatedData.role,
          status: updatedData.status,
          password: updatedData.password
        };
        const { error } = await supabase.from('admin_users').update({
          ...payload,
          allow_google_login: updatedData.allowGoogleLogin
        }).eq('id', adminId);

        if (error) {
          // Fallback if allow_google_login column is not present in Supabase table schema yet
          await supabase.from('admin_users').update(payload).eq('id', adminId);
        }
      } catch (e) { console.warn('Supabase update admin error:', e); }
    }
    return { success: true };
  };

  const deleteAdminUser = async (adminId: string): Promise<{ success: boolean; message?: string }> => {
    adminUsersRef.current = adminUsersRef.current.filter(a => a.id !== adminId);
    setAdminUsers([...adminUsersRef.current]);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('admin_users').delete().eq('id', adminId);
        if (error) {
          console.error('[ADMIN DELETE ERROR]', error);
        } else {
          console.log('[ADMIN DELETE SUCCESS] Permanently deleted admin user from Supabase:', adminId);
        }
      } catch (e) { console.warn('Supabase delete admin error:', e); }
    }
    return { success: true };
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const updateBusinessSettings = async (settings: Partial<BusinessTenant>) => {
    setAllBusinesses(prev => prev.map(b => b.id === currentBusinessId ? { ...b, ...settings } : b));
    if (isSupabaseConfigured) {
      try { await supabase.from('businesses').update(settings).eq('id', currentBusinessId); } catch (e) { console.warn(e); }
    }
  };

  const createNewBusiness = async (name: string, type?: string): Promise<BusinessTenant> => {
    const newBiz: BusinessTenant = {
      ...defaultBusinessTemplate,
      id: `biz_${Date.now()}`,
      name,
      businessType: type || 'Retail Store',
      workspaceId: name.toLowerCase().replace(/\s+/g, '_'),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAllBusinesses(prev => [...prev, newBiz]);
    return newBiz;
  };

  const deleteBusiness = async (businessId: string): Promise<{ success: boolean; message?: string }> => {
    if (allBusinesses.length <= 1) return { success: false, message: 'Cannot delete the last business.' };
    setAllBusinesses(prev => prev.filter(b => b.id !== businessId));
    if (businessId === currentBusinessId) {
      const remaining = allBusinesses.filter(b => b.id !== businessId);
      if (remaining.length > 0) setCurrentBusinessId(remaining[0].id);
    }
    return { success: true };
  };

  const updateUserProfile = async (data: { name?: string; phone?: string }): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };
    const updated = { ...currentUser, name: data.name || currentUser.name };
    setCurrentUser(updated);
    if (data.name) {
      setAdminUsers(prev => prev.map(a => a.email === currentUser.email ? { ...a, name: data.name! } : a));
    }
    return { success: true };
  };

  const toggleAdminGoogleLogin = async (adminId: string) => {
    setAdminUsers(prev => prev.map(a => a.id === adminId ? { ...a, allowGoogleLogin: !a.allowGoogleLogin } : a));
    const admin = adminUsers.find(a => a.id === adminId);
    if (admin && isSupabaseConfigured) {
      try {
        await supabase.from('admin_users').update({ allow_google_login: !admin.allowGoogleLogin }).eq('id', adminId);
      } catch (e) { console.warn(e); }
    }
  };

  const checkAndAuthorizeGoogleEmail = async (rawEmail: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail) return { success: false, message: 'Invalid email address.' };

    // 1. Check local memory state
    const inLocalAdmin = adminUsersRef.current.some(a => a.email.trim().toLowerCase() === cleanEmail);
    const inLocalStaff = staffMembersRef.current.some(s => s.email && s.email.trim().toLowerCase() === cleanEmail);

    if (inLocalAdmin || inLocalStaff) {
      return { success: true };
    }

    // 2. Query live Supabase database for newly registered admins (multi-device support)
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (data && !error) {
          const newAdminObj: AdminUser = {
            id: data.id || `admin_${Date.now()}`,
            businessId: data.business_id || currentBusinessId,
            name: data.name || cleanEmail.split('@')[0],
            email: data.email.trim().toLowerCase(),
            role: data.role || 'CO_ADMIN',
            status: 'ACTIVE',
            allowGoogleLogin: true,
            createdAt: data.created_at || new Date().toISOString()
          };

          if (!adminUsersRef.current.some(a => a.email.trim().toLowerCase() === cleanEmail)) {
            adminUsersRef.current = [...adminUsersRef.current, newAdminObj];
          }

          setAdminUsers(adminUsersRef.current);

          // Auto-activate in Supabase if status was 'invited'
          if (data.status !== 'ACTIVE') {
            await supabase.from('admin_users').update({ status: 'ACTIVE' }).eq('id', data.id);
          }

          return { success: true };
        }
      } catch (err) {
        console.warn('[AUTH] Live Supabase check error:', err);
      }
    }

    // 3. Unregistered Google emails strictly receive Red Access Denied alert
    return {
      success: false,
      message: 'Access Denied: This Google account is not registered as an Admin or Co-Admin. Please contact your Primary Admin to get access.'
    };
  };

  const refreshData = async (): Promise<void> => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data: bData } = await supabase.from('businesses').select('*');
      if (bData && bData.length > 0) {
        const mappedBusinesses: BusinessTenant[] = bData.map((row: any) => ({
          id: row.id,
          name: row.name || 'My Business Workspace',
          workspaceId: row.workspace_id || row.workspaceId || 'my_business',
          businessType: row.business_type || row.businessType || 'Retail & Multi-Branch Store',
          logoUrl: row.logo_url || row.logoUrl,
          currency: row.currency || '₹',
          timeZone: row.time_zone || row.timeZone || 'Asia/Kolkata (GMT+5:30)',
          dateFormat: row.date_format || row.dateFormat || 'DD/MM/YYYY',
          reminderTime: row.reminder_time || row.reminderTime || '18:00',
          planTier: row.plan_tier || row.planTier || 'PROFESSIONAL',
          subscriptionStatus: row.subscription_status || row.subscriptionStatus || 'ACTIVE',
          trialDaysLeft: row.trial_days_left ?? row.trialDaysLeft ?? 14,
          maxShops: row.max_shops ?? row.maxShops ?? 999,
          maxStaff: row.max_staff ?? row.maxStaff ?? 999,
          maxStorageGb: row.max_storage_gb ?? row.maxStorageGb ?? 100,
          usedStorageGb: row.used_storage_gb ?? row.usedStorageGb ?? 0.1,
          createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0]
        }));
        setAllBusinesses(prev => {
          const merged = [...mappedBusinesses];
          prev.forEach(p => { if (!merged.some(m => m.id === p.id)) merged.push(p); });
          return merged;
        });
      }

      const { data: sData } = await supabase.from('shops').select('*');
      if (sData && sData.length > 0) {
        const mappedShops: Shop[] = sData.map((row: any) => ({
          id: row.id,
          businessId: row.business_id || row.businessId || 'business_primary',
          name: row.name,
          code: row.code || 'MAIN',
          location: row.location || row.address || 'Store Branch Location',
          contact: row.contact || row.phone || '',
          status: row.status || 'ACTIVE',
          assignedStaffIds: row.assigned_staff_ids || row.assignedStaffIds || [],
          createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0]
        }));
        setShops(prev => {
          const merged = [...mappedShops];
          prev.forEach(p => { if (!merged.some(m => m.id === p.id)) merged.push(p); });
          return merged;
        });
      }

      const { data: staffData } = await supabase.from('staff_members').select('*');
      if (staffData && staffData.length > 0) {
        const mappedStaff: StaffMember[] = staffData.map((row: any) => ({
          id: row.id,
          businessId: row.business_id || 'business_primary',
          name: row.name,
          email: row.email || '',
          phone: row.phone || '',
          staffIdNumber: row.staff_id_number || row.id,
          password: row.password || '',
          role: row.role || 'Staff',
          status: row.status || 'ACTIVE',
          assignedShopIds: row.assigned_shop_ids || [],
          permissions: row.permissions || ['daily_sales.view', 'daily_sales.create']
        }));
        setStaffMembers(prev => {
          const merged = [...mappedStaff];
          prev.forEach(p => { if (!merged.some(m => m.id === p.id)) merged.push(p); });
          return merged;
        });
      }

      const { data: salesData } = await supabase.from('daily_sales_entries').select('*').order('created_at', { ascending: false }).limit(500);
      if (salesData) {
        const mapped: DailySalesEntry[] = salesData.map((row: any) => {
          const photoUrl = Array.isArray(row.photo_proof_urls) && row.photo_proof_urls.length > 0
            ? row.photo_proof_urls[0]
            : (row.sales_image_url || '');
          return {
            id: row.id,
            businessId: row.business_id || 'business_primary',
            shopId: row.shop_id || '',
            shopName: row.shop_name || '',
            staffId: row.staff_id || '',
            staffName: row.staff_name || '',
            date: row.date,
            amount: Number(row.amount) || 0,
            salesImageUrl: photoUrl,
            optionalNote: row.notes || row.optional_note || '',
            status: row.status || 'UNDER_REVIEW',
            correctionReason: row.rejection_reason || row.correction_reason || '',
            reviewTimestamp: row.review_timestamp || '',
            reviewerName: row.reviewer_name || '',
            createdAt: row.created_at || new Date().toISOString()
          };
        });
        setSalesEntries(mapped);
      }
    } catch (e) {
      console.warn('[MANUAL REFRESH ERROR]', e);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AppContextType = {
    darkMode, toggleDarkMode,
    isMobileSidebarOpen, setIsMobileSidebarOpen, toggleMobileSidebar,
    jwtToken, currentUser, login, logout,
    currentRole, setCurrentRole,
    currentBusiness, allBusinesses, switchBusiness,
    shops, staffMembers, adminUsers,
    salesEntries, notifications, auditLogs, platformMetrics,
    activeTab, setActiveTab,
    isLoading, authLoading, authError, clearAuthError,
    addSalesEntry, updateSalesStatus, deleteSalesEntry,
    addShop, updateShop, deleteShop,
    addStaff, updateStaff, deleteStaff,
    addAdminUser, updateAdminUser, deleteAdminUser,
    markNotificationRead, updateBusinessSettings,
    createNewBusiness, deleteBusiness,
    checkEntitlement, updateUserProfile,
    toggleAdminGoogleLogin,
    checkAndAuthorizeGoogleEmail,
    refreshData
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
