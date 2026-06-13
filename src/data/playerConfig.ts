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
}

export const playerConfig: PlayerConfig = {
  maxSpeed: 90,
  acceleration: 750,
  friction: 950,
  walkFrameRate: 8,
  // A short body near the feet reads better for top-down overlap than the full sprite.
  body: { width: 8, height: 7, offsetX: 4, offsetY: 8 },
};
