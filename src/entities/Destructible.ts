import Phaser from 'phaser';
import { eventBus } from '../systems/EventBus';
import { TextureKeys } from '../systems/TextureFactory';

export interface DestructibleOptions {
  /** Hits to destroy (default 1). */
  hp?: number;
  /** Grouping tag carried through to events (e.g. 'gate' vs 'pocket'). */
  group?: string;
  /** Called once when destroyed, before the fade-out (e.g. to untrack it). */
  onCut?: (self: Destructible) => void;
}

/**
 * Destructible — a static, blocking world object (a vine) that can be cut.
 * For now an interact press calls `hit()`; in the combat step the sword hitbox
 * will call the same method. Emits `vineCut` on the EventBus when destroyed.
 */
export class Destructible extends Phaser.Physics.Arcade.Sprite {
  readonly group?: string;
  private hp: number;
  private readonly onCut?: (self: Destructible) => void;
  private dying = false;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: DestructibleOptions = {}) {
    super(scene, x, y, TextureKeys.Vine);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body — blocks the player
    this.hp = opts.hp ?? 1;
    this.group = opts.group;
    this.onCut = opts.onCut;
    this.setDepth(6);
  }

  /** Apply damage; cuts the vine when depleted. Returns true if it died. */
  hit(damage = 1): boolean {
    if (this.dying) return false;
    this.hp -= damage;
    this.scene.tweens.add({ targets: this, alpha: 0.55, yoyo: true, duration: 60 });
    if (this.hp <= 0) {
      this.cut();
      return true;
    }
    return false;
  }

  private cut(): void {
    this.dying = true;
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false; // stop blocking immediately
    this.onCut?.(this);
    eventBus.emit('vineCut', { x: this.x, y: this.y, group: this.group });
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      angle: 25,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }
}
