/**
 * SaveSystem — single auto-save slot in localStorage (DESIGN.md §22). Saving is
 * just serializing WorldState (the single source of truth, §16); loading
 * rehydrates it and lets the world react to flags exactly as in live play, so a
 * woken Thistledown loads woken with no special-case code.
 *
 * Corruption guard: every read/write is wrapped — a bad/blocked store starts
 * fresh rather than hard-locking the slice.
 */
import { worldState } from './WorldState';

const SAVE_KEY = 'brackenvale_save_v1';
// v2: the Waking Hollow added has_blade/has_handbell gating; pre-v2 saves lack
// those flags, so they're invalidated (clean fresh start) rather than migrated.
const SAVE_VERSION = 2;

interface SaveData {
  saveVersion: number;
  world: ReturnType<typeof worldState.snapshot>;
}

/** Write the current WorldState to disk. Triggered at hearths + the great bell. */
export function saveGame(): boolean {
  try {
    const data: SaveData = { saveVersion: SAVE_VERSION, world: worldState.snapshot() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false; // private mode / quota / no localStorage — fail quietly
  }
}

/** Rehydrate WorldState from disk. Returns true if a valid save was loaded. */
export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Partial<SaveData>;
    if (!data || data.saveVersion !== SAVE_VERSION || !data.world) return false;
    worldState.restore(data.world);
    return true;
  } catch {
    return false; // corrupt save — start fresh rather than crash
  }
}

/** Wipe the save (e.g. a "new game" option later). */
export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
