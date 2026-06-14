import Phaser from 'phaser';
import { loadGame } from '../systems/SaveSystem';
import { SceneKeys } from './SceneKeys';

/**
 * BootScene — first scene. Minimal, synchronous setup only: wire up global
 * services and anything the Preloader itself needs (e.g. a loading-bar
 * texture), then hand off. Heavy asset loading belongs in PreloadScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    // Rehydrate WorldState from the auto-save before any scene reads it, so the
    // world builds itself from the saved flags (DESIGN.md §22).
    loadGame();
    this.scene.start(SceneKeys.Preload);
  }
}
