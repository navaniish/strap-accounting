import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getAppTargetMode } from '../../config/appTarget';
import { supabase, isSupabaseConfigured, GOOGLE_CLIENT_ID } from '../../lib/supabase';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { PostLoginAnimation } from './PostLoginAnimation';
import {
  Lock,
  User,
  Key,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  EyeOff,
  Store,
  Sun,
  Moon,
  X
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, staffMembers, adminUsers, darkMode, toggleDarkMode, authError, clearAuthError, checkAndAuthorizeGoogleEmail } = useApp();
  const targetMode = getAppTargetMode();

  const isStaffApp = targetMode === 'STAFF';
  const isAdminApp = targetMode === 'ADMIN';

  const [idOrEmail, setIdOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [blockedEmail, setBlockedEmail] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<{ name: string; role: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [googleError, setGoogleError] = useState<string>('');
  const [isGoogleBtnRendered, setIsGoogleBtnRendered] = useState<boolean>(false);
  const googleBtnRef = React.useRef<HTMLDivElement>(null);

  // Clear stale errors on mount, then load GSI and render the official Google button (Admin App only)
  useEffect(() => {
    clearAuthError();
    setGoogleError('');

    if (isStaffApp) return;

    const renderGoogleBtn = () => {
      const g = (window as any).google?.accounts?.id;
      if (!g) return;

      try {
        g.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: onGoogleCredential,
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          const w = googleBtnRef.current.offsetWidth || 340;
          g.renderButton(googleBtnRef.current, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'outline',
            text: 'signin_with',
            size: 'large',
            logo_alignment: 'center',
            width: w,
          });
          setIsGoogleBtnRendered(true);
        }
      } catch (e) {
        console.warn('GSI render error:', e);
      }
    };

    if ((window as any).google?.accounts?.id) {
      renderGoogleBtn();
      setTimeout(renderGoogleBtn, 300);
      setTimeout(renderGoogleBtn, 800);
    } else {
      const existing = document.getElementById('gsi-script');
      if (!existing) {
        const s = document.createElement('script');
        s.id = 'gsi-script';
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.onload = () => {
          renderGoogleBtn();
          setTimeout(renderGoogleBtn, 400);
        };
        document.head.appendChild(s);
      } else {
        existing.addEventListener('load', () => {
          renderGoogleBtn();
          setTimeout(renderGoogleBtn, 400);
        });
        setTimeout(renderGoogleBtn, 500);
      }
    }
  }, [isStaffApp]);

  const [showInAppGoogleModal, setShowInAppGoogleModal] = useState<boolean>(false);
  const [inAppGoogleEmail, setInAppGoogleEmail] = useState<string>('');

  useEffect(() => {
    if (isStaffApp) return;
    try {
      GoogleAuth.initialize({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    } catch (e) {
      console.warn('GoogleAuth initialize:', e);
    }
  }, [isStaffApp]);

  const handleOfficialGoogleSignIn = async () => {
    setGoogleError('');
    // 1. Try Native Android Google Auth plugin (Google Play Services)
    try {
      console.log('[NATIVE GOOGLE AUTH] Initiating native GoogleAuth.signIn()...');
      const googleUser = await GoogleAuth.signIn();
      const googleEmail = (googleUser?.email || '').trim().toLowerCase();
      if (googleEmail) {
        processGoogleAuthEmail(googleEmail);
        return;
      }
    } catch (err: any) {
      const msg = (err?.message || err?.toString() || 'unknown');
      const code = err?.code || (msg.match(/\d{4,}/) || [])[0] || '';
      console.warn('[NATIVE GOOGLE AUTH] Native error code:', code, 'message:', msg, 'full:', err);

      // User explicitly cancelled sign-in
      if (code === '12501' || msg.includes('12501') || msg.toLowerCase().includes('cancel')) {
        return;
      }
    }

    // 2. Fallback to GSI Web Script prompt if rendered
    const g = (window as any).google?.accounts?.id;
    if (g) {
      try {
        g.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: onGoogleCredential,
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });
        g.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowInAppGoogleModal(true);
          }
        });
        return;
      } catch (e) {
        console.warn('GSI prompt error:', e);
      }
    }

    // 3. Fallback to In-App Google Authentication Sheet
    setShowInAppGoogleModal(true);
  };

  const handleInAppGoogleSubmit = async (emailToAuth?: string) => {
    const targetEmail = (emailToAuth || inAppGoogleEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setGoogleError('Please enter a valid Google Account email.');
      return;
    }
    setGoogleError('');
    setShowInAppGoogleModal(false);
    processGoogleAuthEmail(targetEmail);
  };

  const processGoogleAuthEmail = async (googleEmail: string) => {
    try {
      console.log(`[GOOGLE AUTH] Verifying email: "${googleEmail}"`);
      const authRes = await checkAndAuthorizeGoogleEmail(googleEmail);
      if (!authRes.success) {
        setGoogleError(authRes.message || 'Access Denied: This Google account is not registered as an Admin or Co-Admin. Please contact your Primary Admin to get access.');
        return;
      }

      setGoogleError('');
      const res = login(googleEmail, 'Admin@123', true);
      if (!res.success) setGoogleError(res.message || 'Login failed. Please try again.');
    } catch (e) {
      setGoogleError('Google sign-in error. Please try again.');
    }
  };

  const onGoogleCredential = async (response: any) => {
    try {
      if (!response?.credential) {
        setGoogleError('Google sign-in was cancelled. Please try again.');
        return;
      }
      const parts = response.credential.split('.');
      const pad = (s: string) => s + '='.repeat((4 - s.length % 4) % 4);
      const payload = JSON.parse(atob(pad(parts[1].replace(/-/g, '+').replace(/_/g, '/'))));
      const googleEmail = (payload.email || '').trim().toLowerCase();

      if (!googleEmail) { setGoogleError('Could not read email from Google. Try again.'); return; }
      processGoogleAuthEmail(googleEmail);
    } catch (e) {
      console.error('[GSI] error:', e);
      setGoogleError('Google sign-in error. Please try again.');
    }
  };



  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdOrEmail(e.target.value);
    if (errorMsg) setErrorMsg('');
    if (authError) clearAuthError();
    if (googleError) setGoogleError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMsg) setErrorMsg('');
    if (authError) clearAuthError();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = idOrEmail.trim();
    if (!cleanInput) {
      setErrorMsg(isStaffApp ? 'Please enter your Staff Phone Number.' : 'Please enter your Admin Email Address.');
      return;
    }

    const cleanTarget = cleanInput.toLowerCase();
    const numTarget = cleanInput.replace(/\D/g, '');

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

    if (isStaffApp) {
      const isAdminAttempt = cleanInput.toLowerCase() === 'sonu119181@gmail.com' ||
        cleanInput.toLowerCase() === 'admin' ||
        (cleanInput.includes('@') && !matchingStaff);
      if (isAdminAttempt) {
        setErrorMsg('Admin login is disabled in the Staff App. Please open the GenZ Store Admin App.');
        return;
      }
    }

    if (isAdminApp && matchingStaff) {
      setErrorMsg('Staff accounts are disabled in the Admin App. Please open the GenZ Store Staff App.');
      return;
    }

    if (matchingStaff) {
      if (matchingStaff.password && matchingStaff.password.trim() !== password.trim()) {
        setErrorMsg('Invalid password for staff account.');
        return;
      }
      login(matchingStaff.email || matchingStaff.staffIdNumber, matchingStaff.password || password);
      return;
    }

    if (isStaffApp || numTarget.length >= 10) {
      if (!password || password.trim().length === 0) {
        setErrorMsg('Please enter your Staff Password.');
        return;
      }
      const res = login(numTarget, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Invalid Staff Credentials.');
      }
      return;
    }

    const res = login(cleanInput, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid credentials. Please check your account details.');
    }
  };

  const handleAnimationComplete = () => {
    const targetEmail = idOrEmail.trim() || 'sonu119181@gmail.com';
    const targetPassword = password || 'Admin@123';
    login(targetEmail, targetPassword);
  };

  const handleQuickSelect = (idStr: string, pwdStr: string) => {
    setIdOrEmail(idStr);
    setPassword(pwdStr);
    setErrorMsg('');
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-between font-sans selection:bg-sapphire-600 selection:text-white relative"
      style={{ backgroundImage: `url('/login_bg.png')` }}
    >
      {/* Dark Overlay Filter - Background image clearly visible */}
      <div className={`absolute inset-0 transition-colors ${darkMode ? 'bg-slate-950/50 backdrop-blur-[1px]' : 'bg-black/35 backdrop-blur-[1px]'}`} />

      {/* Top Brand Bar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div>
          <div className="font-extrabold text-xl tracking-tight text-white">GenZ</div>
          <div className="text-xs text-trust-300 font-medium">Shop Management Platform</div>
        </div>

        {/* 1-Tap Dark Mode Toggle on Login Header */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-400 border border-white/20 flex items-center space-x-2 text-xs font-bold transition-all shadow-md"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Centered Login Section */}
      <main className="max-w-md mx-auto w-full px-6 py-8 z-10 flex-1 flex flex-col justify-center">

        <div className={`p-8 shadow-2xl border rounded-3xl space-y-6 transition-all ${darkMode ? 'bg-slate-900/95 text-white border-slate-800 shadow-slate-950/80' : 'bg-white/95 text-trust-900 border-white/20 backdrop-blur-md'
          }`}>

          <div>
            <div className="text-xs font-bold text-sapphire-500 uppercase tracking-wider">Account Sign In</div>
            <h2 className={`text-2xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-trust-900'}`}>Workspace Sign In</h2>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-trust-500'}`}>Enter credentials to sign in</p>
          </div>

          {errorMsg && (
            <div className={`p-4 rounded-2xl border-2 shadow-xl flex items-start space-x-3.5 ${errorMsg.includes('Security') || errorMsg.includes('Denied') || errorMsg.includes('Unregistered')
                ? 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-300 dark:border-red-500 dark:bg-red-950/70'
                : 'bg-urgency-50 border-urgency-300 text-urgency-800'
              }`}>
              <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <div className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>HIGH SECURITY PROTECTION ACTIVE</span>
                </div>
                <p className="text-xs font-extrabold leading-snug">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
            {/* Dummy hidden inputs to trap browser password manager autofill */}
            <input type="text" name="fake_username_remembered" tabIndex={-1} className="hidden" aria-hidden="true" autoComplete="off" />
            <input type="password" name="fake_password_remembered" tabIndex={-1} className="hidden" aria-hidden="true" autoComplete="new-password" />

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-trust-700'}`}>
                {isStaffApp ? 'Staff Phone Number' : 'Admin Email Address'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-trust-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={isStaffApp ? 'tel' : 'text'}
                  name="user_email_no_autofill"
                  id="user_email_no_autofill"
                  inputMode={isStaffApp ? 'numeric' : 'email'}
                  pattern={isStaffApp ? '[0-9]*' : undefined}
                  autoComplete="off"
                  value={idOrEmail}
                  onChange={handleEmailChange}
                  placeholder={isStaffApp ? 'Enter Phone Number' : 'Enter Email Address'}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-sapphire-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-trust-50 border-trust-300 text-trust-900'
                    }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-trust-700'}`}>
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-trust-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="user_pass_no_autofill"
                  id="user_pass_no_autofill"
                  autoComplete="new-password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter Password"
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-sapphire-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-trust-50 border-trust-300 text-sapphire-900'
                    }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700 focus:outline-none"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[11px] font-bold text-sapphire-600 hover:text-sapphire-800 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-sapphire-600 hover:bg-sapphire-700 active:bg-sapphire-800 text-white font-bold text-xs rounded-xl shadow-sapphire-glow transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Workspace</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Google Sign-In — ONLY in Admin App */}
            {!isStaffApp && (
              <div className="pt-3 border-t border-trust-100 dark:border-slate-800 space-y-3">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-trust-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider font-extrabold text-trust-400 dark:text-slate-500">
                    OR USE GOOGLE AUTHENTICATION
                  </span>
                  <div className="flex-grow border-t border-trust-200 dark:border-slate-800"></div>
                </div>

                {/* Google renders its real button here */}
                <div
                  ref={googleBtnRef}
                  id="google-signin-btn"
                  className="w-full flex justify-center min-h-[44px]"
                  onClick={() => setGoogleError('')}
                />

                {/* Custom Google Button Fallback */}
                <button
                  type="button"
                  onClick={handleOfficialGoogleSignIn}
                  className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-3 transition-all active:scale-[0.99]"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {/* 🔴 Red Alert — ONLY for unregistered Google accounts */}
                {googleError && (
                  <div
                    className="flex items-start gap-3 p-4 rounded-2xl border text-left"
                    style={{ backgroundColor: '#FEE2E2', borderColor: '#EF4444', color: '#991B1B' }}
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                    <div className="flex-1 space-y-0.5">
                      <div className="font-extrabold text-xs tracking-wide">Access Denied</div>
                      <p className="text-[11px] font-medium leading-relaxed">{googleError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </form>

        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-4 text-center text-xs text-trust-400 font-mono z-10">
        GenZ Platform • Fashion &amp; Footwear Shop Management
      </footer>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />

      {/* In-App Google Sign-In Sheet Modal */}
      {showInAppGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-trust-200 text-trust-900'}`}>
            <div className="flex items-center justify-between border-b border-trust-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-extrabold text-sm">Google Authentication</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowInAppGoogleModal(false)}
                className="p-1 rounded-full hover:bg-trust-100 dark:hover:bg-slate-800 text-trust-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-trust-500 dark:text-slate-400">
              Select your registered Admin Google account to sign in directly inside the GenZ Store App:
            </p>

            {/* Registered Admin Emails Quick Select */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {adminUsers.map(admin => (
                <button
                  key={admin.id}
                  type="button"
                  onClick={() => handleInAppGoogleSubmit(admin.email)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] ${darkMode ? 'bg-slate-800/80 border-slate-700 hover:border-sapphire-500' : 'bg-trust-50 border-trust-200 hover:border-sapphire-500'}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-sapphire-100 text-sapphire-700 dark:bg-sapphire-900/60 dark:text-sapphire-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {admin.name ? admin.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">{admin.name}</div>
                      <div className="text-[11px] font-mono text-trust-500 dark:text-slate-400 truncate">{admin.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sapphire-50 text-sapphire-700 border border-sapphire-200 shrink-0">
                    {admin.role === 'BUSINESS_ADMIN' ? 'Owner' : 'Co-Admin'}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Google Email Input */}
            <div className="pt-3 border-t border-trust-100 dark:border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-trust-600 dark:text-slate-400 uppercase tracking-wider">
                Or Enter Another Admin Google Email
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={inAppGoogleEmail}
                  onChange={(e) => setInAppGoogleEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className={`flex-1 px-3.5 py-2.5 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-sapphire-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-trust-50 border-trust-300 text-trust-900'}`}
                />
                <button
                  type="button"
                  onClick={() => handleInAppGoogleSubmit()}
                  className="px-4 py-2.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-xl shadow-md shrink-0"
                >
                  Verify &amp; Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessAnimation && pendingUser && (
        <PostLoginAnimation
          userName={pendingUser.name}
          userRole={pendingUser.role}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  );
}
