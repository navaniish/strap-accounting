import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || 'https://dfhjpjrtexcnbqjvokvh.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NBL25gN7GblykziLp0e8gA_mEoh3GWr';

export const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '136722071275-ti30f765jle5u82nna3ihm1dbjqo6pp3.apps.googleusercontent.com';

// Validates that Supabase credentials are correctly set
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const SUPABASE_AUTH_ENDPOINTS = {
  authorize: `${supabaseUrl}/auth/v1/oauth/authorize`,
  token: `${supabaseUrl}/auth/v1/oauth/token`,
  jwks: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
  oidcDiscovery: `${supabaseUrl}/auth/v1/.well-known/openid-configuration`
};
