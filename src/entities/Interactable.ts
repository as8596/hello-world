import Phaser from 'phaser';
import { TextureKeys } from '../systems/TextureFactory';

export interface InteractableOptions {
  /** Verb shown in the interact prompt (default 'read'). */
  label?: string;
  /** Texture key (default the villager placeholder). */
  texture?: string;
  /** Lines shown when read (villagers). Ignored if `onInteract`/`npcId` is set. */
  lines?: string[];
  /** Named NPC to play via the data-driven dialogue system (e.g. 'maple'). */
  npcId?: string;
  /** Custom action instead of dialogue (e.g. a hearth). */
  onInteract?: (scene: Phaser.Scene) => void;
}

/**
 * Interactable — a non-blocking world object the player can act on with E.
 * Defaults to a readable sleeping villager (shows its dialogue lines); with
 * `npcId` it plays a named data-driven NPC; with `onInteract` it runs a custom
 * action (e.g. a hearth or the great bell). The scene handles proximity.
 */
export class Interactable extends Phaser.GameObjects.Sprite {
  readonly lines: string[];
  readonly label: string;
  readonly npcId?: string;
  readonly onInteract?: (scene: Phaser.Scene) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: InteractableOptions = {}) {
    super(scene, x, y, opts.texture ?? TextureKeys.Villager);
    scene.add.existing(this);
    this.lines = opts.lines ?? [];
    this.label = opts.label ?? 'read';
    this.npcId = opts.npcId;
    this.onInteract = opts.onInteract;
    this.setDepth(6);
  }
}
