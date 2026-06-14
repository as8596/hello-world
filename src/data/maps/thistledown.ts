import { Tile, type TileMapDef } from './types';

/**
 * Thistledown — the vertical-slice overworld (DESIGN.md §12). South (you wake)
 * to north (the belltower). From the bottom up:
 *   - Sleeping Thistledown: a village clearing with sleepers + a hearth.
 *   - A vine GATE across the path north (cut it with the sword).
 *   - Thornwood Trail: a pond, sprite clearings, and a fog-sealed pocket that
 *     hides a heart fragment (ring the handbell to dispel the fog).
 *   - The Belltower: a combat hall with three resonance CHIMES; ring the
 *     handbell by each to tune the bell and open the boss DOOR to the shrine.
 *
 * Terrain:  .  grass     #  tree/wall     w  water
 * Objects:  v  gate vine (sword)   f  Hush-fog (handbell)   h  heart fragment
 *           H  hearth (rest)   N  sleeping villager   S  thorn-sprite
 *           C  resonance chime   D  boss door   X  boss spawn
 *           B  the great bell   @  spawn
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
    h: { type: 'heart' },
    H: { type: 'hearth' },
    N: { type: 'villager' },
    S: { type: 'enemy', enemyId: 'thorn_sprite' },
    C: { type: 'chime' },
    D: { type: 'door' },
    X: { type: 'boss', enemyId: 'bramblewerth' },
    B: { type: 'greatbell' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '########################',
    '#####......B.......#####', // the great bell (shrine)
    '#####..............#####',
    '#####......X.......#####', // Bramblewerth spawns here
    '#####..............#####',
    '#####..............#####',
    '###########DD###########', // boss door
    '###..................###', // belltower hall (chime arena)
    '###..................###',
    '###..C...........C...###', // chimes (left / right)
    '###..................###',
    '###.......S..S.......###',
    '###........C.........###', // chime (center)
    '###..................###',
    '###########..###########',
    '###########..###########',
    '###########..f....######', // fog-sealed pocket
    '###########..f..h.######', // heart fragment behind the fog
    '###########..f....######',
    '###########..###########',
    '########ww......########', // pond + trail clearing
    '########ww......########',
    '########..S...S.########',
    '########....S...########',
    '###########..###########',
    '###########..###########',
    '###########..###########',
    '###########vv###########', // vine gate
    '###########..###########',
    '####................####', // Sleeping Thistledown (village)
    '####................####',
    '####.....N....N.....####',
    '####...........S....####',
    '####................####',
    '####...N...H....N...####', // villagers + hearth
    '####................####',
    '####.......@........####', // spawn (the Waking Hollow)
    '########################',
  ],
};
