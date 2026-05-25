/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'guest' | 'manager' | 'super_manager' | 'supreme';

export interface UserAccount {
  id: string; // WePlay ID or custom login ID
  name: string;
  weplayId: string;
  role: UserRole;
  createdAt: string;
}

export interface SponsorRecord {
  id: string;
  name: string;
  sponsorId: string; // Column: ID
  idReported: number; // Column: ID Reported (Number of IDs sent to be reported)
  totalInviteGiven: number;
  totalRedPacket: number; // calculated from coinsValue, or custom override
  redPacketGiven: number;
  redPacketToBeGiven: number; // calculated: totalRedPacket - redPacketGiven
  coinsValue: number; // Column 6: value of red packet in coins.
  updatedAt: string;
  updatedBy?: string;
}

export interface SystemStats {
  totalSponsors: number;
  totalInviteGiven: number;
  totalRedPacketsAll: number;
  totalRedPacketsGiven: number;
  totalRedPacketsRemaining: number;
  totalCoinsValue: number;
}
