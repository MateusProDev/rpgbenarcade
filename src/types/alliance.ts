/** Alliance types */

export type AllianceRole = 'leader' | 'officer' | 'member';

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderId: string;
  worldId: string;
  members: AllianceMember[];
  createdAt: number;
}

export interface AllianceMember {
  playerId: string;
  displayName: string;
  role: AllianceRole;
  joinedAt: number;
}
