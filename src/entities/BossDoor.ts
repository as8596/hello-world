import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { eventBus } from '../systems/EventBus';
import { TextureKeys } from '../systems/TextureFactory';

export interface BossDoorOptions {
  onOpen?: (self: BossDoor) => void;
}

/**
 * BossDoor — a blocking shrine door. Opens (slides up and fades) once all the
 * resonance chimes are rung, revealing the boss room (DESIGN.md §12). A door
 * may span several tiles; each tile is one BossDoor that opens together.
 */
export class BossDoor extends Phaser.Physics.Arcade.Sprite {
  private opened = false;
  private readonly onOpen?: (self: BossDoor) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: BossDoorOptions = {}) {
    super(scene, x, y, TextureKeys.BossDoor);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static, blocks the player
    this.onOpen = opts.onOpen;
    this.setDepth(8);
  }

  get isOpen(): boolean {
    return this.opened;
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.onOpen?.(this);
    eventBus.emit('bossDoorOpened', { x: this.x, y: this.y });
    this.scene.tweens.add({
      targets: this,
      y: this.y - 8 * RS,
      alpha: 0,
      duration: 480,
      ease: 'Cubic.In',
      onComplete: () => this.destroy(),
    });
  }
}
