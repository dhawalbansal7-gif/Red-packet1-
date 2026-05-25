/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { getStoredUsers, saveStoredUsers } from '../db';
import { Shield, Hammer, Trash2, ArrowUpRight, Crown, BadgeCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface UserManagementProps {
  currentUser: { id: string; name: string; role: UserRole } | null;
  onUsersUpdated?: () => void;
}

export default function UserManagement({ currentUser, onUsersUpdated }: UserManagementProps) {
  const [users, setUsers] = useState<Record<string, { name: string; weplayId: string; pass: string; role: UserRole }>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setUsers(getStoredUsers());
  }, [refreshTrigger]);

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

  return (
    <div id="user-management-panel" className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-sans font-bold text-slate-900">Staff Credentials & Permissions</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser.role === 'supreme' 
              ? 'Supreme Power controls: Appoint Managers/Super Managers, delete accounts, modify all parameters.' 
              : 'Super Manager controls: Approve newly registered guests into basic active Managers.'}
          </p>
        </div>
        <button
          id="btn-refresh-users"
          onClick={() => setRefreshTrigger(p => p + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Roster
        </button>
      </div>

      {feedback && (
        <div id="user-mgmt-feedback" className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
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
              <th className="py-3 px-4 rounded-tl-lg">WePlay User</th>
              <th className="py-3 px-4">Role Badge</th>
              <th className="py-3 px-4">Staff Password</th>
              <th className="py-3 px-4">Status & Permissions</th>
              <th className="py-3 px-4 text-right rounded-tr-lg">Staff Execution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-sm">
            {userList.map((usr) => (
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
                  ) : usr.role === 'manager' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Manager 🛡️
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono font-bold text-xs border border-slate-200">
                      Guest Viewer 👤
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                    {usr.weplayId === '19122007' && currentUser?.id !== '19122007' ? '••••••••' : usr.pass}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500 font-medium font-sans">
                  {usr.role === 'supreme' && 'Immutable super admin'}
                  {usr.role === 'super_manager' && 'Can assign basic manager post'}
                  {usr.role === 'manager' && 'Can read & update red packet rows'}
                  {usr.role === 'guest' && 'Awaiting permission upgrade'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-2 justify-end">
                    {/* Grant Manager Permissions (available to super_manager and supreme) */}
                    {usr.role === 'guest' && (
                      <button
                        title="Appoint as Manager"
                        onClick={() => handlePromoteToManager(usr.weplayId)}
                        className="p-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md border border-emerald-250 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Hammer className="w-3 h-3" />
                        <span>Hire Manager</span>
                      </button>
                    )}

                    {/* Grant Super Manager Permissions (available only to supreme admin Dhawal) */}
                    {usr.role === 'manager' && currentUser.role === 'supreme' && (
                      <button
                        title="Appoint as Super Manager"
                        onClick={() => handlePromoteToSuperManager(usr.weplayId)}
                        className="p-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        <span>To Super</span>
                      </button>
                    )}

                    {/* Demote to guest (available only to supreme) */}
                    {(usr.role === 'manager' || usr.role === 'super_manager') && currentUser.role === 'supreme' && (
                      <button
                        title="Demote to Guest"
                        onClick={() => handleDemoteToGuest(usr.weplayId)}
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold border border-slate-200 rounded-md transition-all cursor-pointer shadow-sm"
                      >
                        Demote
                      </button>
                    )}

                    {/* Delete account entirely (restricted ONLY to Supreme Admin Dhawal) */}
                    {usr.role !== 'supreme' && currentUser.role === 'supreme' && (
                      <button
                        title="Delete and Remove User Account"
                        onClick={() => handleRemoveUser(usr.weplayId)}
                        className="p-1.5 bg-red-50 hover:bg-red-105 text-red-650 hover:text-red-700 rounded-md border border-red-200 transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {usr.role === 'supreme' && (
                      <span className="text-xs text-slate-400 italic px-2 font-mono">Immutable</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
