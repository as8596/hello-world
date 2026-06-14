import { TextureKeys } from '../systems/TextureFactory';
import { RENDER_SCALE } from './render';

/**
 * Enemy definitions (DESIGN.md §17). One shared EnemyBase runs the FSM; each
 * type is pure data tuning. `attack` is optional — contact enemies (like the
 * thorn-sprite) damage on touch and have no telegraphed swing yet.
 */
export interface EnemyDef {
  id: string;
  name: string;
  texture: string;
  hp: number;
  /** Move speed in px/sec. */
  speed: number;
  /** Touch damage in half-hearts. */
  contactDamage: number;
  /** Aggro/perception ranges in px. */
  vision: number;
  aggroRange: number;
  leashRange: number;
  /** Immune unless bell-stunned (handbell step). */
  armored?: boolean;
  /** Handbell can stun it (default true). */
  stunnable?: boolean;
  /**
   * Optional real 8-direction art: textures `<keyPrefix>-<dir>` (loaded in
   * PreloadScene). Used in place of `texture` when all eight are present; the
   * art faces the way it moves. Sizes are in the art's native pixels.
   */
  directional?: {
    keyPrefix: string;
    /** Display scale applied to the source art (it's larger than the world size). */
    displayScale: number;
    /** Collision/hit body, in world px (centered on the sprite). */
    bodyWidth: number;
    bodyHeight: number;
  };
  attack?: {
    type: 'lunge' | 'overhead' | 'charge' | 'projectile';
    windupMs: number;
    activeMs: number;
    recoverMs: number;
    damage: number;
    range: number;
  };
}

/** The teaching enemy: weak, rushes, contact lunge (§10, §17). */
export const thornSprite: EnemyDef = {
  id: 'thorn_sprite',
  name: 'Thorn-sprite',
  texture: TextureKeys.ThornSprite,
  hp: 2,
  speed: 55 * RENDER_SCALE,
  contactDamage: 1,
  vision: 90 * RENDER_SCALE,
  aggroRange: 80 * RENDER_SCALE,
  leashRange: 150 * RENDER_SCALE,
  stunnable: true,
  // 124px rotations -> displayed ~0.55x so the imp reads as small (~half the
  // player); body in world px covers its central mass.
  directional: { keyPrefix: 'thorn', displayScale: 0.55, bodyWidth: 26, bodyHeight: 22 },
};

export const ENEMIES: Record<string, EnemyDef> = {
  thorn_sprite: thornSprite,
};
