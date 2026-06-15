import Phaser from 'phaser';
import { ITEMS } from '../data/items';
import { xpToNext } from '../data/progression';
import { RENDER_SCALE as RS } from '../data/render';
import { audio } from '../systems/AudioManager';
import { eventBus } from '../systems/EventBus';
import { addPixelText } from '../systems/PixelFont';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

const LINE_H = 13 * RS;

/**
 * InventoryScene — a pause-style overlay (I / Tab) showing the player's level,
 * XP, coin, and held items. Consumables can be used here: it emits `useItem` to
 * the (paused) WorldScene, which owns the Player, and re-renders on the
 * `itemUsed` reply. Closing resumes the world.
 */
export class InventoryScene extends Phaser.Scene {
  private rows: Phaser.GameObjects.BitmapText[] = [];
  private ids: string[] = [];
  private cursor = 0;
  private openedAt = 0;
  private header!: Phaser.GameObjects.BitmapText;
  private desc!: Phaser.GameObjects.BitmapText;
  private feedback!: Phaser.GameObjects.BitmapText;
  private cx = 0;
  private cy = 0;
  private panelH = 0;
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
    this.panelH = 11 * LINE_H;

    this.add.rectangle(0, 0, W, H, 0x10101a, 0.72).setOrigin(0, 0).setScrollFactor(0);
    this.add
      .rectangle(this.cx, this.cy, 170 * RS, this.panelH, 0x1a1a2a, 0.95)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setStrokeStyle(RS, 0xffe066, 0.85);

    addPixelText(this, 0, 0, 'INVENTORY', { color: 0xffe066 })
      .setOrigin(0.5)
      .setScale(1.3)
      .setScrollFactor(0)
      .setPosition(this.cx, Math.round(this.cy - this.panelH / 2 + LINE_H * 0.8));

    this.header = addPixelText(this, 0, 0, '', { color: 0xe8e6d8 }).setOrigin(0.5).setScrollFactor(0);
    this.header.setPosition(this.cx, Math.round(this.cy - this.panelH / 2 + LINE_H * 2.1));

    this.desc = addPixelText(this, 0, 0, '', { color: 0x9a9ab0 }).setOrigin(0.5).setScale(0.85).setScrollFactor(0);
    this.feedback = addPixelText(this, 0, 0, '', { color: 0x76c44a }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    addPixelText(this, 0, 0, 'W/S Move   Enter Use   I / Esc Close', { color: 0x6b6b80 })
      .setOrigin(0.5)
      .setScale(0.62)
      .setScrollFactor(0)
      .setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - LINE_H * 0.7));

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-ENTER', () => this.use());
    kb.on('keydown-SPACE', () => this.use());
    kb.on('keydown-I', () => this.close());
    kb.on('keydown-TAB', () => this.close());
    kb.on('keydown-ESC', () => this.close());

    // WorldScene applies the use (it owns the Player) and replies here.
    this.offUsed = eventBus.on('itemUsed', (p) => this.onItemUsed(p as { id: string; ok: boolean }));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.offUsed?.());

    this.rebuild();
  }

  /** Re-read held items + progress and lay out the rows. */
  private rebuild(): void {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    this.ids = Object.keys(ITEMS).filter((id) => worldState.getCounter(`item_${id}`) > 0);

    const level = Math.max(1, worldState.getCounter('level') || 1);
    const xp = worldState.getCounter('xp');
    const coin = worldState.getCounter('coin');
    this.header.setText(`Level ${level}    XP ${xp} / ${xpToNext(level)}    Coin ${coin}`);

    const firstY = this.cy - LINE_H * 1.4;
    if (this.ids.length === 0) {
      const empty = addPixelText(this, 0, 0, '( no items )', { color: 0x6b6b80 }).setOrigin(0.5).setScrollFactor(0);
      empty.setPosition(this.cx, Math.round(firstY));
      this.rows.push(empty);
    } else {
      this.ids.forEach((_id, i) => {
        const t = addPixelText(this, 0, 0, '', { color: 0xe8e6d8 }).setOrigin(0.5).setScrollFactor(0);
        t.setPosition(this.cx, Math.round(firstY + i * LINE_H));
        this.rows.push(t);
      });
    }
    if (this.cursor >= this.ids.length) this.cursor = Math.max(0, this.ids.length - 1);
    this.render();
  }

  private render(): void {
    this.ids.forEach((id, i) => {
      const item = ITEMS[id];
      const n = worldState.getCounter(`item_${id}`);
      const active = i === this.cursor;
      this.rows[i].setText(`${active ? '> ' : '  '}${item.name}  x${n}${active ? ' <' : '  '}`);
      this.rows[i].setTint(active ? 0xffffff : 0x9a9ab0);
    });
    const sel = ITEMS[this.ids[this.cursor]];
    this.desc.setText(sel ? `${sel.desc}${sel.kind === 'charm' ? '  (passive)' : '  (Enter to use)'}` : '');
    this.desc.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - LINE_H * 1.7));
  }

  private move(dir: number): void {
    if (this.ids.length === 0) return;
    this.cursor = (this.cursor + dir + this.ids.length) % this.ids.length;
    audio.playSfx('clink');
    this.render();
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
    this.feedback.setPosition(this.cx, Math.round(this.cy + this.panelH / 2 - LINE_H * 0.05));
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
