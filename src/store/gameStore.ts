import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Character } from '../types/character';
import type { InventoryItem } from '../types/inventory';
import type { CombatState } from '../types/combat';
import type { WorldLocation } from '../types/world';
import type { StoryFlag, SceneId } from '../types/story';
import { PARTY_CHARACTERS } from '../data/characters/party';
import { LOCATIONS } from '../data/world/locations';

export type GamePhase = 'main_menu' | 'story' | 'world_map' | 'combat' | 'paused';

export interface GameState {
  gamePhase: GamePhase;
  previousPhase: GamePhase | null;

  // Story
  currentSceneId: SceneId | null;
  currentLineIndex: number;
  isAwaitingChoice: boolean;
  storyFlags: Record<StoryFlag, boolean | number | string>;

  // World
  currentLocationId: string | null;
  locations: Record<string, WorldLocation>;

  // Party
  characters: Record<string, Character>;
  activePartyIds: string[];

  // Inventory
  inventory: InventoryItem[];
  gold: number;

  // Combat (active session)
  combat: CombatState | null;

  // Meta
  playTime: number;
  chapter: number;

  // Actions
  setGamePhase: (phase: GamePhase) => void;
  startNewGame: () => void;
  advanceStoryLine: () => void;
  setStoryFlag: (flag: StoryFlag, value: boolean | number | string) => void;
  gotoScene: (sceneId: SceneId) => void;
  setAwaitingChoice: (v: boolean) => void;
  unlockLocation: (locationId: string) => void;
  addInventoryItem: (itemId: string, qty?: number) => void;
  removeInventoryItem: (itemId: string, qty?: number) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  setCombat: (combat: CombatState | null) => void;
  addGold: (amount: number) => void;
  incrementPlayTime: (seconds: number) => void;
}

const initialCharacters: Record<string, Character> = {};
PARTY_CHARACTERS.forEach(c => { initialCharacters[c.id] = c; });

export const useGameStore = create<GameState>()(
  immer((set) => ({
    gamePhase: 'main_menu',
    previousPhase: null,
    currentSceneId: null,
    currentLineIndex: 0,
    isAwaitingChoice: false,
    storyFlags: {},
    currentLocationId: null,
    locations: { ...LOCATIONS },
    characters: initialCharacters,
    activePartyIds: ['aldric', 'senna', 'ryn'],
    inventory: [
      { itemId: 'potion', quantity: 3 },
      { itemId: 'ether', quantity: 1 },
    ],
    gold: 50,
    combat: null,
    playTime: 0,
    chapter: 1,

    setGamePhase: (phase) => set((state) => {
      state.previousPhase = state.gamePhase;
      state.gamePhase = phase;
    }),

    startNewGame: () => set((state) => {
      state.gamePhase = 'story';
      state.previousPhase = 'main_menu';
      state.currentSceneId = 'prologue_tavern';
      state.currentLineIndex = 0;
      state.isAwaitingChoice = false;
      state.storyFlags = {};
      state.currentLocationId = 'thornhaven';
      state.locations = { ...LOCATIONS };
      state.characters = { ...initialCharacters };
      state.activePartyIds = ['aldric', 'senna', 'ryn'];
      state.inventory = [
        { itemId: 'potion', quantity: 3 },
        { itemId: 'ether', quantity: 1 },
      ];
      state.gold = 50;
      state.combat = null;
      state.playTime = 0;
      state.chapter = 1;
    }),

    advanceStoryLine: () => set((state) => {
      state.currentLineIndex += 1;
    }),

    setStoryFlag: (flag, value) => set((state) => {
      state.storyFlags[flag] = value;
    }),

    gotoScene: (sceneId) => set((state) => {
      state.currentSceneId = sceneId;
      state.currentLineIndex = 0;
      state.isAwaitingChoice = false;
    }),

    setAwaitingChoice: (v) => set((state) => {
      state.isAwaitingChoice = v;
    }),

    unlockLocation: (locationId) => set((state) => {
      if (state.locations[locationId]) {
        state.locations[locationId].status = 'unlocked';
      }
    }),

    addInventoryItem: (itemId, qty = 1) => set((state) => {
      const existing = state.inventory.find(i => i.itemId === itemId);
      if (existing) {
        existing.quantity += qty;
      } else {
        state.inventory.push({ itemId, quantity: qty });
      }
    }),

    removeInventoryItem: (itemId, qty = 1) => set((state) => {
      const idx = state.inventory.findIndex(i => i.itemId === itemId);
      if (idx >= 0) {
        state.inventory[idx].quantity -= qty;
        if (state.inventory[idx].quantity <= 0) {
          state.inventory.splice(idx, 1);
        }
      }
    }),

    updateCharacter: (characterId, updates) => set((state) => {
      if (state.characters[characterId]) {
        Object.assign(state.characters[characterId], updates);
      }
    }),

    setCombat: (combat) => set((state) => {
      state.combat = combat;
    }),

    addGold: (amount) => set((state) => {
      state.gold += amount;
    }),

    incrementPlayTime: (seconds) => set((state) => {
      state.playTime += seconds;
    }),
  }))
);
