import { RENDER_SCALE } from './render';

/**
 * Warden's Handbell tuning (DESIGN.md §11). The signature tool: ring for an
 * AoE stun pulse and to dispel Hush-fog. It's a tool, not an Echo-spending
 * class active, so it costs nothing — just a short cooldown.
 */
export interface HandbellConfig {
  /** Effect radius in px (stun + fog dispel + shockwave VFX). */
  radius: number;
  /** How long struck enemies stay stunned (ms). */
  stunMs: number;
  /** Cooldown between rings (ms). */
  cooldownMs: number;
}

export const handbellConfig: HandbellConfig = {
  radius: 58 * RENDER_SCALE,
  stunMs: 1800,
  cooldownMs: 850,
};
