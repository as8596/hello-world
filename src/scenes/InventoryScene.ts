import Phaser from 'phaser';
import { ITEMS } from '../data/items';
import { xpToNext } from '../data/progression';
import { RENDER_SCALE as RS } from '../data/render';
import { audio } from '../systems/AudioManager';
import { eventBus } from '../systems/EventBus';
import { addPixelText, type PixelText } from '../systems/PixelFont';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

const LINE_H = 13 * RS;
const COLS = 5;
const ROWS = 3;
const SLOTS = COLS * ROWS;
const SLOT = 30 * RS;

/**
 * InventoryScene — a pause-style overlay (I / Tab) showing the player's level,
 * XP, coin, and held items in a fixed grid (ready for many more items). The
 * focused item shows its name/description below; consumables are used with Enter
 * (it emits `useItem` to the paused WorldScene, which owns the Player).
 */
export class InventoryScene extends Phaser.Scene {
  private ids: string[] = [];
  private icons: Phaser.GameObjects.Image[] = [];
  private counts: PixelText[] = [];
  private cursor = 0;
  private openedAt = 0;
  private cx = 0;
  private cy = 0;
  private panelH = 0;
  private gridX0 = 0;
  private gridY0 = 0;
  private header!: PixelText;
  private detail!: PixelText;
  private feedback!: PixelText;
  private selectBox!: Phaser.GameObjects.Rectangle;
  private offUsed?: () => void;

  constructor() {
    super(SceneKeys.Inventory);
  }

  create(): void {
    this.openedAt = this.time.now;
    const W = this.scale.width;
    const H = this.scale.height;
    this.cx = Math.round(W / 2);
    this.cy = Math.round(H / 2);
    this.panelH = ROWS * SLOT + 6 * LINE_H;

    this.add.rectangle(0, 0, W, H, 0x10101a, 0.72).setOrigin(0, 0).setScrollFactor(0);
    this.add
      .rectangle(this.cx, this.cy, COLS * SLOT + 16 * RS, this.panelH, 0x1a1a2a, 0.96)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setStrokeStyle(RS, 0xffe066, 0.85);

    addPixelText(this, 0, 0, 'INVENTORY', { color: 0xffe066 })
      .setOrigin(0.5)
      .setScale(1.3)
      .setScrollFactor(0)
      .setPosition(this.cx, Math.round(this.cy - this.panelH / 2 + LINE_H));

    this.header = addPixelText(this, 0, 0, '', { color: 0xe8e6d8 }).setOrigin(0.5).setScrollFactor(0);
    this.header.setPosition(this.cx, Math.round(this.cy - this.panelH / 2 + LINE_H * 2.0));

    // Static grid of slot boxes + the selection highlight.
    this.gridX0 = this.cx - ((COLS - 1) * SLOT) / 2;
    this.gridY0 = this.cy - this.panelH / 2 + LINE_H * 2.9 + SLOT / 2;
    for (let i = 0; i < SLOTS; i++) {
      const { x, y } = this.slotPos(i);
      this.add.rectangle(x, y, SLOT - 4 * RS, SLOT - 4 * RS, 0x2a2a3a, 0.9).setScrollFactor(0);
    }
    this.selectBox = this.add
      .rectangle(0, 0, SLOT - 4 * RS, SLOT - 4 * RS, 0xffe066, 0.12)
      .setStrokeStyle(RS, 0xffe066, 0.9)
      .setScrollFactor(0);

    this.detail = addPixelText(this, 0, 0, '', { color: 0xe8e6d8, maxWidth: (COLS * SLOT) }).setOrigin(0.5, 0).setScale(0.9).setScrollFactor(0);
    this.feedback = addPixelText(this, 0, 0, '', { color: 0x76c44a }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    addPixelText(this, 0, 0, 'Move   Enter Use   I / Esc Close', { color: 0x6b6b80 })
      .setOrigin(0.5)
      .setScale(0.62)
      .setScrollFactor(0)
      .setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - LINE_H * 0.7));

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1, 0));
    kb.on('keydown-A', () => this.move(-1, 0));
    kb.on('keydown-RIGHT', () => this.move(1, 0));
    kb.on('keydown-D', () => this.move(1, 0));
    kb.on('keydown-UP', () => this.move(0, -1));
    kb.on('keydown-W', () => this.move(0, -1));
    kb.on('keydown-DOWN', () => this.move(0, 1));
    kb.on('keydown-S', () => this.move(0, 1));
    kb.on('keydown-ENTER', () => this.use());
    kb.on('keydown-SPACE', () => this.use());
    kb.on('keydown-I', () => this.close());
    kb.on('keydown-TAB', () => this.close());
    kb.on('keydown-ESC', () => this.close());

    this.offUsed = eventBus.on('itemUsed', (p) => this.onItemUsed(p as { id: string; ok: boolean }));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.offUsed?.());

    this.rebuild();
  }

  private slotPos(i: number): { x: number; y: number } {
    return { x: this.gridX0 + (i % COLS) * SLOT, y: this.gridY0 + Math.floor(i / COLS) * SLOT };
  }

  /** Re-read held items + progress and lay out the grid icons. */
  private rebuild(): void {
    this.icons.forEach((o) => o.destroy());
    this.counts.forEach((o) => o.destroy());
    this.icons = [];
    this.counts = [];
    this.ids = Object.keys(ITEMS).filter((id) => worldState.getCounter(`item_${id}`) > 0);

    this.ids.forEach((id, i) => {
      if (i >= SLOTS) return; // overflow guard (paging comes with bigger inventories)
      const { x, y } = this.slotPos(i);
      const item = ITEMS[id];
      const icon = this.add.image(x, y, item.texture).setScale(1.5).setScrollFactor(0);
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerover', () => {
        this.cursor = i;
        this.render();
      });
      icon.on('pointerdown', () => {
        this.cursor = i;
        this.use();
      });
      const n = worldState.getCounter(`item_${id}`);
      const count = addPixelText(this, 0, 0, `${n}`, { color: 0xffe066 })
        .setOrigin(1, 1)
        .setScale(0.8)
        .setScrollFactor(0)
        .setPosition(Math.round(x + SLOT / 2 - 5 * RS), Math.round(y + SLOT / 2 - 4 * RS));
      this.icons.push(icon);
      this.counts.push(count);
    });

    if (this.cursor >= this.ids.length) this.cursor = Math.max(0, this.ids.length - 1);
    this.render();
  }

  private render(): void {
    const level = Math.max(1, worldState.getCounter('level') || 1);
    const xp = worldState.getCounter('xp');
    const coin = worldState.getCounter('coin');
    this.header.setText(`Lv ${level}   XP ${xp}/${xpToNext(level)}   Coin ${coin}`);

    const has = this.ids.length > 0;
    this.selectBox.setVisible(has);
    if (has) {
      const { x, y } = this.slotPos(this.cursor);
      this.selectBox.setPosition(x, y);
    }
    const sel = has ? ITEMS[this.ids[this.cursor]] : undefined;
    this.detail.setText(
      sel ? `${sel.name}\n${sel.desc}  ${sel.kind === 'charm' ? '(passive)' : '(Enter to use)'}` : '( no items )',
    );
    this.detail.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - LINE_H * 2.5));
  }

  private move(dx: number, dy: number): void {
    const n = this.ids.length;
    if (n === 0) return;
    let next = this.cursor;
    if (dx) next = (this.cursor + dx + n) % n;
    else if (dy) next = this.cursor + dy * COLS; // up/down a row, clamped to held items
    if (next < 0 || next >= n) return;
    if (next !== this.cursor) {
      this.cursor = next;
      audio.playSfx('clink');
      this.render();
    }
  }

  private use(): void {
    const id = this.ids[this.cursor];
    if (!id) return;
    if (ITEMS[id].kind !== 'consumable') {
      this.flash('That cannot be used.', 0xc4a24a);
      return;
    }
    eventBus.emit('useItem', { id });
  }

  private onItemUsed(p: { id: string; ok: boolean }): void {
    if (p.ok) this.flash(`Used ${ITEMS[p.id]?.name ?? 'item'}.`, 0x76c44a);
    else this.flash('No effect right now.', 0xc4a24a);
    this.rebuild();
  }

  private flash(text: string, color: number): void {
    this.feedback.setText(text).setTint(color).setAlpha(1);
    this.feedback.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - LINE_H * 1.2));
    this.tweens.killTweensOf(this.feedback);
    this.tweens.add({ targets: this.feedback, alpha: 0, delay: 1100, duration: 600 });
  }

  private close(): void {
    if (this.time.now - this.openedAt < 200) return; // ignore the opening keypress
    audio.playSfx('clink');
    this.scene.stop();
    this.scene.resume(SceneKeys.World);
  }
}
