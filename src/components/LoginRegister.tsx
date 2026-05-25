/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, Key, Eye, EyeOff, UserCheck, ShieldAlert, Sparkles, UserX } from 'lucide-react';
import { UserRole } from '../types';
import { getStoredUsers, saveStoredUsers } from '../db';

interface LoginRegisterProps {
  onLoginSuccess: (user: { id: string; name: string; role: UserRole }) => void;
  onClose?: () => void;
  currentUser?: { id: string; name: string; role: UserRole } | null;
  onLogout?: () => void;
}

export default function LoginRegister({ onLoginSuccess, onClose, currentUser, onLogout }: LoginRegisterProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginId.trim() || !loginPass.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    const users = getStoredUsers();
    const cleanId = loginId.trim();

    if (users[cleanId] && users[cleanId].pass === loginPass) {
      const matchedUser = users[cleanId];
      
      onLoginSuccess({
        id: matchedUser.weplayId,
        name: matchedUser.name,
        role: matchedUser.role,
      });

      if (matchedUser.role === 'guest') {
        setSuccess(`Welcome back, ${matchedUser.name}! (Guest read-only view)`);
      } else {
        setSuccess(`Welcome back, ${matchedUser.name}!`);
      }

      if (onClose) setTimeout(onClose, 800);
    } else {
      setError('Invalid WePlay ID or Password. Make sure to double check or use our Quick Sign-In helper 아래 below.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regId.trim() || !regName.trim() || !regPass.trim()) {
      setError('All fields are required.');
      return;
    }

    const cleanRegId = regId.trim();

    if (cleanRegId === '19122007') {
      setError('Cannot register using the Supreme Master ID.');
      return;
    }

    const users = getStoredUsers();

    if (users[cleanRegId]) {
      setError('This WePlay ID is already registered.');
      return;
    }

    // Register as 'guest' initially
    users[cleanRegId] = {
      weplayId: cleanRegId,
      name: regName.trim(),
      pass: regPass,
      role: 'guest',
    };

    saveStoredUsers(users);
    setSuccess(`🎉 Registered success! ID "${cleanRegId}" is added. You can now use "Sign In" tab and login instantly as Guest. Ask Dhawal (Supreme) or any Super Manager to upgrade you to active Coordinator or Manager!`);
    
    // Clear registration fields
    setRegId('');
    setRegName('');
    setRegPass('');
  };

  const quickFill = (id: string, pass: string) => {
    setLoginId(id);
    setLoginPass(pass);
    setError('');
  };

  // Helper roles render
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'supreme': return 'Supreme Power 👑';
      case 'super_manager': return 'Super Manager ⚡';
      case 'manager': return 'Manager 🛡️';
      default: return 'Guest Viewer 👤';
    }
  };

  return (
    <div id="auth-panel" className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {currentUser ? (
        <div id="logged-in-profile" className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500 text-2xl font-bold font-display">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-display font-semibold text-slate-100">{currentUser.name}</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">WePlay ID: {currentUser.id}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {getRoleLabel(currentUser.role)}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-4 mt-2">
            <button
              id="btn-logout"
              onClick={onLogout}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-sm font-medium rounded-lg transition-all border border-slate-700/50 hover:border-red-500/30 cursor-pointer"
            >
              Sign Out Account
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 font-display">
            <button
              id="tab-login"
              onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'border-amber-500 text-amber-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              id="tab-register"
              onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'border-amber-500 text-amber-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div id="auth-error" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div id="auth-success" className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <UserCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <form id="form-login" onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 font-display mb-1.5">WePlay User ID</label>
                  <input
                    type="text"
                    required
                    id="input-login-id"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter your WePlay ID"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all font-mono"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-slate-400 font-display">Password</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      id="input-login-pass"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="Enter WePlay password"
                      className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm rounded-lg shadow-md hover:shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Access Account
                </button>

                {/* Supreme ID & Password Helper block */}
                <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-amber-500 font-extrabold tracking-wider">
                      👑 Developer & Staff Quick Logins
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">Single Tap login</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => quickFill('19122007', 'dhawal19122007')}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/16 text-amber-400 text-xs flex items-center justify-between border border-amber-500/20 transition-all cursor-pointer font-mono"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-amber-500">👑 Supreme:</span> 
                        <span className="font-bold">19122007</span>
                      </span>
                      <span className="text-[8px] tracking-wider uppercase font-extrabold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        Fill
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => quickFill('1002', 'super123')}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/16 text-blue-300 text-xs flex items-center justify-between border border-blue-500/20 transition-all cursor-pointer font-mono"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-blue-400">⚡ Super Mgr:</span> 
                        <span className="font-bold">1002</span>
                      </span>
                      <span className="text-[8px] tracking-wider uppercase font-extrabold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                        Fill
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickFill('1001', 'manager123')}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/16 text-emerald-400 text-xs flex items-center justify-between border border-emerald-500/20 transition-all cursor-pointer font-mono"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-emerald-400">🛡️ Manager:</span> 
                        <span className="font-bold">1001</span>
                      </span>
                      <span className="text-[8px] tracking-wider uppercase font-extrabold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Fill
                      </span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-900 text-center">
                    <span className="text-[9px] text-slate-500 font-sans">
                      * Or manual enter. Supreme ID: <strong className="text-amber-400 font-mono">19122007</strong> | Pass: <strong className="text-amber-400 font-mono">dhawal19122007</strong>
                    </span>
                  </div>
                </div>
              </form>
            ) : (
              <form id="form-register" onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 font-display mb-1.5">Desired WePlay ID (Numeric or text)</label>
                  <input
                    type="text"
                    required
                    id="input-reg-id"
                    value={regId}
                    onChange={(e) => setRegId(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. 1542353"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 font-display mb-1.5">User Full Name</label>
                  <input
                    type="text"
                    required
                    id="input-reg-name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dhawal Bansal"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 font-display mb-1.5">Security Password</label>
                  <input
                    type="password"
                    required
                    id="input-reg-pass"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-register-submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm rounded-lg shadow-md hover:shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create WePlay Profile
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Registered accounts are added instantly as a "Guest Viewer". A Super Manager or Dhawal can upgrade your account to "Manager" status.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
