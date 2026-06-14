import Phaser from 'phaser';
import { Tile, type MapObjectInstance, type TileMapDef } from '../data/maps/types';
import { TextureKeys } from './TextureFactory';

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

  const map = scene.make.tilemap({ data, tileWidth: tileSize, tileHeight: tileSize });
  const tileset = map.addTilesetImage('tiles', TextureKeys.Tiles, tileSize, tileSize);
  if (!tileset) throw new Error('Failed to add tileset image');
  // gpu defaults off -> a CPU TilemapLayer, the kind arcade colliders accept
  // (TilemapGPULayer isn't a valid ArcadeColliderType).
  const layer = map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
  if (!layer) throw new Error('Failed to create tilemap layer');

  layer.setCollision(def.blocking);

  return {
    layer,
    spawn,
    objects,
    widthPx: width * tileSize,
    heightPx: height * tileSize,
  };
}
