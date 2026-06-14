import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { eventBus } from '../systems/EventBus';
import { TextureKeys } from '../systems/TextureFactory';

export interface FogOptions {
  group?: string;
  /** Called once when dispelled, before the fade-out. */
  onDispel?: (self: FogPatch) => void;
}

/**
 * FogPatch — a blocking tile of Hush-fog. The handbell dispels it: it recedes
 * (drifts up and fades) rather than popping (§14 P0). A gentle idle drift keeps
 * it feeling alive while it stands.
 */
export class FogPatch extends Phaser.Physics.Arcade.Sprite {
  readonly group?: string;
  private readonly onDispel?: (self: FogPatch) => void;
  private dispelled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: FogOptions = {}) {
    super(scene, x, y, TextureKeys.Fog);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static, blocks the player
    this.group = opts.group;
    this.onDispel = opts.onDispel;
    this.setDepth(9);
    this.setAlpha(0.85);

    // Subtle breathing so the fog reads as alive.
    scene.tweens.add({
      targets: this,
      alpha: 0.65,
      yoyo: true,
      repeat: -1,
      duration: 1400 + Math.random() * 600,
    });
  }

  dispel(): void {
    if (this.dispelled) return;
    this.dispelled = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.onDispel?.(this);
    eventBus.emit('fogDispelled', { x: this.x, y: this.y, group: this.group });

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 6 * RS,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 420,
      onComplete: () => this.destroy(),
    });
  }
}
