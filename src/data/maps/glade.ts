import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * Mistmere Glade — an optional watery hollow west of the village (DESIGN.md §12
 * exploration branch). Still ponds, reed-islands and an uneven treeline make it
 * read as a place, not a box. A cairn and the spring carry lore; a barbhound and
 * a pair of gloommoths guard a heart fragment tucked in the misted southwest.
 * The east openings return to Sleeping Thistledown.
 *
 * Terrain:  .  grass   #  tree/reed   w  water
 * Objects:  c cairn   p spring   N Wren(npc)   g gloommoth   b barbhound   h heart
 *           H hero standing-stone (lore)   T tree   X exit→village   A entry(from_village)   @ spawn
 */
export const gladeMap: TileMapDef = {
  tileSize: TILE_SIZE,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
    w: Tile.Water,
  },
  blocking: [Tile.Wall, Tile.Water],
  objects: {
    c: { type: 'marker', group: 'cairn', loreId: 'glade_cairn' },
    p: { type: 'marker', group: 'shrine', loreId: 'glade_spring' },
    H: { type: 'marker', group: 'hero_stone', loreId: 'glade_hero' },
    N: { type: 'npc', npcId: 'wren' },
    g: { type: 'enemy', enemyId: 'gloommoth' },
    b: { type: 'enemy', enemyId: 'barbhound' },
    h: { type: 'heart' },
    T: { type: 'tree' },
    G: { type: 'bush', group: 'green' },
    Y: { type: 'bush', group: 'thorny' },
    X: { type: 'exit', toArea: 'village', toEntry: 'from_glade' },
    A: { type: 'entry', entryId: 'from_village' },
  },
  floorTile: Tile.Grass,
  spawnChar: '@',
  spawnTile: Tile.Grass,
  rows: [
    '############################', // 0
    '###..####.........###....###', // 1  ragged northern treeline
    '##..H..##...........#....c.#', // 2  hero standing-stone (NW); cairn (top-right)
    '##.......................A.#', // 3  arrive from the village (east)
    '##..ww......####.........X.#', // 4  the Mistmere (pond) + reed island; exit east
    '##..ww......####...........#', // 5
    '##................g.......##', // 6  a gloommoth over the open ground
    '##...........b.......T.G..##', // 7  barbhound prowls the open ground; a bush
    '###.....p..N..............##', // 8  the spring (lore); Wren the forager nearby
    '##........................##', // 9
    '##..###....ww........g....##', // 10 reed clump; a second pond + gloommoth
    '##..###....ww.............##', // 11
    '##..................@.....##', // 12 (fresh-start fallback spawn)
    '##..h............T....Y...##', // 13 heart fragment (southwest pocket); tree + bush
    '###....##.........####...###', // 14 ragged southern treeline
    '############################', // 15
  ],
};
