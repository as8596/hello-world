import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { addPixelText } from './PixelFont';
import { worldState } from './WorldState';

/**
 * HintSystem — one-time, fading, bottom-center verb hints (DESIGN.md §14a).
 * Each id shows once, ever: a `hint_<id>` flag in WorldState gates it, so hints
 * never repeat after a death-restart or save/load. Reuses the soft control-hint
 * visual (a fading pixel-text line above the bottom edge).
 */
export const HintSystem = {
  /** Show hint `id` once; no-op if its `hint_<id>` flag is already set. */
  tryShow(scene: Phaser.Scene, id: string, text: string): void {
    const flag = `hint_${id}`;
    if (worldState.hasFlag(flag)) return;
    worldState.setFlag(flag, true);
    const hint = addPixelText(scene, 0, 0, text, { color: 0xe8e6d8 }).setScrollFactor(0).setDepth(1000);
    hint.setPosition(Math.round((scene.scale.width - hint.width) / 2), scene.scale.height - 16 * RS);
    scene.tweens.add({ targets: hint, alpha: 0, delay: 4500, duration: 1200, onComplete: () => hint.destroy() });
  },
};
