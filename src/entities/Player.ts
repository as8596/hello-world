import Phaser from 'phaser';
import { playerConfig } from '../data/playerConfig';
import { TextureKeys } from '../systems/TextureFactory';

type Facing = 'down' | 'up' | 'left' | 'right';

/** Move `current` toward `target` by at most `maxDelta` — framerate-safe ramp. */
function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}

/**
 * Player — 8-directional, delta-time movement with diagonal normalization and
 * a light accel/friction ramp for weight (DESIGN.md §14). Placeholder art from
 * TextureFactory; walk anims switch by facing.
 *
 * Driven from the owning scene's `update(_, deltaMs)` — call `player.update(deltaMs)`.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing = 'down';
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.Player, 'down-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const { width, height, offsetX, offsetY } = playerConfig.body;
    body.setSize(width, height);
    body.setOffset(offsetX, offsetY);
    body.setCollideWorldBounds(true);
    this.setDepth(10);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      },
      true,
    ) as Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  }

  /** Register the shared walk animations once per scene. */
  static registerAnims(scene: Phaser.Scene): void {
    const make = (key: string, frames: string[]): void => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: frames.map((frame) => ({ key: TextureKeys.Player, frame })),
        frameRate: playerConfig.walkFrameRate,
        repeat: -1,
      });
    };
    make('player-walk-down', ['down-0', 'down-1']);
    make('player-walk-side', ['side-0', 'side-1']);
    make('player-walk-up', ['up-0', 'up-1']);
  }

  /** Halt and settle on an idle frame (e.g. while a dialogue is open). */
  halt(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    const dirKey = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    this.anims.stop();
    this.setFlipX(this.facing === 'left');
    this.setFrame(`${dirKey}-0`);
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const body = this.body as Phaser.Physics.Arcade.Body;

    // --- Read input into a -1..1 vector ---------------------------------
    let ix = 0;
    let iy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) ix -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) ix += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) iy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) iy += 1;

    // Diagonal normalization so diagonals aren't faster (§14 P0).
    if (ix !== 0 && iy !== 0) {
      const inv = 1 / Math.SQRT2;
      ix *= inv;
      iy *= inv;
    }

    const { maxSpeed, acceleration, friction } = playerConfig;
    const targetVx = ix * maxSpeed;
    const targetVy = iy * maxSpeed;

    // Per-axis ramp: accelerate toward target, friction when releasing.
    const rateX = (ix !== 0 ? acceleration : friction) * dt;
    const rateY = (iy !== 0 ? acceleration : friction) * dt;
    body.setVelocity(
      approach(body.velocity.x, targetVx, rateX),
      approach(body.velocity.y, targetVy, rateY),
    );

    // --- Facing + animation ---------------------------------------------
    const moving = ix !== 0 || iy !== 0;
    if (moving) {
      if (Math.abs(ix) > Math.abs(iy)) this.facing = ix < 0 ? 'left' : 'right';
      else this.facing = iy < 0 ? 'up' : 'down';
    }

    const dirKey = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    this.setFlipX(this.facing === 'left');
    if (moving) {
      this.anims.play(`player-walk-${dirKey}`, true);
    } else {
      this.anims.stop();
      this.setFrame(`${dirKey}-0`);
    }
  }
}
