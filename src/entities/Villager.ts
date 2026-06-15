import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { dir8FromVector, type SpriteDir } from '../data/spriteDirections';
import { Interactable, type InteractableOptions } from './Interactable';

/** Stroll speed once awake (px/sec) and how far they wander from home (px). */
const WANDER_SPEED = 16 * RS;
const WANDER_RADIUS = 28 * RS;

export interface VillagerOptions extends InteractableOptions {
  /** Texture shown once the valley wakes (a color variant). */
  awakeTexture: string;
  /** Optional 8-direction art (textures `<dirPrefix>-<dir>`); faces movement. */
  dirPrefix?: string;
  /** Optional 8-direction walk animation (anims `<walkPrefix>-<dir>`), played while moving. */
  walkPrefix?: string;
  /** Display scale + origin for the directional art (its native px). */
  dirScale?: number;
  dirOriginY?: number;
}

/**
 * Villager — a talkable townsfolk. Asleep until the waking peal; once woken it
 * ambles gently around its home spot (pausing, re-targeting) so the village feels
 * alive. No physics — it drifts in open ground near home, well clear of walls.
 */
export class Villager extends Interactable {
  private readonly awakeTexture: string;
  private readonly dirPrefix?: string;
  private readonly walkPrefix?: string;
  private readonly dirScale: number;
  private readonly dirOriginY: number;
  private useDir = false;
  private hasWalk = false;
  private renderedDir: SpriteDir = 'south';
  private readonly homeX: number;
  private readonly homeY: number;
  private awake = false;
  private moving = false;
  private targetX: number;
  private targetY: number;
  private nextAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: VillagerOptions) {
    super(scene, x, y, opts);
    this.awakeTexture = opts.awakeTexture;
    this.dirPrefix = opts.dirPrefix;
    this.walkPrefix = opts.walkPrefix;
    this.dirScale = opts.dirScale ?? 1;
    this.dirOriginY = opts.dirOriginY ?? 0.74;
    this.homeX = x;
    this.homeY = y;
    this.targetX = x;
    this.targetY = y;
  }

  get isAwake(): boolean {
    return this.awake;
  }

  /** Rise and start ambling (called on the peal, or on load if already woken). */
  wake(): void {
    if (this.awake) return;
    this.awake = true;
    // Use real 8-direction art if present, else the placeholder color variant.
    if (this.dirPrefix && this.scene.textures.exists(`${this.dirPrefix}-south`)) {
      this.useDir = true;
      this.hasWalk = !!this.walkPrefix && this.scene.anims.exists(`${this.walkPrefix}-south`);
      this.setOrigin(0.5, this.dirOriginY).setScale(this.dirScale);
      this.setTexture(`${this.dirPrefix}-south`);
    } else {
      this.setTexture(this.awakeTexture);
    }
    this.nextAt = this.scene.time.now + Phaser.Math.Between(600, 3000);
  }

  /** Gentle wander: drift to a random nearby point, pause, repeat. `frozen` (e.g.
   *  a dialogue is open) holds them still. */
  wander(now: number, deltaMs: number, frozen: boolean): void {
    if (!this.awake || frozen) return;
    if (this.moving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) {
        this.moving = false;
        this.nextAt = now + Phaser.Math.Between(1400, 4000); // rest a while
        // Settle into a still, facing pose.
        if (this.hasWalk) {
          this.stop();
          this.setTexture(`${this.dirPrefix}-${this.renderedDir}`);
        }
      } else {
        const step = Math.min(d, WANDER_SPEED * (deltaMs / 1000));
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
        if (this.useDir) {
          this.renderedDir = dir8FromVector(dx, dy);
          if (this.hasWalk) this.play(`${this.walkPrefix}-${this.renderedDir}`, true); // (no restart if same)
          else this.setTexture(`${this.dirPrefix}-${this.renderedDir}`);
        } else {
          this.setFlipX(dx < 0);
        }
      }
    } else if (now >= this.nextAt) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * WANDER_RADIUS;
      this.targetX = this.homeX + Math.cos(ang) * r;
      this.targetY = this.homeY + Math.sin(ang) * r;
      this.moving = true;
    }
  }
}
