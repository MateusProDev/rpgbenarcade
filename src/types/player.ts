/** Player-related types */

export interface Player {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  allianceId: string | null;
  /** Currently active city id */
  activeCityId: string | null;
  /** World the player belongs to */
  worldId: string;
  createdAt: number;
  lastLoginAt: number;
}
