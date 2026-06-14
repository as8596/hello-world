import { TextureKeys } from '../systems/TextureFactory';

/**
 * Boss tuning (DESIGN.md §12). Bramblewerth is armored: the sword only bites
 * while it's bell-stunned. It periodically *rears and vents Hush-fog* — the
 * window to ring -> stun -> strike the core. Phase 2 (below half HP) speeds up
 * and adds a ground-slam shockwave to dodge on timing.
 */
export interface BossConfig {
  id: string;
  name: string;
  texture: string;
  maxHp: number;
  /** HP fraction at which phase 2 begins. */
  phase2At: number;
  /** Delay between actions (ms). */
  idleMs: number;
  /** Vent (stun window) every N actions. */
  ventEvery: number;
  /** Vent telegraph duration (ms) — ring during this to stun. */
  ventMs: number;
  /** How long a bell-stun lasts (the strike window, ms). */
  stunMs: number;
  swipe: { windupMs: number; activeMs: number; range: number; damage: number };
  slam: { windupMs: number; activeMs: number; radius: number; damage: number };
  /** Add spawning: max concurrent enemies and how many per spawn. */
  adds: { cap: number; per: number };
  /** Timing multiplier in phase 2 (smaller = faster). */
  phase2SpeedMul: number;
}

export const bramblewerth: BossConfig = {
  id: 'bramblewerth',
  name: 'Bramblewerth',
  texture: TextureKeys.Bramblewerth,
  maxHp: 12,
  phase2At: 0.5,
  idleMs: 850,
  ventEvery: 3,
  ventMs: 1300,
  stunMs: 3000,
  swipe: { windupMs: 560, activeMs: 220, range: 42, damage: 1 },
  slam: { windupMs: 680, activeMs: 160, radius: 48, damage: 2 },
  adds: { cap: 3, per: 1 },
  phase2SpeedMul: 0.7,
};
