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
  Bramblewerth: 'bramblewerth',
  GreatBell: 'great_bell',
  VillagerAwake: 'villager_awake',
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
  generateBramblewerth(scene);
  generateGreatBell(scene);
  generateVillagerAwake(scene);
}

/** The great shrine bell — large brass bell on a frame. */
function generateGreatBell(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.GreatBell)) return;
  const tex = scene.textures.createCanvas(TextureKeys.GreatBell, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  rect(ctx, 0, 2, 1, 12, 1, '#6b5a3a'); // beam
  rect(ctx, 0, 7, 2, 2, 1, '#8a6f24'); // hanger
  rect(ctx, 0, 5, 3, 6, 7, '#c9a23a'); // bell body
  rect(ctx, 0, 4, 9, 8, 2, '#c9a23a'); // flared rim
  rect(ctx, 0, 6, 4, 2, 5, '#e3c66a'); // highlight
  rect(ctx, 0, 4, 11, 8, 1, '#8a6f24'); // rim shadow
  rect(ctx, 0, 7, 12, 2, 2, '#8a6f24'); // clapper
  tex.refresh();
}

/** An awake villager — upright, eyes open (used when the valley wakes). */
function generateVillagerAwake(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.VillagerAwake)) return;
  const tex = scene.textures.createCanvas(TextureKeys.VillagerAwake, TILE, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(5, 14, 6, 1);
  rect(ctx, 0, 6, 2, 4, 2, '#5b3a29'); // hair
  rect(ctx, 0, 6, 3, 4, 4, '#e8c39e'); // head
  rect(ctx, 0, 7, 5, 1, 1, '#222'); // eyes
  rect(ctx, 0, 9, 5, 1, 1, '#222');
  rect(ctx, 0, 5, 7, 6, 6, '#7c6f9c'); // body
  rect(ctx, 0, 4, 8, 1, 3, '#e8c39e'); // arms
  rect(ctx, 0, 11, 8, 1, 3, '#e8c39e');
  rect(ctx, 0, 6, 13, 1, 2, '#4a3f5e'); // legs
  rect(ctx, 0, 9, 13, 1, 2, '#4a3f5e');
  tex.refresh();
}

/** The boss: a 32x32 thorny bramble-beast with a reddish core (the weak point). */
function generateBramblewerth(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Bramblewerth)) return;
  const S = 32;
  const tex = scene.textures.createCanvas(TextureKeys.Bramblewerth, S, S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, S, S);
  // Body mass.
  rect(ctx, 0, 5, 7, 22, 20, '#2f4d22');
  rect(ctx, 0, 7, 5, 18, 2, '#2f4d22');
  rect(ctx, 0, 3, 9, 2, 16, '#2f4d22');
  rect(ctx, 0, 27, 9, 2, 16, '#2f4d22');
  // Mottling.
  for (const [x, y] of [[8, 10], [18, 11], [12, 20], [22, 22], [9, 24]] as const) rect(ctx, 0, x, y, 3, 3, '#3a5e2a');
  // Thorns around the edge.
  for (const [x, y] of [[15, 3], [4, 6], [27, 6], [2, 16], [28, 16], [6, 27], [25, 27], [15, 29]] as const) {
    rect(ctx, 0, x, y, 2, 2, '#1f3a18');
  }
  // Armored core (the weak point).
  rect(ctx, 0, 12, 13, 8, 8, '#7a2f2f');
  rect(ctx, 0, 13, 14, 6, 6, '#c0432b');
  rect(ctx, 0, 15, 16, 2, 2, '#ff8a5a');
  // Eyes.
  rect(ctx, 0, 10, 11, 2, 2, '#ffe39a');
  rect(ctx, 0, 20, 11, 2, 2, '#ffe39a');
  tex.refresh();
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
  // Ground shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(4, 14, 8, 1);
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
 * Tileset. Indices 0-4 match the Tile enum (grass/path/wall/water/vine); extra
 * grass variants + a flower tile are appended so the ground can be scattered
 * for an organic look instead of a flat checker (see TilemapBuilder).
 */
export const GRASS_VARIANT_INDICES = [0, 5, 6];
export const FLOWER_TILE_INDEX = 7;
const TILESET_COUNT = 8;

function generateTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Tiles)) return;
  const tex = scene.textures.createCanvas(TextureKeys.Tiles, TILE * TILESET_COUNT, TILE);
  if (!tex) return;
  const ctx = tex.getContext();

  drawGrass(ctx, 0 * TILE, 0);
  drawPath(ctx, 1 * TILE);
  drawWall(ctx, 2 * TILE);
  drawWater(ctx, 3 * TILE);
  drawVine(ctx, 4 * TILE);
  drawGrass(ctx, 5 * TILE, 1);
  drawGrass(ctx, 6 * TILE, 2);
  drawFlowers(ctx, 7 * TILE);

  tex.refresh();
}

function rect(ctx: CanvasRenderingContext2D, ox: number, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(ox + x, y, w, h);
}

const GRASS_BASE = ['#4a7a43', '#46763f', '#4e7e47'];
const GRASS_MOTTLE: { dark: ReadonlyArray<readonly [number, number]>; light: ReadonlyArray<readonly [number, number]>; tuft: ReadonlyArray<readonly [number, number]> }[] = [
  { dark: [[3, 2], [10, 5], [6, 11], [13, 9]], light: [[5, 6], [12, 3], [8, 13]], tuft: [[2, 9], [14, 6]] },
  { dark: [[5, 4], [11, 9], [3, 13]], light: [[8, 3], [13, 11], [6, 7]], tuft: [[10, 12], [4, 5]] },
  { dark: [[7, 3], [12, 7], [4, 11]], light: [[3, 5], [9, 9], [14, 13]], tuft: [[6, 13], [11, 4]] },
];

function drawGrass(ctx: CanvasRenderingContext2D, ox: number, variant: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, GRASS_BASE[variant]);
  const m = GRASS_MOTTLE[variant];
  for (const [x, y] of m.dark) rect(ctx, ox, x, y, 1, 1, '#3c6537');
  for (const [x, y] of m.light) rect(ctx, ox, x, y, 1, 1, '#5e8e51');
  for (const [x, y] of m.tuft) rect(ctx, ox, x, y, 1, 2, '#74a35d');
}

function drawFlowers(ctx: CanvasRenderingContext2D, ox: number): void {
  drawGrass(ctx, ox, 0);
  // A couple of little blooms.
  rect(ctx, ox, 4, 6, 1, 2, '#3c6537'); // stem
  rect(ctx, ox, 3, 5, 3, 1, '#e8d36a');
  rect(ctx, ox, 4, 4, 1, 1, '#fff0a8');
  rect(ctx, ox, 11, 10, 1, 2, '#3c6537');
  rect(ctx, ox, 10, 9, 3, 1, '#d98cae');
  rect(ctx, ox, 11, 8, 1, 1, '#f3c4da');
}

function drawPath(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#9a7a4e'); // warm dirt
  for (const [x, y] of [[2, 3], [9, 5], [5, 10], [12, 2], [8, 13], [13, 9]] as const) rect(ctx, ox, x, y, 1, 1, '#7e5f37');
  for (const [x, y] of [[4, 6], [11, 11], [6, 2], [14, 5]] as const) rect(ctx, ox, x, y, 1, 1, '#b5966a');
  for (const [x, y] of [[3, 8], [10, 7]] as const) rect(ctx, ox, x, y, 2, 1, '#6e5230'); // pebbles
}

function drawWall(ctx: CanvasRenderingContext2D, ox: number): void {
  // Leafy tree/hedge with an outline so the forest border reads against grass.
  rect(ctx, ox, 0, 0, TILE, TILE, '#243a26'); // shaded floor / gaps
  rect(ctx, ox, 1, 1, 14, 13, '#1b3320'); // dark outline
  rect(ctx, ox, 2, 2, 12, 11, '#2f5639'); // canopy mid
  rect(ctx, ox, 3, 2, 9, 4, '#3f6e49'); // lit top
  for (const [x, y] of [[4, 4], [10, 5], [6, 8], [11, 9], [5, 11]] as const) rect(ctx, ox, x, y, 2, 2, '#508059');
  rect(ctx, ox, 7, 13, 2, 3, '#3a2a1c'); // trunk
}

function drawWater(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#3a78b8');
  rect(ctx, ox, 0, 0, TILE, 7, '#4a8ac8'); // lit upper
  rect(ctx, ox, 0, 0, TILE, 2, '#9fc7e8'); // foam edge
  for (const y of [4, 9, 13] as const) rect(ctx, ox, 2, y, 6, 1, '#6aa6da');
  for (const y of [6, 11] as const) rect(ctx, ox, 9, y, 5, 1, '#6aa6da');
}

function drawVine(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#2c4a26');
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

  // Soft ground shadow so the character sits in the world.
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(ox + 4, oy + 15, 8, 1);

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
