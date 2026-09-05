-- ==============================================================================
-- GENZ RETAIL MULTI-TENANT REAL-TIME DATABASE MIGRATION SCRIPT
-- RUN THIS IN YOUR SUPABASE SQL EDITOR AT: https://dfhjpjrtexcnbqjvokvh.supabase.co
-- ==============================================================================

-- 1. Businesses Table (Multi-tenant Workspace Accounts)
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    workspace_id TEXT UNIQUE NOT NULL,
    business_type TEXT DEFAULT 'Retail & Multi-Branch Store',
    currency TEXT DEFAULT '₹',
    time_zone TEXT DEFAULT 'Asia/Kolkata (GMT+5:30)',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    reminder_time TEXT DEFAULT '18:00',
    plan_tier TEXT DEFAULT 'PROFESSIONAL',
    subscription_status TEXT DEFAULT 'ACTIVE',
    trial_days_left INT DEFAULT 14,
    max_shops INT DEFAULT 999,
    max_staff INT DEFAULT 999,
    max_storage_gb NUMERIC DEFAULT 100,
    used_storage_gb NUMERIC DEFAULT 0.1,
    created_at TEXT DEFAULT NOW()::TEXT
);

-- 2. Shops Table (Store Outlet Branches)
CREATE TABLE IF NOT EXISTS public.shops (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    location TEXT,
    address TEXT,
    contact TEXT,
    phone TEXT,
    manager_name TEXT,
    status TEXT DEFAULT 'ACTIVE',
    assigned_staff_ids JSONB DEFAULT '[]'::jsonb,
    created_at TEXT DEFAULT NOW()::TEXT
);

-- Add columns if table already exists
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS assigned_staff_ids JSONB DEFAULT '[]'::jsonb;

-- 3. Staff Members Table
CREATE TABLE IF NOT EXISTS public.staff_members (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    staff_id_number TEXT,
    password TEXT,
    role TEXT DEFAULT 'Staff',
    assigned_shop_ids JSONB DEFAULT '[]'::jsonb,
    created_at TEXT DEFAULT NOW()::TEXT
);

-- 4. Daily Sales Entries Table (Sales Submissions & Verification)
CREATE TABLE IF NOT EXISTS public.daily_sales_entries (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    shop_id TEXT REFERENCES public.shops(id) ON DELETE SET NULL,
    shop_name TEXT NOT NULL,
    staff_id TEXT REFERENCES public.staff_members(id) ON DELETE SET NULL,
    staff_name TEXT NOT NULL,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    sales_image_url TEXT,
    image_file_name TEXT,
    optional_note TEXT,
    status TEXT DEFAULT 'UNDER_REVIEW',
    submitted_at TEXT DEFAULT NOW()::TEXT,
    reviewed_at TEXT,
    rejection_reason TEXT
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT DEFAULT NOW()::TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'SYSTEM'
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TEXT DEFAULT NOW()::TEXT
);

-- 7. Admin Users Table (Workspace Business Owners & Managers)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT,
    role TEXT DEFAULT 'co_admin',
    status TEXT DEFAULT 'invited',
    auth_provider TEXT DEFAULT 'google',
    allow_google_login BOOLEAN DEFAULT TRUE,
    created_at TEXT DEFAULT NOW()::TEXT
);

-- Add columns if table already exists
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS allow_google_login BOOLEAN DEFAULT TRUE;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'invited';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'google';

-- DISABLE ROW LEVEL SECURITY (RLS) FOR UNRESTRICTED REALTIME MULTI-DEVICE ACCESS
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- ENABLE REALTIME REPLICATION FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_sales_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;
