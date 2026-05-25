/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SponsorRecord, UserRole } from '../types';
import { calculateTotalRedPackets } from '../db';
import { Plus, Edit, Trash2, Search, ArrowUpDown, X, Check, Calculator, Sparkles, Coins, Gift, TrendingUp, Info } from 'lucide-react';

interface SponsorTableProps {
  sponsors: SponsorRecord[];
  onSponsorsUpdated: (updated: SponsorRecord[]) => void;
  currentUser: { id: string; name: string; role: UserRole } | null;
}

export default function SponsorTable({ sponsors, onSponsorsUpdated, currentUser }: SponsorTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof SponsorRecord>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal/Form state
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorRecord | null>(null);
  
  // Form Inputs
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [idReported, setIdReported] = useState(0);
  const [totalInviteGiven, setTotalInviteGiven] = useState(0);
  const [coinsValue, setCoinsValue] = useState(0);
  const [redPacketGiven, setRedPacketGiven] = useState(0);
  
  // Auth control
  const canEdit = useMemo(() => {
    return currentUser && (currentUser.role === 'manager' || currentUser.role === 'super_manager' || currentUser.role === 'supreme');
  }, [currentUser]);

  const canWipeLedger = useMemo(() => {
    return currentUser && currentUser.role === 'supreme';
  }, [currentUser]);

  const canDeleteSponsor = useMemo(() => {
    return currentUser && currentUser.role === 'supreme';
  }, [currentUser]);

  // Calculations for active form (live preview!)
  const liveTotalRedPacket = useMemo(() => {
    return calculateTotalRedPackets(coinsValue);
  }, [coinsValue]);

  const liveRedPacketToBeGiven = useMemo(() => {
    return Math.max(0, liveTotalRedPacket - redPacketGiven);
  }, [liveTotalRedPacket, redPacketGiven]);

  // Sorting logic
  const handleSort = (field: keyof SponsorRecord) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedSponsors = useMemo(() => {
    return sponsors
      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
      });
  }, [sponsors, searchTerm, sortBy, sortOrder]);

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const computedTotal = calculateTotalRedPackets(coinsValue);
    const computedToBeGiven = computedTotal - redPacketGiven;

    const sponsorData: SponsorRecord = {
      id: editingSponsor ? editingSponsor.id : 'sponsor_' + Date.now(),
      name: sponsorName.trim(),
      sponsorId: sponsorId.trim(),
      idReported: Number(idReported),
      totalInviteGiven: Number(totalInviteGiven),
      coinsValue: Number(coinsValue),
      totalRedPacket: computedTotal,
      redPacketGiven: Number(redPacketGiven),
      redPacketToBeGiven: computedToBeGiven,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.id || 'unknown',
    };

    let updatedList: SponsorRecord[] = [];
    if (editingSponsor) {
      updatedList = sponsors.map((s) => (s.id === editingSponsor.id ? sponsorData : s));
    } else {
      updatedList = [sponsorData, ...sponsors];
    }

    onSponsorsUpdated(updatedList);
    closeForm();
  };

  const openAddForm = () => {
    setEditingSponsor(null);
    setSponsorName('');
    setSponsorId('');
    setIdReported(0);
    setTotalInviteGiven(0);
    setCoinsValue(0);
    setRedPacketGiven(0);
    setShowAddEditForm(true);
  };

  const openEditForm = (sponsor: SponsorRecord) => {
    setEditingSponsor(sponsor);
    setSponsorName(sponsor.name);
    setSponsorId(sponsor.sponsorId || '');
    setIdReported(sponsor.idReported || 0);
    setTotalInviteGiven(sponsor.totalInviteGiven);
    setCoinsValue(sponsor.coinsValue);
    setRedPacketGiven(sponsor.redPacketGiven);
    setShowAddEditForm(true);
  };

  const closeForm = () => {
    setShowAddEditForm(false);
    setEditingSponsor(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (!canDeleteSponsor) return;
    if (confirm(`Are you absolutely sure you want to remove sponsor "${name}"?`)) {
      const updated = sponsors.filter((s) => s.id !== id);
      onSponsorsUpdated(updated);
    }
  };

  const handleWipeLedger = () => {
    if (!canWipeLedger) return;
    if (confirm('⚠️ WARNING: Are you absolutely sure you want to delete ALL records from the ledger? This action is permanent and cannot be undone.')) {
      if (confirm('FINAL CONFIRMATION: Wipe all sponsor accounts, invitees, and red packet records?')) {
        onSponsorsUpdated([]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            id="search-sponsors"
            placeholder="Search sponsor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-450 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Add Record button */}
        {canEdit ? (
          <div className="flex flex-wrap gap-2 items-center self-start sm:self-auto">
            <button
              id="btn-add-sponsor"
              onClick={openAddForm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white stroke-[3px]" />
              New Sponsor Record
            </button>
            {canWipeLedger && (
              <button
                id="btn-wipe-ledger"
                onClick={handleWipeLedger}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-semibold text-sm rounded-lg border border-red-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                Wipe Ledger Data
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm">
            <Info className="w-4 h-4 text-blue-500" />
            <span>Logged in as <b className="text-slate-800">Guest (Reader)</b>. Sign In to add or edit sponsors.</span>
          </div>
        )}
      </div>

      {/* Responsive Displays: Desktop Table & Mobile Cards */}

      {/* Grid view for standard viewports */}
      <div className="hidden md:block overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="sponsors-data-table">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono font-bold text-slate-500 tracking-wider uppercase bg-slate-50">
                <th onClick={() => handleSort('sponsorId')} className="py-4 px-4 cursor-pointer hover:text-blue-600 select-none transition-all text-center rounded-tl-xl">
                  <div className="flex items-center justify-center gap-1">
                    ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('name')} className="py-4 px-5 cursor-pointer hover:text-blue-600 select-none transition-all">
                  <div className="flex items-center gap-1">
                    1) Sponsor Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('totalInviteGiven')} className="py-4 px-4 cursor-pointer hover:text-blue-600 select-none transition-all text-center">
                  <div className="flex items-center justify-center gap-1">
                    2) Total Invite
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('idReported')} className="py-4 px-4 cursor-pointer hover:text-blue-600 select-none transition-all text-center">
                  <div className="flex items-center justify-center gap-1">
                    ID Reported
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('totalRedPacket')} className="py-4 px-4 cursor-pointer hover:text-blue-600 select-none transition-all text-center">
                  <div className="flex items-center justify-center gap-1">
                    3) Total Red Packet
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('redPacketGiven')} className="py-4 px-4 cursor-pointer hover:text-blue-600 select-none transition-all text-center">
                  <div className="flex items-center justify-center gap-1">
                    4) Packet Given
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('redPacketToBeGiven')} className="py-4 px-4 cursor-pointer hover:text-blue-600 select-none transition-all text-center">
                  <div className="flex items-center justify-center gap-1 mr-0">
                    5) Remaining Packet
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('coinsValue')} className="py-4 px-4 cursor-pointer hover:text-blue-600 select-none transition-all text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    6) Coin Value (Qty / 600)
                    <ArrowUpDown className="w-3 h-3 text-amber-500" />
                  </div>
                </th>
                {canEdit && <th className="py-4 px-4 text-center pr-6 rounded-tr-xl">Manage</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700 bg-white">
              {filteredAndSortedSponsors.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-12 text-center text-slate-400 font-sans">
                    No sponsor records matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSortedSponsors.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-all">
                    {/* ID */}
                    <td className="py-3 px-4 font-mono text-center text-slate-800 font-bold">
                      {record.sponsorId ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 text-xs">
                          {record.sponsorId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">—</span>
                      )}
                    </td>
                    {/* 1) Sponsor Name */}
                    <td className="py-4 px-5 font-sans font-bold text-slate-850">
                      <div>
                        <span>{record.name}</span>
                        {record.updatedBy && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            Updated by: {record.updatedBy}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* 2) Total invite given */}
                    <td className="py-3 px-4 font-mono text-center text-slate-800 font-semibold">
                      {record.totalInviteGiven.toLocaleString()}
                    </td>
                    {/* ID Reported */}
                    <td className="py-3 px-4 font-mono text-center text-slate-800 font-bold">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 text-xs">
                        {(record.idReported || 0).toLocaleString()}
                      </span>
                    </td>
                    {/* 3) Total red packet */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-slate-100 font-mono font-bold text-slate-800 border border-slate-200">
                        {record.totalRedPacket.toLocaleString()}
                      </span>
                    </td>
                    {/* 4) Red packet given */}
                    <td className="py-3 px-4 font-mono text-center text-emerald-700 font-bold">
                      {record.redPacketGiven.toLocaleString()}
                    </td>
                    {/* 5) Red packet to be given */}
                    <td className="py-3 px-4 text-center">
                      {record.redPacketToBeGiven > 0 ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-amber-50 font-mono font-bold text-amber-700 border border-amber-200">
                          {record.redPacketToBeGiven.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-emerald-50 font-mono font-bold text-emerald-750 border border-emerald-200">
                          Completed ✓
                        </span>
                      )}
                    </td>
                    {/* 6) Value of red packet in coins (with divider explanation) */}
                    <td className="py-3 px-4 text-right pr-6 font-mono text-slate-800 font-medium">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 flex items-center justify-end gap-1 font-bold">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          {record.coinsValue.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ({record.coinsValue.toLocaleString()} / 600 Gold)
                        </span>
                      </div>
                    </td>
                    {/* Manage actions */}
                    {canEdit && (
                      <td className="py-3 px-4 text-center pr-6">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Edit Record"
                            onClick={() => openEditForm(record)}
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-650 hover:text-blue-600 rounded-lg transition-all cursor-pointer border border-slate-200 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {canDeleteSponsor && (
                            <button
                              title="Delete Record"
                              onClick={() => handleDelete(record.id, record.name)}
                              className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-650 hover:text-red-600 rounded-lg transition-all cursor-pointer border border-slate-200 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>      {/* Mobile Card Layout (Gives beautiful mobile compliance in Safari/Chrome inside web view) */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedSponsors.length === 0 ? (
          <div className="p-8 text-center text-slate-450 bg-white border border-slate-200 rounded-xl">
            No sponsor records matching the search criteria.
          </div>
        ) : (
          filteredAndSortedSponsors.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden text-slate-805"
            >
              {/* Subtle accent light indicator */}
              <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-blue-500/5 to-transparent pointer-events-none" />

              {/* Title & Actions Row */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-sans font-bold text-slate-900 text-base">{record.name}</h4>
                  {record.updatedBy && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Updated by Staff: {record.updatedBy}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-750 text-[10px] font-mono font-bold rounded border border-slate-200">
                      ID: {record.sponsorId || '—'}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono font-bold rounded border border-blue-150">
                      ID Reported: {(record.idReported || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(record)}
                      className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {canDeleteSponsor && (
                      <button
                        onClick={() => handleDelete(record.id, record.name)}
                        className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Structured Mobile Columns */}
              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                {/* Column 2: Total invites */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="block text-[10px] text-slate-450 font-mono uppercase tracking-wider mb-0.5">2) Total Invites</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {record.totalInviteGiven.toLocaleString()}
                  </span>
                </div>

                {/* Column 6: Coins value */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="block text-[10px] text-slate-455 font-mono uppercase tracking-wider mb-0.5">6) Coins (600 Gold)</span>
                  <span className="font-mono font-bold text-amber-600 text-sm flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    {record.coinsValue.toLocaleString()}
                  </span>
                </div>

                {/* Column 3: Total packets */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="block text-[10px] text-slate-450 font-mono uppercase tracking-wider mb-0.5">3) Total Red Packets</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">
                    {record.totalRedPacket.toLocaleString()}
                  </span>
                </div>

                {/* Column 4: Packet Given */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="block text-[10px] text-slate-450 font-mono uppercase tracking-wider mb-0.5">4) Packets Given</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {record.redPacketGiven.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Column 5: Red Packet to be Given (calculated) */}
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
                <div>
                  <span className="block text-[10px] text-amber-800 font-mono uppercase tracking-wider">5) Remaining Red Packets</span>
                  <span className="text-slate-400 italic text-[10px]">(Total 3 - Given 4)</span>
                </div>
                <div>
                  {record.redPacketToBeGiven > 0 ? (
                    <span className="font-mono font-extrabold text-amber-700 text-base">
                      {record.redPacketToBeGiven.toLocaleString()}
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-emerald-750 text-xs bg-emerald-50 border border-emerald-250 rounded px-2 py-0.5">
                      Completed ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Add Sponsor Modal Screen Drawer Overlay */}
      {showAddEditForm && (
        <div id="modal-sponsor-form" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Heading Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 px-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <Gift className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-base">
                    {editingSponsor ? 'Edit Sponsor Data' : 'Add New Sponsor Data'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Please populate the 6 WePlay sponsor metrics below.</p>
                </div>
              </div>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Contents Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Slot 1: Sponsor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1) Sponsors Name *
                </label>
                <input
                  type="text"
                  required
                  id="form-sponsor-name"
                  placeholder="e.g. Star Gold Gaming Community"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* ID and ID Reported slots */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sponsor ID
                  </label>
                  <input
                    type="text"
                    id="form-sponsor-id"
                    placeholder="e.g. WP-1201"
                    value={sponsorId}
                    onChange={(e) => setSponsorId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Reported
                  </label>
                  <input
                    type="number"
                    min="0"
                    id="form-sponsor-id-reported"
                    placeholder="e.g. 5"
                    value={idReported || ''}
                    onChange={(e) => setIdReported(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Slot 2: Total Invite Given */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2) Total Invite Given *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  id="form-invite-given"
                  placeholder="e.g. 100"
                  value={totalInviteGiven || ''}
                  onChange={(e) => setTotalInviteGiven(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Slot 6: Value in coins (IMPORTANT: Determines column 3!) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>6) Red Packet Value in Gold Coins *</span>
                  <span className="text-[10px] text-slate-550 uppercase font-mono font-bold">Governs Column 3</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    id="form-coins-value"
                    placeholder="e.g. 10000"
                    value={coinsValue || ''}
                    onChange={(e) => setCoinsValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-3 pr-20 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <div className="absolute right-3 top-2 flex items-center gap-1 text-xs text-amber-600 font-bold font-mono select-none">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    Coins
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  💡 Autocalculates <b>Column 3 (Total Packets)</b> as <code>Coins Value / 600 Gold</code> rounded. (For example, 10,000 coins =&gt; 17 red packets).
                </p>
              </div>

              {/* Slot 3: Total Red Packet (Automated feedback!) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-650">3) Total Red Packet (Calculated)</span>
                  <span className="block text-[10px] text-slate-450 font-mono mt-0.5">Formula: round(Coins / 600)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-800 bg-white border border-slate-250 px-3 py-1 rounded shadow-sm">
                    {liveTotalRedPacket} Packets
                  </span>
                </div>
              </div>

              {/* Slot 4: Red Packet Given */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>4) Red Packet Given *</span>
                  {liveTotalRedPacket > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Max advised: {liveTotalRedPacket}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  id="form-given-packet"
                  placeholder="e.g. 5"
                  value={redPacketGiven || ''}
                  onChange={(e) => setRedPacketGiven(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Slot 5: Red Packet to be Given (Automated feedback!) */}
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-amber-800">5) Remaining Red Packet to be Given</span>
                  <span className="block text-[9px] text-[#A15C0F] font-mono mt-0.5">Calculated: Column 3 - Column 4</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold font-mono px-3 py-1 rounded bg-white shadow-sm border ${
                    liveRedPacketToBeGiven > 0 ? 'text-amber-700 border-amber-200' : 'text-emerald-705 border-emerald-200'
                  }`}>
                    {liveRedPacketToBeGiven} Remaining
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2 px-4 border border-slate-200 hover:border-slate-350 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-form"
                  disabled={redPacketGiven > liveTotalRedPacket}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-705 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5px]" />
                  <span>{editingSponsor ? 'Confirm Update' : 'Publish Sponsor'}</span>
                </button>
              </div>
              {redPacketGiven > liveTotalRedPacket && (
                <p className="text-[10px] text-red-500 text-center font-mono mt-1">
                  ⚠️ Error: Given red packets ({redPacketGiven}) cannot exceed total red packets ({liveTotalRedPacket}).
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
