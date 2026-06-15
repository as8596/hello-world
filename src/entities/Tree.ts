import Phaser from 'phaser';

/** Display scale for the 128px tree art → ~1.7 tiles tall. */
const TREE_SCALE = 0.85;
/** Depth when the player is behind (north of) / in front of (south of) the trunk. */
const OVER_PLAYER = 12;
const BEHIND_PLAYER = 9;

/**
 * Tree — a standalone canopy tree world-object (visual only; the scene owns a
 * small static trunk collider). The canopy is drawn above or below the player by
 * comparing feet-Y, so you walk *behind* a tree to your north and *in front* of
 * one to your south (simple 2.5D depth sort). Placed via 'tree' map objects.
 */
export class Tree extends Phaser.GameObjects.Image {
  /** World-Y of the trunk base — the sort line against the player. */
  readonly baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'tree');
    scene.add.existing(this);
    this.setOrigin(0.5, 0.92).setScale(TREE_SCALE); // anchor near the trunk base
    this.baseY = y;
  }

  /** Re-sort the canopy: above the player when they're north of the trunk. */
  syncDepth(playerY: number): void {
    this.setDepth(playerY < this.baseY ? OVER_PLAYER : BEHIND_PLAYER);
  }
}
