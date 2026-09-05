import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User, Key, AlertCircle, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';

export const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { login, staffMembers } = useApp();

  const [idOrEmail, setIdOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!idOrEmail.trim()) {
      setErrorMsg('Please enter your Numeric Staff ID or Email.');
      return;
    }

    const res = login(idOrEmail, password);
    if (res.success) {
      setSuccessMsg('Authentication successful! Logging you in...');
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleUseDemoStaff = (staffIdNum: string, pwd: string) => {
    setIdOrEmail(staffIdNum);
    setPassword(pwd);
  };

  return (
    <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-trust-200 animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-trust-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sapphire-600 text-white flex items-center justify-center font-bold text-lg">
              G
            </div>
            <div>
              <h2 className="font-extrabold text-trust-900 text-lg">GenZ Platform Sign In</h2>
              <p className="text-xs text-trust-500">Sign in with Numeric Staff ID & Password</p>
            </div>
          </div>
          <button onClick={onClose} className="text-trust-400 hover:text-trust-600 font-bold">
            ✕
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-urgency-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-growth-50 border border-growth-200 text-growth-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-growth-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1">
              Staff Phone Number (Staff ID) / Admin Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-trust-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                value={idOrEmail}
                onChange={(e) => setIdOrEmail(e.target.value)}
                placeholder="e.g. 9833344556 or sonu119181@gmail.com"
                className="w-full pl-9 pr-4 py-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-extrabold text-trust-900 focus:ring-2 focus:ring-sapphire-500 font-mono"
                required
              />
            </div>
            <span className="text-[10px] text-trust-400 mt-1 block">Staff sign in using their Phone Number (Numeric Staff ID)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1">
              Password (Alphanumeric + Special Characters)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-trust-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. Gz@8392!K"
                className="w-full pl-9 pr-9 py-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-extrabold text-sapphire-900 focus:ring-2 focus:ring-sapphire-500 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700 focus:outline-none"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-xl shadow-sapphire-glow transition-all flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Authenticate & Access Account</span>
          </button>
        </form>

      </div>
    </div>
  );
};
