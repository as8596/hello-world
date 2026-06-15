import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * A cozy timbered room with a doorway back out to the village. The small
 * footprint + `interior` flag means the camera frames it floating in black
 * (Stardew-style) with no night/atmosphere. `returnEntry` is the village entry
 * the door leads back to (the doorway you came in by).
 */
export function houseInterior(returnEntry: string): TileMapDef {
  return {
    tileSize: TILE_SIZE,
    interior: true,
    legend: {
      '.': Tile.Plank,
      '#': Tile.Timber,
    },
    blocking: [Tile.Timber],
    objects: {
      x: { type: 'exit', toArea: 'village', toEntry: returnEntry },
      e: { type: 'entry', entryId: 'inside' },
    },
    floorTile: Tile.Plank,
    spawnChar: '@',
    spawnTile: Tile.Plank,
    rows: [
      '#############', // 0
      '#...........#', // 1
      '#.....@.....#', // 2  (fresh-start fallback)
      '#...........#', // 3
      '#.....e.....#', // 4  you arrive just inside the door
      '#...........#', // 5
      '######xx#####', // 6  the door (walk onto it to leave)
    ],
  };
}
