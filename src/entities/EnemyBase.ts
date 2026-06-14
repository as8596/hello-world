import Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';
import { playerConfig } from '../data/playerConfig';
import { eventBus } from '../systems/EventBus';
import { addPixelText } from '../systems/PixelFont';
import { TextureKeys } from '../systems/TextureFactory';

type EnemyState = 'idle' | 'notice' | 'chase' | 'leash' | 'stunned' | 'dead';

export interface EnemyOptions {
  /** Called once when the enemy dies, before its fade-out (e.g. to untrack it). */
  onDeath?: (self: EnemyBase) => void;
}

/**
 * EnemyBase — the shared enemy with a perception + FSM brain (DESIGN.md §17),
 * tuned per type by an EnemyDef. The thorn-sprite is a pure contact chaser:
 * idle until it perceives the player, chase, leash home if you flee. Damage to
 * the player is resolved by the scene's overlap; this class owns movement, HP,
 * hit-flash, knockback, stun, and death.
 *
 * Driven from the scene's update: `enemy.think(playerX, playerY)`.
 */
export class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  readonly def: EnemyDef;
  private aiState: EnemyState = 'idle';
  private readonly home: { x: number; y: number };
  private hp: number;
  private knockbackUntil = 0;
  private noticeUntil = 0;
  private stunUntil = 0;
  private dying = false;
  private readonly onDeath?: (self: EnemyBase) => void;

  private stunStars?: Phaser.GameObjects.Image;
  private stunBar?: Phaser.GameObjects.Rectangle;
  private wobble?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef, opts: EnemyOptions = {}) {
    super(scene, x, y, def.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.def = def;
    this.hp = def.hp;
    this.home = { x, y };
    this.onDeath = opts.onDeath;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 10);
    body.setOffset(3, 4);
    body.setCollideWorldBounds(true);
    this.setDepth(7);
  }

  get isDead(): boolean {
    return this.dying;
  }

  /** Take melee damage from a source position (drives hit-flash + knockback). */
  takeDamage(amount: number, fromX: number, fromY: number): void {
    if (this.dying) return;
    this.hp -= amount;
    this.flash();

    const body = this.body as Phaser.Physics.Arcade.Body;
    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
    const k = playerConfig.attack.knockback;
    body.setVelocity(Math.cos(angle) * k, Math.sin(angle) * k);
    this.knockbackUntil = this.scene.time.now + 160;

    // Getting hit pulls an idle enemy into the fight.
    if (this.aiState === 'idle' || this.aiState === 'notice') this.aiState = 'chase';

    if (this.hp <= 0) this.die();
  }

  /** Handbell stun: freeze + an unmistakable wobble/stars state with a timer (§14 P0). */
  stun(ms: number): void {
    if (this.dying || this.def.stunnable === false) return;
    this.aiState = 'stunned';
    this.stunUntil = this.scene.time.now + ms;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.showStunVfx(ms);
  }

  private showStunVfx(ms: number): void {
    this.endStunVfx();

    this.stunStars = this.scene.add.image(this.x, this.y - 12, TextureKeys.StunStars).setDepth(20);
    this.scene.tweens.add({
      targets: this.stunStars,
      alpha: { from: 0.5, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });

    // A visible countdown bar that shrinks over the stun duration.
    this.stunBar = this.scene.add.rectangle(this.x, this.y - 17, 12, 1, 0xffe066).setDepth(20);
    this.scene.tweens.add({ targets: this.stunBar, scaleX: 0, duration: ms, ease: 'Linear' });

    this.wobble = this.scene.tweens.add({
      targets: this,
      angle: { from: -8, to: 8 },
      yoyo: true,
      repeat: -1,
      duration: 90,
    });
  }

  private endStunVfx(): void {
    this.wobble?.stop();
    this.wobble = undefined;
    this.setAngle(0);
    if (this.stunStars) {
      this.scene.tweens.killTweensOf(this.stunStars);
      this.stunStars.destroy();
      this.stunStars = undefined;
    }
    if (this.stunBar) {
      this.scene.tweens.killTweensOf(this.stunBar);
      this.stunBar.destroy();
      this.stunBar = undefined;
    }
  }

  /** Per-frame brain. Call from the scene with the player's position. */
  think(playerX: number, playerY: number): void {
    if (this.dying) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const now = this.scene.time.now;

    // Knockback overrides the brain, easing out.
    if (now < this.knockbackUntil) {
      body.velocity.scale(0.85);
      return;
    }

    const distHome = Phaser.Math.Distance.Between(this.x, this.y, this.home.x, this.home.y);
    const distPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    switch (this.aiState) {
      case 'idle':
        body.setVelocity(0, 0);
        if (distPlayer <= this.def.aggroRange) this.toNotice(now);
        break;

      case 'notice':
        body.setVelocity(0, 0);
        if (now >= this.noticeUntil) this.aiState = 'chase';
        break;

      case 'chase':
        if (distHome > this.def.leashRange || distPlayer > this.def.vision * 1.6) {
          this.aiState = 'leash';
          break;
        }
        this.moveToward(playerX, playerY, this.def.speed);
        break;

      case 'leash':
        if (distHome < 4) {
          body.setVelocity(0, 0);
          this.aiState = 'idle';
        } else {
          this.moveToward(this.home.x, this.home.y, this.def.speed * 0.8);
        }
        break;

      case 'stunned':
        body.setVelocity(0, 0);
        if (now >= this.stunUntil) {
          this.endStunVfx();
          this.aiState = 'chase';
        }
        break;

      case 'dead':
        break;
    }
  }

  private moveToward(tx: number, ty: number, speed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private toNotice(now: number): void {
    this.aiState = 'notice';
    this.noticeUntil = now + 220;
    // A readability cue when an enemy first spots you (§14 P1).
    const cue = addPixelText(this.scene, Math.round(this.x), Math.round(this.y - 14), '!', {
      color: 0xffe066,
    }).setOrigin(0.5, 1).setDepth(20);
    this.scene.tweens.add({
      targets: cue,
      y: cue.y - 4,
      alpha: 0,
      delay: 250,
      duration: 350,
      onComplete: () => cue.destroy(),
    });
  }

  private flash(): void {
    this.setTint(0xffffff);
    this.setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });
  }

  private die(): void {
    this.dying = true;
    this.aiState = 'dead';
    this.endStunVfx();
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.onDeath?.(this);
    eventBus.emit('enemyKilled', { id: this.def.id, x: this.x, y: this.y });
    this.spawnSpores();
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.2,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }

  /** A small spore/leaf burst so death isn't an instant pop (§14 P1). */
  private spawnSpores(): void {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const dist = 6 + Math.random() * 6;
      const spore = this.scene.add
        .rectangle(this.x, this.y, 2, 2, 0x6f9b3a)
        .setDepth(8);
      this.scene.tweens.add({
        targets: spore,
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 260,
        onComplete: () => spore.destroy(),
      });
    }
  }
}
