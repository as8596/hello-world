import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config';
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
  }

  create(): void {
    this.scene.start(SceneKeys.World);
  }

  private drawLoadingBar(): void {
    const barWidth = Math.floor(BASE_WIDTH * 0.6);
    const barHeight = 6;
    const x = Math.floor((BASE_WIDTH - barWidth) / 2);
    const y = Math.floor(BASE_HEIGHT / 2);

    const frame = this.add.rectangle(x, y, barWidth, barHeight, 0x222233).setOrigin(0, 0.5);
    const fill = this.add.rectangle(x + 1, y, 0, barHeight - 2, 0x6fb3ff).setOrigin(0, 0.5);

    const label = addPixelText(this, 0, 0, 'Loading...', { color: 0xe8e6d8 });
    label.setPosition(Math.round((BASE_WIDTH - label.width) / 2), y - 16);

    this.load.on('progress', (value: number) => {
      fill.width = (barWidth - 2) * value;
    });

    this.load.on('complete', () => {
      frame.destroy();
      fill.destroy();
      label.destroy();
    });
  }
}
