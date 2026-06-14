/**
 * gif-to-sheets — convert the player's animation GIFs into Phaser sprite sheets
 * (Phaser can't load animated GIFs). For each animation set (run, idle, …) it
 * reads `<set>-<dir>.gif` from public/assets/sprites/player/raw/ and writes a
 * horizontal strip public/assets/sprites/player/<set>/<dir>.png plus a
 * `manifest.json` (frame size / count / dirs), which PreloadScene reads.
 *
 * Run: `npm run sprites`. Missing directions/sets are skipped (the game falls
 * back to the static directional art), so this is safe to run partially.
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

// Animation sets to build: raw/<set>-<dir>.gif -> <set>/<dir>.png + manifest.
const SETS = ['run', 'idle'];

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

/** Build one animation set (e.g. 'run'): raw/<set>-<dir>.gif -> <set>/<dir>.png. */
function convertSet(set) {
  const out = join(PLAYER, set);
  let frameW = 0;
  let frameH = 0;
  let frameCount = 0;
  const done = [];

  for (const dir of DIRS) {
    const inPath = join(RAW, `${set}-${dir}.gif`);
    if (!existsSync(inPath)) continue;
    const { width, height, frames } = decodeGifFrames(readFileSync(inPath));
    if (!frameW) {
      frameW = width;
      frameH = height;
      frameCount = frames.length;
    } else if (width !== frameW || height !== frameH || frames.length !== frameCount) {
      console.error(
        `! ${set}/${dir}: ${width}x${height} x${frames.length} differs from ${frameW}x${frameH} x${frameCount}. ` +
          'All directions in a set must share frame size and count.',
      );
      process.exit(1);
    }
    mkdirSync(out, { recursive: true });
    writeSheet(width, height, frames, join(out, `${dir}.png`));
    done.push(dir);
    console.log(`✓ ${set}/${dir}: ${frames.length} frames @ ${width}x${height}`);
  }

  if (done.length === 0) {
    console.log(`- ${set}: no raw/${set}-*.gif files — skipped.`);
    return false;
  }
  const manifest = { frameWidth: frameW, frameHeight: frameH, frames: frameCount, dirs: done };
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`  manifest -> player/${set}/manifest.json: ${JSON.stringify(manifest)}`);
  return true;
}

let any = false;
for (const set of SETS) any = convertSet(set) || any;
if (!any) {
  console.error(`\nNo animation GIFs found in ${RAW}. Add <set>-<dir>.gif (e.g. run-south.gif, idle-south.gif).`);
  process.exit(1);
}
