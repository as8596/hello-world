import { TextureKeys } from '../systems/TextureFactory';

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
  speed: 55,
  contactDamage: 1,
  vision: 90,
  aggroRange: 80,
  leashRange: 150,
  stunnable: true,
};

export const ENEMIES: Record<string, EnemyDef> = {
  thorn_sprite: thornSprite,
};
