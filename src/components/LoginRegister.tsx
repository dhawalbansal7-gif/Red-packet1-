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
      
      // Block unassigned guests from logging in
      if (matchedUser.role === 'guest') {
        setError(`Access Denied: Your account (WePlay ID: ${cleanId}) is pending role assignment. Please request Supreme Dhawal or a Super Manager to approve and promote your role in the staff credentials panel before you can access.`);
        return;
      }

      onLoginSuccess({
        id: matchedUser.weplayId,
        name: matchedUser.name,
        role: matchedUser.role,
      });

      setSuccess(`Welcome back, ${matchedUser.name}!`);

      if (onClose) setTimeout(onClose, 800);
    } else {
      setError('Invalid WePlay ID or Password. Please double check your credentials.');
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
    setSuccess(`🎉 Profile Registered! ID "${cleanRegId}" has been successfully added to the staff approval roster. You cannot log in yet. Please ask Supreme Dhawal or a Super Manager to assign your active Coordinator or Manager role so you can access the system.`);
    
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

                {/* Security and Approval Notice */}
                <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                    🛡️ Security active. Newly registered users are stored in the queue and must be approved in Supreme's staff roster before logging in.
                  </span>
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
                  Registered accounts are placed in the staff credentials approval queue. Only after Supreme Dhawal or a Super Manager approves your account can you log in.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
