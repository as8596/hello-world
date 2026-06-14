import Phaser from 'phaser';
import { TextureKeys } from '../systems/TextureFactory';

export interface InteractableOptions {
  /** Verb shown in the interact prompt (default 'read'). */
  label?: string;
  /** Texture key (default the villager placeholder). */
  texture?: string;
  /** Lines shown when read (villagers). Ignored if `onInteract` is set. */
  lines?: string[];
  /** Custom action instead of opening dialogue (e.g. a hearth). */
  onInteract?: (scene: Phaser.Scene) => void;
}

/**
 * Interactable — a non-blocking world object the player can act on with E.
 * Defaults to a readable sleeping villager (shows its dialogue lines), but with
 * `onInteract` it becomes any point-of-interest, e.g. a hearth that heals/saves.
 * The scene handles proximity.
 */
export class Interactable extends Phaser.GameObjects.Sprite {
  readonly lines: string[];
  readonly label: string;
  readonly onInteract?: (scene: Phaser.Scene) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: InteractableOptions = {}) {
    super(scene, x, y, opts.texture ?? TextureKeys.Villager);
    scene.add.existing(this);
    this.lines = opts.lines ?? [];
    this.label = opts.label ?? 'read';
    this.onInteract = opts.onInteract;
    this.setDepth(6);
  }
}
