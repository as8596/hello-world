import { RENDER_SCALE } from './render';

/**
 * Player tuning — data, not hardcoded into the entity (project convention).
 * Movement is expressed in pixels/second so it stays delta-time correct and
 * framerate-independent (DESIGN.md §14, P0). Spatial values are `design *
 * RENDER_SCALE` so they track the global render scale.
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
  /** Base playback rate (fps) for the real directional run cycles. */
  runFrameRate: number;
  /** Playback rate (fps) for the idle "breathing" cycles. */
  idleFrameRate: number;
  /**
   * World pixels of travel per run-animation frame. The run cadence is locked to
   * distance (not time), so the feet never slide regardless of move speed — and
   * the legs speed up naturally during a dash. Tied to the art's stride (~the
   * foot travel between frames), so it is NOT scaled by RENDER_SCALE.
   */
  runPixelsPerFrame: number;
  /** Arcade physics body, relative to the 16x16 frame. */
  body: { width: number; height: number; offsetX: number; offsetY: number };
  /**
   * Real directional art (4 rotations). If `public/assets/sprites/player-<dir>.png`
   * (down/up/left/right) are present they're used automatically; otherwise the
   * generated placeholder is used. Tune these once you can see it in-game.
   */
  sprite: {
    /** Vertical origin (0..1); ~0.9 puts the feet near the bottom of the frame. */
    originY: number;
    /** Foot collision box, in the art's native (128px-frame) pixels. */
    bodyWidth: number;
    bodyHeight: number;
  };
  /** Max hearts (Vigor governs this later). Health is tracked in half-hearts. */
  maxHearts: number;
  /** Max-HP gained per heart fragment, in half-hearts (2 = one full heart). */
  heartFragmentHalfHearts: number;
  /** Invulnerability window after taking a hit (i-frames, ms). */
  invulnMs: number;
  /** Knockback impulse when hurt (px/sec). */
  hurtKnockback: number;
  /** How long input is locked after being hurt, so knockback reads (ms). */
  hurtLockMs: number;
  /** Max stamina (abstract points; gates the dodge). Not a spatial value. */
  maxStamina: number;
  /** Stamina regenerated per second. */
  staminaRegenPerSec: number;
  /** Dodge-roll tuning (DESIGN.md §13 step 7): a stamina-gated dash with i-frames. */
  dodge: {
    /** Dash burst speed (px/sec). */
    speed: number;
    /** How long the dash burst lasts (ms). */
    durationMs: number;
    /** Invulnerability granted by the roll (ms); covers the dash + a little. */
    iframesMs: number;
    /** Stamina spent per dodge. */
    staminaCost: number;
    /** Minimum gap after a dash ends before another can start (ms). */
    cooldownMs: number;
  };
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
  maxSpeed: 80 * RENDER_SCALE,
  acceleration: 750 * RENDER_SCALE,
  friction: 950 * RENDER_SCALE,
  walkFrameRate: 8,
  runFrameRate: 10,
  idleFrameRate: 6,
  // Effective run cadence = moveSpeed / this. At maxSpeed (320) that's ~8 fps
  // (≈4 steps/s) — a natural run. Lower = faster legs (and tighter no-slide);
  // higher = calmer legs (with a touch of foot-slide).
  runPixelsPerFrame: 40,
  // A short body near the feet reads better for top-down overlap than the full sprite.
  body: { width: 8 * RENDER_SCALE, height: 7 * RENDER_SCALE, offsetX: 4 * RENDER_SCALE, offsetY: 8 * RENDER_SCALE },
  // Native 128px art (character centered, feet ~90% down the frame); the foot
  // box is in those native pixels (the sprite renders 1:1, no scaling).
  sprite: {
    originY: 0.9,
    bodyWidth: 34,
    bodyHeight: 18,
  },
  maxHearts: 3,
  heartFragmentHalfHearts: 2,
  invulnMs: 800,
  hurtKnockback: 170 * RENDER_SCALE,
  hurtLockMs: 180,
  maxStamina: 3,
  staminaRegenPerSec: 1.4,
  dodge: {
    speed: 260 * RENDER_SCALE,
    durationMs: 180,
    iframesMs: 240,
    staminaCost: 1,
    cooldownMs: 320,
  },
  attack: {
    damage: 1,
    windupMs: 70,
    activeMs: 90,
    recoverMs: 130,
    bufferMs: 150,
    reach: 11 * RENDER_SCALE,
    hitboxW: 16 * RENDER_SCALE,
    hitboxH: 14 * RENDER_SCALE,
    hitStopMs: 70,
    knockback: 150 * RENDER_SCALE,
  },
};
