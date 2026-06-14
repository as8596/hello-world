import Phaser from 'phaser';
import { CELL_W, GLYPH_H, GLYPH_W, PIXEL_GLYPHS } from '../data/pixelFont';
import { RENDER_SCALE } from '../data/render';

/**
 * Bakes the hand-authored pixel font (data/pixelFont.ts) into a texture and
 * registers it as a Phaser bitmap font. Bitmap glyphs are hard-edged 1px art,
 * so they upscale crisply with the rest of the pixel-art game instead of the
 * blurry anti-aliasing you get from system-font `Text`.
 */
export const PIXEL_FONT_KEY = 'pixel';
const TEXTURE_KEY = 'pixelfont-tex';

export function createPixelFont(scene: Phaser.Scene): void {
  if (scene.cache.bitmapFont.has(PIXEL_FONT_KEY)) return;

  const count = PIXEL_GLYPHS.length;
  const S = RENDER_SCALE; // bake the font at native (world) size like the other art

  if (!scene.textures.exists(TEXTURE_KEY)) {
    const tex = scene.textures.createCanvas(TEXTURE_KEY, count * CELL_W * S, GLYPH_H * S);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(S, S);
    ctx.fillStyle = '#ffffff';
    PIXEL_GLYPHS.forEach((glyph, i) => {
      const ox = i * CELL_W;
      for (let r = 0; r < GLYPH_H; r++) {
        const row = glyph.rows[r];
        for (let c = 0; c < GLYPH_W; c++) {
          if (row[c] === '#') ctx.fillRect(ox + c, r, 1, 1);
        }
      }
    });
    tex.refresh();
  }

  const chars = PIXEL_GLYPHS.map((g) => g.char).join('');
  const data = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: TEXTURE_KEY,
    'offset.x': 0,
    'offset.y': 0,
    width: CELL_W * S,
    height: GLYPH_H * S,
    chars,
    charsPerRow: count,
    'spacing.x': 0,
    'spacing.y': 0,
    lineSpacing: 1 * S,
  });
  scene.cache.bitmapFont.add(PIXEL_FONT_KEY, data);
}

export interface PixelTextOptions {
  /** Tint applied to the white glyphs (multiply → exact color). */
  color?: number;
  /** Word-wrap width in px. */
  maxWidth?: number;
}

/** Create a crisp pixel-font BitmapText. */
export function addPixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: PixelTextOptions = {},
): Phaser.GameObjects.BitmapText {
  const bt = scene.add.bitmapText(x, y, PIXEL_FONT_KEY, text);
  if (opts.color !== undefined) bt.setTint(opts.color);
  if (opts.maxWidth) bt.setMaxWidth(opts.maxWidth);
  return bt;
}
