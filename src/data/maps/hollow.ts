import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * The Waking Hollow — the starting area (DESIGN.md §12, §14a). A small maze of
 * thicket corridors. You wake at the bottom; the blade (L) sits in a left
 * pocket (found first), and the Warden's Handbell (g) is sealed in a niche
 * behind a vine (v) you must cut with the blade. Take both, then leave by the
 * north opening (n) into Sleeping Thistledown.
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
    '#########nn#########', // 0  north opening -> village
    '##.#g#............##', // 1  the handbell, sealed in a niche...
    '##.#v#...1........##', // 2  ...behind a vine (cut it). 1 = arrive from village
    '##................##', // 3
    '##....######......##', // 4  thicket
    '##....#..#........##', // 5
    '##....####........##', // 6
    '##................##', // 7
    '##.......#####....##', // 8  thicket
    '##.......#...#....##', // 9
    '##.......#####....##', // 10
    '##.#######........##', // 11
    '##L......#........##', // 12 the blade (found first)
    '##.######.........##', // 13
    '##.......@........##', // 14 you wake here
    '####################', // 15
  ],
};
