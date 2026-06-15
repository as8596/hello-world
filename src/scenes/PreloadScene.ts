import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config';
import { RENDER_SCALE as RS } from '../data/render';
import { SPRITE_DIRS } from '../data/spriteDirections';
import { PLAYER_SPRITE_DIRS } from '../entities/Player';
import { addPixelText, createPixelFont } from '../systems/PixelFont';
import { applyStoneTileset, applyTerrainTileset, generateEdgeDecals, generatePlaceholderTextures } from '../systems/TextureFactory';
import { SceneKeys } from './SceneKeys';

/**
 * PreloadScene — load all assets and show a progress bar, then enter the
 * world. No real assets exist yet (placeholder art comes later), so this
 * builds the procedural placeholder textures + pixel font and transitions on.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    // Procedural assets are synchronous, so build them up front — the loading
    // bar below then has a crisp font to draw with.
    generatePlaceholderTextures(this);
    createPixelFont(this);
    this.drawLoadingBar();

    // Optional real player art (8 rotations) in public/assets/sprites/player/.
    // Missing files are tolerated — the Player falls back to the placeholder.
    for (const d of PLAYER_SPRITE_DIRS) this.load.image(`player-${d.key}`, d.file);

    // Player animation sheets (generated from GIFs by `npm run sprites`). The
    // frame size lives in each set's manifest, so load that first and queue the
    // sheets when it arrives — Phaser processes loads added mid-run.
    this.loadPlayerAnimSet('run');
    this.loadPlayerAnimSet('idle');

    // Optional thorn-sprite 8-direction art. If all eight load, the enemy uses
    // it in place of the procedural placeholder (EnemyBase / enemies.ts).
    for (const dir of SPRITE_DIRS) {
      this.load.image(`thorn-${dir}`, `assets/sprites/thorn-sprite/rotations/${dir}.png`);
    }

    // Optional Maple 8-direction art — used for the shopkeeper once she wakes.
    for (const dir of SPRITE_DIRS) {
      this.load.image(`maple-${dir}`, `assets/sprites/maple/rotations/${dir}.png`);
    }

    // Optional real terrain tileset — composited over the walkable placeholder
    // tiles once loaded (tree-walls + vines stay procedural).
    this.load.image('terrain', 'assets/tilesets/terrain.png');

    // Optional real cobblestone sheet — composited into the cobble tile slots.
    this.load.image('stone', 'assets/tilesets/stone.png');

    // A standalone tree world-object, placed via 'tree' map objects (optional —
    // a missing file just means those objects render nothing).
    this.load.image('tree', 'assets/tree.png');

    // Bush foliage world-objects (green / dead / thorny), placed via 'bush' objects.
    this.load.image('bush-green', 'assets/sprites/bushes/green.png');
    this.load.image('bush-dead', 'assets/sprites/bushes/dead.png');
    this.load.image('bush-thorny', 'assets/sprites/bushes/thorny.png');

    // Animated placeholder fire (roaring flames) for the hearth — a 64px strip.
    this.load.spritesheet('fire', 'assets/sprites/fire.png', { frameWidth: 64, frameHeight: 64 });

    // Optional real item art (blade + handbell pickups); falls back to the
    // procedural placeholder if missing.
    this.load.image('item-blade', 'assets/sprites/items/blade.png');
    this.load.image('item-handbell', 'assets/sprites/items/handbell.png');

    // A missing optional asset must not fail the boot.
    this.load.on('loaderror', () => undefined);
  }

  /**
   * Load a player animation set (`run`, `idle`, …): read its manifest, then
   * queue a spritesheet per direction it contains (keys `player-<set>-<dir>`).
   * All optional — a missing manifest just leaves the static art in use.
   */
  private loadPlayerAnimSet(set: string): void {
    const key = `player-${set}-manifest`;
    this.load.json(key, `assets/sprites/player/${set}/manifest.json`);
    this.load.once(`filecomplete-json-${key}`, (_k: string, _t: string, data: unknown) => {
      const m = data as { frameWidth: number; frameHeight: number; dirs?: string[] } | undefined;
      if (!m || !Array.isArray(m.dirs)) return;
      for (const dir of m.dirs) {
        this.load.spritesheet(`player-${set}-${dir}`, `assets/sprites/player/${set}/${dir}.png`, {
          frameWidth: m.frameWidth,
          frameHeight: m.frameHeight,
        });
      }
    });
  }

  create(): void {
    // All loads are done now, so fold the real terrain + stone art into the
    // tileset, then bake the dithered edge decals from the (now real) grass.
    applyTerrainTileset(this, 'terrain');
    applyStoneTileset(this, 'stone');
    generateEdgeDecals(this);
    // Register the looping fire animation (global) if its sheet loaded.
    if (this.textures.exists('fire') && !this.anims.exists('fire')) {
      this.anims.create({ key: 'fire', frames: this.anims.generateFrameNumbers('fire', {}), frameRate: 10, repeat: -1 });
    }
    this.scene.start(SceneKeys.World);
  }

  private drawLoadingBar(): void {
    const barWidth = Math.floor(BASE_WIDTH * 0.6);
    const barHeight = 6 * RS;
    const x = Math.floor((BASE_WIDTH - barWidth) / 2);
    const y = Math.floor(BASE_HEIGHT / 2);

    const frame = this.add.rectangle(x, y, barWidth, barHeight, 0x222233).setOrigin(0, 0.5);
    const fill = this.add.rectangle(x + 1 * RS, y, 0, barHeight - 2 * RS, 0x6fb3ff).setOrigin(0, 0.5);

    const label = addPixelText(this, 0, 0, 'Loading...', { color: 0xe8e6d8 });
    label.setPosition(Math.round((BASE_WIDTH - label.width) / 2), y - 16 * RS);

    this.load.on('progress', (value: number) => {
      fill.width = (barWidth - 2 * RS) * value;
    });

    this.load.on('complete', () => {
      frame.destroy();
      fill.destroy();
      label.destroy();
    });
  }
}
