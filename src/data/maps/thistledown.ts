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
 * Objects:  v  gate vine (sword)   f  Hush-fog (handbell)
 *           N  sleeping villager   S  thorn-sprite   @  spawn
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
    f: { type: 'fog', group: 'pocket' },
    N: { type: 'villager' },
    S: { type: 'enemy', enemyId: 'thorn_sprite' },
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
    '###########..f....######',
    '###########..f..N.######',
    '###########..f....######',
    '###########..###########',
    '########ww......########',
    '########ww......########',
    '########..S...S.########',
    '########....S...########',
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
    '####...........S....####',
    '####................####',
    '####...N........N...####',
    '####................####',
    '####.......@........####',
    '########################',
  ],
};
