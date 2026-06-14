import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config';
import { RENDER_SCALE as RS } from '../data/render';
import { SPRITE_DIRS } from '../data/spriteDirections';
import { PLAYER_SPRITE_DIRS } from '../entities/Player';
import { addPixelText, createPixelFont } from '../systems/PixelFont';
import { generatePlaceholderTextures } from '../systems/TextureFactory';
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
