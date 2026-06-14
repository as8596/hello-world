import Phaser from 'phaser';
import { DESIGN_HEIGHT, DESIGN_WIDTH, RENDER_SCALE } from './data/render';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';

/**
 * Base (framebuffer) resolution = the design view (320x180) x the render scale,
 * so detailed art renders 1:1. The Scale Manager then upscales the whole
 * framebuffer to the window (FIT) with `image-rendering: pixelated`.
 */
export const BASE_WIDTH = DESIGN_WIDTH * RENDER_SCALE; // 1280
export const BASE_HEIGHT = DESIGN_HEIGHT * RENDER_SCALE; // 720

// Texture filtering: detailed art (player) renders 1:1 and looks crisp with
// NEAREST; pixelArt also keeps the procedural placeholders sharp.

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#10101a',

  // Crisp pixel art: no texture smoothing, snap rendering to whole pixels.
  pixelArt: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  scene: [BootScene, PreloadScene, WorldScene, UIScene],
};
