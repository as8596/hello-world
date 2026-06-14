import Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';
import { playerConfig } from '../data/playerConfig';
import { RENDER_SCALE as RS } from '../data/render';
import { dir8FromVector, type SpriteDir, SPRITE_DIRS } from '../data/spriteDirections';
import { eventBus } from '../systems/EventBus';
import { addPixelText } from '../systems/PixelFont';
import { TextureKeys } from '../systems/TextureFactory';

/** True when every 8-direction texture for this def's directional art is loaded. */
function hasDirectionalArt(scene: Phaser.Scene, def: EnemyDef): boolean {
  if (!def.directional) return false;
  return SPRITE_DIRS.every((d) => scene.textures.exists(`${def.directional!.keyPrefix}-${d}`));
}

type EnemyState = 'idle' | 'notice' | 'chase' | 'windup' | 'attack' | 'recover' | 'leash' | 'stunned' | 'dead';

export interface EnemyOptions {
  /** Called once when the enemy dies, before its fade-out (e.g. to untrack it). */
  onDeath?: (self: EnemyBase) => void;
  /** Called when a telegraphed attack connects (the scene applies it to the player). */
  onPlayerHit?: (amount: number, fromX: number, fromY: number) => void;
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
  private readonly onPlayerHit?: (amount: number, fromX: number, fromY: number) => void;

  // Telegraphed-attack (windup → active → recover) state.
  private attackPhaseUntil = 0;
  private attackReadyAt = 0;
  private attackHitDone = false;
  private readonly attackTarget = { x: 0, y: 0 };
  private telegraph?: Phaser.GameObjects.Arc;

  private stunStars?: Phaser.GameObjects.Image;
  private stunBar?: Phaser.GameObjects.Rectangle;
  private wobble?: Phaser.Tweens.Tween;

  /** Using real 8-direction art (faces its heading) vs the placeholder. */
  private readonly useDir: boolean;
  private renderedDir?: SpriteDir;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef, opts: EnemyOptions = {}) {
    const useDir = hasDirectionalArt(scene, def);
    super(scene, x, y, useDir ? `${def.directional!.keyPrefix}-south` : def.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.def = def;
    this.useDir = useDir;
    this.hp = def.hp;
    this.home = { x, y };
    this.onDeath = opts.onDeath;
    this.onPlayerHit = opts.onPlayerHit;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (useDir) {
      const dc = def.directional!;
      // Smooth the downscaled art so it doesn't shimmer as it moves.
      for (const d of SPRITE_DIRS) {
        scene.textures.get(`${dc.keyPrefix}-${d}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
      this.setScale(dc.displayScale);
      // Body in world px; source size compensates for the display scale, centered
      // (origin stays at the sprite center so the VFX offsets are unchanged).
      const bw = dc.bodyWidth / dc.displayScale;
      const bh = dc.bodyHeight / dc.displayScale;
      body.setSize(bw, bh);
      body.setOffset(this.width * 0.5 - bw / 2, this.height * 0.5 - bh / 2);
    } else {
      body.setSize(10 * RS, 10 * RS);
      body.setOffset(3 * RS, 4 * RS);
    }
    body.setCollideWorldBounds(true);
    this.setDepth(7);
  }

  /** Face the way we're moving (8-direction art only); keep facing when still. */
  private renderFacing(): void {
    if (!this.useDir) return;
    const v = (this.body as Phaser.Physics.Arcade.Body).velocity;
    if (v.x === 0 && v.y === 0) return;
    const dir = dir8FromVector(v.x, v.y);
    if (dir === this.renderedDir) return;
    this.renderedDir = dir;
    this.setTexture(`${this.def.directional!.keyPrefix}-${dir}`);
  }

  get isDead(): boolean {
    return this.dying;
  }

  /** True while bell-stunned (the only window an armored foe can be hurt). */
  get isStunned(): boolean {
    return this.aiState === 'stunned';
  }

  /**
   * Take melee damage from a source position. Armored foes (§9.1) shrug it off
   * unless bell-stunned — a "clink" + spark teaches "this doesn't work" without
   * text. Returns true if the hit actually landed (so the caller gates hit-stop).
   */
  takeDamage(amount: number, fromX: number, fromY: number): boolean {
    if (this.dying) return false;

    if (this.def.armored && !this.isStunned) {
      this.clink();
      // Getting clinked still wakes an idle armored foe.
      if (this.aiState === 'idle' || this.aiState === 'notice') this.aiState = 'chase';
      return false;
    }

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
    return true;
  }

  /** Armored "no" feedback: a cool spark + brief steel tint, no flinch, no damage. */
  private clink(): void {
    this.setTint(0xbfe3ff);
    this.setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });
    const spark = this.scene.add.circle(this.x, this.y - 4 * RS, 3 * RS, 0xdff2ff, 0.95).setDepth(20);
    this.scene.tweens.add({ targets: spark, scale: 2.2, alpha: 0, duration: 170, onComplete: () => spark.destroy() });
  }

  /** Handbell stun: freeze + an unmistakable wobble/stars state with a timer (§14 P0). */
  stun(ms: number): void {
    if (this.dying || this.def.stunnable === false) return;
    this.clearTelegraph(); // cancel any wind-up in progress
    this.aiState = 'stunned';
    this.stunUntil = this.scene.time.now + ms;
    this.attackReadyAt = this.scene.time.now + ms;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.showStunVfx(ms);
  }

  private showStunVfx(ms: number): void {
    this.endStunVfx();

    this.stunStars = this.scene.add.image(this.x, this.y - 12 * RS, TextureKeys.StunStars).setDepth(20);
    this.scene.tweens.add({
      targets: this.stunStars,
      alpha: { from: 0.5, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });

    // A visible countdown bar that shrinks over the stun duration.
    this.stunBar = this.scene.add.rectangle(this.x, this.y - 17 * RS, 12 * RS, 1 * RS, 0xffe066).setDepth(20);
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
        // In range + off cooldown? Telegraph an attack instead of touching.
        if (this.def.attack && now >= this.attackReadyAt && distPlayer <= this.def.attack.range) {
          this.enterWindup(now, playerX, playerY);
          break;
        }
        this.moveToward(playerX, playerY, this.def.speed);
        break;

      case 'windup':
        body.setVelocity(0, 0);
        if (now >= this.attackPhaseUntil) this.enterAttack(now);
        break;

      case 'attack':
        this.runActiveAttack(now, distPlayer);
        break;

      case 'recover':
        body.setVelocity(0, 0);
        if (now >= this.attackPhaseUntil) this.aiState = 'chase';
        break;

      case 'leash':
        if (distHome < 4 * RS) {
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

    this.renderFacing();
  }

  /** Begin a telegraphed attack: stop, color/scale up, draw a ground danger ring. */
  private enterWindup(now: number, px: number, py: number): void {
    const a = this.def.attack!;
    this.aiState = 'windup';
    this.attackPhaseUntil = now + a.windupMs;
    this.attackHitDone = false;
    this.attackTarget.x = px;
    this.attackTarget.y = py;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Colorblind-safe telegraph: color shift + scale-breathe + a filling ground ring.
    this.setTint(0xff7a4a);
    this.scene.tweens.add({ targets: this, scale: this.scale * 1.12, yoyo: true, repeat: -1, duration: 120 });
    this.telegraph = this.scene.add
      .circle(this.x, this.y, a.range, 0xff6b5a, 0.12)
      .setStrokeStyle(2 * RS, 0xff6b5a, 0.7)
      .setDepth(6)
      .setScale(0.2);
    this.scene.tweens.add({ targets: this.telegraph, scale: 1, duration: a.windupMs, ease: 'Quad.easeOut' });
  }

  /** Fire the attack: clear the telegraph, punch the scale, lunge if applicable. */
  private enterAttack(now: number): void {
    const a = this.def.attack!;
    this.clearTelegraph();
    this.aiState = 'attack';
    this.attackPhaseUntil = now + a.activeMs;
    this.attackReadyAt = now + a.activeMs + a.recoverMs;
    this.scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.15, scaleY: this.scaleY * 0.85, yoyo: true, duration: a.activeMs });
    if (a.type === 'lunge' || a.type === 'charge') {
      const angle = Math.atan2(this.attackTarget.y - this.y, this.attackTarget.x - this.x);
      const speed = this.def.speed * (a.type === 'charge' ? 3 : 2);
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  private runActiveAttack(now: number, distPlayer: number): void {
    const a = this.def.attack!;
    if (!this.attackHitDone && distPlayer <= a.range && this.onPlayerHit) {
      this.attackHitDone = true;
      this.onPlayerHit(a.damage, this.x, this.y);
    }
    if (a.type === 'overhead') (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    if (now >= this.attackPhaseUntil) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.aiState = 'recover';
      this.attackPhaseUntil = now + a.recoverMs;
    }
  }

  /** Tear down an in-progress telegraph (on fire, stun, or death). */
  private clearTelegraph(): void {
    this.scene.tweens.killTweensOf(this); // stop the wind-up scale-breathe
    this.clearTint();
    this.setScale(this.useDir ? this.def.directional!.displayScale : 1);
    if (this.telegraph) {
      this.scene.tweens.killTweensOf(this.telegraph);
      this.telegraph.destroy();
      this.telegraph = undefined;
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
    const cue = addPixelText(this.scene, Math.round(this.x), Math.round(this.y - 14 * RS), '!', {
      color: 0xffe066,
    }).setOrigin(0.5, 1).setDepth(20);
    this.scene.tweens.add({
      targets: cue,
      y: cue.y - 4 * RS,
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
    this.clearTelegraph();
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
      const dist = (6 + Math.random() * 6) * RS;
      const spore = this.scene.add
        .rectangle(this.x, this.y, 2 * RS, 2 * RS, 0x6f9b3a)
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
