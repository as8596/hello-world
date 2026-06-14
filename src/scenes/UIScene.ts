import Phaser from 'phaser';
import { playerConfig } from '../data/playerConfig';
import { eventBus } from '../systems/EventBus';
import { TextureKeys } from '../systems/TextureFactory';
import { SceneKeys } from './SceneKeys';

/**
 * UIScene — the HUD overlay (DESIGN.md §13 step 9). Runs in parallel above the
 * World so it's independent of the world camera. For now it's the hearts row;
 * the pinned quest objective and other HUD bits land here later. Driven purely
 * by `playerHealth` events off the EventBus.
 */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private currentMax = -1;

  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    this.hearts = [];
    this.currentMax = -1;
    const full = playerConfig.maxHearts * 2;
    this.render(full, full); // assume full health on spawn until told otherwise

    const off = eventBus.on('playerHealth', (p) => {
      const { hp, max } = p as { hp: number; max: number };
      this.render(hp, max);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }

  private render(hp: number, max: number): void {
    if (max !== this.currentMax) this.buildHearts(max);
    for (let i = 0; i < this.hearts.length; i++) {
      const v = Phaser.Math.Clamp(hp - i * 2, 0, 2);
      this.hearts[i].setFrame(v >= 2 ? 'full' : v === 1 ? 'half' : 'empty');
    }
  }

  private buildHearts(max: number): void {
    for (const h of this.hearts) h.destroy();
    this.hearts = [];
    this.currentMax = max;
    const count = max / 2;
    for (let i = 0; i < count; i++) {
      this.hearts.push(
        this.add.image(5 + i * 8, 5, TextureKeys.Hearts, 'full').setOrigin(0, 0),
      );
    }
  }
}
