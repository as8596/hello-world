import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * The Waking Hollow — the starting area (DESIGN.md §12, §14a). You wake among
 * sleepers; a blade (L) and the Warden's Handbell (g) glint just north. Pick
 * them up to unlock attack + ring, then leave by the north opening (n) into
 * Sleeping Thistledown.
 *
 * Terrain:  .  grass   #  tree/wall
 * Objects:  L blade   g handbell   N sleeper   n exit→village   1 entry(from_village)   @ spawn
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
    N: { type: 'villager' },
    n: { type: 'exit', toArea: 'village', toEntry: 'from_hollow' },
    '1': { type: 'entry', entryId: 'from_village' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '########nn########', // 0  north opening -> village
    '##..............##', // 1
    '##......1.......##', // 2  arrive here coming back from the village
    '##..............##', // 3
    '##......g.......##', // 4  the Warden's Handbell (glints)
    '##..N........N..##', // 5  sleepers
    '##......L.......##', // 6  the blade (glints)
    '##..............##', // 7
    '##....N....N....##', // 8  sleepers
    '##..............##', // 9
    '##......@.......##', // 10 you wake here
    '##..............##', // 11
    '##################', // 12
  ],
};
