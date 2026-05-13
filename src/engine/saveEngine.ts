import type { GameState } from '../store/gameStore';
import type { SaveMeta } from '../types/save';
import { LOCATIONS } from '../data/world/locations';

const SAVE_KEY = 'rpg_save_slot_';
const AUTO_SAVE_SLOT = 0;

interface SaveData {
  version: string;
  timestamp: number;
  gamePhase: string;
  currentSceneId: string | null;
  currentLineIndex: number;
  storyFlags: Record<string, boolean | number | string>;
  currentLocationId: string | null;
  locationStatuses: Record<string, string>;
  characters: GameState['characters'];
  activePartyIds: string[];
  inventory: GameState['inventory'];
  gold: number;
  playTime: number;
  chapter: number;
}

export function serializeState(state: GameState): SaveData {
  const locationStatuses: Record<string, string> = {};
  Object.entries(state.locations).forEach(([id, loc]) => {
    locationStatuses[id] = loc.status;
  });
  return {
    version: '1.0',
    timestamp: Date.now(),
    gamePhase: state.gamePhase,
    currentSceneId: state.currentSceneId,
    currentLineIndex: state.currentLineIndex,
    storyFlags: { ...state.storyFlags },
    currentLocationId: state.currentLocationId,
    locationStatuses,
    characters: JSON.parse(JSON.stringify(state.characters)),
    activePartyIds: [...state.activePartyIds],
    inventory: JSON.parse(JSON.stringify(state.inventory)),
    gold: state.gold,
    playTime: state.playTime,
    chapter: state.chapter,
  };
}

export function saveToSlot(slot: 0 | 1 | 2 | 3, state: GameState): void {
  try {
    const data = serializeState(state);
    localStorage.setItem(`${SAVE_KEY}${slot}`, JSON.stringify(data));
  } catch {
    console.warn('Failed to save game state');
  }
}

export function autoSave(state: GameState): void {
  saveToSlot(AUTO_SAVE_SLOT, state);
}

export function loadFromSlot(slot: 0 | 1 | 2 | 3): SaveData | null {
  try {
    const raw = localStorage.getItem(`${SAVE_KEY}${slot}`);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function listSaves(): SaveMeta[] {
  const slots: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
  return slots.map(slot => {
    const data = loadFromSlot(slot);
    if (!data) return { slot, isEmpty: true };
    const locationName = data.currentLocationId
      ? LOCATIONS[data.currentLocationId]?.name ?? 'Unknown'
      : 'Unknown';
    return {
      slot,
      isEmpty: false,
      timestamp: data.timestamp,
      locationName,
      chapter: data.chapter,
      playTime: data.playTime,
      characterLevel: Object.values(data.characters)[0]?.level,
    };
  });
}

export function applyLoadedSave(data: SaveData, store: GameState): void {
  const locationStatuses = data.locationStatuses ?? {};
  const locations = { ...LOCATIONS };
  Object.entries(locationStatuses).forEach(([id, status]) => {
    if (locations[id]) {
      locations[id] = { ...locations[id], status: status as 'locked' | 'unlocked' | 'visited' | 'completed' };
    }
  });

  store.startNewGame();

  // Use the store's immer-powered methods to restore state
  Object.entries(data.characters).forEach(([, char]) => {
    store.updateCharacter(char.id, char);
  });

  data.inventory.forEach(item => {
    store.addInventoryItem(item.itemId, item.quantity);
  });

  Object.entries(data.storyFlags).forEach(([flag, value]) => {
    store.setStoryFlag(flag, value);
  });

  Object.entries(locationStatuses).forEach(([id, status]) => {
    if (status !== 'locked') store.unlockLocation(id);
  });

  if (data.currentSceneId) {
    store.gotoScene(data.currentSceneId);
    store.setGamePhase(data.gamePhase as GameState['gamePhase']);
  }
}
