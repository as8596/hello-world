import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config';
import { RENDER_SCALE as RS } from '../data/render';
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

    // Optional real player art (8 rotations). Missing files are tolerated —
    // the Player falls back to the generated placeholder.
    this.load.setPath('assets/sprites');
    for (const d of PLAYER_SPRITE_DIRS) this.load.image(`player-${d.key}`, d.file);

    // Optional running-animation sheets (generated from GIFs by `npm run
    // sprites`). The frame size lives in the manifest, so load that first and
    // queue the sheets when it arrives — Phaser processes loads added mid-run.
    this.load.json('player-run-manifest', 'player-run.json');
    this.load.once(
      'filecomplete-json-player-run-manifest',
      (_key: string, _type: string, data: unknown) => {
        const m = data as { frameWidth: number; frameHeight: number; dirs?: string[] } | undefined;
        if (!m || !Array.isArray(m.dirs)) return;
        for (const dir of m.dirs) {
          this.load.spritesheet(`player-run-${dir}`, `player-run-${dir}.png`, {
            frameWidth: m.frameWidth,
            frameHeight: m.frameHeight,
          });
        }
      },
    );

    // A missing optional asset must not fail the boot.
    this.load.on('loaderror', () => undefined);
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
