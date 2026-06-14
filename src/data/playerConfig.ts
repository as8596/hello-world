/**
 * Player tuning — data, not hardcoded into the entity (project convention).
 * Movement is expressed in pixels/second so it stays delta-time correct and
 * framerate-independent (DESIGN.md §14, P0).
 */
export interface PlayerConfig {
  /** Top speed in px/sec. */
  maxSpeed: number;
  /** How fast we ramp up to target speed, px/sec². */
  acceleration: number;
  /** How fast we slow to a stop when no input, px/sec² (a touch of weight, §14 P1). */
  friction: number;
  /** Walk animation playback rate (fps). */
  walkFrameRate: number;
  /** Arcade physics body, relative to the 16x16 frame. */
  body: { width: number; height: number; offsetX: number; offsetY: number };
  /** Max hearts (Vigor governs this later). Health is tracked in half-hearts. */
  maxHearts: number;
  /** Invulnerability window after taking a hit (i-frames, ms). */
  invulnMs: number;
  /** Knockback impulse when hurt (px/sec). */
  hurtKnockback: number;
  /** How long input is locked after being hurt, so knockback reads (ms). */
  hurtLockMs: number;
  /** Melee swing tuning (DESIGN.md §9, §14). */
  attack: {
    /** Damage dealt per connecting swing (Might governs this later). */
    damage: number;
    /** Telegraph before the hitbox goes live (ms). */
    windupMs: number;
    /** How long the hitbox is live (ms). */
    activeMs: number;
    /** Lockout after the active window (ms); total of the three = cooldown. */
    recoverMs: number;
    /** A press this long before "ready" still fires (input buffering, §14 P0). */
    bufferMs: number;
    /** Distance from the player center to the hitbox center (px). */
    reach: number;
    /** Hitbox size (px). */
    hitboxW: number;
    hitboxH: number;
    /** Freeze duration on a connecting hit (hit-stop, §14 P0). */
    hitStopMs: number;
    /** Knockback impulse applied to struck dynamic bodies (px/sec). */
    knockback: number;
  };
}

export const playerConfig: PlayerConfig = {
  maxSpeed: 90,
  acceleration: 750,
  friction: 950,
  walkFrameRate: 8,
  // A short body near the feet reads better for top-down overlap than the full sprite.
  body: { width: 8, height: 7, offsetX: 4, offsetY: 8 },
  maxHearts: 3,
  invulnMs: 800,
  hurtKnockback: 170,
  hurtLockMs: 180,
  attack: {
    damage: 1,
    windupMs: 70,
    activeMs: 90,
    recoverMs: 130,
    bufferMs: 150,
    reach: 11,
    hitboxW: 16,
    hitboxH: 14,
    hitStopMs: 70,
    knockback: 150,
  },
};
