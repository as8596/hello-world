import { create } from 'zustand';

export type MenuTab = 'character' | 'inventory' | 'save' | 'settings';
export type CombatMenuTab = 'action' | 'skill' | 'item';

interface UIState {
  dialogueRevealed: boolean;
  activeMenuTab: MenuTab;
  combatMenuTab: CombatMenuTab;
  hoveredLocationId: string | null;
  showPauseMenu: boolean;
  showSaveLoad: boolean;
  saveLoadMode: 'save' | 'load';
  notification: string | null;

  setDialogueRevealed: (v: boolean) => void;
  setActiveMenuTab: (tab: MenuTab) => void;
  setCombatMenuTab: (tab: CombatMenuTab) => void;
  setHoveredLocation: (id: string | null) => void;
  setShowPauseMenu: (v: boolean) => void;
  setShowSaveLoad: (v: boolean, mode?: 'save' | 'load') => void;
  showNotification: (msg: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  dialogueRevealed: false,
  activeMenuTab: 'character',
  combatMenuTab: 'action',
  hoveredLocationId: null,
  showPauseMenu: false,
  showSaveLoad: false,
  saveLoadMode: 'save',
  notification: null,

  setDialogueRevealed: (v) => set({ dialogueRevealed: v }),
  setActiveMenuTab: (tab) => set({ activeMenuTab: tab }),
  setCombatMenuTab: (tab) => set({ combatMenuTab: tab }),
  setHoveredLocation: (id) => set({ hoveredLocationId: id }),
  setShowPauseMenu: (v) => set({ showPauseMenu: v }),
  setShowSaveLoad: (v, mode) => set({ showSaveLoad: v, saveLoadMode: mode ?? 'save' }),
  showNotification: (msg) => set({ notification: msg }),
  clearNotification: () => set({ notification: null }),
}));
