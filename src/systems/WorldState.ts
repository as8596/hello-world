/**
 * WorldState — the global flag/counter store (DESIGN.md §16).
 *
 * This is the single source of truth for persistent, game-wide state:
 * quest flags, story progress, which doors are unlocked, how many wolves
 * the player has slain, etc. Systems read and write through here rather
 * than holding their own copies, so save/load is one serialize call.
 *
 * Stub for now — get/set over flags and counters. It will grow a
 * subscription API and (de)serialization as later systems need them.
 */

export type FlagValue = boolean | number | string;

export interface WorldStateSnapshot {
  flags: Record<string, FlagValue>;
  counters: Record<string, number>;
}

export class WorldState {
  private readonly flags = new Map<string, FlagValue>();
  private readonly counters = new Map<string, number>();

  // --- Flags -------------------------------------------------------------

  getFlag(key: string): FlagValue | undefined {
    return this.flags.get(key);
  }

  setFlag(key: string, value: FlagValue): void {
    this.flags.set(key, value);
  }

  /** True only when the flag is explicitly the boolean `true`. */
  hasFlag(key: string): boolean {
    return this.flags.get(key) === true;
  }

  clearFlag(key: string): void {
    this.flags.delete(key);
  }

  // --- Counters ----------------------------------------------------------

  getCounter(key: string): number {
    return this.counters.get(key) ?? 0;
  }

  setCounter(key: string, value: number): void {
    this.counters.set(key, value);
  }

  /** Adjust a counter by `amount` (default +1) and return the new value. */
  addCounter(key: string, amount = 1): number {
    const next = this.getCounter(key) + amount;
    this.counters.set(key, next);
    return next;
  }

  // --- Persistence (stub) ------------------------------------------------

  snapshot(): WorldStateSnapshot {
    return {
      flags: Object.fromEntries(this.flags),
      counters: Object.fromEntries(this.counters),
    };
  }

  restore(snapshot: WorldStateSnapshot): void {
    this.flags.clear();
    this.counters.clear();
    for (const [key, value] of Object.entries(snapshot.flags)) this.flags.set(key, value);
    for (const [key, value] of Object.entries(snapshot.counters)) this.counters.set(key, value);
  }

  reset(): void {
    this.flags.clear();
    this.counters.clear();
  }
}

/** Shared singleton — one world, one state. */
export const worldState = new WorldState();
