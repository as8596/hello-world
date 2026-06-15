import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';

export interface PickupOptions {
  onCollect?: (self: Pickup) => void;
  /** Optional glint glow that fades out alongside the pickup. */
  glow?: Phaser.GameObjects.Image;
  /** Resting display scale (default 1). The glint/collect pops scale relative to it. */
  scale?: number;
}

/**
 * Pickup — a world item the scene auto-collects on proximity (same pattern as
 * HeartPickup). Bobs gently and carries an optional "glint" pulse + glow to pull
 * the eye. Used for the Waking Hollow's blade + handbell (§14a onboarding).
 */
export class Pickup extends Phaser.GameObjects.Sprite {
  private readonly onCollect?: (self: Pickup) => void;
  private readonly glow?: Phaser.GameObjects.Image;
  private readonly baseScale: number;
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, opts: PickupOptions = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    this.onCollect = opts.onCollect;
    this.glow = opts.glow;
    this.baseScale = opts.scale ?? 1;
    this.setScale(this.baseScale);
    this.setDepth(6);

    scene.tweens.add({ targets: this, y: y - 2 * RS, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.InOut' });
    // A subtle scale/alpha glint to draw attention (relative to the rest scale).
    scene.tweens.add({
      targets: this,
      scale: this.baseScale * 1.12,
      alpha: 0.85,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.InOut',
    });
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.onCollect?.(this);
    this.scene.tweens.killTweensOf(this);
    if (this.glow) {
      this.scene.tweens.killTweensOf(this.glow);
      this.scene.tweens.add({ targets: this.glow, alpha: 0, scale: 0.2, duration: 260, onComplete: () => this.glow!.destroy() });
    }
    this.scene.tweens.add({
      targets: this,
      y: this.y - 8 * RS,
      alpha: 0,
      scale: this.baseScale * 1.6,
      duration: 260,
      onComplete: () => this.destroy(),
    });
  }
}
