import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * Bramble Warren — an optional combat den east of the Thornwood Trail (DESIGN.md
 * §12 exploration branch). A winding thorn burrow: a lone sprite guards the
 * approach, and stepping into the inner chamber springs an AMBUSH (gloommoths +
 * a barbhound, raised by the encounter). A thorn-WARD seals a warden's cache
 * (heart + lore) until the den is cleared. West openings return to the trail.
 *
 * Terrain:  .  grass   #  thorn/wall
 * Objects:  m sprite(guard)  t ambush trigger  s/B ambush spawns  W ward  R Bram(npc)
 *           h heart  b bones(lore)  k cache(lore)  T tree  X exit→trail  A entry  @ spawn
 */
export const warrenMap: TileMapDef = {
  tileSize: TILE_SIZE,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
  },
  blocking: [Tile.Wall],
  objects: {
    m: { type: 'enemy', enemyId: 'thorn_sprite' },
    t: { type: 'trigger', group: 'warren' },
    s: { type: 'spawn', enemyId: 'gloommoth', group: 'warren' },
    B: { type: 'spawn', enemyId: 'barbhound', group: 'warren' },
    W: { type: 'ward', group: 'warren' },
    h: { type: 'heart' },
    R: { type: 'npc', npcId: 'bram' },
    T: { type: 'tree' },
    b: { type: 'marker', loreId: 'warren_bones' },
    k: { type: 'marker', loreId: 'warren_cache' },
    X: { type: 'exit', toArea: 'trail', toEntry: 'from_warren' },
    A: { type: 'entry', entryId: 'from_trail' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '############################', // 0
    '##....######....##........##', // 1  thorn masses; chamber roof (right)
    '##.b............##......k.##', // 2  bones (lore) / cache (lore, sealed)
    '##....##........##...h....##', // 3  heart (sealed in the cache)
    '##.....T........##....R...##', // 4  a tree west; Bram hides in the sealed cache
    '##......####....##........##', // 5
    '##..............#####WW#####', // 6  ward seals the cache mouth
    'A...............##........##', // 7  entry from the trail (west)
    '##...................t....##', // 8  ambush trigger (chamber mouth open)
    '##..................s.....##', // 9  gap in the wall -> the chamber
    'X...............##.s..B...##', // 10 exit to the trail; ambush spawns
    '##....######....##........##', // 11
    '##..............##........##', // 12
    '##.......m......##........##', // 13 a sprite guards the approach
    '##.....@........##........##', // 14 (fresh-start fallback spawn)
    '############################', // 15
  ],
};
