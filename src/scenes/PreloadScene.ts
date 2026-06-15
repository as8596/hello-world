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
    // Maple's 8-direction walk animation (sheets generated from GIFs).
    this.loadDirAnimSet('maple-walk', 'assets/sprites/maple/walk');

    // Optional real terrain tileset — composited over the walkable placeholder
    // tiles once loaded (tree-walls + vines stay procedural).
    this.load.image('terrain', 'assets/tilesets/terrain.png');

    // Optional real cobblestone sheet — composited into the cobble tile slots.
    this.load.image('stone', 'assets/tilesets/stone.png');

    // A standalone tree world-object, placed via 'tree' map objects (optional —
    // a missing file just means those objects render nothing).
    this.load.image('tree', 'assets/tree.png');

    // Detailed front-facing village buildings (house / tavern / alchemy shop).
    // Optional — the procedural house art is the fallback (see BUILDINGS).
    for (const b of ['house', 'tavern', 'alchemy']) this.load.image(`building-${b}`, `assets/sprites/buildings/${b}.png`);

    // Character portraits (full art); a head-and-shoulders bust is baked from each
    // for the dialogue box in create(). Optional — no portrait just hides the panel.
    this.load.image('portrait-maple-full', 'assets/sprites/portraits/maple.png');

    // Bush foliage world-objects (green / dead / thorny / berry), placed in clusters.
    this.load.image('bush-green', 'assets/sprites/bushes/green.png');
    this.load.image('bush-dead', 'assets/sprites/bushes/dead.png');
    this.load.image('bush-thorny', 'assets/sprites/bushes/thorny.png');
    this.load.image('bush-berry', 'assets/sprites/bushes/berry.png');

    // Rock set-dressing + cairn/shrine/well point-of-interest props (64px each).
    for (const r of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'cluster', 'mossy', 'large', 'cairn', 'shrine', 'well', 'arch']) {
      this.load.image(`rock-${r}`, `assets/sprites/rocks/${r}.png`);
    }

    // Carved stone shrines: four small 64px standing-stones/altars for markers,
    // and four tall 128px hero shrines (statue / tomb / forge / standing stone)
    // used as depth-sorted point-of-interest props.
    for (const s of ['1', '2', '3', '4']) this.load.image(`shrine-small-${s}`, `assets/sprites/shrines/small-${s}.png`);
    for (const s of ['statue', 'tomb', 'forge', 'stone']) this.load.image(`shrine-hero-${s}`, `assets/sprites/shrines/hero-${s}.png`);

    // Animated placeholder fire (roaring flames) for the hearth — a 64px strip.
    this.load.spritesheet('fire', 'assets/sprites/fire.png', { frameWidth: 64, frameHeight: 64 });

    // Optional real item art (blade + handbell pickups); falls back to the
    // procedural placeholder if missing.
    this.load.image('item-blade', 'assets/sprites/items/blade.png');
    this.load.image('item-handbell', 'assets/sprites/items/handbell.png');
    this.load.image('item-berry', 'assets/sprites/items/berry.png');

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

  /**
   * Load an 8-direction animation set from a folder with a manifest (e.g. Maple's
   * walk): queues `<animKey>-<dir>` spritesheets. Registered as anims in create().
   */
  private loadDirAnimSet(animKey: string, basePath: string): void {
    const key = `${animKey}-manifest`;
    this.load.json(key, `${basePath}/manifest.json`);
    this.load.once(`filecomplete-json-${key}`, (_k: string, _t: string, data: unknown) => {
      const m = data as { frameWidth: number; frameHeight: number; dirs?: string[] } | undefined;
      if (!m || !Array.isArray(m.dirs)) return;
      for (const dir of m.dirs) {
        this.load.spritesheet(`${animKey}-${dir}`, `${basePath}/${dir}.png`, {
          frameWidth: m.frameWidth,
          frameHeight: m.frameHeight,
        });
      }
    });
  }

  /** Register a looping anim per direction for an animation set, if loaded. */
  private registerDirAnims(animKey: string): void {
    const m = this.cache.json.get(`${animKey}-manifest`) as { dirs?: string[] } | undefined;
    if (!m || !Array.isArray(m.dirs)) return;
    for (const dir of m.dirs) {
      const tk = `${animKey}-${dir}`;
      if (this.textures.exists(tk) && !this.anims.exists(tk)) {
        this.anims.create({ key: tk, frames: this.anims.generateFrameNumbers(tk, {}), frameRate: 10, repeat: -1 });
      }
    }
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
    this.registerDirAnims('maple-walk');
    // Bake a head-and-shoulders bust from each full portrait for the dialogue box.
    this.bakePortrait('portrait-maple-full', 'portrait-maple', 221, 28, 224);
    this.scene.start(SceneKeys.World);
  }

  /**
   * Crop a square bust out of a full-body portrait into its own texture, so the
   * dialogue box can show a clean head-and-shoulders frame. No-op if the source
   * is missing (the box just renders without a portrait).
   */
  private bakePortrait(srcKey: string, destKey: string, sx: number, sy: number, side: number): void {
    if (!this.textures.exists(srcKey) || this.textures.exists(destKey)) return;
    const src = this.textures.get(srcKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const tex = this.textures.createCanvas(destKey, side, side);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, sx, sy, side, side, 0, 0, side, side);
    tex.refresh();
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
