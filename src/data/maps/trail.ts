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
 *           n exit→belltower   s exit→village   e exit→warren
 *           4 entry(from_belltower)   5 entry(from_village)   6 entry(from_warren)
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
    T: { type: 'tree' },
    G: { type: 'bush', group: 'green' },
    D: { type: 'bush', group: 'dead' },
    n: { type: 'exit', toArea: 'belltower', toEntry: 'from_trail' },
    s: { type: 'exit', toArea: 'village', toEntry: 'from_trail' },
    e: { type: 'exit', toArea: 'warren', toEntry: 'from_trail' },
    '4': { type: 'entry', entryId: 'from_belltower' },
    '5': { type: 'entry', entryId: 'from_village' },
    '6': { type: 'entry', entryId: 'from_warren' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '############nn##############', // 0  north opening -> belltower
    '##..................G.....##', // 1  a leafy bush
    '##..........4.............##', // 2  arrive here coming back from the belltower
    '##..wwww........b.........##', // 3  pond + brambleback (ring-to-stun)
    '##..wwww........T.........##', // 4  a tree by the pond
    '##..wwww..............D...##', // 5  a bare bush
    '##.........S...............e', // 6  a lone sprite (east opening -> warren)
    '##......................6..e', // 7  arrive from the warren; the doorway
    '##..fff...................##', // 8  fog-sealed pocket...
    '##..fhf...................##', // 9  ...heart fragment inside
    '##..fff...................##', // 10
    '##...............m........##', // 11 mushroom-folk (dodge timing)
    '##.................T......##', // 12 a tree off the south lane
    '##..........5.............##', // 13 arrive here coming from the village
    '##.......@................##', // 14 (fresh-start fallback spawn)
    '############ss##############', // 15 south opening -> village
  ],
};
