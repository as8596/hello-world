import { belltowerMap } from './belltower';
import { gladeMap } from './glade';
import { hollowMap } from './hollow';
import { houseInterior } from './interiors';
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
export type AreaId =
  | 'hollow'
  | 'village'
  | 'trail'
  | 'belltower'
  | 'glade'
  | 'warren'
  | 'house1'
  | 'house2'
  | 'house3'
  | 'house4';

export const AREAS: Record<AreaId, TileMapDef> = {
  hollow: hollowMap,
  village: villageMap,
  trail: trailMap,
  belltower: belltowerMap,
  glade: gladeMap,
  warren: warrenMap,
  // House interiors (entered via village doorways); each leads back to its door.
  house1: houseInterior('house1_door'),
  house2: houseInterior('house2_door'),
  house3: houseInterior('house3_door'),
  house4: houseInterior('house4_door'),
};

/** Where a brand-new game begins. */
export const START_AREA: AreaId = 'hollow';

export function isAreaId(value: unknown): value is AreaId {
  return typeof value === 'string' && value in AREAS;
}
