import type { SceneId, FlagCondition } from './story';

export type LocationId = string;
export type LocationStatus = 'locked' | 'unlocked' | 'visited' | 'completed';
export type LocationIconType = 'town' | 'dungeon' | 'wilderness' | 'ruins';

export interface WorldLocation {
  id: LocationId;
  name: string;
  description: string;
  mapCoords: { x: number; y: number };
  iconType: LocationIconType;
  unlockCondition?: FlagCondition;
  entryScene?: SceneId;
  status: LocationStatus;
}
