import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * Thistledown — the vertical-slice overworld (DESIGN.md §12). South (you wake)
 * to north (the belltower), as an encounter ladder that teaches each verb solo
 * then tests it. From the bottom up:
 *   - The Waking Hollow: you wake among sleepers (movement only).
 *   - Sleeping Thistledown: cut a vine GATE, fight thorn-sprites, hearth + Maple.
 *   - Thornwood Trail: a pond, mushroom-folk (dodge timing), a brambleback that
 *     blocks the direct lane (ring-to-stun), and a fog-sealed pocket hiding a
 *     heart fragment (ring the handbell to dispel the fog).
 *   - The Belltower: a combat hall with three resonance CHIMES (a brambleback +
 *     sprites among them); ring each to tune the bell and open the boss DOOR.
 *   - The shrine: Bramblewerth, then the great bell.
 *
 * Terrain:  .  grass     #  tree/wall     w  water
 * Objects:  v  gate vine (sword)   f  Hush-fog (handbell)   h  heart fragment
 *           H  hearth (rest)   M  Maple (shopkeeper)   N  sleeping villager
 *           S  thorn-sprite   b  brambleback (armored)   m  mushroom-folk
 *           C  resonance chime   D  boss door   X  boss spawn   B  great bell   @  spawn
 */
export const thistledownMap: TileMapDef = {
  tileSize: TILE_SIZE,
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
    M: { type: 'maple' },
    N: { type: 'villager' },
    S: { type: 'enemy', enemyId: 'thorn_sprite' },
    b: { type: 'enemy', enemyId: 'brambleback' },
    m: { type: 'enemy', enemyId: 'mushroom_folk' },
    C: { type: 'chime' },
    D: { type: 'door' },
    X: { type: 'boss', enemyId: 'bramblewerth' },
    B: { type: 'greatbell' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '############################', // 0  — the shrine (north)
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
    '###...........S..........###', // 18
    '#############..#############', // 19
    '#############..#############', // 20
    '###......................###', // 21 — Thornwood Trail (north end → the hall)
    '###..wwww........b.......###', // 22 brambleback blocks the lane (ring-to-stun)
    '###..wwww................###', // 23 pond
    '###..wwww................###', // 24
    '###.........S............###', // 25 a lone sprite
    '###......................###', // 26
    '###..............m.......###', // 27 mushroom-folk — dodge timing (first taught)
    '###..fff.................###', // 28 fog-sealed pocket...
    '###..fhf.................###', // 29 ...heart fragment inside
    '###..fff.................###', // 30
    '###......................###', // 31
    '#############..#############', // 32
    '#############vv#############', // 33 vine gate
    '#############..#############', // 34
    '##........................##', // 35 — Sleeping Thistledown (village)
    '##........................##', // 36
    '##....N..........N........##', // 37 sleepers
    '##........................##', // 38
    '##...H..........M.........##', // 39 hearth + Maple
    '##........................##', // 40
    '##..N..........S..........##', // 41 sleeper + a lone sprite
    '##........................##', // 42
    '##........................##', // 43
    '##....N.........N.........##', // 44 — The Waking Hollow
    '##........................##', // 45
    '##.........@..............##', // 46 spawn
    '##........................##', // 47
    '############################', // 48
  ],
};
