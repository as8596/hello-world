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
  /** Use the bold weight (e.g. speaker names). */
  bold?: boolean;
}

/** The game's text type. Pixelify Sans is a TTF, so UI text is rendered with
 *  Phaser's `Text` (the browser draws the real proportional font). */
export type PixelText = Phaser.GameObjects.Text;

/** The bundled pixel font (Google's Pixelify Sans, see assets/fonts/OFL.txt). */
export const FONT_FAMILY = 'Pixelify Sans';
/** Render size in px (~35% smaller than before). Now drawn 1:1, so it's crisp. */
export const FONT_PX = 5 * RENDER_SCALE;

/**
 * Load Pixelify Sans (regular + bold) via the FontFace API so `Text` can draw
 * it. Resolves even on failure (a missing font just falls back to monospace),
 * and is a no-op where FontFace is unavailable. Must finish before any text is
 * created, or that text bakes its texture in the fallback font.
 */
export function loadGameFont(): Promise<void> {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return Promise.resolve();
  const faces = [
    new FontFace(FONT_FAMILY, 'url(assets/fonts/PixelifySans-Regular.ttf)', { weight: '400' }),
    new FontFace(FONT_FAMILY, 'url(assets/fonts/PixelifySans-Bold.ttf)', { weight: '700' }),
  ];
  return Promise.all(
    faces.map((f) => f.load().then((loaded) => document.fonts.add(loaded))),
  )
    .then(() => undefined)
    .catch(() => undefined);
}

/**
 * Create a crisp pixel-font line. Returns a Phaser `Text` using Pixelify Sans;
 * `color` is applied as a tint (white glyphs × color) so existing call sites
 * that also chain `.setTint(...)` keep working, and `maxWidth` word-wraps.
 */
export function addPixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: PixelTextOptions = {},
): PixelText {
  const t = scene.add.text(x, y, text, {
    fontFamily: `'${FONT_FAMILY}', monospace`,
    fontSize: `${FONT_PX}px`,
    fontStyle: opts.bold ? 'bold' : 'normal',
    color: '#ffffff',
    resolution: RENDER_SCALE,
  });
  t.setOrigin(0, 0);
  if (opts.color !== undefined) t.setTint(opts.color);
  if (opts.maxWidth) t.setWordWrapWidth(opts.maxWidth, true);
  return t;
}
