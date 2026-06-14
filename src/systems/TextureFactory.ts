import Phaser from 'phaser';

/**
 * TextureFactory — generates placeholder art at runtime so we never block on
 * real assets (project convention). Plain canvas-drawn pixels; swap for
 * Kenney/LPC/custom sheets later by loading real images in PreloadScene and
 * keeping the same texture keys + frame names.
 */

export const TextureKeys = {
  Player: 'player',
  Tiles: 'tiles',
  Vine: 'vine',
  Villager: 'villager',
  Slash: 'slash',
  ThornSprite: 'thorn_sprite',
  Hearts: 'hearts',
  Fog: 'fog',
  StunStars: 'stun_stars',
  HeartFragment: 'heart_fragment',
  Hearth: 'hearth',
  Chime: 'chime',
  BossDoor: 'boss_door',
} as const;

const FRAME = 16; // player frame size, px
const TILE = 16; // tileset tile size, px

type Dir = 'down' | 'side' | 'up';

/** Generate every placeholder texture. Safe to call once during preload. */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  generateTileset(scene);
  generatePlayer(scene);
  generateObjects(scene);
  generateSlash(scene);
  generateThornSprite(scene);
  generateHearts(scene);
  generateFog(scene);
  generateStunStars(scene);
  generateHeartFragment(scene);
  generateHearth(scene);
  generateChime(scene);
  generateBossDoor(scene);
}

/** A resonance chime: a standing post with a small bell (tinted gold when rung). */
function generateChime(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Chime)) return;
  const tex = scene.textures.createCanvas(TextureKeys.Chime, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  // Frame / post.
  rect(ctx, 0, 4, 1, 8, 2, '#6b5a3a');
  rect(ctx, 0, 11, 1, 2, 11, '#6b5a3a'); // top bar approx
  rect(ctx, 0, 4, 1, 9, 2, '#6b5a3a');
  // Bell.
  rect(ctx, 0, 6, 4, 5, 5, '#c9a23a');
  rect(ctx, 0, 7, 3, 3, 1, '#e3c66a');
  rect(ctx, 0, 7, 9, 3, 1, '#8a6f24');
  rect(ctx, 0, 8, 10, 1, 2, '#8a6f24'); // clapper
  tex.refresh();
}

/** An ornate boss door: stone frame with brass bars. */
function generateBossDoor(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.BossDoor)) return;
  const tex = scene.textures.createCanvas(TextureKeys.BossDoor, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  rect(ctx, 0, 0, 0, TILE, TILE, '#4a4038'); // stone
  rect(ctx, 0, 2, 1, 12, 14, '#2c2620'); // recess
  for (const x of [3, 6, 9, 12] as const) rect(ctx, 0, x, 2, 1, 12, '#b9892f'); // bars
  rect(ctx, 0, 2, 7, 12, 1, '#b9892f'); // cross band
  rect(ctx, 0, 7, 6, 2, 2, '#e0b54a'); // boss
  tex.refresh();
}

/** A glittering heart fragment pickup. */
function generateHeartFragment(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.HeartFragment)) return;
  const tex = scene.textures.createCanvas(TextureKeys.HeartFragment, 9, 8);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, 9, 8);
  const mask = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  for (let y = 0; y < mask.length; y++) {
    for (let x = 0; x < 7; x++) {
      if (mask[y][x] === '#') {
        ctx.fillStyle = y <= 1 ? '#ff8fb0' : '#e0567f';
        ctx.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(3, 2, 1, 1); // shine
  tex.refresh();
}

/** A small hearth (stone ring + flame) — rest point. */
function generateHearth(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Hearth)) return;
  const tex = scene.textures.createCanvas(TextureKeys.Hearth, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  // Stone ring.
  for (const [x, y] of [[2, 11], [5, 12], [8, 12], [11, 11], [3, 9], [10, 9]] as const) {
    rect(ctx, 0, x, y, 3, 2, '#7d7468');
  }
  // Logs.
  rect(ctx, 0, 4, 11, 8, 2, '#5a3d28');
  // Flame.
  rect(ctx, 0, 6, 6, 4, 5, '#e8702a');
  rect(ctx, 0, 7, 4, 2, 5, '#f4b23a');
  rect(ctx, 0, 7, 7, 2, 3, '#ffe39a');
  rect(ctx, 0, 7, 2, 2, 2, '#f4b23a'); // tip
  tex.refresh();
}

/** A soft Hush-fog tile (semi-transparent, wispy). */
function generateFog(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Fog)) return;
  const tex = scene.textures.createCanvas(TextureKeys.Fog, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  ctx.fillStyle = 'rgba(214,221,232,0.55)';
  ctx.fillRect(1, 1, 14, 14);
  ctx.fillStyle = 'rgba(232,236,243,0.65)';
  for (const [x, y] of [[2, 3], [8, 2], [11, 6], [4, 9], [9, 11], [6, 6]] as const) {
    ctx.fillRect(x, y, 4, 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const [x, y] of [[3, 5], [10, 8], [6, 10], [12, 3]] as const) ctx.fillRect(x, y, 2, 2);
  tex.refresh();
}

/** A little ring of stun stars, shown above a stunned enemy. */
function generateStunStars(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.StunStars)) return;
  const w = 16;
  const h = 7;
  const tex = scene.textures.createCanvas(TextureKeys.StunStars, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  const star = (cx: number, cy: number): void => {
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(cx, cy - 1, 1, 3);
    ctx.fillRect(cx - 1, cy, 3, 1);
  };
  star(3, 2);
  star(8, 4);
  star(13, 2);
  tex.refresh();
}

/** A small spiky thorn-creature (transparent corners). */
function generateThornSprite(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.ThornSprite)) return;
  const tex = scene.textures.createCanvas(TextureKeys.ThornSprite, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  // Body blob.
  rect(ctx, 0, 4, 5, 8, 8, '#3a5e2a');
  rect(ctx, 0, 5, 4, 6, 1, '#3a5e2a');
  rect(ctx, 0, 3, 6, 1, 6, '#3a5e2a');
  rect(ctx, 0, 12, 6, 1, 6, '#3a5e2a');
  rect(ctx, 0, 5, 12, 6, 1, '#2f4d22');
  // Thorns.
  for (const [x, y] of [[7, 2], [2, 7], [13, 6], [4, 13], [11, 13]] as const) rect(ctx, 0, x, y, 2, 2, '#27401d');
  // Eyes.
  rect(ctx, 0, 6, 8, 1, 2, '#ffe39a');
  rect(ctx, 0, 9, 8, 1, 2, '#ffe39a');
  tex.refresh();
}

/** Heart pips for the HUD: frames 'full', 'half', 'empty'. */
function generateHearts(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Hearts)) return;
  const w = 7;
  const h = 6;
  const tex = scene.textures.createCanvas(TextureKeys.Hearts, w * 3, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w * 3, h);

  // Heart mask (7x6).
  const mask = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const draw = (ox: number, colorAt: (x: number) => string): void => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y][x] === '#') rect(ctx, 0, ox + x, y, 1, 1, colorAt(x));
      }
    }
  };
  draw(0, () => '#d24b4b'); // full
  draw(w, (x) => (x <= 2 ? '#d24b4b' : '#4a2632')); // half
  draw(w * 2, () => '#4a2632'); // empty
  tex.refresh();

  tex.add('full', 0, 0, 0, w, h);
  tex.add('half', 0, w, 0, w, h);
  tex.add('empty', 0, w * 2, 0, w, h);
  tex.refresh();
}

/** A crescent swing VFX, drawn pointing +x; rotated per facing at runtime. */
function generateSlash(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Slash)) return;
  const tex = scene.textures.createCanvas(TextureKeys.Slash, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  const cx = 4;
  const cy = 8;
  for (let i = 0; i <= 14; i++) {
    const t = -0.85 + (1.7 * i) / 14;
    const x = Math.round(cx + 7 * Math.cos(t));
    const y = Math.round(cy + 7 * Math.sin(t));
    rect(ctx, 0, x, y, 2, 2, '#ffffff');
  }
  for (let i = 0; i <= 14; i++) {
    const t = -0.6 + (1.2 * i) / 14;
    const x = Math.round(cx + 5 * Math.cos(t));
    const y = Math.round(cy + 5 * Math.sin(t));
    rect(ctx, 0, x, y, 1, 1, '#bfe3ff');
  }
  tex.refresh();
}

/** Free-standing world objects (transparent background so grass shows around). */
function generateObjects(scene: Phaser.Scene): void {
  if (!scene.textures.exists(TextureKeys.Vine)) {
    const tex = scene.textures.createCanvas(TextureKeys.Vine, TILE, TILE);
    if (tex) {
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, TILE, TILE);
      // A tangled bramble clump, roughly circular, corners left transparent.
      for (const [x, y] of [[5, 2], [9, 3], [3, 6], [11, 6], [6, 9], [10, 10], [4, 11], [8, 12]] as const) {
        rect(ctx, 0, x, y, 3, 3, '#2c4a26');
      }
      for (const [x, y] of [[6, 4], [4, 8], [9, 7], [7, 11], [11, 9]] as const) rect(ctx, 0, x, y, 2, 2, '#5b7d33');
      for (const [x, y] of [[7, 5], [5, 9], [10, 8]] as const) rect(ctx, 0, x, y, 1, 1, '#9ec465');
      tex.refresh();
    }
  }

  if (!scene.textures.exists(TextureKeys.Villager)) {
    const tex = scene.textures.createCanvas(TextureKeys.Villager, TILE, TILE);
    if (tex) {
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, TILE, TILE);
      // A figure asleep on the ground, lying horizontally, with a soft shadow.
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(2, 12, 12, 2);
      rect(ctx, 0, 5, 6, 9, 5, '#7c6f9c'); // blanket / body
      rect(ctx, 0, 5, 8, 9, 1, '#6a5e88'); // fold
      rect(ctx, 0, 3, 6, 3, 4, '#e8c39e'); // head
      rect(ctx, 0, 3, 5, 3, 2, '#5b3a29'); // hair
      rect(ctx, 0, 13, 3, 1, 1, '#cfd2e0'); // sleepy 'z'
      rect(ctx, 0, 14, 2, 1, 1, '#cfd2e0');
      tex.refresh();
    }
  }
}

/**
 * Tileset laid out left-to-right so tile index matches column:
 * 0 grass · 1 path · 2 wall/tree · 3 water · 4 vine. Matches the Tile enum.
 */
function generateTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Tiles)) return;
  const count = 5;
  const tex = scene.textures.createCanvas(TextureKeys.Tiles, TILE * count, TILE);
  if (!tex) return;
  const ctx = tex.getContext();

  drawGrass(ctx, 0 * TILE);
  drawPath(ctx, 1 * TILE);
  drawWall(ctx, 2 * TILE);
  drawWater(ctx, 3 * TILE);
  drawVine(ctx, 4 * TILE);

  tex.refresh();
}

function rect(ctx: CanvasRenderingContext2D, ox: number, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(ox + x, y, w, h);
}

function drawGrass(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#3f6b43');
  rect(ctx, ox, 8, 0, 8, 8, '#3a6240');
  rect(ctx, ox, 0, 8, 8, 8, '#3a6240');
  for (const [x, y] of [[2, 3], [11, 5], [6, 11], [13, 13]] as const) rect(ctx, ox, x, y, 1, 2, '#34593a');
  for (const [x, y] of [[5, 6], [12, 2], [3, 12], [9, 9]] as const) rect(ctx, ox, x, y, 1, 1, '#4a7d4f');
}

function drawPath(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#8a6b45');
  for (const [x, y] of [[3, 4], [10, 6], [6, 11], [13, 2], [9, 13]] as const) rect(ctx, ox, x, y, 1, 1, '#75582f');
  for (const [x, y] of [[5, 7], [12, 10], [2, 12]] as const) rect(ctx, ox, x, y, 1, 1, '#a08254');
}

function drawWall(ctx: CanvasRenderingContext2D, ox: number): void {
  // A leafy tree/hedge block.
  rect(ctx, ox, 0, 0, TILE, TILE, '#1f3a26');
  rect(ctx, ox, 2, 2, 12, 11, '#2c5036');
  rect(ctx, ox, 4, 1, 8, 3, '#35613f');
  for (const [x, y] of [[3, 4], [10, 5], [6, 8], [11, 10], [5, 11]] as const) rect(ctx, ox, x, y, 2, 2, '#3f7049');
  rect(ctx, ox, 7, 13, 2, 3, '#4a3527'); // trunk
}

function drawWater(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#2f6fb0');
  rect(ctx, ox, 0, 0, TILE, 8, '#3a7cc0');
  for (const y of [3, 9, 13] as const) rect(ctx, ox, 2, y, 6, 1, '#6aa6da');
  for (const y of [6, 11] as const) rect(ctx, ox, 9, y, 5, 1, '#6aa6da');
}

function drawVine(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#2c4a26');
  // Tangled brambles.
  for (const [x, y] of [[2, 2], [6, 4], [10, 2], [13, 6], [4, 9], [8, 11], [12, 12], [3, 13]] as const) rect(ctx, ox, x, y, 2, 2, '#5b7d33');
  for (const [x, y] of [[5, 6], [9, 8], [11, 4], [2, 11]] as const) rect(ctx, ox, x, y, 1, 1, '#7fa64a');
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
