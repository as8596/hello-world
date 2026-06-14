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
  | 'boss';

export interface ObjectSpec {
  type: ObjectType;
  /** Optional grouping tag (e.g. 'gate' vs 'pocket' vines). */
  group?: string;
  /** For enemies: which EnemyDef id to spawn. */
  enemyId?: string;
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
}
