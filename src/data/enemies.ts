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
  // 124px rotations -> displayed ~0.75x (visible imp ~46px); body in world px
  // covers its core so swings connect fairly.
  directional: { keyPrefix: 'thorn', displayScale: 0.75, bodyWidth: 34, bodyHeight: 30 },
};

/** The armored bruiser: only damageable while bell-stunned — teaches ring-to-stun (§9). */
export const brambleback: EnemyDef = {
  id: 'brambleback',
  name: 'Brambleback',
  texture: TextureKeys.Brambleback,
  hp: 5,
  speed: 38 * RENDER_SCALE,
  contactDamage: 2,
  vision: 95 * RENDER_SCALE,
  aggroRange: 78 * RENDER_SCALE,
  leashRange: 175 * RENDER_SCALE,
  armored: true,
  stunnable: true,
};

/** The dodge-timing teacher: a slow, heavily telegraphed overhead slam. */
export const mushroomFolk: EnemyDef = {
  id: 'mushroom_folk',
  name: 'Mushroom-folk',
  texture: TextureKeys.MushroomFolk,
  hp: 3,
  speed: 42 * RENDER_SCALE,
  contactDamage: 0, // only the telegraphed overhead hurts (fair, dodgeable)
  vision: 100 * RENDER_SCALE,
  aggroRange: 85 * RENDER_SCALE,
  leashRange: 160 * RENDER_SCALE,
  stunnable: true,
  attack: {
    type: 'overhead',
    windupMs: 700, // a longer, more readable tell before the slam
    activeMs: 150,
    recoverMs: 450,
    damage: 2,
    range: 30 * RENDER_SCALE,
  },
};

/**
 * The barbhound: a lean thorn-beast that telegraphs a long wind-up then CHARGES
 * in a straight line — teaches sidestepping/dodging a committed dash (§17). Fast
 * but fragile, and it overshoots, opening a punish window.
 */
export const barbhound: EnemyDef = {
  id: 'barbhound',
  name: 'Barbhound',
  texture: TextureKeys.Barbhound,
  hp: 3,
  speed: 60 * RENDER_SCALE,
  contactDamage: 0, // only the telegraphed charge hurts (fair, dodgeable)
  vision: 120 * RENDER_SCALE,
  aggroRange: 110 * RENDER_SCALE,
  leashRange: 200 * RENDER_SCALE,
  stunnable: true,
  attack: {
    type: 'charge',
    windupMs: 700, // a clear, readable wind-up before it commits
    activeMs: 260,
    recoverMs: 560,
    damage: 2,
    // Near-contact: it must actually reach the player to connect (the dash closes
    // the gap during the active window) rather than "hitting" from across the room.
    range: 22 * RENDER_SCALE,
  },
};

/**
 * The gloommoth: a small, fast, erratic flutterer that harries on contact — no
 * telegraph, low HP, dangerous in numbers. Used for swarms/ambushes (§17).
 */
export const gloommoth: EnemyDef = {
  id: 'gloommoth',
  name: 'Gloommoth',
  texture: TextureKeys.Gloommoth,
  hp: 1,
  speed: 70 * RENDER_SCALE,
  contactDamage: 1,
  vision: 130 * RENDER_SCALE,
  aggroRange: 120 * RENDER_SCALE,
  leashRange: 260 * RENDER_SCALE,
  stunnable: true,
};

export const ENEMIES: Record<string, EnemyDef> = {
  thorn_sprite: thornSprite,
  brambleback: brambleback,
  mushroom_folk: mushroomFolk,
  barbhound: barbhound,
  gloommoth: gloommoth,
};
