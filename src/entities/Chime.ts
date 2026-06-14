import Phaser from 'phaser';
import { eventBus } from '../systems/EventBus';
import { TextureKeys } from '../systems/TextureFactory';

export interface ChimeOptions {
  onActivate?: (self: Chime) => void;
}

/**
 * Chime — a resonance chime in the belltower. Rung by the handbell's pulse
 * (the scene activates chimes within ring radius). Once rung it glows gold and
 * stays rung; ringing all three opens the boss door (DESIGN.md §12).
 */
export class Chime extends Phaser.GameObjects.Sprite {
  private activated = false;
  private readonly onActivate?: (self: Chime) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: ChimeOptions = {}) {
    super(scene, x, y, TextureKeys.Chime);
    scene.add.existing(this);
    this.onActivate = opts.onActivate;
    this.setDepth(6);
  }

  get isActivated(): boolean {
    return this.activated;
  }

  activate(): void {
    if (this.activated) return;
    this.activated = true;
    this.setTint(0xffe066);

    // A little pop + an expanding resonance ring.
    this.scene.tweens.add({ targets: this, scaleX: 1.25, scaleY: 1.25, yoyo: true, duration: 120 });
    const ring = this.scene.add
      .circle(this.x, this.y, 14)
      .setStrokeStyle(2, 0xffe066, 0.9)
      .setFillStyle(0xffe066, 0)
      .setScale(0.2)
      .setDepth(15);
    this.scene.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    eventBus.emit('chimeRung', { x: this.x, y: this.y });
    this.onActivate?.(this);
  }
}
