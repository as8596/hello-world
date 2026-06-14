import Phaser from 'phaser';
import type { TileMapDef } from '../data/maps/types';
import { TextureKeys } from './TextureFactory';

export interface BuiltMap {
  layer: Phaser.Tilemaps.TilemapLayer;
  spawn: { x: number; y: number };
  widthPx: number;
  heightPx: number;
}

/**
 * Build a Phaser tilemap + collision layer from an ASCII TileMapDef.
 * Returns the layer (for colliders), the player spawn point (pixel center),
 * and the map's pixel dimensions (for world/camera bounds).
 */
export function buildTilemap(scene: Phaser.Scene, def: TileMapDef): BuiltMap {
  const { tileSize, rows, legend, spawnChar, spawnTile } = def;
  const height = rows.length;
  const width = rows[0]?.length ?? 0;

  let spawn = { x: tileSize / 2, y: tileSize / 2 };
  const data: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    if (row.length !== width) {
      throw new Error(`Map row ${y} is ${row.length} wide, expected ${width}`);
    }
    const cells: number[] = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      let index: number;
      if (ch === spawnChar) {
        index = spawnTile;
        spawn = { x: x * tileSize + tileSize / 2, y: y * tileSize + tileSize / 2 };
      } else {
        const mapped = legend[ch];
        if (mapped === undefined) {
          throw new Error(`Map cell (${x},${y}) uses unknown character '${ch}'`);
        }
        index = mapped;
      }
      cells.push(index);
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
    widthPx: width * tileSize,
    heightPx: height * tileSize,
  };
}
