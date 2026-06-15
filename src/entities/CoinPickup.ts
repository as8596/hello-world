import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { TextureKeys } from '../systems/TextureFactory';

/**
 * CoinPickup — a gold coin an enemy drops into the world (DESIGN.md §19). It
 * hops to a nearby spot on spawn, then bobs/spins until the player overlaps it;
 * the scene collects it (proximity) and credits coin + XP. Collectible only
 * after it lands, so loot reads as a thing you pick up, not an instant credit.
 */
export class CoinPickup extends Phaser.GameObjects.Image {
  readonly value: number;
  collectible = false;
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y, TextureKeys.Coin);
    scene.add.existing(this);
    this.value = value;
    this.setDepth(6).setScale(0.2).setAlpha(0);

    // Hop out to a small random landing spot with an arc (up then down).
    const lx = x + Phaser.Math.Between(-12 * RS, 12 * RS);
    const ly = y + Phaser.Math.Between(0, 8 * RS);
    const apexY = Math.min(y, ly) - 12 * RS;
    scene.tweens.add({ targets: this, alpha: 1, scale: 0.75, duration: 140, ease: 'Quad.Out' });
    scene.tweens.add({ targets: this, x: lx, duration: 300, ease: 'Quad.Out' });
    scene.tweens.add({
      targets: this,
      y: apexY,
      duration: 150,
      ease: 'Quad.Out',
      onComplete: () => {
        scene.tweens.add({
          targets: this,
          y: ly,
          duration: 160,
          ease: 'Quad.In',
          onComplete: () => {
            this.collectible = true;
            this.startIdle();
          },
        });
      },
    });
  }

  /** Settle into a gentle bob + a coin-spin shimmer. */
  private startIdle(): void {
    if (this.collected) return;
    this.scene.tweens.add({ targets: this, y: this.y - 2 * RS, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.InOut' });
    this.scene.tweens.add({ targets: this, scaleX: 0.2, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut' }); // fake spin
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 10 * RS,
      alpha: 0,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
