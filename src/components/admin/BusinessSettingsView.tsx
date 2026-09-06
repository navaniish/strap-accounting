import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Building2, Clock, Globe, Save, CheckCircle, ShieldCheck, Key, Lock, Eye, EyeOff, ShieldAlert, Cpu, RefreshCw, Sparkles, Trash2, AlertTriangle, Sun, Moon } from 'lucide-react';
import { DevicePermissionsModal } from '../settings/DevicePermissionsModal';
import { getJWTExpirationText, getJWTSecret, setDynamicJWTSecret, generateCryptographicJWTSecret } from '../../utils/jwtAuth';
import { generateStrongPassword } from '../../utils/authGenerators';

export const BusinessSettingsView: React.FC = () => {
  const { currentBusiness, allBusinesses, updateBusinessSettings, deleteBusiness, jwtToken, currentUser, darkMode, toggleDarkMode } = useApp();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [name, setName] = useState<string>(currentBusiness.name);
  const [businessType, setBusinessType] = useState<string>(currentBusiness.businessType);
  const [currency, setCurrency] = useState<string>(currentBusiness.currency);
  const [timeZone, setTimeZone] = useState<string>(currentBusiness.timeZone);
  const [reminderTime, setReminderTime] = useState<string>(currentBusiness.reminderTime);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [activeSecretKey, setActiveSecretKey] = useState<string>(() => getJWTSecret());

  // Security Password Change State
  const [currentPwd, setCurrentPwd] = useState<string>('');
  const [newPwd, setNewPwd] = useState<string>('');
  const [confirmPwd, setConfirmPwd] = useState<string>('');
  const [showCurrPwd, setShowCurrPwd] = useState<boolean>(false);
  const [showNewPwd, setShowNewPwd] = useState<boolean>(false);
  const [showConfPwd, setShowConfPwd] = useState<boolean>(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessSettings({
      name,
      businessType,
      currency,
      timeZone,
      reminderTime
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

    setPwdMsg({ type: 'success', text: 'Security password updated successfully! Session JWT Token renewed.' });
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setTimeout(() => setPwdMsg(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-trust-900">Business Profile & Settings</h1>
          <p className="text-xs text-trust-500 mt-0.5">Workspace ID: {currentBusiness.workspaceId}</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-growth-50 border border-growth-200 text-growth-800 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-growth-600" />
          <span className="font-bold text-xs">Settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-5 sm:p-8 rounded-2xl border border-trust-200 shadow-psychology space-y-6">
        <h2 className="font-bold text-trust-900 text-base border-b border-trust-100 pb-3">Business Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1">Business Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1">Industry / Category</label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1">Time Zone</label>
            <input
              type="text"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1">Daily Sales Reminder Time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-6 py-2.5 bg-sapphire-600 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* APP THEME & DARK MODE CARD */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-trust-200 shadow-psychology space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-trust-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0">
              {darkMode ? <Moon className="w-6 h-6 text-indigo-600" /> : <Sun className="w-6 h-6 text-amber-500" />}
            </div>
            <div>
              <h2 className="font-extrabold text-trust-900 text-lg">App Display Theme (Dark Mode)</h2>
              <p className="text-xs text-trust-500 mt-0.5">
                Toggle between Light Mode ☀️ and Dark Mode 🌙 for all screens and outlets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleDarkMode}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              darkMode 
                ? 'bg-trust-900 text-amber-400 border border-trust-700 shadow-lg' 
                : 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
            }`}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Switch to Light Mode ☀️</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>Switch to Dark Mode 🌙</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ACCOUNT SECURITY & PASSWORD RESET CARD */}
      <form onSubmit={handlePasswordChange} className="bg-white p-6 sm:p-8 rounded-3xl border border-trust-200 shadow-psychology space-y-6 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-trust-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-sapphire-50 border border-sapphire-200 text-sapphire-600 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-trust-900 text-lg">Account Security & Password Reset</h2>
              <p className="text-xs text-trust-500 mt-0.5">
                Active account: <span className="font-bold text-trust-900">{currentUser?.email || currentUser?.staffIdNumber}</span>
              </p>
            </div>
          </div>

          <span className="badge-growth text-[10px] px-3 py-1 rounded-full font-mono font-bold self-start sm:self-auto shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HS256 JWT Encrypted</span>
          </span>
        </div>

        {pwdMsg && (
          <div className={`p-4 rounded-2xl text-xs flex items-center space-x-2 font-bold ${
            pwdMsg.type === 'success' ? 'bg-growth-50 border border-growth-200 text-growth-800' : 'bg-urgency-50 border border-urgency-200 text-urgency-800'
          }`}>
            {pwdMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-growth-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-urgency-600 shrink-0" />}
            <span>{pwdMsg.text}</span>
          </div>
        )}

        {/* Password Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* 1. Current Password */}
          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-trust-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrPwd ? 'text' : 'password'}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Current Password"
                className="w-full pl-9 pr-10 py-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-extrabold font-mono text-trust-900 focus:ring-2 focus:ring-sapphire-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrPwd(!showCurrPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700"
                title={showCurrPwd ? 'Hide Password' : 'Show Password'}
              >
                {showCurrPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. New Password with Auto-Generate Shortcut */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-trust-700">
                New Password
              </label>
              <button
                type="button"
                onClick={() => {
                  const generated = generateStrongPassword();
                  setNewPwd(generated);
                  setConfirmPwd(generated);
                  setShowNewPwd(true);
                  setShowConfPwd(true);
                }}
                className="text-[10px] font-bold text-sapphire-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Auto-Generate
              </button>
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-trust-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="e.g. Gz@8392!K"
                className="w-full pl-9 pr-10 py-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-extrabold font-mono text-sapphire-900 focus:ring-2 focus:ring-sapphire-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700"
                title={showNewPwd ? 'Hide Password' : 'Show Password'}
              >
                {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-trust-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfPwd ? 'text' : 'password'}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full pl-9 pr-10 py-3 bg-trust-50 border border-trust-300 rounded-xl text-xs font-extrabold font-mono text-sapphire-900 focus:ring-2 focus:ring-sapphire-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfPwd(!showConfPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700"
                title={showConfPwd ? 'Hide Password' : 'Show Password'}
              >
                {showConfPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

        {/* Action Button Footer */}
        <div className="pt-2 flex justify-end">
          <button 
            type="submit" 
            className="w-full sm:w-auto px-6 py-3 bg-trust-900 hover:bg-trust-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <Key className="w-4 h-4 text-sapphire-400" />
            <span>Update Password & Renew Token</span>
          </button>
        </div>
      </form>

      {/* Danger Zone — Delete Active Business Workspace */}
      <div className="bg-red-50/70 border border-red-200 p-6 sm:p-8 rounded-2xl space-y-4 font-sans">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-red-950">Danger Zone — Delete Active Business Tenant</h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Permanently delete <strong>"{currentBusiness.name}"</strong> (ID: {currentBusiness.workspaceId}). This action will permanently remove all associated shop outlets, staff credentials, and submitted daily sales records for this tenant.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Business Workspace</span>
          </button>
        </div>
      </div>

      {/* Delete Business Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-trust-950/75 backdrop-blur-xs font-sans animate-fade-in">
          <div className="bg-white rounded-2xl border border-trust-300 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center space-x-3 text-red-600 border-b border-trust-100 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-trust-900">Delete Workspace Tenant</h3>
                <p className="text-[11px] text-trust-500 font-mono">Workspace ID: {currentBusiness.workspaceId}</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {deleteError}
              </div>
            )}

            <div className="space-y-3 text-xs text-trust-700">
              <p>
                Are you sure you want to permanently delete <strong>"{currentBusiness.name}"</strong>?
              </p>
              {allBusinesses.length <= 1 ? (
                <div className="p-3 bg-tier-50 border border-tier-200 text-tier-900 font-bold rounded-xl text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-tier-600 shrink-0" />
                  <span>This is your only active workspace. You cannot delete the last workspace tenant. Please register a new business workspace before deleting this one.</span>
                </div>
              ) : (
                <p className="text-trust-500 font-medium">
                  Type <strong>DELETE</strong> below to confirm deletion of this workspace.
                </p>
              )}

              {allBusinesses.length > 1 && (
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl font-bold font-mono text-xs text-trust-900 uppercase"
                />
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-trust-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-trust-100 hover:bg-trust-200 text-trust-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>

              {allBusinesses.length > 1 && (
                <button
                  type="button"
                  disabled={deleteConfirmText !== 'DELETE'}
                  onClick={async () => {
                    const res = await deleteBusiness(currentBusiness.id);
                    if (res.success) {
                      setShowDeleteModal(false);
                    } else {
                      setDeleteError(res.message || 'Failed to delete business.');
                    }
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                >
                  Confirm Permanent Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
