import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { addPixelText } from '../systems/PixelFont';
import { audio } from '../systems/AudioManager';
import { SceneKeys } from './SceneKeys';

interface MenuItem {
  label: string;
  /** Run when the item is confirmed. Return a string to flash as feedback. */
  action: () => string | void;
}

/**
 * MenuScene — the Escape pause menu. Launched on top of a *paused* WorldScene
 * (see WorldScene's `keydown-ESC`), it dims the world, shows a small panel of
 * options, and drives them by keyboard. Resume tears the menu back down and
 * hands control back to the world; the rest are placeholders for now save for
 * Exit, which asks the browser to close the tab.
 */
export class MenuScene extends Phaser.Scene {
  private items: MenuItem[] = [];
  private labels: Phaser.GameObjects.BitmapText[] = [];
  private cursor = 0;
  /** Timestamp the menu opened; the keypress that opened it must not close it. */
  private openedAt = 0;
  private feedback?: Phaser.GameObjects.BitmapText;

  constructor() {
    super(SceneKeys.Menu);
  }

  create(): void {
    this.openedAt = this.time.now;
    this.cursor = 0;

    const W = this.scale.width;
    const H = this.scale.height;

    // Dim the world behind us so the menu reads as a modal overlay.
    this.add.rectangle(0, 0, W, H, 0x10101a, 0.72).setOrigin(0, 0).setScrollFactor(0);

    this.items = [
      { label: 'Resume', action: () => this.resumeGame() },
      { label: 'Save / Load', action: () => 'Not yet available' },
      { label: 'Options', action: () => 'Not yet available' },
      { label: 'Exit', action: () => this.exitGame() },
    ];

    // Panel sized to the options, centered.
    const lineH = 14 * RS;
    const panelW = 120 * RS;
    const panelH = (this.items.length + 3) * lineH;
    const cx = Math.round(W / 2);
    const cy = Math.round(H / 2);
    this.add
      .rectangle(cx, cy, panelW, panelH, 0x1a1a2a, 0.95)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setStrokeStyle(RS, 0x6fb3ff, 0.9);

    const title = addPixelText(this, 0, 0, 'PAUSED', { color: 0x6fb3ff }).setScale(1.4).setScrollFactor(0);
    title.setPosition(Math.round(cx - (title.width * 1.4) / 2), Math.round(cy - panelH / 2 + lineH * 0.6));

    const firstY = cy - ((this.items.length - 1) * lineH) / 2 + lineH * 0.3;
    this.labels = this.items.map((item, i) => {
      const t = addPixelText(this, 0, 0, item.label, { color: 0xe8e6d8 }).setScrollFactor(0);
      t.setPosition(Math.round(cx - t.width / 2), Math.round(firstY + i * lineH - t.height / 2));
      return t;
    });

    this.feedback = addPixelText(this, 0, 0, '', { color: 0xffcf6f }).setScrollFactor(0);

    this.refreshSelection();

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.moveCursor(-1));
    kb.on('keydown-W', () => this.moveCursor(-1));
    kb.on('keydown-DOWN', () => this.moveCursor(1));
    kb.on('keydown-S', () => this.moveCursor(1));
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-E', () => this.confirm());
    kb.on('keydown-ESC', () => this.closeIfReady());

    // Clicking an option selects + confirms it.
    this.labels.forEach((label, i) => {
      label.setInteractive({ useHandCursor: true });
      label.on('pointerover', () => {
        this.cursor = i;
        this.refreshSelection();
      });
      label.on('pointerdown', () => {
        this.cursor = i;
        this.refreshSelection();
        this.confirm();
      });
    });
  }

  private moveCursor(dir: number): void {
    const n = this.items.length;
    this.cursor = (this.cursor + dir + n) % n;
    audio.playSfx('clink');
    this.refreshSelection();
  }

  /** Re-render the pointer (`> label`) and highlight the active row. */
  private refreshSelection(): void {
    this.labels.forEach((label, i) => {
      const active = i === this.cursor;
      label.setText(active ? `> ${this.items[i].label}` : `  ${this.items[i].label}`);
      label.setTint(active ? 0xffffff : 0x9a9ab0);
      const cx = Math.round(this.scale.width / 2);
      label.setX(Math.round(cx - label.width / 2));
    });
  }

  private confirm(): void {
    const result = this.items[this.cursor].action();
    if (typeof result === 'string') this.flash(result);
  }

  /** Briefly show feedback under the menu (for placeholder options). */
  private flash(text: string): void {
    if (!this.feedback) return;
    audio.playSfx('chime');
    this.feedback.setText(text).setAlpha(1);
    const cx = Math.round(this.scale.width / 2);
    const y = Math.round(this.scale.height / 2 + (this.items.length + 1) * 7 * RS);
    this.feedback.setPosition(Math.round(cx - this.feedback.width / 2), y);
    this.tweens.killTweensOf(this.feedback);
    this.tweens.add({ targets: this.feedback, alpha: 0, delay: 1200, duration: 600 });
  }

  /** ESC closes the menu, but only after the opening keypress has cleared. */
  private closeIfReady(): void {
    if (this.time.now - this.openedAt < 200) return;
    this.resumeGame();
  }

  private resumeGame(): void {
    audio.playSfx('clink');
    this.scene.stop();
    this.scene.resume(SceneKeys.World);
  }

  private exitGame(): string | void {
    // Browsers only honor window.close() for tabs/windows opened by script, so
    // this may be ignored on the main tab — tell the player if it didn't take.
    window.close();
    return 'Close blocked by browser';
  }
}
