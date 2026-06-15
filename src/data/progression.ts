/**
 * Leveling curve (DESIGN.md §18). XP comes from the coins enemies drop — each
 * coin collected is worth its value in XP — so combat both pays and levels you.
 * Levels grant a small permanent boost (see WorldScene.applyLevelUp).
 */

/** XP required to advance from `level` to `level + 1`. Rising; tuned so combat
 *  levels you steadily but not too fast (~1 level per 10-15 kills early on). */
export function xpToNext(level: number): number {
  return 24 + (level - 1) * 16; // L1→2: 24, L2→3: 40, L3→4: 56, …
}

/** Half-hearts of max-HP granted per level gained. */
export const LEVEL_UP_MAX_HALF_HEARTS = 1;
