/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount, SponsorRecord, UserRole } from './types';

const STORAGE_USERS_KEY = 'weplay_tracker_users';
const STORAGE_SPONSORS_KEY = 'weplay_tracker_sponsors';

const DEFAULT_USERS: Record<string, { name: string; weplayId: string; pass: string; role: UserRole }> = {
  // Supreme Administrator (Assigned via prompt instructions)
  '19122007': {
    name: 'Dhawal (Supreme Power)',
    weplayId: '19122007',
    pass: 'dhawal19122007',
    role: 'supreme',
  },
  // Default Seed accounts for testing & demonstration
  '1001': {
    name: 'Aravind R.',
    weplayId: '1001',
    pass: 'manager123',
    role: 'manager',
  },
  '1002': {
    name: 'Siddharth Roy',
    weplayId: '1002',
    pass: 'super123',
    role: 'super_manager',
  },
  '1003': {
    name: 'Gaurav K.',
    weplayId: '1003',
    pass: 'guest123',
    role: 'guest',
  },
};

const DEFAULT_SPONSORS: SponsorRecord[] = [
  {
    id: 's1',
    name: 'Red Bull Esports India',
    sponsorId: 'WP-1201',
    idReported: 45,
    totalInviteGiven: 120,
    coinsValue: 120000, // 120,000 / 600 = 200 red packets
    totalRedPacket: 200,
    redPacketGiven: 145,
    redPacketToBeGiven: 55,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedBy: '1001',
  },
  {
    id: 's2',
    name: 'ROG Asus South Asia',
    sponsorId: 'WP-1502',
    idReported: 25,
    totalInviteGiven: 85,
    coinsValue: 50000, // 50,050 / 600 = 83.33 -> 83 packets
    totalRedPacket: 83,
    redPacketGiven: 60,
    redPacketToBeGiven: 23,
    updatedAt: new Date().toISOString(),
    updatedBy: '19122007',
  },
  {
    id: 's3',
    name: 'OnePlus Community India',
    sponsorId: 'WP-1804',
    idReported: 15,
    totalInviteGiven: 42,
    coinsValue: 10000, // 10,000 / 600 = 16.66 -> 17 red packets (Dhawal's Example)
    totalRedPacket: 17,
    redPacketGiven: 12,
    redPacketToBeGiven: 5,
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    updatedBy: '1002',
  },
  {
    id: 's4',
    name: 'Mortal Gaming Guild',
    sponsorId: 'WP-1991',
    idReported: 80,
    totalInviteGiven: 200,
    coinsValue: 250000, // 250,000 / 600 = 416.66 -> 417 red packets
    totalRedPacket: 417,
    redPacketGiven: 390,
    redPacketToBeGiven: 27,
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    updatedBy: '1001',
  },
  {
    id: 's5',
    name: 'Cosmic Bytes India',
    sponsorId: 'WP-1102',
    idReported: 10,
    totalInviteGiven: 30,
    coinsValue: 8000, // 8,000 / 600 = 13.33 -> 13 red packets
    totalRedPacket: 13,
    redPacketGiven: 5,
    redPacketToBeGiven: 8,
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    updatedBy: '19122007',
  },
];

// Helper to load users structure
export function getStoredUsers(): Record<string, { name: string; weplayId: string; pass: string; role: UserRole }> {
  const local = localStorage.getItem(STORAGE_USERS_KEY);
  if (!local) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    const parsed = JSON.parse(local);
    // Always ensure supreme admin is present and immutable in credentials
    if (!parsed['19122007']) {
      parsed['19122007'] = DEFAULT_USERS['19122007'];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: Record<string, { name: string; weplayId: string; pass: string; role: UserRole }>) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

// Helper to load sponsor records
export function getStoredSponsors(): SponsorRecord[] {
  const local = localStorage.getItem(STORAGE_SPONSORS_KEY);
  if (!local) {
    localStorage.setItem(STORAGE_SPONSORS_KEY, JSON.stringify(DEFAULT_SPONSORS));
    return DEFAULT_SPONSORS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return DEFAULT_SPONSORS;
  }
}

export function saveStoredSponsors(sponsors: SponsorRecord[]) {
  localStorage.setItem(STORAGE_SPONSORS_KEY, JSON.stringify(sponsors));
}

// Calculate total red packets from coinsValue (divided by 600, rounded off)
export function calculateTotalRedPackets(coinsValue: number): number {
  if (isNaN(coinsValue) || coinsValue < 0) return 0;
  return Math.round(coinsValue / 600);
}
