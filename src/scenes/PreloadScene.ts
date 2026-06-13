import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config';
import { generatePlaceholderTextures } from '../systems/TextureFactory';
import { SceneKeys } from './SceneKeys';

/**
 * PreloadScene — load all assets and show a progress bar, then enter the
 * world. No real assets exist yet (placeholder art comes later), so this
 * currently just demonstrates the loading flow and transitions straight on.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    this.drawLoadingBar();

    // TODO: queue real assets here (sprites, tilesets, maps, audio, data).
    // Until then, the load completes immediately.
  }

  create(): void {
    // Build placeholder art now that the (empty) load queue is done.
    generatePlaceholderTextures(this);
    this.scene.start(SceneKeys.World);
  }

  private drawLoadingBar(): void {
    const barWidth = Math.floor(BASE_WIDTH * 0.6);
    const barHeight = 6;
    const x = Math.floor((BASE_WIDTH - barWidth) / 2);
    const y = Math.floor(BASE_HEIGHT / 2);

    const frame = this.add.rectangle(x, y, barWidth, barHeight, 0x222233).setOrigin(0, 0.5);
    const fill = this.add.rectangle(x + 1, y, 0, barHeight - 2, 0x6fb3ff).setOrigin(0, 0.5);

    this.add
      .text(BASE_WIDTH / 2, y - 14, 'Loading…', { fontFamily: 'monospace', fontSize: '8px' })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = (barWidth - 2) * value;
    });

    this.load.on('complete', () => {
      frame.destroy();
      fill.destroy();
    });
  }
}
