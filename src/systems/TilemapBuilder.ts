import Phaser from 'phaser';
import { Tile, type MapObjectInstance, type TileMapDef } from '../data/maps/types';
import { COBBLE_VARIANT_INDICES, EDGE_DIRS, FLOWER_TILE_INDICES, GRASS_VARIANT_INDICES, TextureKeys } from './TextureFactory';

/** Narrow walkable runs this wide or less become the dirt trail. */
const MAX_TRAIL_WIDTH = 2;

/** Depth of the tree-canopy overlay — just above the player (10) + slash (11). */
const OVERHEAD_DEPTH = 12;
/** Depth of the dithered edge decals — above the ground, below everything else. */
const DECAL_DEPTH = 1;

const GRASS_TILES = new Set<number>([...GRASS_VARIANT_INDICES, ...FLOWER_TILE_INDICES]);

/**
 * Deterministic RNG for decoration. Seeded per-area at the top of buildTilemap so
 * bushes/rocks/grass/flowers land in the *same* spots on every (re)build — the
 * world is fixed and persistent without storing any positions. `rnd()` replaces
 * Math.random throughout this module.
 */
let rng: () => number = Math.random;
function rnd(): number {
  return rng();
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const isGrass = (t: number): boolean => GRASS_TILES.has(t);

const COBBLE_TILES = new Set<number>(COBBLE_VARIANT_INDICES);
const isCobble = (t: number): boolean => COBBLE_TILES.has(t);

// The distinct grass variant (slot 5) vs the plain grass (slots 0/6); the
// variant feathers onto the plain at their borders to blend the grass.
const VARIANT_GRASS = GRASS_VARIANT_INDICES[1];
const isPlainGrass = (t: number): boolean => t === GRASS_VARIANT_INDICES[0] || t === GRASS_VARIANT_INDICES[2];

/** N/S/E/W offsets matching EDGE_DIRS, for neighbour lookups. */
const EDGE_OFFSETS: Record<string, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

/**
 * Overlay dithered transition decals so terrain types feather together: a grass
 * fringe over sand/water edges that border grass, and a soft shadow at the base
 * of trees. Decals are static images between the ground and the player.
 */
function placeEdgeDecals(scene: Phaser.Scene, data: number[][], tileSize: number): void {
  const H = data.length;
  const W = data[0].length;
  const at = (x: number, y: number): number | undefined => (y >= 0 && y < H && x >= 0 && x < W ? data[y][x] : undefined);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = data[y][x];
      const grass = isGrass(t);
      // Surfaces grass can overgrow at the edges: sand/water + the stone paths.
      const receivesGrass = t === Tile.Path || t === Tile.Water || isCobble(t);
      if (!grass && !receivesGrass) continue; // trees/vines don't receive decals
      const cx = x * tileSize + tileSize / 2;
      const cy = y * tileSize + tileSize / 2;
      for (const dir of EDGE_DIRS) {
        const [dx, dy] = EDGE_OFFSETS[dir];
        const n = at(x + dx, y + dy);
        if (n === undefined) continue;
        // Soft shadow where this walkable tile meets a tree.
        if (n === Tile.Wall) scene.add.image(cx, cy, `shadow-edge-${dir}`).setDepth(DECAL_DEPTH);
        // Grass fringe bleeding onto sand/water/stone from a grass neighbour.
        else if (receivesGrass && isGrass(n)) scene.add.image(cx, cy, `grass-edge-${dir}`).setDepth(DECAL_DEPTH);
        // Grass-to-grass: the variant grass feathers onto plain grass it borders.
        else if (grass && isPlainGrass(t) && n === VARIANT_GRASS) scene.add.image(cx, cy, `grassvar-edge-${dir}`).setDepth(DECAL_DEPTH);
      }
    }
  }
}

const GRASS_VARIANT_SET = new Set<number>(GRASS_VARIANT_INDICES);

/** Plain grass; the distinct variant is grown in patches (then dithered in). */
function pickGrass(): number {
  return GRASS_VARIANT_INDICES[0];
}

/** Grow a blob of the variant grass over plain grass, for soft meadow patches. */
function growGrassPatch(data: number[][], sx: number, sy: number, target: number): void {
  const H = data.length;
  const W = data[0].length;
  const frontier: [number, number][] = [[sx, sy]];
  let placed = 0;
  while (frontier.length > 0 && placed < target) {
    const i = Math.floor(rnd() * frontier.length);
    const [x, y] = frontier.splice(i, 1)[0];
    if (!isPlainGrass(data[y][x])) continue;
    data[y][x] = VARIANT_GRASS;
    placed++;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < H && nx >= 0 && nx < W && isPlainGrass(data[ny][nx])) frontier.push([nx, ny]);
    }
  }
}

/**
 * Grow an organic patch of one flower variant from a seed cell, spreading to
 * adjacent plain-grass tiles until `target` are placed — so flowers read as
 * clumped patches, not random confetti.
 */
function growFlowerPatch(data: number[][], sx: number, sy: number, variant: number, target: number): void {
  const H = data.length;
  const W = data[0].length;
  const frontier: [number, number][] = [[sx, sy]];
  let placed = 0;
  while (frontier.length > 0 && placed < target) {
    const i = Math.floor(rnd() * frontier.length);
    const [x, y] = frontier.splice(i, 1)[0];
    if (!GRASS_VARIANT_SET.has(data[y][x])) continue; // already flowered / not grass
    data[y][x] = variant;
    placed++;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < H && nx >= 0 && nx < W && GRASS_VARIANT_SET.has(data[ny][nx])) frontier.push([nx, ny]);
    }
  }
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

  // Lay plain grass, then grow soft patches of the variant grass over it (the
  // `grassvar-edge` decals later feather these patches into the plain grass).
  for (const row of data) {
    for (let i = 0; i < row.length; i++) if (row[i] === Tile.Grass) row[i] = pickGrass();
  }
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      if (isPlainGrass(data[y][x]) && rnd() < 0.025) {
        growGrassPatch(data, x, y, 6 + Math.floor(rnd() * 10)); // ~6–15 tiles
      }
    }
  }

  // Overgrown stone: a fraction of cobbles have cracked and gone to grass/weeds,
  // so the medieval paths read as long-neglected and unkempt.
  for (const row of data) {
    for (let i = 0; i < row.length; i++) if (row[i] === Tile.Cobble && rnd() < 0.14) row[i] = pickGrass();
  }

  // Vary the remaining cobbles across the real stone variants (grey/grey-alt/tan/
  // rough/mossy) — mostly grey, with the distinctive ones sprinkled in.
  for (const row of data) {
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== Tile.Cobble) continue;
      const r = rnd();
      const v = r < 0.34 ? 0 : r < 0.62 ? 1 : r < 0.76 ? 2 : r < 0.88 ? 3 : 4;
      row[i] = COBBLE_VARIANT_INDICES[v];
    }
  }

  // Flower PATCHES: seed a few spots and grow a blob of one variant from each, so
  // flowers cluster into patches instead of speckling the whole field.
  const H = data.length;
  const W = data[0].length;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (GRASS_VARIANT_SET.has(data[y][x]) && rnd() < 0.012) {
        const variant = FLOWER_TILE_INDICES[Math.floor(rnd() * FLOWER_TILE_INDICES.length)];
        growFlowerPatch(data, x, y, variant, 3 + Math.floor(rnd() * 7)); // ~3–9 tiles
      }
    }
  }
}

export interface BushPlacement {
  x: number;
  y: number;
  group: string; // green | dead | thorny | berry
}

export interface RockPlacement {
  x: number;
  y: number;
  texture: string; // a rock-* texture key
}

/** A connected blob of water tiles to be covered by one scaled pond sprite. */
export interface PondPlacement {
  /** Centre of the water blob's bounding box (px). */
  cx: number;
  cy: number;
  /** Bounding-box size of the water blob (px) — the area the pond water covers. */
  wPx: number;
  hPx: number;
}

export interface BuiltMap {
  layer: Phaser.Tilemaps.TilemapLayer;
  spawn: { x: number; y: number };
  /** Hand-placed objects (vines, villagers, …) resolved to pixel centers. */
  objects: MapObjectInstance[];
  /** Procedurally-clustered bush foliage (pixel centers). */
  bushes: BushPlacement[];
  /** Procedurally-scattered rock set-dressing (pixel centers). */
  rocks: RockPlacement[];
  /** Water blobs to render as pond sprites (the scene owns the art). */
  ponds: PondPlacement[];
  widthPx: number;
  heightPx: number;
}

/**
 * Replace water-tile blobs with pond props: flood-fill each connected run of
 * Water, render grass under it (the pond art carries its own banks) while
 * keeping the tiles solid, and return one placement per blob covering its
 * bounding box. Collision + the offline BFS validator are unchanged (the data
 * still says Water); only the look is swapped.
 */
function placePonds(
  layer: Phaser.Tilemaps.TilemapLayer,
  data: number[][],
  floorTile: number,
  tileSize: number,
): PondPlacement[] {
  const H = data.length;
  const W = data[0]?.length ?? 0;
  const seen = new Set<number>();
  const out: PondPlacement[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[y][x] !== Tile.Water || seen.has(y * W + x)) continue;
      // Flood-fill this water blob (4-connected).
      const blob: [number, number][] = [];
      const stack: [number, number][] = [[x, y]];
      seen.add(y * W + x);
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      while (stack.length) {
        const [bx, by] = stack.pop()!;
        blob.push([bx, by]);
        if (bx < minX) minX = bx;
        if (bx > maxX) maxX = bx;
        if (by < minY) minY = by;
        if (by > maxY) maxY = by;
        for (const [nx, ny] of [[bx + 1, by], [bx - 1, by], [bx, by + 1], [bx, by - 1]] as const) {
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (data[ny][nx] !== Tile.Water || seen.has(ny * W + nx)) continue;
          seen.add(ny * W + nx);
          stack.push([nx, ny]);
        }
      }
      // Render grass under each water tile, but keep it solid (a pond you can't
      // wade into). The data stays Water so collision/validation are untouched.
      for (const [bx, by] of blob) {
        const t = layer.getTileAt(bx, by);
        if (t) {
          t.index = floorTile;
          t.setCollision(true);
        }
      }
      out.push({
        cx: ((minX + maxX + 1) / 2) * tileSize,
        cy: ((minY + maxY + 1) / 2) * tileSize,
        wPx: (maxX - minX + 1) * tileSize,
        hPx: (maxY - minY + 1) * tileSize,
      });
    }
  }
  return out;
}

/** Tiles occupied by objects/spawn (+ a 1-ring), so scatter avoids them. */
function occupiedTiles(objects: MapObjectInstance[], spawn: { x: number; y: number }, tileSize: number, W: number): Set<number> {
  const taken = new Set<number>();
  const mark = (px: number, py: number): void => {
    const tx = Math.floor(px / tileSize);
    const ty = Math.floor(py / tileSize);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) taken.add((ty + dy) * W + (tx + dx));
  };
  for (const o of objects) mark(o.x, o.y);
  mark(spawn.x, spawn.y);
  return taken;
}

const ROCK_VARIANTS = ['rock-a', 'rock-b', 'rock-c', 'rock-d', 'rock-e', 'rock-f', 'rock-g', 'rock-h', 'rock-cluster', 'rock-mossy'];

/** Sparsely scatter single rocks over open grass for set-dressing. */
function generateRockScatter(data: number[][], taken: Set<number>, tileSize: number, def: TileMapDef): RockPlacement[] {
  if (def.interior) return [];
  const H = data.length;
  const W = data[0].length;
  const out: RockPlacement[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!isGrass(data[y][x]) || taken.has(y * W + x) || rnd() >= 0.009) continue;
      taken.add(y * W + x);
      const texture = rnd() < 0.08 ? 'rock-large' : ROCK_VARIANTS[Math.floor(rnd() * ROCK_VARIANTS.length)];
      out.push({ x: x * tileSize + tileSize / 2, y: y * tileSize + tileSize / 2, texture });
    }
  }
  return out;
}

/**
 * Scatter bush clusters over open grass (like flower patches, but as world
 * objects): seed a few spots, grow a small blob of one variant, and give green
 * clusters a chance at a harvestable berry bush. Avoids object/spawn tiles.
 */
function generateBushClusters(data: number[][], taken: Set<number>, tileSize: number, def: TileMapDef): BushPlacement[] {
  if (def.interior) return [];
  const H = data.length;
  const W = data[0].length;
  const out: BushPlacement[] = [];
  const key = (x: number, y: number): number => y * W + x;
  const canSeed = (x: number, y: number): boolean => isGrass(data[y][x]) && !taken.has(key(x, y));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!canSeed(x, y) || rnd() >= 0.01) continue;
      const r = rnd();
      const group = r < 0.55 ? 'green' : r < 0.78 ? 'dead' : 'thorny';
      // Grow the cluster: a small blob of grass tiles, one bush each.
      const frontier: [number, number][] = [[x, y]];
      const target = 2 + Math.floor(rnd() * 4); // 2–5 bushes
      let placed = 0;
      while (frontier.length > 0 && placed < target) {
        const i = Math.floor(rnd() * frontier.length);
        const [bx, by] = frontier.splice(i, 1)[0];
        if (taken.has(key(bx, by)) || !isGrass(data[by][bx])) continue;
        taken.add(key(bx, by));
        placed++;
        const isBerry = group === 'green' && rnd() < 0.3;
        out.push({ x: bx * tileSize + tileSize / 2, y: by * tileSize + tileSize / 2, group: isBerry ? 'berry' : group });
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = bx + dx;
          const ny = by + dy;
          if (ny >= 0 && ny < H && nx >= 0 && nx < W && isGrass(data[ny][nx]) && !taken.has(key(nx, ny))) frontier.push([nx, ny]);
        }
      }
    }
  }
  return out;
}

/**
 * Build a Phaser tilemap + collision layer from an ASCII TileMapDef. Terrain
 * characters become tiles; object/spawn characters become a floor tile plus an
 * entry in the returned `objects`/`spawn`. Returns the layer (for colliders),
 * the spawn point, the objects, and the map's pixel dimensions.
 */
export function buildTilemap(scene: Phaser.Scene, def: TileMapDef, seed = 'brackenvale'): BuiltMap {
  // Seed decoration from the area id so every (re)build of this area lays out
  // identically — the world stays fixed and persistent across visits/reloads.
  rng = mulberry32(hashSeed(seed));
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
  const flippable = new Set<number>([...GRASS_VARIANT_INDICES, ...FLOWER_TILE_INDICES, ...COBBLE_VARIANT_INDICES]);
  layer.forEachTile((tile) => {
    if (flippable.has(tile.index) && rnd() < 0.5) tile.flipX = true;
  });

  layer.setCollision(def.blocking);

  // Re-draw the blocking tiles (tree-walls) on a layer ABOVE the player so the
  // tall character walks *behind* the treeline (the canopy occludes them)
  // instead of covering it — collision stays on the ground layer below. Skipped
  // for interiors, where short walls shouldn't occlude the player.
  const overhead = def.interior ? null : map.createBlankLayer('overhead', tileset, 0, 0);
  if (overhead) {
    const blockingSet = new Set<number>(def.blocking);
    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < data[y].length; x++) {
        // Water is a ground feature (covered by a pond sprite), not a tall wall —
        // it must not be redrawn above the player.
        if (blockingSet.has(data[y][x]) && data[y][x] !== Tile.Water) overhead.putTileAt(data[y][x], x, y);
      }
    }
    overhead.setDepth(OVERHEAD_DEPTH);
  }

  placeEdgeDecals(scene, data, tileSize);

  // Swap water blobs for pond sprites (after decals, so the grass-under read is clean).
  const ponds = placePonds(layer, data, floorTile, tileSize);

  // Shared "occupied" set so bushes + rocks avoid objects and each other.
  const taken = occupiedTiles(objects, spawn, tileSize, width);
  return {
    layer,
    spawn,
    objects,
    bushes: generateBushClusters(data, taken, tileSize, def),
    rocks: generateRockScatter(data, taken, tileSize, def),
    ponds,
    widthPx: width * tileSize,
    heightPx: height * tileSize,
  };
}
