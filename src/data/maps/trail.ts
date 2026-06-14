import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * Thornwood Trail (DESIGN.md §12). The teaching ladder: a mushroom-folk (dodge
 * timing), a thorn-sprite, then a brambleback that blocks the lane (ring-to-stun),
 * plus a fog-sealed pocket hiding a heart fragment. North opening leads to the
 * Belltower; south returns to the village.
 *
 * Terrain:  .  grass   #  tree/wall   w  water
 * Objects:  f fog   h heart   S thorn-sprite   b brambleback   m mushroom-folk
 *           n exit→belltower   s exit→village   4 entry(from_belltower)   5 entry(from_village)
 */
export const trailMap: TileMapDef = {
  tileSize: TILE_SIZE,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
    w: Tile.Water,
  },
  blocking: [Tile.Wall, Tile.Water],
  objects: {
    f: { type: 'fog', group: 'pocket' },
    h: { type: 'heart' },
    S: { type: 'enemy', enemyId: 'thorn_sprite' },
    b: { type: 'enemy', enemyId: 'brambleback' },
    m: { type: 'enemy', enemyId: 'mushroom_folk' },
    n: { type: 'exit', toArea: 'belltower', toEntry: 'from_trail' },
    s: { type: 'exit', toArea: 'village', toEntry: 'from_trail' },
    '4': { type: 'entry', entryId: 'from_belltower' },
    '5': { type: 'entry', entryId: 'from_village' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '############nn##############', // 0  north opening -> belltower
    '##........................##', // 1
    '##..........4.............##', // 2  arrive here coming back from the belltower
    '##..wwww........b.........##', // 3  pond + brambleback (ring-to-stun)
    '##..wwww..................##', // 4
    '##..wwww..................##', // 5
    '##.........S..............##', // 6  a lone sprite
    '##........................##', // 7
    '##..fff...................##', // 8  fog-sealed pocket...
    '##..fhf...................##', // 9  ...heart fragment inside
    '##..fff...................##', // 10
    '##...............m........##', // 11 mushroom-folk (dodge timing)
    '##........................##', // 12
    '##..........5.............##', // 13 arrive here coming from the village
    '##.......@................##', // 14 (fresh-start fallback spawn)
    '############ss##############', // 15 south opening -> village
  ],
};
