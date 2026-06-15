import Phaser from 'phaser';
import { handbellConfig } from '../data/handbellConfig';
import { playerConfig } from '../data/playerConfig';
import { audio } from '../systems/AudioManager';
import { eventBus } from '../systems/EventBus';
import { TextureKeys } from '../systems/TextureFactory';
import { worldState } from '../systems/WorldState';

type Facing = 'down' | 'up' | 'left' | 'right';
type SpriteDir =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west';

/** Real 8-direction art: texture key `player-<dir>` <- `player/rotations/<dir>.png`. */
export const PLAYER_SPRITE_DIRS: { key: SpriteDir; file: string }[] = [
  { key: 'north', file: 'assets/sprites/player/rotations/north.png' },
  { key: 'south', file: 'assets/sprites/player/rotations/south.png' },
  { key: 'east', file: 'assets/sprites/player/rotations/east.png' },
  { key: 'west', file: 'assets/sprites/player/rotations/west.png' },
  { key: 'north-east', file: 'assets/sprites/player/rotations/north-east.png' },
  { key: 'north-west', file: 'assets/sprites/player/rotations/north-west.png' },
  { key: 'south-east', file: 'assets/sprites/player/rotations/south-east.png' },
  { key: 'south-west', file: 'assets/sprites/player/rotations/south-west.png' },
];

/** Map an input vector (signs) to one of the 8 compass directions. */
function dir8(ix: number, iy: number): SpriteDir {
  const sx = Math.sign(ix);
  const sy = Math.sign(iy);
  if (sx === 0) return sy < 0 ? 'north' : 'south';
  if (sy === 0) return sx > 0 ? 'east' : 'west';
  if (sy < 0) return sx > 0 ? 'north-east' : 'north-west';
  return sx > 0 ? 'south-east' : 'south-west';
}

/** True when all eight real directional textures were loaded. */
function hasDirectionalSheet(scene: Phaser.Scene): boolean {
  return PLAYER_SPRITE_DIRS.every((d) => scene.textures.exists(`player-${d.key}`));
}

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
  private facing: Facing = 'down'; // 4-way, used for attack aim
  private spriteFacing: SpriteDir = 'south'; // 8-way, used for the art
  private renderedSprite?: SpriteDir;
  /** Using real directional art (8 rotations) vs the generated placeholder. */
  private readonly useSheet: boolean;
  /** Resting display scale (1 — art renders 1:1 on the high-res framebuffer). */
  private baseScale = 1;
  /**
   * Vertical offset (px) from the entity origin up to the sprite's center, where
   * a swing visually reads. The real art puts the origin at the feet
   * (originY 0.9), so attacks must aim from the body center, not `this.y`. Zero
   * for the placeholder (origin 0.5), so its behavior is unchanged.
   */
  private attackAnchorY = 0;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;

  private attackState: AttackState = 'ready';
  private bufferedAttackAt = -Infinity;
  private readonly hitTargets = new Set<unknown>();

  /** Health, tracked in half-hearts (maxHearts * 2). */
  private maxHp = playerConfig.maxHearts * 2;
  private hp = playerConfig.maxHearts * 2;
  private invulnUntil = 0;
  private controlLockUntil = 0;
  private dead = false;
  private bellReadyAt = 0;

  /** Stamina (abstract points), regenerating; gates the dodge. */
  private stamina = playerConfig.maxStamina;
  private lastStaminaEmit = -1;
  /** While `now < dodgeUntil` the dash burst is active (steering is locked). */
  private dodgeUntil = 0;
  /** Earliest time a new dash may start (dash end + cooldown). */
  private dodgeReadyAt = 0;
  private readonly dodgeDir = { x: 0, y: 0 };
  /** Distance accumulator for footstep cadence (one step per 2 animation frames). */
  private stepAccum = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const useSheet = hasDirectionalSheet(scene);
    super(scene, x, y, useSheet ? 'player-south' : TextureKeys.Player, useSheet ? undefined : 'down-0');
    this.useSheet = useSheet;

    // Max HP persists across deaths/loads (heart fragments + the bell reward).
    this.maxHp = worldState.getCounter('player_max_half_hearts') || playerConfig.maxHearts * 2;
    this.hp = this.maxHp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (useSheet) {
      // The framebuffer is high-res (RENDER_SCALE), so the 128px art displays
      // 1:1 — no scaling, which keeps it crisp and shimmer-free. The foot box is
      // in the art's native pixels, centered on the feet (origin).
      const cfg = playerConfig.sprite;
      const srcW = this.width;
      const srcH = this.height;
      this.setOrigin(0.5, cfg.originY);
      body.setSize(cfg.bodyWidth, cfg.bodyHeight);
      // X: centred on the sprite (left/right collide cleanly). Y: the box BOTTOM
      // sits at the feet/contact line (origin) and rises over the legs — the art
      // has empty padding below the feet, so a centred box would float above south
      // walls and bury into north ones. Anchoring the bottom fixes top/bottom.
      body.setOffset(srcW * 0.5 - cfg.bodyWidth / 2, srcH * cfg.originY - cfg.bodyHeight);
    } else {
      const { width, height, offsetX, offsetY } = playerConfig.body;
      body.setSize(width, height);
      body.setOffset(offsetX, offsetY);
    }
    // Aim attacks from the sprite's vertical center, not the origin (= feet on
    // the real art). Resolves to 0 for the placeholder (origin 0.5).
    this.attackAnchorY = this.height * (this.originY - 0.5);
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

    // Optional real directional animation cycles (from the GIF sheets). Register
    // one per direction that actually loaded; the rest fall back to static art.
    const registerSet = (set: string, frameRate: number): void => {
      const manifest = scene.cache.json.get(`player-${set}-manifest`) as
        | { frames: number; dirs?: string[] }
        | undefined;
      if (!manifest || !Array.isArray(manifest.dirs)) return;
      for (const dir of manifest.dirs) {
        const key = `player-${set}-${dir}`;
        if (scene.anims.exists(key) || !scene.textures.exists(key)) continue;
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(key, { start: 0, end: manifest.frames - 1 }),
          frameRate,
          repeat: -1,
        });
      }
    };
    registerSet('run', playerConfig.runFrameRate);
    registerSet('idle', playerConfig.idleFrameRate);
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

  /** Heal to full (e.g. resting at a hearth), with a soft green flash. */
  healFull(): void {
    this.hp = this.maxHp;
    this.emitHealth();
    this.scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, duration: 110, repeat: 2, onComplete: () => this.setAlpha(1) });
  }

  /** Raise max health by `halfHearts` and top off (heart fragment). */
  gainMaxHalfHearts(halfHearts: number): void {
    this.maxHp += halfHearts;
    this.hp = this.maxHp;
    worldState.setCounter('player_max_half_hearts', this.maxHp); // persist (DESIGN.md §22)
    this.emitHealth();
  }

  /** Heal `halfHearts`, capped at max (e.g. a consumable). Returns true if it did anything. */
  heal(halfHearts: number): boolean {
    if (this.dead || this.hp >= this.maxHp) return false;
    this.hp = Math.min(this.maxHp, this.hp + halfHearts);
    this.emitHealth();
    this.scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, duration: 110, repeat: 1, onComplete: () => this.setAlpha(1) });
    return true;
  }

  /** Restore stamina/Echoes by `points`, capped at max. Returns true if it did anything. */
  restoreStamina(points: number): boolean {
    if (this.stamina >= playerConfig.maxStamina) return false;
    this.stamina = Math.min(playerConfig.maxStamina, this.stamina + points);
    this.emitStamina(true);
    return true;
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
    eventBus.emit('playerHurt', { amount });
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

  // --- Handbell -----------------------------------------------------------

  /**
   * Ring the Warden's Handbell if off cooldown. Returns true if it rang (the
   * scene then applies the AoE stun + fog dispel). A small pop sells the ring.
   */
  ringBell(now: number): boolean {
    if (this.dead || !worldState.hasFlag('has_handbell') || now < this.bellReadyAt) return false;
    this.bellReadyAt = now + handbellConfig.cooldownMs;
    // Pop relative to the resting scale (the art is downscaled, not scale 1).
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.15,
      scaleY: this.baseScale * 1.15,
      yoyo: true,
      duration: 90,
      onComplete: () => this.setScale(this.baseScale),
    });
    return true;
  }

  // --- Dodge --------------------------------------------------------------

  /** True while the dash burst is active (steering locked, i-frames live). */
  get isDodging(): boolean {
    return this.scene.time.now < this.dodgeUntil;
  }

  /**
   * Dodge-roll (DESIGN.md §13 step 7): a short stamina-gated dash with i-frames,
   * in the current movement direction (or facing if standing still). Returns
   * true if it fired. No-op while dead, mid-dash, on cooldown, or out of stamina.
   */
  tryDodge(now: number): boolean {
    const d = playerConfig.dodge;
    if (this.dead || this.isDodging || now < this.dodgeReadyAt) return false;
    if (this.stamina < d.staminaCost) return false;

    // Direction: live input vector, else the way we're facing.
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;
    if (dx === 0 && dy === 0) {
      const o = this.facingOffset();
      dx = o.x;
      dy = o.y;
    }
    const len = Math.hypot(dx, dy) || 1;
    this.dodgeDir.x = dx / len;
    this.dodgeDir.y = dy / len;

    this.stamina -= d.staminaCost;
    this.emitStamina(true);
    this.dodgeUntil = now + d.durationMs;
    this.dodgeReadyAt = now + d.durationMs + d.cooldownMs;
    this.invulnUntil = Math.max(this.invulnUntil, now + d.iframesMs);

    // Face and animate in the dash direction.
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx < 0 ? 'left' : 'right';
    else this.facing = dy < 0 ? 'up' : 'down';
    this.spriteFacing = dir8(dx, dy);

    (this.body as Phaser.Physics.Arcade.Body).setVelocity(this.dodgeDir.x * d.speed, this.dodgeDir.y * d.speed);
    audio.playSfx('dodge');
    this.spawnDashVfx();
    return true;
  }

  /** A short blue after-image trail so the roll reads as a quick burst. */
  private spawnDashVfx(): void {
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 55, () => {
        if (!this.active) return;
        const ghost = this.scene.add
          .image(this.x, this.y, this.texture.key, this.frame.name)
          .setOrigin(this.originX, this.originY)
          .setFlipX(this.flipX)
          .setDepth(this.depth - 1)
          .setAlpha(0.4)
          .setTint(0x9fd0ff);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
      });
    }
  }

  /** Current stamina as a 0..1 ratio (for the HUD). */
  get staminaRatio(): number {
    return this.stamina / playerConfig.maxStamina;
  }

  /** Broadcast stamina to the HUD when it changes (or `force` on spawn). */
  emitStamina(force: boolean): void {
    const q = Math.round(this.stamina / 0.05);
    if (!force && q === this.lastStaminaEmit) return;
    this.lastStaminaEmit = q;
    eventBus.emit('playerStamina', { ratio: this.staminaRatio, max: playerConfig.maxStamina });
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
    if (!worldState.hasFlag('has_blade')) return; // unlocked by the blade pickup
    if (this.attackState === 'ready') this.startSwing();
    else this.bufferedAttackAt = now;
  }

  /** The world-space hitbox rectangle while active, else null. */
  getHitRect(): Phaser.Geom.Rectangle | null {
    if (this.attackState !== 'active') return null;
    const a = playerConfig.attack;
    const o = this.facingOffset();
    const cx = this.x + o.x * a.reach;
    const cy = this.y - this.attackAnchorY + o.y * a.reach;
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
    audio.playSfx('attack');

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
      .image(this.x + o.x * a.reach, this.y - this.attackAnchorY + o.y * a.reach, TextureKeys.Slash)
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
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.renderFacing(false);
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Stamina regenerates whenever we're not mid-dash; keep the HUD in sync.
    if (!this.isDodging) {
      this.stamina = Math.min(playerConfig.maxStamina, this.stamina + playerConfig.staminaRegenPerSec * dt);
    }
    this.emitStamina(false);

    // Mid-dash: hold the burst and ignore steering until it ends (§13 step 7).
    if (this.isDodging) {
      const d = playerConfig.dodge;
      body.setVelocity(this.dodgeDir.x * d.speed, this.dodgeDir.y * d.speed);
      this.renderFacing(true);
      return;
    }

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

    // --- Facing (from the raw -1/0/1 input, before normalization) --------
    const moving = ix !== 0 || iy !== 0;
    if (moving) {
      // 4-way for attack aim (dominant axis).
      if (Math.abs(ix) > Math.abs(iy)) this.facing = ix < 0 ? 'left' : 'right';
      else if (Math.abs(iy) > Math.abs(ix)) this.facing = iy < 0 ? 'up' : 'down';
      else this.facing = iy < 0 ? 'up' : 'down'; // diagonal: prefer vertical
      // 8-way for the art.
      this.spriteFacing = dir8(ix, iy);
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

    this.renderFacing(moving);

    // Soft footsteps on a distance cadence (synced to the leg animation: one
    // step per ~2 animation frames), so they never play faster than you move.
    if (moving) {
      this.stepAccum += body.velocity.length() * dt;
      if (this.stepAccum >= playerConfig.runPixelsPerFrame * 2) {
        this.stepAccum = 0;
        audio.playSfx('footstep');
      }
    } else {
      this.stepAccum = playerConfig.runPixelsPerFrame; // first step lands soon after starting
    }
  }

  /** Update the displayed art for the current facing (sheet or placeholder). */
  private renderFacing(moving: boolean): void {
    if (this.useSheet) {
      // Eight distinct rotations, no flip. Play the directional run cycle while
      // moving if its sheet loaded; otherwise show the static frame.
      const runKey = `player-run-${this.spriteFacing}`;
      const idleKey = `player-idle-${this.spriteFacing}`;
      if (moving && this.scene.anims.exists(runKey)) {
        this.anims.play(runKey, true);
        // Lock the leg cadence to distance travelled so the feet never slide:
        // play one frame per `runPixelsPerFrame` world px. Falls out naturally
        // for the dash (faster legs) and the accel ramp (slower legs on start).
        const speed = (this.body as Phaser.Physics.Arcade.Body).velocity.length();
        const target = speed / playerConfig.runPixelsPerFrame; // desired fps
        this.anims.timeScale = Phaser.Math.Clamp(target / playerConfig.runFrameRate, 0.45, 3.5);
        this.renderedSprite = undefined; // force the static frame to re-apply on stop
      } else if (!moving && this.scene.anims.exists(idleKey)) {
        this.anims.timeScale = 1; // the idle breathing plays at its calm rate
        this.anims.play(idleKey, true);
        this.renderedSprite = undefined;
      } else {
        if (this.anims.isPlaying) this.anims.stop();
        if (this.renderedSprite !== this.spriteFacing) {
          this.renderedSprite = this.spriteFacing;
          this.setTexture(`player-${this.spriteFacing}`);
        }
      }
      return;
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
