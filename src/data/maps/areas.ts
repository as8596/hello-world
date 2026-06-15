import { belltowerMap } from './belltower';
import { gladeMap } from './glade';
import { hollowMap } from './hollow';
import { trailMap } from './trail';
import type { TileMapDef } from './types';
import { villageMap } from './village';
import { warrenMap } from './warren';

/**
 * The Thistledown region split into discrete areas (DESIGN.md §12). Each is its
 * own tilemap; the player transitions between them at edge openings with a
 * fade-to-black (see WorldScene). The main spine runs south (you wake) to north
 * (the bell), with two optional exploration branches hanging off it:
 *   hollow -> village -> trail -> belltower
 *               |          |
 *             glade      warren   (optional side areas)
 */
export type AreaId = 'hollow' | 'village' | 'trail' | 'belltower' | 'glade' | 'warren';

export const AREAS: Record<AreaId, TileMapDef> = {
  hollow: hollowMap,
  village: villageMap,
  trail: trailMap,
  belltower: belltowerMap,
  glade: gladeMap,
  warren: warrenMap,
};

/** Where a brand-new game begins. */
export const START_AREA: AreaId = 'hollow';

export function isAreaId(value: unknown): value is AreaId {
  return typeof value === 'string' && value in AREAS;
}
