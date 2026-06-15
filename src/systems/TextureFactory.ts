import Phaser from 'phaser';
import { RENDER_SCALE } from '../data/render';

/**
 * TextureFactory — generates placeholder art at runtime so we never block on
 * real assets (project convention). Authored in 16px "design" units; the
 * drawing context is pre-scaled by RENDER_SCALE so every texture is produced at
 * native (world) size and displays 1:1 alongside the high-res player art.
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
  Brambleback: 'brambleback',
  MushroomFolk: 'mushroom_folk',
  Barbhound: 'barbhound',
  Gloommoth: 'gloommoth',
  Blade: 'blade',
  Handbell: 'handbell',
  Cairn: 'cairn',
  Coin: 'coin',
  HouseCottage: 'house-cottage',
  HouseStone: 'house-stone',
  HouseRuin: 'house-ruin',
  ItemPreserve: 'item-preserve',
  ItemDraught: 'item-draught',
  ItemCharm: 'item-charm',
} as const;

const FRAME = 16; // player placeholder frame size, design px
const TILE = 16; // tileset tile size, design px

type Dir = 'down' | 'side' | 'up';

interface Made {
  tex: Phaser.Textures.CanvasTexture;
  ctx: CanvasRenderingContext2D;
}

/** Create a canvas texture `w x h` design units, drawn at native (x scale) size. */
function makeTexture(scene: Phaser.Scene, key: string, w: number, h: number): Made | null {
  const tex = scene.textures.createCanvas(key, w * RENDER_SCALE, h * RENDER_SCALE);
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(RENDER_SCALE, RENDER_SCALE);
  return { tex, ctx };
}

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
  generateBrambleback(scene);
  generateMushroomFolk(scene);
  generateBarbhound(scene);
  generateGloommoth(scene);
  generateBlade(scene);
  generateHandbell(scene);
  generateCairn(scene);
  generateCoin(scene);
  generateHouses(scene);
  generateShopItems(scene);
}

/** Small inventory/shop icons for the consumables + charm. */
function generateShopItems(scene: Phaser.Scene): void {
  // Bell-pear preserve: a stout jar of amber jam with a cloth lid.
  if (!scene.textures.exists(TextureKeys.ItemPreserve)) {
    const m = makeTexture(scene, TextureKeys.ItemPreserve, TILE, TILE);
    if (m) {
      const { tex, ctx } = m;
      rect(ctx, 0, 4, 6, 8, 8, '#b9762a'); // jam
      rect(ctx, 0, 4, 5, 8, 1, '#d68f3f'); // shine band
      rect(ctx, 0, 5, 4, 6, 1, '#caa15f'); // glass rim
      rect(ctx, 0, 4, 3, 8, 2, '#cdd6b0'); // cloth lid
      rect(ctx, 0, 7, 7, 2, 2, '#7a4a1c'); // fruit chunk
      tex.refresh();
    }
  }
  // Resonant draught: a round-bottomed flask of teal liquid.
  if (!scene.textures.exists(TextureKeys.ItemDraught)) {
    const m = makeTexture(scene, TextureKeys.ItemDraught, TILE, TILE);
    if (m) {
      const { tex, ctx } = m;
      rect(ctx, 0, 7, 2, 2, 3, '#9aa6b0'); // neck
      rect(ctx, 0, 4, 5, 8, 9, '#2f8f9c'); // body glass
      rect(ctx, 0, 5, 8, 6, 5, '#46c0cf'); // liquid
      rect(ctx, 0, 6, 9, 1, 3, '#9fe6ef'); // glint
      rect(ctx, 0, 6, 2, 4, 1, '#c9b08a'); // cork
      tex.refresh();
    }
  }
  // Sproutling charm: a green sprout pendant on a cord.
  if (!scene.textures.exists(TextureKeys.ItemCharm)) {
    const m = makeTexture(scene, TextureKeys.ItemCharm, TILE, TILE);
    if (m) {
      const { tex, ctx } = m;
      rect(ctx, 0, 7, 2, 2, 6, '#8a6f3a'); // cord
      rect(ctx, 0, 6, 5, 4, 7, '#6b4a2a'); // wood disc
      rect(ctx, 0, 7, 6, 2, 5, '#8a6a3e');
      rect(ctx, 0, 7, 8, 2, 3, '#4a8c3a'); // sprout stem
      rect(ctx, 0, 6, 6, 1, 2, '#5fae4a'); // leaf
      rect(ctx, 0, 9, 6, 1, 2, '#5fae4a');
      tex.refresh();
    }
  }
}

const HOUSE_W = 44;
const HOUSE_H = 52;

interface HousePalette {
  wall: string;
  wallShade: string;
  roof: string;
  roofShade: string;
  ridge: string;
  ruin?: boolean;
}

/** A small medieval house, overgrown and weathered. Origin sits near its base. */
function generateHouse(scene: Phaser.Scene, key: string, o: HousePalette): void {
  if (scene.textures.exists(key)) return;
  const made = makeTexture(scene, key, HOUSE_W, HOUSE_H);
  if (!made) return;
  const { tex, ctx } = made;
  const R = (x: number, y: number, w: number, h: number, c: string): void => rect(ctx, 0, x, y, w, h, c);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(8, HOUSE_H - 3, HOUSE_W - 16, 2); // ground shadow

  // Walls (plaster/stone with timber framing + a stone foundation).
  const wx = 6;
  const ww = 32;
  const wy = 22;
  const wh = 28;
  R(wx, wy, ww, wh, o.wall);
  R(wx, wy, ww, 2, o.wallShade); // shade under the eaves
  R(wx, wy + wh - 3, ww, 3, o.wallShade); // foundation
  for (const bx of [wx + 4, wx + 15, wx + 26]) R(bx, wy + 2, 1, wh - 5, o.roofShade); // beams
  R(wx, wy + 12, ww, 1, o.roofShade); // mid rail
  // Window (cross-framed).
  R(wx + 3, wy + 6, 6, 7, '#2b2f3a');
  R(wx + 5, wy + 6, 1, 7, o.wall);
  R(wx + 3, wy + 9, 6, 1, o.wall);
  // Door.
  R(wx + 18, wy + 15, 7, 13, '#3a281a');
  R(wx + 18, wy + 15, 7, 1, o.roofShade);
  R(wx + 23, wy + 22, 1, 1, '#caa23a'); // knob

  // Gabled roof (peak → base), with overhang, ridge, and shingle lines.
  const peakX = HOUSE_W / 2;
  const peakY = 2;
  const baseY = 24;
  const half = 21;
  for (let y = peakY; y <= baseY; y++) {
    const hw = Math.round(((y - peakY) / (baseY - peakY)) * half);
    R(peakX - hw, y, hw * 2, 1, o.roof);
  }
  R(peakX - 1, peakY, 2, baseY - peakY, o.ridge); // ridge beam
  R(peakX - half, baseY, half * 2, 2, o.roofShade); // eaves
  for (let y = peakY + 3; y < baseY; y += 3) {
    const hw = Math.round(((y - peakY) / (baseY - peakY)) * half);
    R(peakX - hw + 1, y, hw * 2 - 2, 1, o.roofShade);
  }
  R(HOUSE_W - 12, 0, 5, 14, '#7a5246'); // chimney
  R(HOUSE_W - 12, 0, 5, 2, '#8f6356');

  // Overgrown: moss on eaves + base, a vine up the wall, grass tufts.
  for (const [x, y] of [[wx + 1, wy + wh - 6], [wx + ww - 3, wy + wh - 6], [peakX - half + 2, baseY - 2], [peakX + half - 4, baseY - 3]] as const) {
    R(x, y, 2, 2, '#5e8e51');
  }
  for (let y = wy + 2; y < wy + wh - 2; y += 3) R(wx + 1, y, 1, 2, '#4a7340'); // climbing vine
  for (const [x, y] of [[wx, wy + 8], [wx + 2, wy + 14], [wx, wy + 20]] as const) R(x, y, 2, 1, '#5e8e51');
  for (const [x, y] of [[wx - 2, wy + wh - 2], [wx + ww, wy + wh - 3]] as const) R(x, y, 2, 2, '#5e8e51');

  if (o.ruin) {
    ctx.clearRect(peakX - 6, peakY + 5, 8, 7); // a hole knocked in the roof
    R(peakX - 6, peakY + 5, 8, 1, o.roofShade); // charred rim
    R(wx + 9, wy + 16, 1, 11, '#2b2f3a'); // a crack down the wall
    for (const [x, y] of [[wx + 6, wy + 4], [wx + 20, wy + 6], [wx + ww - 6, wy + 18]] as const) R(x, y, 3, 2, '#4a7340'); // extra moss
  }
  tex.refresh();
}

function generateHouses(scene: Phaser.Scene): void {
  generateHouse(scene, TextureKeys.HouseCottage, {
    wall: '#bda687', wallShade: '#8f7a5c', roof: '#a9803f', roofShade: '#6e4a28', ridge: '#caa15f',
  });
  generateHouse(scene, TextureKeys.HouseStone, {
    wall: '#9a958c', wallShade: '#6f6a61', roof: '#5a6470', roofShade: '#3e454e', ridge: '#7c8896',
  });
  generateHouse(scene, TextureKeys.HouseRuin, {
    wall: '#8a8174', wallShade: '#5e564b', roof: '#6b5e44', roofShade: '#473d2c', ridge: '#857650', ruin: true,
  });
}

/** A small round gold coin with a highlight — the enemy loot drop. */
function generateCoin(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Coin)) return;
  const made = makeTexture(scene, TextureKeys.Coin, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(6, 12, 5, 1); // shadow
  rect(ctx, 0, 6, 4, 5, 6, '#b8841f'); // outer rim
  rect(ctx, 0, 5, 5, 7, 4, '#e9b53b'); // gold face
  rect(ctx, 0, 7, 5, 3, 4, '#f6d873'); // inner highlight
  rect(ctx, 0, 7, 6, 1, 1, '#fff3c4'); // glint
  rect(ctx, 0, 8, 6, 1, 2, '#a8761b'); // engraved mark
  tex.refresh();
}

/** A lean thorn-hound: low slung body, long snout — the charger. */
function generateBarbhound(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Barbhound)) return;
  const made = makeTexture(scene, TextureKeys.Barbhound, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(2, 14, 12, 1); // shadow
  rect(ctx, 0, 2, 8, 11, 4, '#4a3320'); // long body
  rect(ctx, 0, 12, 7, 3, 3, '#4a3320'); // snout
  rect(ctx, 0, 3, 11, 1, 3, '#3a2718'); // legs
  rect(ctx, 0, 9, 11, 1, 3, '#3a2718');
  // Barbs along the spine.
  for (const x of [3, 5, 7, 9] as const) rect(ctx, 0, x, 6, 1, 2, '#6b4a2a');
  rect(ctx, 0, 13, 8, 1, 1, '#ff7a4a'); // eye
  tex.refresh();
}

/** A small four-winged moth: dusky body, pale wings, glowing eye — the swarmer. */
function generateGloommoth(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Gloommoth)) return;
  const made = makeTexture(scene, TextureKeys.Gloommoth, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  rect(ctx, 0, 7, 5, 2, 7, '#3a3550'); // body
  // Wings.
  rect(ctx, 0, 3, 5, 3, 4, '#8d86b0');
  rect(ctx, 0, 10, 5, 3, 4, '#8d86b0');
  rect(ctx, 0, 4, 6, 1, 2, '#b7b1d6'); // wing highlights
  rect(ctx, 0, 11, 6, 1, 2, '#b7b1d6');
  rect(ctx, 0, 7, 5, 2, 1, '#c8f06a'); // glowing eye-spot
  tex.refresh();
}

/** A small stacked-stone cairn — marks a point of interest (examine for lore). */
function generateCairn(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Cairn)) return;
  const made = makeTexture(scene, TextureKeys.Cairn, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(4, 14, 8, 1); // shadow
  rect(ctx, 0, 4, 11, 8, 3, '#8a8470'); // base stone
  rect(ctx, 0, 5, 8, 6, 3, '#9b9580'); // middle stone
  rect(ctx, 0, 6, 5, 4, 3, '#aaa491'); // top stone
  rect(ctx, 0, 4, 11, 8, 1, '#6f6a59'); // base shading
  rect(ctx, 0, 6, 5, 1, 2, '#c8c2ad'); // top highlight
  rect(ctx, 0, 7, 6, 2, 1, '#6fae8a'); // moss
  tex.refresh();
}

/** A small sword lying point-up — the blade pickup (unlocks attack). */
function generateBlade(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Blade)) return;
  const made = makeTexture(scene, TextureKeys.Blade, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(5, 14, 6, 1); // shadow
  rect(ctx, 0, 7, 1, 2, 9, '#cdd3dc'); // blade
  rect(ctx, 0, 8, 1, 1, 8, '#eef2f7'); // edge highlight
  rect(ctx, 0, 5, 10, 6, 1, '#7a5a32'); // crossguard
  rect(ctx, 0, 7, 11, 2, 3, '#5a3d28'); // grip
  rect(ctx, 0, 7, 14, 2, 1, '#caa23a'); // pommel
  tex.refresh();
}

/** A small handbell with a handle — distinct from the large framed GreatBell. */
function generateHandbell(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Handbell)) return;
  const made = makeTexture(scene, TextureKeys.Handbell, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(5, 14, 6, 1); // shadow
  rect(ctx, 0, 7, 2, 2, 3, '#5a3d28'); // handle
  rect(ctx, 0, 6, 5, 4, 5, '#c9a23a'); // bell body
  rect(ctx, 0, 7, 5, 2, 1, '#e3c66a'); // highlight
  rect(ctx, 0, 5, 9, 6, 1, '#8a6f24'); // flared rim
  rect(ctx, 0, 7, 11, 2, 2, '#8a6f24'); // clapper
  tex.refresh();
}

/** An armored bramble-bruiser: stone plates over a thorn body (the ring-to-stun foe). */
function generateBrambleback(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Brambleback)) return;
  const made = makeTexture(scene, TextureKeys.Brambleback, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(3, 14, 10, 1); // shadow
  // Thorn body.
  rect(ctx, 0, 3, 7, 10, 6, '#2f4d22');
  rect(ctx, 0, 4, 6, 8, 1, '#2f4d22');
  // Stone armor plates on the back (the "you can't hit this" read).
  rect(ctx, 0, 4, 5, 8, 3, '#8a8470');
  rect(ctx, 0, 5, 4, 6, 2, '#a9a48f');
  rect(ctx, 0, 4, 5, 1, 3, '#6f6a59'); // plate seams
  rect(ctx, 0, 8, 5, 1, 3, '#6f6a59');
  rect(ctx, 0, 11, 5, 1, 3, '#6f6a59');
  // Thorns poking past the armor.
  for (const [x, y] of [[2, 8], [13, 8], [4, 12], [11, 12], [7, 3]] as const) rect(ctx, 0, x, y, 2, 2, '#1f3a18');
  // Low, grumpy eyes.
  rect(ctx, 0, 5, 11, 1, 1, '#ffd24a');
  rect(ctx, 0, 10, 11, 1, 1, '#ffd24a');
  tex.refresh();
}

/** A toadstool-folk: spotted cap, pale stem — telegraphs a big overhead (dodge teacher). */
function generateMushroomFolk(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.MushroomFolk)) return;
  const made = makeTexture(scene, TextureKeys.MushroomFolk, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(4, 14, 8, 1); // shadow
  // Stem / body.
  rect(ctx, 0, 6, 8, 4, 5, '#e6dcc2');
  rect(ctx, 0, 6, 11, 1, 1, '#222'); // eyes
  rect(ctx, 0, 9, 11, 1, 1, '#222');
  // Cap.
  rect(ctx, 0, 4, 4, 8, 4, '#b8412f');
  rect(ctx, 0, 3, 6, 10, 2, '#9c3526');
  rect(ctx, 0, 6, 3, 4, 1, '#cf5a44'); // cap highlight
  // Spots.
  for (const [x, y] of [[5, 5], [9, 5], [7, 6], [11, 6]] as const) rect(ctx, 0, x, y, 1, 1, '#f2e7cf');
  tex.refresh();
}

/** The great shrine bell — large brass bell on a frame. */
function generateGreatBell(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.GreatBell)) return;
  const made = makeTexture(scene, TextureKeys.GreatBell, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
  rect(ctx, 0, 2, 1, 12, 1, '#6b5a3a'); // beam
  rect(ctx, 0, 7, 2, 2, 1, '#8a6f24'); // hanger
  rect(ctx, 0, 5, 3, 6, 7, '#c9a23a'); // bell body
  rect(ctx, 0, 4, 9, 8, 2, '#c9a23a'); // flared rim
  rect(ctx, 0, 6, 4, 2, 5, '#e3c66a'); // highlight
  rect(ctx, 0, 4, 11, 8, 1, '#8a6f24'); // rim shadow
  rect(ctx, 0, 7, 12, 2, 2, '#8a6f24'); // clapper
  tex.refresh();
}

/** Distinct villager palettes [shirt, legs, hair] so the folk read apart. */
const VILLAGER_PALETTES: [string, string, string][] = [
  ['#7c6f9c', '#4a3f5e', '#5b3a29'], // 0 plum (default)
  ['#a35a45', '#5e342a', '#3a2a1c'], // 1 rust
  ['#5a8c5e', '#3a5e3a', '#7a4a2a'], // 2 green
  ['#4f7396', '#34506e', '#2a2a3a'], // 3 blue
  ['#b39248', '#6e5a2e', '#5b3a29'], // 4 ochre
  ['#9c6f8c', '#5e3a5a', '#3a2a3a'], // 5 mauve
  ['#5c8c8c', '#3a5e5e', '#4a3a2a'], // 6 teal
];

/** Number of distinct awake-villager color variants. */
export const VILLAGER_VARIANTS = VILLAGER_PALETTES.length;

/** Texture key for awake-villager color variant `i` (wraps). */
export function villagerAwakeKey(i: number): string {
  const v = ((i % VILLAGER_VARIANTS) + VILLAGER_VARIANTS) % VILLAGER_VARIANTS;
  return v === 0 ? TextureKeys.VillagerAwake : `villager-awake-${v}`;
}

/** An awake villager — upright, eyes open. Generates each color variant. */
function generateVillagerAwake(scene: Phaser.Scene): void {
  VILLAGER_PALETTES.forEach(([shirt, legs, hair], i) => {
    const key = villagerAwakeKey(i);
    if (scene.textures.exists(key)) return;
    const made = makeTexture(scene, key, TILE, TILE);
    if (!made) return;
    const { tex, ctx } = made;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(5, 14, 6, 1);
    rect(ctx, 0, 6, 2, 4, 2, hair); // hair
    rect(ctx, 0, 6, 3, 4, 4, '#e8c39e'); // head
    rect(ctx, 0, 7, 5, 1, 1, '#222'); // eyes
    rect(ctx, 0, 9, 5, 1, 1, '#222');
    rect(ctx, 0, 5, 7, 6, 6, shirt); // body / shirt
    rect(ctx, 0, 4, 8, 1, 3, '#e8c39e'); // arms
    rect(ctx, 0, 11, 8, 1, 3, '#e8c39e');
    rect(ctx, 0, 6, 13, 1, 2, legs); // legs
    rect(ctx, 0, 9, 13, 1, 2, legs);
    tex.refresh();
  });
}

/** The boss: a 32x32 thorny bramble-beast with a reddish core (the weak point). */
function generateBramblewerth(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Bramblewerth)) return;
  const S = 32;
  const made = makeTexture(scene, TextureKeys.Bramblewerth, S, S);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.Chime, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.BossDoor, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.HeartFragment, 9, 8);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.Hearth, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.Fog, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.StunStars, 16, 7);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.ThornSprite, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
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
  const made = makeTexture(scene, TextureKeys.Hearts, w * 3, h);
  if (!made) return;
  const { tex, ctx } = made;

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

  // Frames are in native (scaled) texture pixels.
  const S = RENDER_SCALE;
  tex.add('full', 0, 0, 0, w * S, h * S);
  tex.add('half', 0, w * S, 0, w * S, h * S);
  tex.add('empty', 0, w * 2 * S, 0, w * S, h * S);
  tex.refresh();
}

/** A crescent swing VFX, drawn pointing +x; rotated per facing at runtime. */
function generateSlash(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Slash)) return;
  const made = makeTexture(scene, TextureKeys.Slash, TILE, TILE);
  if (!made) return;
  const { tex, ctx } = made;
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
    const made = makeTexture(scene, TextureKeys.Vine, TILE, TILE);
    if (made) {
      const { tex, ctx } = made;
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
    const made = makeTexture(scene, TextureKeys.Villager, TILE, TILE);
    if (made) {
      const { tex, ctx } = made;
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
export const COBBLE_TILE_INDEX = 8;
const TILESET_COUNT = 11;

function generateTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TextureKeys.Tiles)) return;
  const made = makeTexture(scene, TextureKeys.Tiles, TILE * TILESET_COUNT, TILE);
  if (!made) return;
  const { tex, ctx } = made;

  drawGrass(ctx, 0 * TILE, 0);
  drawPath(ctx, 1 * TILE);
  drawWall(ctx, 2 * TILE);
  drawWater(ctx, 3 * TILE);
  drawVine(ctx, 4 * TILE);
  drawGrass(ctx, 5 * TILE, 1);
  drawGrass(ctx, 6 * TILE, 2);
  drawFlowers(ctx, 7 * TILE);
  drawCobble(ctx, 8 * TILE);
  drawPlank(ctx, 9 * TILE);
  drawTimber(ctx, 10 * TILE);

  tex.refresh();
}

/**
 * Replace the walkable tiles (grass + sand) in the generated tileset with real
 * 64px art from an uploaded grass/sand tileset, keeping the procedural tree-wall
 * (index 2), water (index 3), and vine (index 4). Call after the terrain image
 * loads. The source is a 4×4 grid of 64px tiles with 1px spacing.
 */
export function applyTerrainTileset(scene: Phaser.Scene, terrainKey: string): boolean {
  if (!scene.textures.exists(terrainKey) || !scene.textures.exists(TextureKeys.Tiles)) return false;
  const tex = scene.textures.get(TextureKeys.Tiles);
  if (!(tex instanceof Phaser.Textures.CanvasTexture)) return false;
  const src = scene.textures.get(terrainKey).getSourceImage() as CanvasImageSource;

  const SLOT = TILE * RENDER_SCALE; // native tile-slot size in the tileset (64)
  const STEP = 64 + 1; // source: 64px tiles + 1px spacing
  const ctx = tex.getContext();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // generation left the context RENDER_SCALE'd
  ctx.imageSmoothingEnabled = false;
  // Each source tile has a baked-in 1px dark border; crop the inner 62×62 art
  // (offset 1px) and scale it to fill the slot, so tiles have no grid outline.
  const blit = (slot: number, r: number, c: number): void => {
    ctx.drawImage(src, c * STEP + 1, r * STEP + 1, 62, 62, slot * SLOT, 0, SLOT, SLOT);
  };
  blit(0, 0, 0); // plain grass    -> Grass
  blit(1, 2, 0); // sand           -> Path
  blit(GRASS_VARIANT_INDICES[1], 0, 1); // grass variant (slot 5)
  blit(GRASS_VARIANT_INDICES[2], 0, 0); // plain grass   (slot 6 — the striped tile is dropped)
  blit(FLOWER_TILE_INDEX, 1, 2); //       grass + flowers (slot 7)
  ctx.restore();
  tex.refresh();
  return true;
}

/** Edge directions for transition decals. */
export const EDGE_DIRS = ['n', 's', 'e', 'w'] as const;
export type EdgeDir = (typeof EDGE_DIRS)[number];

// 4x4 ordered (Bayer) dither matrix, values 0..15.
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Distance (native px) from the named edge of a `size`-px tile. */
function edgeDepth(dir: EdgeDir, x: number, y: number, size: number): number {
  if (dir === 'n') return y;
  if (dir === 's') return size - 1 - y;
  if (dir === 'e') return size - 1 - x;
  return x; // 'w'
}

/**
 * Generate dithered transition decals: a grass fringe that bleeds over sand/water
 * edges, and a soft shadow fringe at tree bases. The TilemapBuilder overlays
 * these on boundary tiles so terrain types feather together instead of meeting
 * at a hard line. Call after applyTerrainTileset (so the grass art is real).
 */
export function generateEdgeDecals(scene: Phaser.Scene): void {
  const tiles = scene.textures.get(TextureKeys.Tiles);
  if (!(tiles instanceof Phaser.Textures.CanvasTexture)) return;
  const SIZE = TILE * RENDER_SCALE; // 64
  const grass = tiles.getContext().getImageData(0, 0, SIZE, SIZE); // grass slot 0

  const D_FULL = 6; // fully opaque within this many px of the edge
  const GRASS_FADE = 26; // grass fringe reaches this far in
  const SHADOW_FADE = 30;
  const SHADOW_RGB = [18, 30, 20];
  const SHADOW_A = 90;

  // Anti-aliased ordered dither: instead of a hard on/off threshold, return a
  // continuous 0..1 coverage (a smooth ramp across each dither dot's edge) at
  // fade progress t (0 = full, 1 = gone). The partial alpha softens the dither.
  const AA = 0.5; // width of the soft band around each dither threshold
  const coverage = (x: number, y: number, t: number): number => {
    if (t <= 0) return 1;
    if (t >= 1) return 0;
    const threshold = (BAYER4[(y >> 2) & 3][(x >> 2) & 3] + 0.5) / 16;
    return Math.min(1, Math.max(0, (threshold - t) / AA + 0.5));
  };

  const bake = (key: string, dir: EdgeDir, fade: number, color: (i: number) => [number, number, number, number]): void => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, SIZE, SIZE);
    if (!tex) return;
    const out = tex.getContext().createImageData(SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const d = edgeDepth(dir, x, y, SIZE);
        const t = Math.min(1, Math.max(0, (d - D_FULL) / (fade - D_FULL)));
        const cov = coverage(x, y, t);
        if (cov <= 0.01) continue;
        const i = (y * SIZE + x) * 4;
        const [r, g, b, a] = color(i);
        out.data[i] = r;
        out.data[i + 1] = g;
        out.data[i + 2] = b;
        out.data[i + 3] = Math.round(a * cov);
      }
    }
    tex.getContext().putImageData(out, 0, 0);
    tex.refresh();
  };

  for (const dir of EDGE_DIRS) {
    bake(`grass-edge-${dir}`, dir, GRASS_FADE, (i) => [grass.data[i], grass.data[i + 1], grass.data[i + 2], grass.data[i + 3]]);
    bake(`shadow-edge-${dir}`, dir, SHADOW_FADE, () => [SHADOW_RGB[0], SHADOW_RGB[1], SHADOW_RGB[2], SHADOW_A]);
  }
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

function drawCobble(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#55555d'); // dark mortar between stones
  const stones: [number, number, number, number][] = [
    [1, 1, 4, 3], [6, 1, 4, 3], [11, 1, 4, 3],
    [0, 5, 3, 3], [4, 5, 4, 3], [9, 5, 4, 3], [14, 5, 2, 3],
    [1, 9, 4, 3], [6, 9, 4, 3], [11, 9, 4, 3],
    [0, 13, 3, 2], [4, 13, 4, 2], [9, 13, 4, 2], [14, 13, 2, 2],
  ];
  for (const [x, y, w, h] of stones) {
    rect(ctx, ox, x, y, w, h, '#878790'); // worn grey stone
    rect(ctx, ox, x, y, w, 1, '#9c9ca6'); // top highlight
    rect(ctx, ox, x, y + h - 1, w, 1, '#6b6b74'); // bottom shade
  }
  // Moss creeping into the cracks — overgrown, unkempt.
  for (const [x, y] of [[5, 4], [10, 8], [3, 12], [13, 4]] as const) rect(ctx, ox, x, y, 1, 1, '#5e8e51');
  for (const [x, y] of [[8, 0], [0, 8], [13, 11]] as const) rect(ctx, ox, x, y, 1, 2, '#4a7340');
}

function drawPlank(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#7a5536'); // warm wood floor
  rect(ctx, ox, 0, 0, TILE, 1, '#8a6440'); // top board highlight
  for (const y of [5, 10, 15] as const) rect(ctx, ox, 0, y, TILE, 1, '#5e3f28'); // board seams
  for (const [x, y] of [[3, 2], [11, 7], [6, 12]] as const) rect(ctx, ox, x, y, 1, 1, '#5e3f28'); // grain knots
  for (const [x, y] of [[9, 3], [4, 8], [13, 13]] as const) rect(ctx, ox, x, y, 1, 1, '#8a6440');
}

function drawTimber(ctx: CanvasRenderingContext2D, ox: number): void {
  rect(ctx, ox, 0, 0, TILE, TILE, '#5a4632'); // daub
  rect(ctx, ox, 0, 0, 2, TILE, '#3e2f20'); // timber posts
  rect(ctx, ox, 14, 0, 2, TILE, '#3e2f20');
  rect(ctx, ox, 0, 0, TILE, 2, '#3e2f20'); // beams
  rect(ctx, ox, 0, 14, TILE, 2, '#3e2f20');
  rect(ctx, ox, 6, 2, 1, 12, '#4a3826'); // brace
  rect(ctx, ox, 3, 4, 9, 1, '#6b5640');
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
  const made = makeTexture(scene, TextureKeys.Player, FRAME * 2, FRAME * 3);
  if (!made) return;
  const { tex, ctx } = made;

  const rows: Dir[] = ['down', 'side', 'up'];
  rows.forEach((dir, r) => {
    for (let step = 0; step < 2; step++) {
      drawCharacter(ctx, step * FRAME, r * FRAME, dir, step);
    }
  });

  // Frames are in native (scaled) texture pixels.
  const S = RENDER_SCALE;
  const add = (name: string, col: number, row: number): void => {
    tex.add(name, 0, col * FRAME * S, row * FRAME * S, FRAME * S, FRAME * S);
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
