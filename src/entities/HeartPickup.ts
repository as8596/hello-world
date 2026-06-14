import Phaser from 'phaser';
import { TextureKeys } from '../systems/TextureFactory';

export interface HeartPickupOptions {
  onCollect?: (self: HeartPickup) => void;
}

/**
 * HeartPickup — a heart fragment lying in the world. Bobs gently; the scene
 * auto-collects it on proximity (raising max HP). A non-physics sprite;
 * proximity is a simple distance check in the scene.
 */
export class HeartPickup extends Phaser.GameObjects.Sprite {
  private readonly onCollect?: (self: HeartPickup) => void;
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: HeartPickupOptions = {}) {
    super(scene, x, y, TextureKeys.HeartFragment);
    scene.add.existing(this);
    this.onCollect = opts.onCollect;
    this.setDepth(6);

    scene.tweens.add({
      targets: this,
      y: y - 2,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.InOut',
    });
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.onCollect?.(this);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 8,
      alpha: 0,
      scale: 1.6,
      duration: 260,
      onComplete: () => this.destroy(),
    });
  }
}
