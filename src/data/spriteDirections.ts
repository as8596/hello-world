/**
 * Shared 8-direction helpers for directional sprite art (player rotations,
 * thorn-sprite rotations, …). Compass names match the art file names.
 */
export type SpriteDir =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west';

export const SPRITE_DIRS: readonly SpriteDir[] = [
  'north',
  'south',
  'east',
  'west',
  'north-east',
  'north-west',
  'south-east',
  'south-west',
];

// Octants clockwise from east (screen space: +y is down).
const OCTANTS: readonly SpriteDir[] = [
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
  'north',
  'north-east',
];

/** Snap a heading/velocity vector to one of the 8 compass directions. */
export function dir8FromVector(vx: number, vy: number): SpriteDir {
  const oct = ((Math.round(Math.atan2(vy, vx) / (Math.PI / 4)) % 8) + 8) % 8;
  return OCTANTS[oct];
}
