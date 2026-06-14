import { Tile, type TileMapDef } from './types';

/**
 * Thistledown — the vertical-slice overworld (DESIGN.md §12). South (you wake)
 * to north (the belltower). From the bottom up:
 *   - Sleeping Thistledown: a wide village clearing with sleeping villagers.
 *   - A vine GATE across the only path north — cut it to open the lane.
 *   - Thornwood Trail: a forest corridor, a pond, and a vine-sealed side
 *     pocket (a future reward, cut-the-vines later).
 *   - The belltower clearing at the top.
 *
 * Terrain:  .  grass     #  tree/wall     w  water
 * Objects:  v  gate vine   V  pocket vine   N  sleeping villager   @  spawn
 */
export const thistledownMap: TileMapDef = {
  tileSize: 16,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
    w: Tile.Water,
  },
  blocking: [Tile.Wall, Tile.Water],
  objects: {
    v: { type: 'vine', group: 'gate' },
    V: { type: 'vine', group: 'pocket' },
    N: { type: 'villager' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '########################',
    '########........########',
    '########........########',
    '########........########',
    '########........########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..V....######',
    '###########..V....######',
    '###########..V....######',
    '###########..###########',
    '########ww......########',
    '########ww......########',
    '########........########',
    '########........########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########vv###########',
    '###########..###########',
    '####................####',
    '####................####',
    '####.....N....N.....####',
    '####................####',
    '####................####',
    '####...N........N...####',
    '####................####',
    '####.......@........####',
    '########################',
  ],
};
