import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * The Belltower (DESIGN.md §12). A combat hall with three resonance CHIMES (a
 * brambleback + sprites among them); ring each to tune the bell and open the
 * boss DOOR to the shrine, where Bramblewerth nests and the great bell waits.
 * South opening returns to the Thornwood Trail. The shrine (north) is terminal.
 *
 * Terrain:  .  grass   #  tree/wall
 * Objects:  C chime   D boss door   X boss spawn   B great bell   S thorn-sprite
 *           b brambleback   s exit→trail   6 entry(from_trail)
 */
export const belltowerMap: TileMapDef = {
  tileSize: TILE_SIZE,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
  },
  blocking: [Tile.Wall],
  objects: {
    C: { type: 'chime' },
    D: { type: 'door' },
    X: { type: 'boss', enemyId: 'bramblewerth' },
    B: { type: 'greatbell' },
    S: { type: 'enemy', enemyId: 'thorn_sprite' },
    b: { type: 'enemy', enemyId: 'brambleback' },
    s: { type: 'exit', toArea: 'trail', toEntry: 'from_belltower' },
    '6': { type: 'entry', entryId: 'from_trail' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '############################', // 0  — the shrine (north, terminal)
    '######................######', // 1
    '######................######', // 2
    '######......B.........######', // 3  great bell
    '######................######', // 4
    '######......X.........######', // 5  Bramblewerth spawns here
    '######................######', // 6
    '######................######', // 7
    '######................######', // 8
    '#############DD#############', // 9  boss door
    '###......................###', // 10 — belltower hall (chime arena)
    '###......................###', // 11
    '###..C................C..###', // 12 chimes (left / right)
    '###......................###', // 13
    '###......................###', // 14
    '###.......b....S.........###', // 15 brambleback + sprite among the chimes
    '###..........C...........###', // 16 chime (center)
    '###......................###', // 17
    '###..........6...........###', // 18 arrive here coming from the trail
    '###...........S......@...###', // 19 sprite (+ fresh-start fallback spawn)
    '############ss##############', // 20 south opening -> trail
  ],
};
