import { Tile, type TileMapDef } from './types';

/**
 * Thistledown — the vertical-slice overworld (DESIGN.md §12), as a carved
 * forest path. You wake at the bottom (`@`) and follow the trail north toward
 * the belltower clearing. Water and a vine-blocked side pocket (the future
 * cut-the-vines moment) constrain the route so walls actually matter.
 *
 *   .  grass (walkable)      #  tree/wall (blocks)
 *   w  water (blocks)        v  vine (blocks, cuttable later)
 *   @  player spawn
 */
export const thistledownMap: TileMapDef = {
  tileSize: 16,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
    w: Tile.Water,
    v: Tile.Vine,
  },
  blocking: [Tile.Wall, Tile.Water, Tile.Vine],
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '########################',
    '#########......#########',
    '#########......#########',
    '#########......#########',
    '#########......#########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..v....######',
    '###########..v....######',
    '###########..v....######',
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
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########@.###########',
    '###########..###########',
    '########################',
  ],
};
