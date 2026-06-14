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

export interface TileMapDef {
  /** Pixel size of one square tile. */
  tileSize: number;
  /** Each string is a row; every row must be the same length. */
  rows: string[];
  /** Maps an ASCII character to a tile index. */
  legend: Record<string, Tile>;
  /** Tile indices that block movement. */
  blocking: Tile[];
  /** Character marking the player's spawn cell. */
  spawnChar: string;
  /** Tile placed underneath the spawn marker. */
  spawnTile: Tile;
}
