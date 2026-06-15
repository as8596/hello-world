import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * Sleeping Thistledown — the village (DESIGN.md §12). Sleepers, a hearth (rest +
 * save), Maple the shopkeeper, a lone thorn-sprite, and a vine GATE you must cut
 * to reach the north opening into the Thornwood Trail. South opening returns to
 * the Waking Hollow.
 *
 * Terrain:  .  grass   #  tree/wall
 * Objects:  v gate vine   H hearth   M Maple   N sleeper   S thorn-sprite
 *           n exit→trail   s exit→hollow   g exit→glade
 *           2 entry(from_trail)   3 entry(from_hollow)   4 entry(from_glade)
 */
export const villageMap: TileMapDef = {
  tileSize: TILE_SIZE,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
  },
  blocking: [Tile.Wall],
  objects: {
    v: { type: 'vine', group: 'gate' },
    H: { type: 'hearth' },
    M: { type: 'maple' },
    N: { type: 'villager' },
    S: { type: 'enemy', enemyId: 'thorn_sprite' },
    n: { type: 'exit', toArea: 'trail', toEntry: 'from_village' },
    s: { type: 'exit', toArea: 'hollow', toEntry: 'from_village' },
    g: { type: 'exit', toArea: 'glade', toEntry: 'from_village' },
    '2': { type: 'entry', entryId: 'from_trail' },
    '3': { type: 'entry', entryId: 'from_hollow' },
    '4': { type: 'entry', entryId: 'from_glade' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '############nn##############', // 0  north opening -> trail
    '############..##############', // 1  the gate neck (walled — no way around)
    '############vv##############', // 2  vine gate (cut to pass north)
    '##..........2.............##', // 3  arrive here coming back from the trail
    '##........................##', // 4
    '##....N..........N........##', // 5  sleepers
    '##........................##', // 6
    'g....H..........M.........##', // 7  hearth + Maple (west opening -> glade)
    'g.........................##', // 8  ...the glade doorway
    '##4.N..........S..........##', // 9  arrive from the glade; sleeper + a sprite
    '##........................##', // 10
    '##........................##', // 11
    '##..........3.............##', // 12 arrive here coming from the Hollow
    '##........................##', // 13
    '##.......@................##', // 14 (fresh-start fallback spawn)
    '############ss##############', // 15 south opening -> hollow
  ],
};
