import { belltowerMap } from './belltower';
import { hollowMap } from './hollow';
import { trailMap } from './trail';
import type { TileMapDef } from './types';
import { villageMap } from './village';

/**
 * The Thistledown region split into discrete areas (DESIGN.md §12). Each is its
 * own tilemap; the player transitions between them at edge openings with a
 * fade-to-black (see WorldScene). South (you wake) to north (the bell):
 *   hollow -> village -> trail -> belltower
 */
export type AreaId = 'hollow' | 'village' | 'trail' | 'belltower';

export const AREAS: Record<AreaId, TileMapDef> = {
  hollow: hollowMap,
  village: villageMap,
  trail: trailMap,
  belltower: belltowerMap,
};

/** Where a brand-new game begins. */
export const START_AREA: AreaId = 'hollow';

export function isAreaId(value: unknown): value is AreaId {
  return typeof value === 'string' && value in AREAS;
}
