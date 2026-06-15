import Phaser from 'phaser';

/** Depth when the player is behind (north of) / in front of (south of) the base. */
const OVER_PLAYER = 12;
const BEHIND_PLAYER = 8;

/**
 * Building — a medieval house world-object (visual only; the scene owns a static
 * footprint collider at its base). Like Tree, it depth-sorts against the player
 * so you walk behind it from the north and in front from the south. Placed via
 * 'building' map objects; the texture key picks the variant (cottage/stone/ruin).
 */
export class Building extends Phaser.GameObjects.Image {
  /** World-Y of the base — the sort line against the player. */
  readonly baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    this.setOrigin(0.5, 0.92); // anchor near the wall base
    this.baseY = y;
  }

  /** Re-sort the house and fade it when the player is hidden behind it. */
  syncDepth(playerX: number, playerY: number): void {
    const over = playerY < this.baseY;
    this.setDepth(over ? OVER_PLAYER : BEHIND_PLAYER);
    const hidden = over && this.getBounds().contains(playerX, playerY);
    this.setAlpha(this.alpha + ((hidden ? 0.5 : 1) - this.alpha) * 0.2);
  }
}
