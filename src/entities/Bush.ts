import Phaser from 'phaser';

/** Depth above / below the player (10) for behind / in front. */
const OVER_PLAYER = 11;
const BEHIND_PLAYER = 6;

/**
 * Bush — a small foliage world-object (green / dead / thorny). Depth-sorts and
 * fades against the player like the tree/building, so you can walk behind it and
 * still see through it. The scene gives it a tiny base collider.
 */
export class Bush extends Phaser.GameObjects.Image {
  /** World-Y of the base — the sort line against the player. */
  readonly baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    this.setOrigin(0.5, 0.82); // anchor near the base
    this.baseY = y;
  }

  /** Re-sort and fade when the player is hidden behind it. */
  syncDepth(playerX: number, playerY: number): void {
    const over = playerY < this.baseY;
    this.setDepth(over ? OVER_PLAYER : BEHIND_PLAYER);
    const hidden = over && this.getBounds().contains(playerX, playerY);
    this.setAlpha(this.alpha + ((hidden ? 0.55 : 1) - this.alpha) * 0.2);
  }
}
