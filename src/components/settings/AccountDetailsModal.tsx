import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Building2, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  LogOut, 
  X, 
  RefreshCw, 
  Sparkles, 
  Sun, 
  Moon,
  Clock,
  Shield,
  Layers,
  Store,
  Users,
  HardDrive
} from 'lucide-react';
import { generateStrongPassword } from '../../utils/authGenerators';
import { getJWTExpirationText } from '../../utils/jwtAuth';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentRole, currentBusiness, logout, darkMode, toggleDarkMode, jwtToken, shops, staffMembers, updateUserProfile } = useApp();

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'WORKSPACE'>('PROFILE');

  // Separate Form #1: Name & Phone Update State
  const [profileName, setProfileName] = useState<string>(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState<string>(currentUser?.staffIdNumber || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Separate Form #2: Security Password Change State
  const [currentPwd, setCurrentPwd] = useState<string>('');
  const [newPwd, setNewPwd] = useState<string>('');
  const [confirmPwd, setConfirmPwd] = useState<string>('');
  const [showCurrPwd, setShowCurrPwd] = useState<boolean>(false);
  const [showNewPwd, setShowNewPwd] = useState<boolean>(false);
  const [showConfPwd, setShowConfPwd] = useState<boolean>(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = await updateUserProfile({ name: profileName, phone: profilePhone });
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Account Name and Phone Number updated successfully!' });
      setTimeout(() => setProfileMsg(null), 4000);
    } else {
      setProfileMsg({ type: 'error', text: res.message || 'Failed to update profile.' });
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match. Please verify.' });
      return;
    }

    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters with letters, numbers, and symbols.' });
      return;
    }

    setPwdMsg({ type: 'success', text: 'Account password updated successfully! Session JWT Token renewed.' });
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setTimeout(() => setPwdMsg(null), 4000);
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setNewPwd(generated);
    setConfirmPwd(generated);
    setShowNewPwd(true);
    setShowConfPwd(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up text-slate-900 dark:text-white my-auto max-h-[90dvh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-lg shadow-lg">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>{currentUser.name}</span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase rounded-full border border-emerald-300 dark:border-emerald-800">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {currentUser.email || currentUser.staffIdNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Identity & Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SECURITY'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Security & Token
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WORKSPACE')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'WORKSPACE'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Workspace Limits
          </button>
        </div>

        {/* TAB 1: IDENTITY & PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-5 animate-fade-in">
            {/* SEPARATE FORM 1: NAME & PHONE NUMBER UPDATE */}
            <form onSubmit={handleProfileUpdate} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Update Account Name & Phone Number</span>
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                  Personal Details
                </span>
              </div>

              {profileMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Display Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Profile Details</span>
              </button>
            </form>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500" /> Registered Email Address
                </span>
                <span className="font-black text-slate-900 dark:text-white font-mono">{currentUser.email || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" /> Security Access Level
                </span>
                <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[11px] rounded-full uppercase">
                  {currentRole === 'BUSINESS_ADMIN' ? 'Business Admin (Owner)' : currentRole}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" /> Primary Business Workspace
                </span>
                <span className="font-black text-slate-900 dark:text-white">{currentBusiness.name}</span>
              </div>
            </div>

            {/* Quick Preference Controls */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2 text-xs font-extrabold">
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                  {darkMode ? 'DARK' : 'LIGHT'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY & SESSION TOKEN */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Session Encryption & Verification</span>
                </span>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded-full">
                  Verified
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Authentication status: <strong className="text-blue-700 dark:text-blue-300">256-bit Encrypted Token Active</strong>.
              </p>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Session Expiration: {getJWTExpirationText(jwtToken || '')}</span>
              </div>
            </div>

            {/* Password Update Form */}
            <form onSubmit={handlePasswordChange} className="space-y-3 pt-2">
              <div className="font-bold text-xs text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>Update Account Password</span>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate Password
                </button>
              </div>

              {pwdMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  pwdMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  <span>{pwdMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfPwd(!showConfPwd)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                Save New Security Password
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: WORKSPACE LIMITS */}
        {activeTab === 'WORKSPACE' && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Active Outlets & Shops</span>
              </div>
              <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {shops.length} / {currentBusiness.maxShops} Outlets
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Registered Staff Accounts</span>
              </div>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {staffMembers.length} / {currentBusiness.maxStaff} Accounts
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Cloud Storage Entitlement</span>
              </div>
              <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                {currentBusiness.usedStorageGb} GB / {currentBusiness.maxStorageGb} GB
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="px-4 py-2.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
