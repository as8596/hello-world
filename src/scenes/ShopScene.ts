import Phaser from 'phaser';
import { ITEMS, MAPLE_STOCK } from '../data/items';
import { RENDER_SCALE as RS } from '../data/render';
import { audio } from '../systems/AudioManager';
import { eventBus } from '../systems/EventBus';
import { addPixelText } from '../systems/PixelFont';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

const COLS = 4;
const SLOT = 42 * RS;

/** Stock lists per shop id. */
const SHOPS: Record<string, string[]> = { maple: MAPLE_STOCK };

/**
 * ShopScene — a trade UI launched from a shopkeeper's dialogue (the `openShop`
 * effect). Shows wares as a grid of icons; the focused item shows its name,
 * description, and price below, and Enter buys it if you can afford it. Buying
 * adjusts WorldState (coin + `item_<id>`) directly and refreshes the HUD.
 */
export class ShopScene extends Phaser.Scene {
  private stock: string[] = [];
  private slots: Phaser.GameObjects.GameObject[] = [];
  private cursor = 0;
  private openedAt = 0;
  private cx = 0;
  private cy = 0;
  private panelH = 0;
  private coinText!: Phaser.GameObjects.BitmapText;
  private detail!: Phaser.GameObjects.BitmapText;
  private feedback!: Phaser.GameObjects.BitmapText;
  private selectBox!: Phaser.GameObjects.Rectangle;
  private gridX0 = 0;
  private gridY0 = 0;

  constructor() {
    super(SceneKeys.Shop);
  }

  init(data: { shopId?: string }): void {
    this.stock = SHOPS[data?.shopId ?? 'maple'] ?? MAPLE_STOCK;
    this.cursor = 0;
  }

  create(): void {
    this.openedAt = this.time.now;
    const W = this.scale.width;
    const H = this.scale.height;
    this.cx = Math.round(W / 2);
    this.cy = Math.round(H / 2);
    this.panelH = 13 * RS * 7;

    this.add.rectangle(0, 0, W, H, 0x10101a, 0.72).setOrigin(0, 0).setScrollFactor(0);
    this.add
      .rectangle(this.cx, this.cy, 200 * RS, this.panelH, 0x1a1a2a, 0.96)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setStrokeStyle(RS, 0xffe066, 0.85);

    addPixelText(this, 0, 0, "MAPLE'S WARES", { color: 0xffe066 })
      .setOrigin(0.5)
      .setScale(1.25)
      .setScrollFactor(0)
      .setPosition(this.cx, Math.round(this.cy - this.panelH / 2 + 16 * RS));

    this.coinText = addPixelText(this, 0, 0, '', { color: 0xffe066 }).setOrigin(1, 0.5).setScrollFactor(0);
    this.coinText.setPosition(this.cx + 92 * RS, Math.round(this.cy - this.panelH / 2 + 16 * RS));

    // Grid of item slots.
    const rows = Math.ceil(this.stock.length / COLS);
    const usedCols = Math.min(COLS, this.stock.length);
    this.gridX0 = this.cx - ((usedCols - 1) * SLOT) / 2;
    this.gridY0 = this.cy - 8 * RS - ((rows - 1) * SLOT) / 2;

    this.selectBox = this.add
      .rectangle(0, 0, SLOT - 4 * RS, SLOT - 4 * RS, 0xffe066, 0.12)
      .setStrokeStyle(RS, 0xffe066, 0.9)
      .setScrollFactor(0);

    this.stock.forEach((id, i) => {
      const item = ITEMS[id];
      const { x, y } = this.slotPos(i);
      this.add.rectangle(x, y, SLOT - 4 * RS, SLOT - 4 * RS, 0x2a2a3a, 0.9).setScrollFactor(0);
      const icon = this.add.image(x, y - 4 * RS, item.texture).setScrollFactor(0).setScale(1.6);
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerover', () => {
        this.cursor = i;
        this.render();
      });
      icon.on('pointerdown', () => {
        this.cursor = i;
        this.buy();
      });
      addPixelText(this, 0, 0, `${item.value}c`, { color: 0xffe066 })
        .setOrigin(0.5)
        .setScale(0.85)
        .setScrollFactor(0)
        .setPosition(x, y + 13 * RS);
      this.slots.push(icon);
    });

    this.detail = addPixelText(this, 0, 0, '', { color: 0xe8e6d8, maxWidth: 180 * RS })
      .setOrigin(0.5)
      .setScale(0.9)
      .setScrollFactor(0);
    this.feedback = addPixelText(this, 0, 0, '', { color: 0x76c44a }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    addPixelText(this, 0, 0, 'Move   Enter Buy   Esc Close', { color: 0x6b6b80 })
      .setOrigin(0.5)
      .setScale(0.62)
      .setScrollFactor(0)
      .setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - 8 * RS));

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1, 0));
    kb.on('keydown-A', () => this.move(-1, 0));
    kb.on('keydown-RIGHT', () => this.move(1, 0));
    kb.on('keydown-D', () => this.move(1, 0));
    kb.on('keydown-UP', () => this.move(0, -1));
    kb.on('keydown-W', () => this.move(0, -1));
    kb.on('keydown-DOWN', () => this.move(0, 1));
    kb.on('keydown-S', () => this.move(0, 1));
    kb.on('keydown-ENTER', () => this.buy());
    kb.on('keydown-SPACE', () => this.buy());
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-TAB', () => this.close());

    this.render();
  }

  private slotPos(i: number): { x: number; y: number } {
    return { x: this.gridX0 + (i % COLS) * SLOT, y: this.gridY0 + Math.floor(i / COLS) * SLOT };
  }

  private move(dx: number, dy: number): void {
    const n = this.stock.length;
    let next = this.cursor;
    if (dx) next = (this.cursor + dx + n) % n;
    else if (dy) next = (this.cursor + dy * COLS + n) % n;
    if (next !== this.cursor) {
      this.cursor = next;
      audio.playSfx('clink');
      this.render();
    }
  }

  private render(): void {
    const { x, y } = this.slotPos(this.cursor);
    this.selectBox.setPosition(x, y);
    this.coinText.setText(`Coin: ${worldState.getCounter('coin')}`);
    const item = ITEMS[this.stock[this.cursor]];
    this.detail.setText(item ? `${item.name} — ${item.value}c\n${item.desc}` : '');
    this.detail.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - 22 * RS));
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
    this.feedback.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - 13 * RS));
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
