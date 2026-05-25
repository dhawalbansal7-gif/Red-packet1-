/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SponsorRecord, UserRole } from './types';
import { getStoredSponsors, saveStoredSponsors, syncFromBackend, getStoredUsers } from './db';
import SponsorTable from './components/SponsorTable';
import LoginRegister from './components/LoginRegister';
import UserManagement from './components/UserManagement';
import { Coins, Gift, Users, LogIn, Calculator, RefreshCw, X } from 'lucide-react';

const SESSION_USER_KEY = 'weplay_current_user_session';

export default function App() {
  const [sponsors, setSponsors] = useState<SponsorRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Load initial session on start and set up real-time background sync
  useEffect(() => {
    // Initial immediate load
    setSponsors(getStoredSponsors());

    const syncData = () => {
      syncFromBackend().then(({ sponsors }) => {
        setSponsors(sponsors);

        // Auto-refresh active user role from master server in case Supreme has upgraded us!
        const savedSession = sessionStorage.getItem(SESSION_USER_KEY);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            const latestUsers = getStoredUsers();
            if (latestUsers[parsed.id] && latestUsers[parsed.id].role !== parsed.role) {
              const updatedUser = { ...parsed, role: latestUsers[parsed.id].role };
              setCurrentUser(updatedUser);
              sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
            }
          } catch (e) {
            // failed to load session
          }
        }
      }).catch(err => {
        console.warn("Real-time sync offline.", err);
      });
    };

    // Perform immediate sync and poll every 6 seconds to keep screens active
    syncData();
    const interval = setInterval(syncData, 6000);
    return () => clearInterval(interval);
  }, [resetKey]);

  // Saves changes of sponsors list to localstorage & state
  const handleSponsorsUpdated = (updated: SponsorRecord[]) => {
    setSponsors(updated);
    saveStoredSponsors(updated);
  };

  const handleLoginSuccess = (user: { id: string; name: string; role: UserRole }) => {
    setCurrentUser(user);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_USER_KEY);
  };

  // Calculate Overall Statistics dynamically
  const stats = useMemo(() => {
    return sponsors.reduce(
      (acc, s) => {
        acc.totalInviteGiven += s.totalInviteGiven;
        acc.totalCoinsValue += s.coinsValue;
        acc.totalRedPacketsAll += s.totalRedPacket;
        acc.totalRedPacketsGiven += s.redPacketGiven;
        acc.totalRedPacketsRemaining += s.redPacketToBeGiven;
        return acc;
      },
      {
        totalInviteGiven: 0,
        totalCoinsValue: 0,
        totalRedPacketsAll: 0,
        totalRedPacketsGiven: 0,
        totalRedPacketsRemaining: 0,
      }
    );
  }, [sponsors]);

  const handleUserApprovalReset = () => {
    // Forces soft reloads to components matching the user db
    setResetKey(prev => prev + 1);
  };

  // Helper roles render
  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'supreme': return 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] font-bold';
      case 'super_manager': return 'bg-[#EDE9FE] text-[#5B21B6] border border-[#8B5CF6] font-bold';
      case 'manager': return 'bg-[#DBEAFE] text-[#1E40AF] border border-[#3B82F6] font-bold';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200 font-bold';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'supreme': return 'Supreme Power';
      case 'super_manager': return 'Super Manager';
      case 'manager': return 'Manager';
      default: return 'Guest Viewer';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans select-none">
      
      {/* Primary Header Segment */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand/Logo Element */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <span className="font-display font-extrabold text-white text-base">W</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-white tracking-tight">WePlay Reward Management Portal</span>
                <span className="text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/30">
                  600 GOLD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Sponsorship Ledger & Staff Registry</p>
            </div>
          </div>

          {/* User Sign-in Status */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:block text-right">
                  <span className="block text-xs font-semibold text-slate-200">{currentUser.name}</span>
                  <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full uppercase mt-1 ${getRoleBadgeClass(currentUser.role)}`}>
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
                <button
                  id="btn-trigger-auth-profile"
                  onClick={() => setShowAuthModal(true)}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-display font-bold text-sm tracking-tight cursor-pointer transition-all flex items-center justify-center shadow-inner"
                  title="View Profile Details"
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </button>
              </div>
            ) : (
              <button
                id="btn-header-login"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 hover:border-slate-650 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Staff Access
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Dashboard Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 z-10">
        
        {/* Dynamic Formula Info Header Card */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center font-sans gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-white border border-blue-300 flex items-center justify-center shrink-0 shadow-sm">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-blue-900 font-display flex items-center gap-2 justify-center sm:justify-start">
              ✨ Automatic WePlay Formula Active
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed max-w-3xl">
              Each red packet contains exactly <b className="text-blue-950 font-bold">600 gold</b>. Multiply coin values in <b>Column 6</b> to find <b>Column 3 (Total Packets)</b> using standard division/rounding. Subtract <b>Column 4 (Given)</b> to yield <b>Column 5 (Remaining)</b>.
            </p>
          </div>
          <div className="sm:ml-auto shrink-0 bg-slate-900 text-white px-3.5 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono font-bold shadow-sm">
            e.g. 10,000 coins / 600 = <span className="text-amber-400 font-black">17 Packets</span>
          </div>
        </div>

        {/* Dynamic Multi-Card Statistics (Metric Summary Bento Grid) */}
        <div id="stats-dashboard-grid" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Total Sponsors */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Sponsors Active</span>
              <div className="p-1 px-2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold border border-slate-200">Qty</div>
            </div>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 leading-none">{sponsors.length}</span>
              <span className="text-xs text-slate-500">accounts</span>
            </div>
          </div>

          {/* Card 2: Total Invitees */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Invites Issued</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-blue-600 leading-none">{stats.totalInviteGiven.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">Members</span>
            </div>
          </div>

          {/* Card 3: Overall Coin Value */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 col-span-2 lg:col-span-1 flex flex-col justify-between border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall WePlay Coins</span>
              <Coins className="w-4 h-4 text-amber-500 animate-bounce" />
            </div>
            <div className="flex items-baseline gap-1 flex-wrap pt-1">
              <span className="text-2xl sm:text-2xl font-display font-bold text-amber-600 leading-none">{stats.totalCoinsValue.toLocaleString()}</span>
              <span className="text-[9px] text-slate-550 font-mono uppercase font-bold">Gold</span>
            </div>
          </div>

          {/* Card 4: Total Red Packets Given */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Packets Given</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded border border-emerald-200">Awarded</span>
            </div>
            <div className="flex items-baseline gap-1 flex-wrap pt-1">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-600 leading-none">{stats.totalRedPacketsGiven.toLocaleString()}</span>
              <span className="text-xs text-slate-500">/ {stats.totalRedPacketsAll.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 5: Remaining Packets to be Given */}
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-[#854D0E] uppercase tracking-wider">Remaining To Give</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-[#854D0E] border border-amber-200">Todo</span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-display font-bold text-amber-700 leading-none">{stats.totalRedPacketsRemaining.toLocaleString()}</span>
              <span className="text-[10px] text-amber-800 font-mono uppercase font-bold">Unclaimed</span>
            </div>
          </div>

        </div>

        {/* Split Screen Layout: Primary Sheet Dashboard & Action Overviews */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          {/* Left Spreadsheet / Sponsor Records Panel (Full widths in simple viewports) */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden space-y-6">
              
              {/* Card top banner accent line */}
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Sponsors Distribution Ledgers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sponsorship accounting roster. Tracks verified invites, coin conversions, and active red packet payouts.
                  </p>
                </div>
                {currentUser && (
                  <div className="text-xs text-slate-650 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Session: <b className="text-slate-800">{currentUser.name}</b></span>
                  </div>
                )}
              </div>

              {/* Sponsor Sheet component */}
              <SponsorTable
                sponsors={sponsors}
                onSponsorsUpdated={handleSponsorsUpdated}
                currentUser={currentUser}
              />
            </div>
          </div>

          {/* User authorizations and promotion management panel */}
          {(currentUser?.role === 'supreme' || currentUser?.role === 'super_manager') && (
            <div className="xl:col-span-3">
              <UserManagement currentUser={currentUser} onUsersUpdated={handleUserApprovalReset} />
            </div>
          )}

        </div>

        {/* Informative Footer explaining columns and validation */}
        <footer className="border-t border-slate-200 pt-8 mt-12 text-slate-500 text-xs">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-semibold text-slate-850">WePlay Gold Sponsor & Invite Tracker</p>
              <p className="mt-1">Designed in a polished layout optimized for smartphones and general utility.</p>
            </div>
            <div className="flex items-center gap-6 font-mono text-[10px] text-slate-400">
              <div>RATE SPECIFICATION: 1 PACKET = 600 GOLD</div>
              <div>SUPREME CONTROLLER PRIVILEGES ONLINE</div>
            </div>
          </div>
        </footer>

      </main>

      {/* Auth Drawer Overlay Frame popup modal */}
      {showAuthModal && (
        <div id="modal-auth-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Close button on absolute corner */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-12 right-0 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-xs rounded-lg text-white flex items-center gap-1 cursor-pointer transition-all shadow-md font-bold"
            >
              <X className="w-4 h-4" />
              <span>Close Portal</span>
            </button>
            
            <LoginRegister
              currentUser={currentUser}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
