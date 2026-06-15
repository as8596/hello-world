/**
 * Tilemap data types. Maps are authored as ASCII rows + a legend so they're
 * hand-editable data (project convention) and trivially swapped for real Tiled
 * JSON later — the collision indices and builder stay the same.
 */

/** Tile indices into the generated tileset (left-to-right order). */
export const Tile = {
  Grass: 0,
  Path: 1,
  Wall: 2,
  Water: 3,
  Vine: 4,
  Cobble: 8, // stone path (slots 5-7 are grass variants/flowers, see TextureFactory)
  Plank: 9, // interior wood floor
  Timber: 10, // interior wood wall (blocking)
} as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

/** Object kinds that can be hand-placed on the map via legend characters. */
export type ObjectType =
  | 'vine'
  | 'villager'
  | 'enemy'
  | 'fog'
  | 'heart'
  | 'hearth'
  | 'chime'
  | 'door'
  | 'boss'
  | 'greatbell'
  | 'maple'
  | 'npc' // a named, data-driven NPC (dialogue/dialogue/npcs.ts) via `npcId`
  | 'blade'
  | 'handbell'
  | 'tree' // a standalone canopy tree: blocks at the trunk, occludes overhead
  | 'building' // a medieval house: blocks at its footprint, occludes overhead
  | 'marker' // an examinable point-of-interest (a cairn with lore)
  | 'trigger' // an invisible zone that starts a scripted encounter on entry
  | 'spawn' // a deferred enemy spawn point, raised by its encounter (not at build)
  | 'ward' // a magical barrier that only dispels when its encounter is cleared
  | 'doorway' // an interactable door: press to enter an interior; also a return point
  | 'exit' // an edge zone that transitions to another area
  | 'entry'; // a named spawn point the player arrives at from another area

export interface ObjectSpec {
  type: ObjectType;
  /** Optional grouping tag (e.g. 'gate' vs 'pocket' vines). */
  group?: string;
  /** For enemies: which EnemyDef id to spawn. */
  enemyId?: string;
  /** For 'npc': which named NPC (data/dialogue/npcs.ts) to talk to. */
  npcId?: string;
  /** For 'marker': the lore entry (data/dialogue/lore.ts) to show on examine. */
  loreId?: string;
  /** For 'exit': the area id to travel to and the entry id to arrive at there. */
  toArea?: string;
  toEntry?: string;
  /** For 'entry': the id matched by an exit's `toEntry`. */
  entryId?: string;
}

/** A resolved object placement with a pixel-center position. */
export interface MapObjectInstance extends ObjectSpec {
  x: number;
  y: number;
}

export interface TileMapDef {
  /** Pixel size of one square tile. */
  tileSize: number;
  /** Each string is a row; every row must be the same length. */
  rows: string[];
  /** Maps an ASCII character to a terrain tile index. */
  legend: Record<string, Tile>;
  /** Tile indices that block movement. */
  blocking: Tile[];
  /** Character marking the player's spawn cell. */
  spawnChar: string;
  /** Tile placed underneath the spawn marker. */
  spawnTile: Tile;
  /** Maps an ASCII character to an object placed on a floor tile. */
  objects?: Record<string, ObjectSpec>;
  /** Tile placed underneath objects (and a fallback floor). Defaults to Grass. */
  floorTile?: Tile;
  /** Interior room (a house etc.): no night/atmosphere, no overhead canopy layer,
   *  and small enough that the camera shows it floating in black (Stardew style). */
  interior?: boolean;
}
