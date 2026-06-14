import Phaser from 'phaser';
import { TextureKeys } from '../systems/TextureFactory';

export interface InteractableOptions {
  /** Lines shown when the player reads/talks to this object. */
  lines: string[];
  /** Verb shown in the interact prompt (default 'read'). */
  label?: string;
}

/**
 * Interactable — a non-blocking world object the player can read/talk to (a
 * sleeping villager for now). Carries its dialogue lines as data; the scene
 * handles proximity and opens the DialogueBox.
 */
export class Interactable extends Phaser.GameObjects.Sprite {
  readonly lines: string[];
  readonly label: string;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: InteractableOptions) {
    super(scene, x, y, TextureKeys.Villager);
    scene.add.existing(this);
    this.lines = opts.lines;
    this.label = opts.label ?? 'read';
    this.setDepth(6);
  }
}
