/**
 * gif-to-sheets — convert the player's running-animation GIFs into Phaser sprite
 * sheets (Phaser can't load animated GIFs). For each `run-<dir>.gif` in
 * public/assets/sprites/player/raw/, writes a horizontal strip
 * public/assets/sprites/player/run/<dir>.png (all frames in a row) plus a
 * shared `manifest.json` describing the frame size / count, which PreloadScene
 * reads.
 *
 * Run: `npm run sprites`. Missing directions are skipped (the game falls back to
 * the static directional art while moving), so this is safe to run partially.
 *
 * GIF frames can be partial (delta-encoded) with per-frame disposal; we
 * composite onto a persistent canvas following the GIF disposal rules so every
 * emitted frame is the full, correct image.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GifReader } from 'omggif';
import { PNG } from 'pngjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAYER = join(HERE, '..', 'public', 'assets', 'sprites', 'player');
const RAW = join(PLAYER, 'raw');
const OUT = join(PLAYER, 'run');

// Compass directions, matching PLAYER_SPRITE_DIRS / the static art file names.
const DIRS = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];

/** Decode a GIF buffer into an array of full-canvas RGBA frame buffers. */
function decodeGifFrames(buf) {
  const reader = new GifReader(buf);
  const w = reader.width;
  const h = reader.height;
  const n = reader.numFrames();
  const frames = [];
  let canvas = new Uint8Array(w * h * 4); // persistent composite, starts transparent

  for (let i = 0; i < n; i++) {
    const info = reader.frameInfo(i);
    const saved = info.disposal === 3 ? canvas.slice() : null; // "restore to previous"

    // Blits frame i onto the canvas, honoring its sub-rect + transparency.
    reader.decodeAndBlitFrameRGBA(i, canvas);
    frames.push(Buffer.from(canvas));

    // Apply this frame's disposal so the NEXT frame composites correctly.
    if (info.disposal === 2) {
      // Restore the frame's rectangle to the (transparent) background.
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const px = ((info.y + y) * w + (info.x + x)) * 4;
          canvas[px] = canvas[px + 1] = canvas[px + 2] = canvas[px + 3] = 0;
        }
      }
    } else if (info.disposal === 3 && saved) {
      canvas = saved;
    }
  }
  return { width: w, height: h, frames };
}

/** Write frames side by side into one horizontal strip PNG. */
function writeSheet(width, height, frames, outPath) {
  const n = frames.length;
  const sheet = new PNG({ width: width * n, height, colorType: 6 });
  sheet.data.fill(0);
  frames.forEach((frame, i) => {
    const ox = i * width;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const src = (y * width + x) * 4;
        const dst = (y * width * n + (ox + x)) * 4;
        sheet.data[dst] = frame[src];
        sheet.data[dst + 1] = frame[src + 1];
        sheet.data[dst + 2] = frame[src + 2];
        sheet.data[dst + 3] = frame[src + 3];
      }
    }
  });
  writeFileSync(outPath, PNG.sync.write(sheet));
}

let frameW = 0;
let frameH = 0;
let frameCount = 0;
const done = [];
mkdirSync(OUT, { recursive: true });

for (const dir of DIRS) {
  const inPath = join(RAW, `run-${dir}.gif`);
  if (!existsSync(inPath)) {
    console.warn(`- skip ${dir}: no raw/run-${dir}.gif`);
    continue;
  }
  const { width, height, frames } = decodeGifFrames(readFileSync(inPath));
  if (!frameW) {
    frameW = width;
    frameH = height;
    frameCount = frames.length;
  } else if (width !== frameW || height !== frameH || frames.length !== frameCount) {
    console.error(
      `! ${dir}: ${width}x${height} x${frames.length} differs from ${frameW}x${frameH} x${frameCount}. ` +
        'All directions must share frame size and count.',
    );
    process.exit(1);
  }
  writeSheet(width, height, frames, join(OUT, `${dir}.png`));
  done.push(dir);
  console.log(`✓ ${dir}: ${frames.length} frames @ ${width}x${height}`);
}

if (done.length === 0) {
  console.error(`\nNo run-*.gif files in ${RAW}. Add run-<dir>.gif (e.g. run-south.gif) and re-run.`);
  process.exit(1);
}

const manifest = { frameWidth: frameW, frameHeight: frameH, frames: frameCount, dirs: done };
writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nmanifest -> player/run/manifest.json: ${JSON.stringify(manifest)}`);
if (done.length < DIRS.length) {
  console.log(`(${DIRS.length - done.length} direction(s) missing — they'll use static art while moving.)`);
}
