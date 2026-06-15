/**
 * Leveling curve (DESIGN.md §18). XP comes from the coins enemies drop — each
 * coin collected is worth its value in XP — so combat both pays and levels you.
 * Levels grant a small permanent boost (see WorldScene.applyLevelUp).
 */

/** XP required to advance from `level` to `level + 1`. Gently rising. */
export function xpToNext(level: number): number {
  return 10 + (level - 1) * 6; // L1→2: 10, L2→3: 16, L3→4: 22, …
}

/** Half-hearts of max-HP granted per level gained. */
export const LEVEL_UP_MAX_HALF_HEARTS = 1;
