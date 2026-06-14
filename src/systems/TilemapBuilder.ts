import Phaser from 'phaser';
import { Tile, type MapObjectInstance, type TileMapDef } from '../data/maps/types';
import { FLOWER_TILE_INDEX, GRASS_VARIANT_INDICES, TextureKeys } from './TextureFactory';

/** Narrow walkable runs this wide or less become the dirt trail. */
const MAX_TRAIL_WIDTH = 2;

/** Depth of the tree-canopy overlay — just above the player (10) + slash (11). */
const OVERHEAD_DEPTH = 12;

/** Pick a grass tile variant (rarely a flower) for organic-looking ground. */
function pickGrass(): number {
  const r = Math.random();
  if (r < 0.02) return FLOWER_TILE_INDEX; // sparse flowers
  if (r < 0.38) return GRASS_VARIANT_INDICES[1];
  return GRASS_VARIANT_INDICES[0];
}

/**
 * Decorate the raw tile grid in place: pave narrow corridors as a dirt trail
 * (so the journey through the forest reads), then scatter grass variants over
 * the remaining open ground. Purely cosmetic — walkability is unchanged since
 * none of these indices are in `blocking`.
 */
function decorate(data: number[][], blocking: number[]): void {
  const blockingSet = new Set<number>(blocking);
  const walkable = (t: number): boolean => !blockingSet.has(t);

  // Pave narrow horizontal runs of open ground.
  for (const row of data) {
    let x = 0;
    while (x < row.length) {
      if (!walkable(row[x])) {
        x++;
        continue;
      }
      let end = x;
      while (end < row.length && walkable(row[end])) end++;
      if (end - x <= MAX_TRAIL_WIDTH) {
        for (let i = x; i < end; i++) if (row[i] === Tile.Grass) row[i] = Tile.Path;
      }
      x = end;
    }
  }

  // Scatter grass variants over the rest.
  for (const row of data) {
    for (let i = 0; i < row.length; i++) if (row[i] === Tile.Grass) row[i] = pickGrass();
  }
}

export interface BuiltMap {
  layer: Phaser.Tilemaps.TilemapLayer;
  spawn: { x: number; y: number };
  /** Hand-placed objects (vines, villagers, …) resolved to pixel centers. */
  objects: MapObjectInstance[];
  widthPx: number;
  heightPx: number;
}

/**
 * Build a Phaser tilemap + collision layer from an ASCII TileMapDef. Terrain
 * characters become tiles; object/spawn characters become a floor tile plus an
 * entry in the returned `objects`/`spawn`. Returns the layer (for colliders),
 * the spawn point, the objects, and the map's pixel dimensions.
 */
export function buildTilemap(scene: Phaser.Scene, def: TileMapDef): BuiltMap {
  const { tileSize, rows, legend, spawnChar, spawnTile } = def;
  const floorTile = def.floorTile ?? Tile.Grass;
  const objectDefs = def.objects ?? {};
  const height = rows.length;
  const width = rows[0]?.length ?? 0;

  let spawn = { x: tileSize / 2, y: tileSize / 2 };
  const objects: MapObjectInstance[] = [];
  const data: number[][] = [];

  const center = (i: number): number => i * tileSize + tileSize / 2;

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    if (row.length !== width) {
      throw new Error(`Map row ${y} is ${row.length} wide, expected ${width}`);
    }
    const cells: number[] = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      if (ch === spawnChar) {
        cells.push(spawnTile);
        spawn = { x: center(x), y: center(y) };
      } else if (objectDefs[ch]) {
        cells.push(floorTile);
        objects.push({ ...objectDefs[ch], x: center(x), y: center(y) });
      } else {
        const tile = legend[ch];
        if (tile === undefined) {
          throw new Error(`Map cell (${x},${y}) uses unknown character '${ch}'`);
        }
        cells.push(tile);
      }
    }
    data.push(cells);
  }

  decorate(data, def.blocking);

  const map = scene.make.tilemap({ data, tileWidth: tileSize, tileHeight: tileSize });
  const tileset = map.addTilesetImage('tiles', TextureKeys.Tiles, tileSize, tileSize);
  if (!tileset) throw new Error('Failed to add tileset image');
  // gpu defaults off -> a CPU TilemapLayer, the kind arcade colliders accept
  // (TilemapGPULayer isn't a valid ArcadeColliderType).
  const layer = map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
  if (!layer) throw new Error('Failed to create tilemap layer');

  // Randomly mirror ~half the grass/flower tiles for extra organic variation.
  const flippable = new Set<number>([...GRASS_VARIANT_INDICES, FLOWER_TILE_INDEX]);
  layer.forEachTile((tile) => {
    if (flippable.has(tile.index) && Math.random() < 0.5) tile.flipX = true;
  });

  layer.setCollision(def.blocking);

  // Re-draw the blocking tiles (tree-walls) on a layer ABOVE the player so the
  // tall character walks *behind* the treeline (the canopy occludes them)
  // instead of covering it — collision stays on the ground layer below.
  const overhead = map.createBlankLayer('overhead', tileset, 0, 0);
  if (overhead) {
    const blockingSet = new Set<number>(def.blocking);
    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < data[y].length; x++) {
        if (blockingSet.has(data[y][x])) overhead.putTileAt(data[y][x], x, y);
      }
    }
    overhead.setDepth(OVERHEAD_DEPTH);
  }

  return {
    layer,
    spawn,
    objects,
    widthPx: width * tileSize,
    heightPx: height * tileSize,
  };
}
