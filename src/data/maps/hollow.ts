import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * The Waking Hollow — the starting area (DESIGN.md §12, §14a). A thicket of
 * winding paths larger than the screen: you wake in the middle and must follow
 * the trails off-screen to find each item. The blade (L) lies down the southern
 * paths; the Warden's Handbell (g) is sealed in a clearing to the north behind
 * a vine (v) — examine it without a blade, or cut through once you have one.
 * Take both, then leave by the north opening (n) into Sleeping Thistledown.
 *
 * Terrain:  .  grass   #  thicket/wall
 * Objects:  L blade   g handbell   v vine (blocks the bell)
 *           n exit→village   1 entry(from_village)   @ spawn
 */
export const hollowMap: TileMapDef = {
  tileSize: TILE_SIZE,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
  },
  blocking: [Tile.Wall],
  objects: {
    L: { type: 'blade' },
    g: { type: 'handbell' },
    v: { type: 'vine', group: 'bell' },
    n: { type: 'exit', toArea: 'village', toEntry: 'from_hollow' },
    '1': { type: 'entry', entryId: 'from_village' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '##########nn##########', // 0  north opening -> village
    '######..........######', // 1  the bell clearing...
    '######....g..1..######', // 2  ...the handbell (1 = arrive from village)
    '######..........######', // 3
    '######..........######', // 4
    '##########v###########', // 5  a vine seals the clearing
    '#####......###########', // 6  winding north paths
    '#####.####.###########', // 7
    '#####.####.###########', // 8
    '#####......###########', // 9
    '##########.###########', // 10
    '##########.###########', // 11
    '##########.###########', // 12
    '########......########', // 13 you wake here...
    '########..@...########', // 14
    '########......########', // 15
    '##########.###########', // 16 winding south paths
    '##########......######', // 17
    '###############.######', // 18
    '###############.######', // 19
    '##########......######', // 20
    '##########.###########', // 21
    '##########.###########', // 22
    '##########.###########', // 23
    '######.........#######', // 24 the blade clearing...
    '######..L......#######', // 25 ...the blade (found down here)
    '######.........#######', // 26
    '######################', // 27
  ],
};
