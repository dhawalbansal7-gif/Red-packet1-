/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { getStoredUsers, saveStoredUsers, syncFromBackend } from '../db';
import { Shield, Hammer, Trash2, ArrowUpRight, Crown, BadgeCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface UserManagementProps {
  currentUser: { id: string; name: string; role: UserRole } | null;
  onUsersUpdated?: () => void;
  viewMode?: 'all' | 'pending' | 'staff';
  resetKey?: number;
}

export default function UserManagement({ currentUser, onUsersUpdated, viewMode = 'all', resetKey }: UserManagementProps) {
  const [users, setUsers] = useState<Record<string, { name: string; weplayId: string; pass: string; role: UserRole }>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    syncFromBackend().then(({ users }) => {
      setUsers(users);
    });
  }, [refreshTrigger, resetKey]);

  if (!currentUser || (currentUser.role !== 'super_manager' && currentUser.role !== 'supreme')) {
    return null; // Don't render for basic managers or guests
  }

  const handlePromoteToManager = (weplayId: string) => {
    const updated = { ...getStoredUsers() };
    if (!updated[weplayId]) return;

    updated[weplayId].role = 'manager';
    saveStoredUsers(updated);
    setUsers(updated);
    showFeedback('success', `Promoted ${updated[weplayId].name} to Manager successfully.`);
    if (onUsersUpdated) onUsersUpdated();
  };

  const handlePromoteToSuperManager = (weplayId: string) => {
    if (currentUser.role !== 'supreme') {
      showFeedback('error', 'Only the Supreme Admin can appoint Super Managers.');
      return;
    }
    const updated = { ...getStoredUsers() };
    if (!updated[weplayId]) return;

    updated[weplayId].role = 'super_manager';
    saveStoredUsers(updated);
    setUsers(updated);
    showFeedback('success', `Promoted ${updated[weplayId].name} to Super Manager successfully.`);
    if (onUsersUpdated) onUsersUpdated();
  };

  const handleDemoteToGuest = (weplayId: string) => {
    if (currentUser.role !== 'supreme') {
      showFeedback('error', 'Only the Supreme Admin can demote managers.');
      return;
    }
    const updated = { ...getStoredUsers() };
    if (!updated[weplayId]) return;

    updated[weplayId].role = 'guest';
    saveStoredUsers(updated);
    setUsers(updated);
    showFeedback('success', `Demoted ${updated[weplayId].name} back to Guest status.`);
    if (onUsersUpdated) onUsersUpdated();
  };

  const handleRemoveUser = (weplayId: string) => {
    if (currentUser.role !== 'supreme') {
      showFeedback('error', 'Only the Supreme Admin (Dhawal) is permitted to remove managers.');
      return;
    }
    
    if (weplayId === '19122007') {
      showFeedback('error', 'Supreme Power cannot destroy their own account.');
      return;
    }

    const updated = { ...getStoredUsers() };
    if (!updated[weplayId]) return;

    const deletedUserName = updated[weplayId].name;
    delete updated[weplayId];
    saveStoredUsers(updated);
    setUsers(updated);
    showFeedback('success', `Successfully removed and deleted ${deletedUserName} from WePlay database.`);
    if (onUsersUpdated) onUsersUpdated();
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const userList = Object.values(users) as Array<{ name: string; weplayId: string; pass: string; role: UserRole }>;
  
  // Separate the roster into Pending Approvals (Guest role) and Active Authorized Staff
  const pendingApprovals = userList.filter((usr) => usr.role === 'guest');
  const authorizedStaff = userList.filter((usr) => usr.role !== 'guest');

  const showPending = viewMode === 'all' || viewMode === 'pending';
  const showStaff = viewMode === 'all' || viewMode === 'staff';

  return (
    <div id="user-management-panel" className="space-y-6">
      
      {/* 1. TOP ACCESS APPROVAL QUEUE PANEL */}
      {showPending && (
        <div className="bg-gradient-to-r from-amber-600/10 via-slate-900 to-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md relative overflow-hidden">
          {/* Glow Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-amber-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <h2 className="text-lg font-sans font-extrabold text-white tracking-tight flex items-center gap-2">
                  ⏳ Access Approval Queue
                  <span className="px-2 py-0.5 bg-amber-500/25 text-amber-300 font-mono text-xs rounded-full border border-amber-500/35 font-black">
                    {pendingApprovals.length} Accounts Pending
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                New staff sign-up requests. Approve as Manager to grant database access and login privileges.
              </p>
            </div>
            
            <button
              id="btn-refresh-users"
              onClick={() => setRefreshTrigger(p => p + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-650 transition-all cursor-pointer shadow-sm ml-0 sm:ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Queue
            </button>
          </div>

          {feedback && viewMode === 'pending' && (
            <div id="user-mgmt-feedback-pending" className={`p-3 rounded-lg text-xs flex items-center gap-2 mt-4 ${
              feedback.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Pending approvals Cards Container */}
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-6 text-slate-400 font-sans space-y-1">
              <p className="text-sm font-bold text-slate-200 flex items-center justify-center gap-2">
                ✅ No Pending Approvals
              </p>
              <p className="text-xs text-slate-500">Every registered personnel has been approved or belongs to the roster.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
              {pendingApprovals.map((usr) => (
                <div 
                  key={usr.weplayId} 
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 font-sans flex items-center gap-1.5">
                        {usr.name}
                        <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono">
                          Awaiting Access
                        </span>
                      </h4>
                      <p className="text-xs font-mono text-slate-400 mt-1">WePlay ID: <strong className="text-slate-100 font-bold">{usr.weplayId}</strong></p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">Password: <code className="bg-slate-900 border border-slate-800 text-amber-400 px-1.5 py-0.5 rounded text-[11px] font-bold">{usr.pass}</code></p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-850 flex flex-wrap gap-2">
                    <button
                      onClick={() => handlePromoteToManager(usr.weplayId)}
                      className="p-2 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-505 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm select-none"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>Approve as Manager 🛡️</span>
                    </button>

                    {currentUser.role === 'supreme' && (
                      <button
                        onClick={() => handlePromoteToSuperManager(usr.weplayId)}
                        className="p-2 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm select-none"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Approve as Super Manager ⚡</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveUser(usr.weplayId)}
                      className="p-2 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 text-xs font-bold rounded-lg border border-red-900 transition-all cursor-pointer shadow-sm ml-auto select-none"
                      title="Reject and delete registration registration requests"
                    >
                      <span>Reject ❌</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. MAIN ACTIVE STAFF DIRECTORY PANEL */}
      {showStaff && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-sans font-extrabold text-slate-900 tracking-tight">🛡️ Approved & Authorized Staff</h3>
              </div>
              <p className="text-xs text-slate-500">
                These accounts have approved clearance credentials to access WePlay Ledger.
              </p>
            </div>
            
            <button
              id="btn-refresh-staff"
              onClick={() => setRefreshTrigger(p => p + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-705 text-xs font-semibold rounded-lg border border-slate-222 transition-all cursor-pointer shadow-sm ml-0 sm:ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Staff
            </button>
          </div>

          {feedback && viewMode === 'staff' && (
            <div id="user-mgmt-feedback-staff" className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-850' 
                : 'bg-red-50 border border-red-200 text-red-850'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-4 rounded-tl-lg">WePlay Active Personnel</th>
                  <th className="py-3 px-4">Role Clearance</th>
                  <th className="py-3 px-4">Staff Password</th>
                  <th className="py-3 px-4">Ledger Write Rights</th>
                  <th className="py-3 px-4 text-right rounded-tr-lg">Clearance Revocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-sm">
                {authorizedStaff.map((usr) => (
                  <tr key={usr.weplayId} className="hover:bg-slate-50 transition-all">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{usr.name}</span>
                        <span className="text-xs font-mono text-slate-400 block">WePlay ID: {usr.weplayId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {usr.role === 'supreme' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-[#A15C0F] font-mono font-bold text-xs border border-amber-200">
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          Supreme Power 👑
                        </span>
                      ) : usr.role === 'super_manager' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                          Super Manager ⚡
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Manager 🛡️
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                        {usr.weplayId === '19122007' && currentUser?.id !== '19122007' ? '••••••••' : usr.pass}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-medium font-sans">
                      {usr.role === 'supreme' && 'Unlimited Server Administrator'}
                      {usr.role === 'super_manager' && 'Full Sheet Rights & Hires Managers'}
                      {usr.role === 'manager' && 'Full Sheet View & Specific write access'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        
                        {/* Demote to guest queue / revoke access (available to supreme) */}
                        {usr.role !== 'supreme' && currentUser.role === 'supreme' && (
                          <button
                            title="Revoke Permission down to Pending Approval Queue"
                            onClick={() => handleDemoteToGuest(usr.weplayId)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-800 text-xs font-semibold border border-slate-200 rounded-md transition-all cursor-pointer shadow-sm select-none"
                          >
                            Revoke Access
                          </button>
                        )}

                        {/* Super Promotion */}
                        {usr.role === 'manager' && currentUser.role === 'supreme' && (
                          <button
                            title="Promote to Super Manager"
                            onClick={() => handlePromoteToSuperManager(usr.weplayId)}
                            className="p-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200 transition-all flex items-center gap-1 cursor-pointer shadow-sm select-none"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Approve Super</span>
                          </button>
                        )}

                        {/* Delete account entirely (restricted ONLY to Supreme Admin Dhawal) */}
                        {usr.role !== 'supreme' && currentUser.role === 'supreme' && (
                          <button
                            title="Delete and Remove User Account"
                            onClick={() => handleRemoveUser(usr.weplayId)}
                            className="p-2 bg-red-50 hover:bg-red-105 text-red-650 hover:text-red-700 rounded-md border border-red-200 transition-all cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {usr.role === 'supreme' && (
                          <span className="text-xs text-slate-400 italic px-2 font-mono">Immutable Controller</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
