import Phaser from 'phaser';

/**
 * TextureFactory — generates placeholder art at runtime so we never block on
 * real assets (project convention). Plain canvas-drawn pixels; swap for
 * Kenney/LPC/custom sheets later by loading real images in PreloadScene and
 * keeping the same texture keys + frame names.
 */

export const TextureKeys = {
  Player: 'player',
  Ground: 'ground',
} as const;

const FRAME = 16; // player frame size, px

type Dir = 'down' | 'side' | 'up';

/** Generate every placeholder texture. Safe to call once during preload. */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  generateGround(scene);
  generatePlayer(scene);
}

function generateGround(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Ground)) return;
  const size = 16;
  const tex = scene.textures.createCanvas(TextureKeys.Ground, size, size);
  if (!tex) return;
  const ctx = tex.getContext();

  ctx.fillStyle = '#3f6b43';
  ctx.fillRect(0, 0, size, size);
  // Subtle checker + a few darker/lighter tufts so motion is visible.
  ctx.fillStyle = '#3a6240';
  ctx.fillRect(8, 0, 8, 8);
  ctx.fillRect(0, 8, 8, 8);
  ctx.fillStyle = '#34593a';
  for (const [x, y] of [[2, 3], [11, 5], [6, 11], [13, 13]] as const) {
    ctx.fillRect(x, y, 1, 2);
  }
  ctx.fillStyle = '#4a7d4f';
  for (const [x, y] of [[5, 6], [12, 2], [3, 12], [9, 9]] as const) {
    ctx.fillRect(x, y, 1, 1);
  }
  tex.refresh();
}

function generatePlayer(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Player)) return;
  // 2 walk frames (cols) x 3 directions (rows): down, side, up.
  const tex = scene.textures.createCanvas(TextureKeys.Player, FRAME * 2, FRAME * 3);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, FRAME * 2, FRAME * 3);

  const rows: Dir[] = ['down', 'side', 'up'];
  rows.forEach((dir, r) => {
    for (let step = 0; step < 2; step++) {
      drawCharacter(ctx, step * FRAME, r * FRAME, dir, step);
    }
  });

  const add = (name: string, col: number, row: number): void => {
    tex.add(name, 0, col * FRAME, row * FRAME, FRAME, FRAME);
  };
  add('down-0', 0, 0);
  add('down-1', 1, 0);
  add('side-0', 0, 1);
  add('side-1', 1, 1);
  add('up-0', 0, 2);
  add('up-1', 1, 2);
  tex.refresh();
}

/** Draw one 16x16 character frame at (ox, oy). `step` alternates the stride. */
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dir: Dir,
  step: number,
): void {
  const SKIN = '#e8c39e';
  const HAIR = '#5b3a29';
  const TUNIC = '#3d7dc4';
  const BELT = '#274d78';

  const px = (x: number, y: number, w: number, h: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, w, h);
  };

  // Head
  px(5, 2, 6, 5, SKIN);
  // Hair: covers the back of the head when facing up; a fringe otherwise.
  if (dir === 'up') px(5, 1, 6, 5, HAIR);
  else px(5, 1, 6, 2, HAIR);

  // Eyes
  if (dir === 'down') {
    px(6, 4, 1, 1, '#222');
    px(9, 4, 1, 1, '#222');
  } else if (dir === 'side') {
    // Single eye toward +x; left-facing is produced via flipX at runtime.
    px(9, 4, 1, 1, '#222');
  }

  // Body / tunic
  px(4, 7, 8, 6, TUNIC);
  px(4, 12, 8, 1, BELT);
  // Arms
  px(3, 7, 1, 4, SKIN);
  px(12, 7, 1, 4, SKIN);

  // Feet — alternate which steps forward (1px higher) to read as walking.
  const leftY = step === 0 ? 12 : 13;
  const rightY = step === 0 ? 13 : 12;
  px(5, leftY, 2, 2, HAIR);
  px(9, rightY, 2, 2, HAIR);
}
