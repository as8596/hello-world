import Phaser from 'phaser';
import { ITEMS, MAPLE_STOCK } from '../data/items';
import { RENDER_SCALE as RS } from '../data/render';
import { audio } from '../systems/AudioManager';
import { eventBus } from '../systems/EventBus';
import { addPixelText, type PixelText } from '../systems/PixelFont';
import { itemIcon } from '../systems/TextureFactory';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

const ROW_W = 158 * RS;
const ROW_H = 22 * RS;
const VISIBLE = 5; // rows shown at once; the rest scroll
const PANEL_W = 184 * RS;

/** Stock lists per shop id. */
const SHOPS: Record<string, string[]> = { maple: MAPLE_STOCK };

/**
 * ShopScene — a trade UI launched from a shopkeeper's dialogue (`openShop`).
 * Wares are a scrollable vertical list of buttons: each row is an icon box, the
 * item name, and its price. Up/Down (or the wheel) scroll; Enter/click buys.
 * Buying adjusts WorldState (coin + `item_<id>`) and refreshes the HUD.
 */
export class ShopScene extends Phaser.Scene {
  private stock: string[] = [];
  private cursor = 0;
  private scrollTop = 0;
  private openedAt = 0;
  private cx = 0;
  private cy = 0;
  private panelH = 0;
  private listTop = 0;
  private coinText!: PixelText;
  private detail!: PixelText;
  private feedback!: PixelText;
  private rowObjs: Phaser.GameObjects.GameObject[] = [];
  private thumb?: Phaser.GameObjects.Rectangle;

  constructor() {
    super(SceneKeys.Shop);
  }

  init(data: { shopId?: string }): void {
    this.stock = SHOPS[data?.shopId ?? 'maple'] ?? MAPLE_STOCK;
    this.cursor = 0;
    this.scrollTop = 0;
  }

  create(): void {
    this.openedAt = this.time.now;
    const W = this.scale.width;
    const H = this.scale.height;
    this.cx = Math.round(W / 2);
    this.cy = Math.round(H / 2);
    this.panelH = 26 * RS + VISIBLE * ROW_H + 34 * RS;
    const panelTop = this.cy - this.panelH / 2;
    this.listTop = panelTop + 30 * RS + ROW_H / 2;

    this.add.rectangle(0, 0, W, H, 0x10101a, 0.72).setOrigin(0, 0).setScrollFactor(0);
    this.slice(this.cx, this.cy, PANEL_W, this.panelH, 'ui-window', 30);

    addPixelText(this, 0, 0, "MAPLE'S WARES", { color: 0xffe066, bold: true })
      .setOrigin(0.5)
      .setScale(1.1)
      .setScrollFactor(0)
      .setPosition(this.cx - 24 * RS, Math.round(panelTop + 14 * RS));
    this.coinText = addPixelText(this, 0, 0, '', { color: 0xffe066 }).setOrigin(1, 0.5).setScrollFactor(0);
    this.coinText.setPosition(this.cx + PANEL_W / 2 - 14 * RS, Math.round(panelTop + 14 * RS));

    // Scrollbar track + thumb (right edge of the list).
    const trackX = this.cx + ROW_W / 2 + 6 * RS;
    const trackH = VISIBLE * ROW_H;
    this.add.rectangle(trackX, this.listTop - ROW_H / 2 + trackH / 2, 2 * RS, trackH, 0xffffff, 0.12).setScrollFactor(0);
    this.thumb = this.add.rectangle(trackX, 0, 2 * RS, trackH, 0xffe066, 0.7).setScrollFactor(0);

    this.detail = addPixelText(this, 0, 0, '', { color: 0xe8e6d8, maxWidth: PANEL_W - 24 * RS })
      .setOrigin(0.5, 0)
      .setScale(0.9)
      .setScrollFactor(0);
    this.feedback = addPixelText(this, 0, 0, '', { color: 0x76c44a }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);
    addPixelText(this, 0, 0, 'Up/Down  Enter Buy  Esc Close', { color: 0x6b6b80 })
      .setOrigin(0.5)
      .setScale(0.62)
      .setScrollFactor(0)
      .setPosition(this.cx, Math.round(panelTop + this.panelH - 8 * RS));

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.moveCursor(-1));
    kb.on('keydown-W', () => this.moveCursor(-1));
    kb.on('keydown-DOWN', () => this.moveCursor(1));
    kb.on('keydown-S', () => this.moveCursor(1));
    kb.on('keydown-ENTER', () => this.buy());
    kb.on('keydown-SPACE', () => this.buy());
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-TAB', () => this.close());
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.scrollBy(dy > 0 ? 1 : -1));

    this.render();
  }

  /** A nine-sliced framed panel/button, or a drawn rect if the art is absent. */
  private slice(x: number, y: number, w: number, h: number, tex: string, inset: number): Phaser.GameObjects.GameObject {
    if (this.textures.exists(tex)) {
      return this.add.nineslice(x, y, tex, undefined, w, h, inset, inset, inset, inset).setScrollFactor(0);
    }
    return this.add.rectangle(x, y, w, h, 0x1a1a2a, 0.96).setStrokeStyle(RS, 0xffe066, 0.85).setScrollFactor(0);
  }

  private moveCursor(delta: number): void {
    const next = Phaser.Math.Clamp(this.cursor + delta, 0, this.stock.length - 1);
    if (next === this.cursor) return;
    this.cursor = next;
    if (this.cursor < this.scrollTop) this.scrollTop = this.cursor;
    else if (this.cursor >= this.scrollTop + VISIBLE) this.scrollTop = this.cursor - VISIBLE + 1;
    audio.playSfx('clink');
    this.render();
  }

  private scrollBy(delta: number): void {
    const maxTop = Math.max(0, this.stock.length - VISIBLE);
    const next = Phaser.Math.Clamp(this.scrollTop + delta, 0, maxTop);
    if (next === this.scrollTop) return;
    this.scrollTop = next;
    this.render();
  }

  private render(): void {
    for (const o of this.rowObjs) o.destroy();
    this.rowObjs = [];

    const boxSize = ROW_H - 6 * RS;
    const leftX = this.cx - ROW_W / 2;
    for (let j = 0; j < VISIBLE; j++) {
      const idx = this.scrollTop + j;
      if (idx >= this.stock.length) break;
      const item = ITEMS[this.stock[idx]];
      const y = this.listTop + j * ROW_H;
      const selected = idx === this.cursor;

      // Button background.
      const btn = this.slice(this.cx, y, ROW_W, ROW_H - 4 * RS, 'ui-button', 12);
      this.rowObjs.push(btn);
      if (selected) {
        const hl = this.add
          .rectangle(this.cx, y, ROW_W, ROW_H - 4 * RS, 0xffe066, 0.16)
          .setStrokeStyle(2 * RS, 0xffe066, 0.95)
          .setScrollFactor(0);
        this.rowObjs.push(hl);
      }

      // Icon box on the left, with the item's icon.
      const boxX = leftX + 4 * RS + boxSize / 2;
      const box = this.add
        .rectangle(boxX, y, boxSize, boxSize, 0x12121c, 0.92)
        .setStrokeStyle(RS, 0xffe066, selected ? 0.9 : 0.45)
        .setScrollFactor(0);
      const icon = this.add.image(boxX, y, itemIcon(this, item.texture)).setScrollFactor(0);
      icon.setScale((boxSize - 6 * RS) / Math.max(icon.width, icon.height));

      // Name + price.
      const name = addPixelText(this, boxX + boxSize / 2 + 6 * RS, y, item.name, {
        color: selected ? 0xffffff : 0xd8d8c8,
      })
        .setOrigin(0, 0.5)
        .setScale(0.92)
        .setScrollFactor(0);
      const price = addPixelText(this, this.cx + ROW_W / 2 - 8 * RS, y, `${item.value}c`, { color: 0xffe066 })
        .setOrigin(1, 0.5)
        .setScrollFactor(0);

      // Click/hover the whole row.
      box.setInteractive({ useHandCursor: true });
      const hit = this.add
        .rectangle(this.cx, y, ROW_W, ROW_H - 4 * RS, 0xffffff, 0.001)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        if (this.cursor !== idx) {
          this.cursor = idx;
          this.render();
        }
      });
      hit.on('pointerdown', () => {
        this.cursor = idx;
        this.buy();
      });
      this.rowObjs.push(box, icon, name, price, hit);
    }

    // Scrollbar thumb.
    if (this.thumb) {
      const n = this.stock.length;
      const trackH = VISIBLE * ROW_H;
      const frac = Math.min(1, VISIBLE / n);
      const thumbH = Math.max(8 * RS, trackH * frac);
      const maxTop = Math.max(1, n - VISIBLE);
      const t = this.scrollTop / maxTop;
      const top = this.listTop - ROW_H / 2;
      this.thumb.setSize(2 * RS, thumbH).setVisible(n > VISIBLE);
      this.thumb.setPosition(this.thumb.x, top + (trackH - thumbH) * t + thumbH / 2);
    }

    this.coinText.setText(`Coin: ${worldState.getCounter('coin')}`);
    const sel = ITEMS[this.stock[this.cursor]];
    this.detail.setText(sel ? `${sel.name} — ${sel.value}c\n${sel.desc}` : '');
    this.detail.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - 28 * RS));
  }

  private buy(): void {
    if (this.time.now - this.openedAt < 200) return; // ignore the opening keypress
    const id = this.stock[this.cursor];
    const item = ITEMS[id];
    if (!item) return;
    const coin = worldState.getCounter('coin');
    if (coin < item.value) {
      this.flash('Not enough coin.', 0xc4a24a);
      return;
    }
    worldState.setCounter('coin', coin - item.value);
    worldState.addCounter(`item_${id}`, 1);
    eventBus.emit('coinChanged', { coin: coin - item.value });
    audio.playSfx('chime');
    this.flash(`Bought ${item.name}.`, 0x76c44a);
    this.render();
  }

  private flash(text: string, color: number): void {
    this.feedback.setText(text).setTint(color).setAlpha(1);
    this.feedback.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - 14 * RS));
    this.tweens.killTweensOf(this.feedback);
    this.tweens.add({ targets: this.feedback, alpha: 0, delay: 1100, duration: 600 });
  }

  private close(): void {
    if (this.time.now - this.openedAt < 200) return;
    audio.playSfx('clink');
    this.scene.stop();
    this.scene.resume(SceneKeys.World);
  }
}
