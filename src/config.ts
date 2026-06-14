import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';

/**
 * Fixed low base resolution. We render the whole game at this size and let
 * the Scale Manager upscale it (FIT, integer-friendly) to the window, with
 * `image-rendering: pixelated` keeping the result crisp. 320x180 upscales
 * cleanly: x6 -> 1920x1080.
 */
export const BASE_WIDTH = 320;
export const BASE_HEIGHT = 180;

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
