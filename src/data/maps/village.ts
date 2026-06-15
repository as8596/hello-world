import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * Sleeping Thistledown — the village (DESIGN.md §12). A long-neglected medieval
 * hamlet: overgrown cobble streets thread between a few timbered cottages (one a
 * mossy ruin), a market where Maple keeps shop, a hearth to rest, and sleepers
 * curled where they fell during the Hush. A vine GATE seals the north neck into
 * the Thornwood Trail; south returns to the Waking Hollow, west to Mistmere Glade.
 *
 * Terrain:  .  grass   #  tree/wall   o  cobble (stone path)
 * Objects:  v gate vine   H hearth   M Maple   N sleeper   S thorn-sprite
 *           C cottage   P stone house   U ruined house   T tree   Q smith's shrine(lore)
 *           d/e/f/j house doors (enter the interiors)
 *           n exit→trail   s exit→hollow   g exit→glade
 *           2 entry(from_trail)   3 entry(from_hollow)   4 entry(from_glade)
 */
export const villageMap: TileMapDef = {
  tileSize: TILE_SIZE,
  legend: {
    '.': Tile.Grass,
    '#': Tile.Wall,
    o: Tile.Cobble,
  },
  blocking: [Tile.Wall],
  objects: {
    v: { type: 'vine', group: 'gate' },
    H: { type: 'hearth' },
    M: { type: 'maple' },
    N: { type: 'villager' },
    S: { type: 'enemy', enemyId: 'thorn_sprite' },
    C: { type: 'building', group: 'cottage' },
    P: { type: 'building', group: 'stone' },
    U: { type: 'building', group: 'ruin' },
    T: { type: 'tree' },
    Q: { type: 'marker', group: 'hero_forge', loreId: 'village_forge' },
    k: { type: 'signpost' },
    // Interactable doors (in front of each house) -> interiors; also the spot you
    // return to when you leave.
    d: { type: 'doorway', toArea: 'house1', toEntry: 'inside', entryId: 'house1_door' },
    e: { type: 'doorway', toArea: 'house2', toEntry: 'inside', entryId: 'house2_door' },
    f: { type: 'doorway', toArea: 'house3', toEntry: 'inside', entryId: 'house3_door' },
    j: { type: 'doorway', toArea: 'house4', toEntry: 'inside', entryId: 'house4_door' },
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
    '###############nn###############', // 0  north opening -> trail
    '###############..###############', // 1  the gate neck (walled — no way around)
    '###############vv###############', // 2  vine gate (cut to pass north)
    '##.............o2.............##', // 3  arrive from the trail
    '##.............oo.............##', // 4
    '##...T....Q....oo.........T...##', // 5  a smith's shrine off the west lane
    '##.....C.......oo.......P.....##', // 6  cottage / stone house
    '##.....d.N.....oo.....N.e.....##', // 7  their doors (enter) + sleepers
    '##.........oooooooooo.........##', // 8  the market square (cobbled)
    'g.ooooooooooooooooooo.........##', // 9  west street -> Mistmere Glade
    'g.o4ooooooooooooooooo.........##', // 10 arrive from the glade
    '##.........ooMooooHoo.........##', // 11 Maple's stall + a hearth
    '##.........ookooooooo.........##', // 12 a signpost in the square
    '##......N......oo......N......##', // 13 more sleepers
    '##.....U.......oo.......C.....##', // 14 ruined house / cottage
    '##...T.f.....@.oo....S..j.T...##', // 15 their doors + spawn + a lone sprite
    '##.............o3.............##', // 16 arrive from the Hollow
    '##.............oo.............##', // 17
    '##.............oo.............##', // 18
    '###############ss###############', // 19 south opening -> hollow
  ],
};
