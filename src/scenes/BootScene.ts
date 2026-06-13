import Phaser from 'phaser';
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
    this.scene.start(SceneKeys.Preload);
  }
}
