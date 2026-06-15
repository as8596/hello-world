import { TILE_SIZE } from '../render';
import { Tile, type TileMapDef } from './types';

/**
 * Building interiors (DESIGN.md §12). Each is a timbered room (Plank floor,
 * Timber walls) entered from a village doorway and laid out as its own little
 * scene: a House, a Tavern (with a back storage room + a cellar below), and a
 * Shop. `returnEntry` is the village entry the front door leads back to.
 *
 * Shared legend:
 *   .  plank floor   #  timber wall   o  cellar stone
 *   x  front door (exit to village)   e  arrive-inside entry   @  fallback spawn
 *   F  fireplace(hearth)  B bed  T table  C counter  S shelf  R rug
 *   W window  G stained glass  b barrel  c crate  h cellar hatch
 */

const FURNITURE = {
  F: { type: 'hearth' as const },
  B: { type: 'prop' as const, group: 'bed' },
  T: { type: 'prop' as const, group: 'table' },
  C: { type: 'prop' as const, group: 'counter' },
  S: { type: 'prop' as const, group: 'shelf' },
  R: { type: 'prop' as const, group: 'rug' },
  W: { type: 'prop' as const, group: 'window' },
  G: { type: 'prop' as const, group: 'glass' },
  b: { type: 'prop' as const, group: 'barrel' },
  c: { type: 'prop' as const, group: 'crate' },
};

const base = (returnEntry: string) => ({
  tileSize: TILE_SIZE,
  interior: true as const,
  legend: { '.': Tile.Plank, '#': Tile.Timber },
  blocking: [Tile.Timber],
  floorTile: Tile.Plank,
  spawnChar: '@',
  spawnTile: Tile.Plank,
  objects: {
    x: { type: 'exit' as const, toArea: 'village', toEntry: returnEntry },
    e: { type: 'entry' as const, entryId: 'inside' },
    ...FURNITURE,
  },
});

/**
 * House — a central living/dining/kitchen with a central fireplace and two
 * windows; a short hallway north leads to a bedroom.
 */
export function houseInterior(returnEntry: string): TileMapDef {
  return {
    ...base(returnEntry),
    rows: [
      '###############', // 0
      '#......W......#', // 1  bedroom (window in the north wall)
      '#...B.........#', // 2  bed
      '#...R.........#', // 3  rug
      '######.########', // 4  hallway (1x2) to the bedroom
      '######.########', // 5
      '#..W.......W..#', // 6  living/dining/kitchen; two windows
      '#.CC..F....T..#', // 7  kitchen counter, central fireplace, dining table
      '#.....e.@.....#', // 8  you arrive just inside the door
      '#.....R.......#', // 9  hearthside rug
      '######xx#######', // 10 the door out
    ],
  };
}

/**
 * Tavern — an open eating/drinking room with a bar and windows; a door on the
 * back wall leads to a storage room, where a hatch drops into the cellar.
 */
export function tavernInterior(returnEntry: string): TileMapDef {
  const b = base(returnEntry);
  return {
    ...b,
    objects: {
      ...b.objects,
      h: { type: 'doorway' as const, group: 'hatch', toArea: 'tavern_cellar', toEntry: 'from_hatch', entryId: 'cellar_hatch' },
    },
    rows: [
      '###############', // 0
      '#..b..c...b...#', // 1  storage room (north): barrels + crates
      '#....h........#', // 2  cellar hatch (descend)
      '#.........c...#', // 3
      '######.########', // 4  back-wall door (1x2) to the storage room
      '######.########', // 5
      '#..W.......W..#', // 6  eating/drinking room; two windows
      '#.CCCC........#', // 7  the bar
      '#.....T...T...#', // 8  tables
      '#.....e.@.....#', // 9  arrive inside
      '######xx#######', // 10 the door out
    ],
  };
}

/** Shop — one room with a long counter and stained-glass windows. */
export function shopInterior(returnEntry: string): TileMapDef {
  return {
    ...base(returnEntry),
    rows: [
      '#############', // 0
      '#.G.......G.#', // 1  stained-glass windows
      '#...........#', // 2  (keeper's side)
      '#.CCCCCCC...#', // 3  the counter
      '#...........#', // 4
      '#.....S.....#', // 5  a shelf of wares
      '#.....e.@...#', // 6  arrive inside
      '#...........#', // 7
      '######xx#####', // 8  the door out
    ],
  };
}

/** Tavern cellar — a cool stone room of casks, reached by the hatch above. */
export function cellarInterior(): TileMapDef {
  return {
    tileSize: TILE_SIZE,
    interior: true,
    legend: { '.': Tile.Cobble, '#': Tile.Timber },
    blocking: [Tile.Timber],
    floorTile: Tile.Cobble,
    spawnChar: '@',
    spawnTile: Tile.Cobble,
    objects: {
      // Back up the stairs/hatch into the tavern's storage room.
      x: { type: 'exit', toArea: 'house2', toEntry: 'cellar_hatch' },
      e: { type: 'entry', entryId: 'from_hatch' },
      b: { type: 'prop', group: 'barrel' },
      c: { type: 'prop', group: 'crate' },
    },
    rows: [
      '###########', // 0
      '#.b.c.b.c.#', // 1  casks
      '#....@....#', // 2  (fresh-start fallback)
      '#....x....#', // 3  the stairs back up
      '#....e....#', // 4  arrive at the foot of the stairs
      '#.b.c.b.c.#', // 5
      '###########', // 6
    ],
  };
}
