import Phaser from 'phaser';
import { playerConfig } from '../data/playerConfig';
import { eventBus } from '../systems/EventBus';
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
type AttackState = 'ready' | 'windup' | 'active' | 'recover';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing = 'down';
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;

  private attackState: AttackState = 'ready';
  private bufferedAttackAt = -Infinity;
  private readonly hitTargets = new Set<unknown>();

  /** Health, tracked in half-hearts (maxHearts * 2). */
  private readonly maxHp = playerConfig.maxHearts * 2;
  private hp = playerConfig.maxHearts * 2;
  private invulnUntil = 0;
  private controlLockUntil = 0;
  private dead = false;

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

  // --- Health -------------------------------------------------------------

  get heartsHp(): number {
    return this.hp;
  }

  get heartsMax(): number {
    return this.maxHp;
  }

  get isDead(): boolean {
    return this.dead;
  }

  get invulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil;
  }

  /** Broadcast current health (e.g. to refresh the HUD on spawn). */
  emitHealth(): void {
    eventBus.emit('playerHealth', { hp: this.hp, max: this.maxHp });
  }

  /**
   * Take `amount` half-hearts of damage from a source position. No-op while
   * invulnerable or dead. Applies i-frames, knockback, a hurt blink, and emits
   * `playerHealth` / `playerDied`. Returns true if the hit landed.
   */
  takeHit(amount: number, fromX: number, fromY: number): boolean {
    if (this.dead || this.invulnerable) return false;
    const now = this.scene.time.now;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = now + playerConfig.invulnMs;
    this.controlLockUntil = now + playerConfig.hurtLockMs;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
    body.setVelocity(
      Math.cos(angle) * playerConfig.hurtKnockback,
      Math.sin(angle) * playerConfig.hurtKnockback,
    );

    this.blink();
    eventBus.emit('playerHealth', { hp: this.hp, max: this.maxHp });
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      eventBus.emit('playerDied', undefined);
    }
    return true;
  }

  private blink(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      yoyo: true,
      repeat: Math.floor(playerConfig.invulnMs / 120),
      duration: 120,
      onComplete: () => this.setAlpha(1),
    });
  }

  // --- Attack -------------------------------------------------------------

  /** True only while the hitbox is live. */
  get isAttacking(): boolean {
    return this.attackState === 'active';
  }

  /**
   * Request a swing. Fires immediately if ready; otherwise the press is
   * buffered so it can fire the instant the current swing ends (§14 P0).
   */
  queueAttack(now: number): void {
    if (this.attackState === 'ready') this.startSwing();
    else this.bufferedAttackAt = now;
  }

  /** The world-space hitbox rectangle while active, else null. */
  getHitRect(): Phaser.Geom.Rectangle | null {
    if (this.attackState !== 'active') return null;
    const a = playerConfig.attack;
    const o = this.facingOffset();
    const cx = this.x + o.x * a.reach;
    const cy = this.y + o.y * a.reach;
    return new Phaser.Geom.Rectangle(cx - a.hitboxW / 2, cy - a.hitboxH / 2, a.hitboxW, a.hitboxH);
  }

  /** Returns true the first time a given target is hit within the current swing. */
  registerHit(target: unknown): boolean {
    if (this.hitTargets.has(target)) return false;
    this.hitTargets.add(target);
    return true;
  }

  private startSwing(): void {
    const a = playerConfig.attack;
    this.attackState = 'windup';
    this.hitTargets.clear();

    this.scene.time.delayedCall(a.windupMs, () => {
      if (!this.active) return;
      this.attackState = 'active';
      this.showSlash();

      this.scene.time.delayedCall(a.activeMs, () => {
        if (!this.active) return;
        this.attackState = 'recover';

        this.scene.time.delayedCall(a.recoverMs, () => {
          if (!this.active) return;
          this.attackState = 'ready';
          // Consume a buffered press that landed during the swing.
          if (this.scene.time.now - this.bufferedAttackAt <= a.bufferMs) {
            this.bufferedAttackAt = -Infinity;
            this.startSwing();
          }
        });
      });
    });
  }

  private facingOffset(): { x: number; y: number } {
    switch (this.facing) {
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      case 'up':
        return { x: 0, y: -1 };
      default:
        return { x: 0, y: 1 };
    }
  }

  private showSlash(): void {
    const a = playerConfig.attack;
    const o = this.facingOffset();
    const angle = this.facing === 'right' ? 0 : this.facing === 'down' ? 90 : this.facing === 'left' ? 180 : 270;
    const slash = this.scene.add
      .image(this.x + o.x * a.reach, this.y + o.y * a.reach, TextureKeys.Slash)
      .setDepth(11)
      .setAngle(angle)
      .setAlpha(0.95);
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: a.activeMs + 50,
      onComplete: () => slash.destroy(),
    });
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

    // While knockback-locked (just hurt), ignore input so the fling reads;
    // friction then eases the player to a stop.
    if (this.scene.time.now < this.controlLockUntil) {
      ix = 0;
      iy = 0;
    }

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
