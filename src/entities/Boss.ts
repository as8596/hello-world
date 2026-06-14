import Phaser from 'phaser';
import type { BossConfig } from '../data/bossConfig';
import { RENDER_SCALE as RS } from '../data/render';
import { eventBus } from '../systems/EventBus';
import { TextureKeys } from '../systems/TextureFactory';

type BossState =
  | 'intro'
  | 'idle'
  | 'swipeWindup'
  | 'swipe'
  | 'slamWindup'
  | 'slam'
  | 'vent'
  | 'stunned'
  | 'dying';

export interface BossOptions {
  /** Deal damage to the player from a source position. */
  onPlayerHit: (damage: number, fromX: number, fromY: number) => void;
  /** Request a thorn-sprite add at a position (the scene enforces the cap). */
  onRequestAdd: (x: number, y: number) => void;
  /** Called once when defeated. */
  onDefeated: () => void;
}

/**
 * Bramblewerth, the Thornwarden (DESIGN.md §12). A rooted, armored boss: the
 * sword only bites while it's bell-stunned. It cycles attacks (telegraphed
 * vine-swipe; phase-2 ground-slam) and periodically *vents* — the cue to ring
 * the handbell, which stuns it open for the strike. Driven by `think()`.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly def: BossConfig;
  private hp: number;
  private phase: 1 | 2 = 1;
  private fsm: BossState = 'intro';
  private fsmEndsAt = 0;
  private nextActionAt = 0;
  private actionCount = 0;
  private ventAura?: Phaser.GameObjects.Arc;
  private stunStars?: Phaser.GameObjects.Image;
  private readonly opts: BossOptions;

  constructor(scene: Phaser.Scene, x: number, y: number, def: BossConfig, opts: BossOptions) {
    super(scene, x, y, def.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.def = def;
    this.hp = def.maxHp;
    this.opts = opts;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(22 * RS, 18 * RS);
    body.setOffset(5 * RS, 10 * RS);
    body.setImmovable(true); // rooted at the shrine
    this.setDepth(9);

    // Brief intro beat before it acts.
    this.fsmEndsAt = scene.time.now + 900;
  }

  // --- Queries ------------------------------------------------------------

  get isVulnerable(): boolean {
    return this.fsm === 'stunned';
  }

  get isDying(): boolean {
    return this.fsm === 'dying';
  }

  get hpRatio(): number {
    return Math.max(0, this.hp) / this.def.maxHp;
  }

  // --- Damage & stun ------------------------------------------------------

  /** Sword damage — only lands while stunned; otherwise it clangs off the armor. */
  takeDamage(amount: number, fromX: number, _fromY: number): void {
    if (this.fsm === 'dying') return;
    if (!this.isVulnerable) {
      this.clang();
      return;
    }
    this.hp -= amount;
    this.flashWhite();
    // Heavy: a small recoil shake rather than real knockback.
    const dir = this.x >= fromX ? 1 : -1;
    this.scene.tweens.add({ targets: this, x: this.x + dir * 2 * RS, yoyo: true, duration: 50 });

    if (this.phase === 1 && this.hp <= this.def.maxHp * this.def.phase2At) this.enterPhase2();
    if (this.hp <= 0) this.die();
  }

  /** The handbell pulse. Only stuns while venting (the open window). */
  onBellRung(): void {
    if (this.fsm === 'vent') this.enterStunned();
  }

  // --- Brain --------------------------------------------------------------

  think(playerX: number, playerY: number): void {
    if (this.fsm === 'dying') return;
    const now = this.scene.time.now;
    this.setFlipX(playerX < this.x);

    switch (this.fsm) {
      case 'intro':
        if (now >= this.fsmEndsAt) this.enterIdle(now);
        break;

      case 'idle':
        if (now >= this.nextActionAt) this.chooseAction(now, playerX, playerY);
        break;

      case 'swipeWindup':
        if (now >= this.fsmEndsAt) this.fireSwipe(playerX, playerY);
        break;

      case 'slamWindup':
        if (now >= this.fsmEndsAt) this.fireSlam(playerX, playerY);
        break;

      case 'swipe':
      case 'slam':
        if (now >= this.fsmEndsAt) this.enterIdle(now);
        break;

      case 'vent':
        if (now >= this.fsmEndsAt) {
          this.clearVent();
          this.enterIdle(now);
        }
        break;

      case 'stunned':
        if (now >= this.fsmEndsAt) {
          this.clearStun();
          this.enterIdle(now);
        }
        break;
    }
  }

  private mul(): number {
    return this.phase === 2 ? this.def.phase2SpeedMul : 1;
  }

  private enterIdle(now: number): void {
    this.fsm = 'idle';
    this.nextActionAt = now + this.def.idleMs * this.mul();
  }

  private chooseAction(now: number, px: number, py: number): void {
    this.actionCount++;
    if (this.actionCount % 2 === 0) {
      this.opts.onRequestAdd(this.x + Phaser.Math.Between(-12 * RS, 12 * RS), this.y + 14 * RS);
    }
    if (this.actionCount % this.def.ventEvery === 0) {
      this.enterVent(now);
    } else if (this.phase === 2 && Math.random() < 0.45) {
      this.enterSlamWindup(now);
    } else {
      this.enterSwipeWindup(now, px, py);
    }
  }

  // --- Vent / stun --------------------------------------------------------

  private enterVent(now: number): void {
    this.fsm = 'vent';
    this.fsmEndsAt = now + this.def.ventMs;
    // Telegraph: a pulsing green aura + drifting fog wisps + a cue.
    this.ventAura = this.scene.add
      .circle(this.x, this.y, 20 * RS, 0x9fe06a, 0.18)
      .setDepth(8);
    this.scene.tweens.add({ targets: this.ventAura, scale: 1.4, alpha: 0.05, yoyo: true, repeat: -1, duration: 360 });
    for (let i = 0; i < 5; i++) {
      const wisp = this.scene.add
        .image(this.x + Phaser.Math.Between(-10 * RS, 10 * RS), this.y, TextureKeys.Fog)
        .setDepth(10)
        .setScale(0.7);
      this.scene.tweens.add({
        targets: wisp,
        y: wisp.y - 16 * RS,
        alpha: 0,
        duration: this.def.ventMs,
        delay: i * 80,
        onComplete: () => wisp.destroy(),
      });
    }
    this.flashWhite();
  }

  private clearVent(): void {
    if (this.ventAura) {
      this.scene.tweens.killTweensOf(this.ventAura);
      this.ventAura.destroy();
      this.ventAura = undefined;
    }
  }

  private enterStunned(): void {
    this.clearVent();
    this.fsm = 'stunned';
    this.fsmEndsAt = this.scene.time.now + this.def.stunMs;
    this.stunStars = this.scene.add.image(this.x, this.y - 20 * RS, TextureKeys.StunStars).setDepth(20);
    this.scene.tweens.add({ targets: this.stunStars, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 200 });
    this.scene.tweens.add({ targets: this, angle: { from: -5, to: 5 }, yoyo: true, repeat: -1, duration: 110 });
  }

  private clearStun(): void {
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
    if (this.stunStars) {
      this.scene.tweens.killTweensOf(this.stunStars);
      this.stunStars.destroy();
      this.stunStars = undefined;
    }
  }

  // --- Swipe --------------------------------------------------------------

  private enterSwipeWindup(now: number, px: number, py: number): void {
    this.fsm = 'swipeWindup';
    this.fsmEndsAt = now + this.def.swipe.windupMs * this.mul();
    // Telegraph: lean toward the player and flash red.
    this.setTint(0xff6b5a);
    this.scene.tweens.add({ targets: this, scaleX: 1.12, scaleY: 0.9, yoyo: true, duration: this.def.swipe.windupMs * this.mul() });
    void px;
    void py;
  }

  private fireSwipe(px: number, py: number): void {
    this.applyBaseTint();
    this.fsm = 'swipe';
    this.fsmEndsAt = this.scene.time.now + this.def.swipe.activeMs;

    const dir = this.flipX ? -1 : 1;
    const slash = this.scene.add
      .image(this.x + dir * 18 * RS, this.y, TextureKeys.Slash)
      .setScale(2.2)
      .setAngle(this.flipX ? 180 : 0)
      .setDepth(11)
      .setAlpha(0.95);
    this.scene.tweens.add({ targets: slash, alpha: 0, scale: 2.8, duration: 200, onComplete: () => slash.destroy() });

    if (Phaser.Math.Distance.Between(this.x, this.y, px, py) <= this.def.swipe.range) {
      this.opts.onPlayerHit(this.def.swipe.damage, this.x, this.y);
    }
  }

  // --- Slam (phase 2) -----------------------------------------------------

  private enterSlamWindup(now: number): void {
    this.fsm = 'slamWindup';
    this.fsmEndsAt = now + this.def.slam.windupMs * this.mul();
    // Telegraph: a growing ring outline showing the danger radius.
    const tell = this.scene.add
      .circle(this.x, this.y, this.def.slam.radius)
      .setStrokeStyle(1 * RS, 0xff6b5a, 0.8)
      .setFillStyle(0xff6b5a, 0.05)
      .setScale(0.2)
      .setDepth(8);
    this.scene.tweens.add({ targets: tell, scale: 1, duration: this.def.slam.windupMs * this.mul(), onComplete: () => tell.destroy() });
  }

  private fireSlam(px: number, py: number): void {
    this.fsm = 'slam';
    this.fsmEndsAt = this.scene.time.now + this.def.slam.activeMs;
    this.scene.cameras.main.shake(180, 0.006);

    const ring = this.scene.add
      .circle(this.x, this.y, this.def.slam.radius, 0xff8a5a, 0.18)
      .setScale(0.2)
      .setDepth(8);
    this.scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 240, onComplete: () => ring.destroy() });

    if (Phaser.Math.Distance.Between(this.x, this.y, px, py) <= this.def.slam.radius) {
      this.opts.onPlayerHit(this.def.slam.damage, this.x, this.y);
    }
  }

  // --- Phases & death -----------------------------------------------------

  private enterPhase2(): void {
    this.phase = 2;
    this.applyBaseTint();
    eventBus.emit('bossPhase', { id: this.def.id, phase: 2 });
  }

  private applyBaseTint(): void {
    if (this.phase === 2) this.setTint(0xff9d8a);
    else this.clearTint();
  }

  private flashWhite(): void {
    this.setTint(0xffffff);
    this.setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(80, () => {
      if (this.active) {
        this.setTintMode(Phaser.TintModes.MULTIPLY);
        this.applyBaseTint();
      }
    });
  }

  private clang(): void {
    // Armored: a metallic blue spark, no damage.
    const spark = this.scene.add.circle(this.x, this.y - 4 * RS, 3 * RS, 0xbfe3ff, 0.9).setDepth(20);
    this.scene.tweens.add({ targets: spark, scale: 2, alpha: 0, duration: 160, onComplete: () => spark.destroy() });
  }

  private die(): void {
    this.clearVent();
    this.clearStun();
    this.fsm = 'dying';
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    eventBus.emit('bossDefeated', { id: this.def.id });
    this.opts.onDefeated();
    // Sever the corruption: shrink into a small, dormant bramble (it stays).
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
    this.setTintMode(Phaser.TintModes.MULTIPLY);
    this.scene.tweens.add({
      targets: this,
      scale: 0.5,
      alpha: 0.85,
      duration: 700,
      ease: 'Cubic.Out',
      onComplete: () => this.setTint(0x4a5e3a),
    });
  }
}
