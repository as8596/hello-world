import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { addPixelText } from '../systems/PixelFont';
import { audio } from '../systems/AudioManager';
import { hasSave, loadGame, saveGame } from '../systems/SaveSystem';
import { SceneKeys } from './SceneKeys';

type Page = 'main' | 'options' | 'saveload';

interface MenuItem {
  /** Dynamic so toggles/sliders re-render their current value on refresh. */
  label: () => string;
  /** Run on confirm (Enter/Space/E/click). Return a string to flash as feedback. */
  action?: () => string | void;
  /** Adjust on Left/Right (sliders, toggles). dir is -1 or +1. */
  adjust?: (dir: number) => void;
}

const LINE_H = 14 * RS;
const MAX_ROWS = 4; // the main page has the most rows; size the panel for it

/**
 * MenuScene — the Escape pause menu. Launched on top of a *paused* WorldScene
 * (see WorldScene's `keydown-ESC`), it dims the world and drives a small list by
 * keyboard. It has two pages: the main menu (Resume / Save-Load / Options / Exit)
 * and an Options page with live audio controls backed by AudioManager.
 */
export class MenuScene extends Phaser.Scene {
  private items: MenuItem[] = [];
  private labels: Phaser.GameObjects.BitmapText[] = [];
  private cursor = 0;
  private page: Page = 'main';
  /** Timestamp the menu opened; the keypress that opened it must not close it. */
  private openedAt = 0;

  private title!: Phaser.GameObjects.BitmapText;
  private help!: Phaser.GameObjects.BitmapText;
  private feedback!: Phaser.GameObjects.BitmapText;
  private cx = 0;
  private cy = 0;
  private panelH = 0;

  constructor() {
    super(SceneKeys.Menu);
  }

  create(): void {
    this.openedAt = this.time.now;

    const W = this.scale.width;
    const H = this.scale.height;
    this.cx = Math.round(W / 2);
    this.cy = Math.round(H / 2);
    this.panelH = (MAX_ROWS + 3) * LINE_H;

    // Dim the world behind us so the menu reads as a modal overlay.
    this.add.rectangle(0, 0, W, H, 0x10101a, 0.72).setOrigin(0, 0).setScrollFactor(0);
    this.add
      .rectangle(this.cx, this.cy, 132 * RS, this.panelH, 0x1a1a2a, 0.95)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setStrokeStyle(RS, 0x6fb3ff, 0.9);

    this.title = addPixelText(this, 0, 0, '', { color: 0x6fb3ff }).setScale(1.4).setScrollFactor(0);
    this.help = addPixelText(this, 0, 0, '', { color: 0x6b6b80 }).setScrollFactor(0);
    this.feedback = addPixelText(this, 0, 0, '', { color: 0xffcf6f }).setScrollFactor(0).setAlpha(0);

    this.bindKeys();
    this.showPage('main');
  }

  // --- pages ---------------------------------------------------------------

  private showPage(page: Page): void {
    this.page = page;
    this.cursor = 0;
    this.labels.forEach((l) => l.destroy());
    this.labels = [];

    this.items =
      page === 'main' ? this.mainItems() : page === 'options' ? this.optionsItems() : this.saveLoadItems();

    const firstY = this.cy - ((this.items.length - 1) * LINE_H) / 2 + LINE_H * 0.2;
    this.labels = this.items.map((item, i) => {
      const t = addPixelText(this, 0, 0, item.label(), { color: 0xe8e6d8 }).setScrollFactor(0);
      t.setY(Math.round(firstY + i * LINE_H - t.height / 2));
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => {
        this.cursor = i;
        this.refresh();
      });
      t.on('pointerdown', () => {
        this.cursor = i;
        this.refresh();
        this.confirm();
      });
      return t;
    });

    this.title.setText(page === 'main' ? 'PAUSED' : page === 'options' ? 'OPTIONS' : 'SAVE / LOAD');
    this.title.setX(Math.round(this.cx - (this.title.width * 1.4) / 2));
    this.title.setY(Math.round(this.cy - this.panelH / 2 + LINE_H * 0.6));

    this.help.setText(
      page === 'main'
        ? 'W/S Move   Enter Select   Esc Resume'
        : page === 'options'
          ? 'W/S Move   A/D Adjust   Esc Back'
          : 'W/S Move   Enter Select   Esc Back',
    );
    this.help.setX(Math.round(this.cx - this.help.width / 2));
    this.help.setY(Math.round(this.cy + this.panelH / 2 - LINE_H * 1.1));

    this.refresh();
  }

  private mainItems(): MenuItem[] {
    return [
      { label: () => 'Resume', action: () => this.resumeGame() },
      { label: () => 'Save / Load', action: () => this.showPage('saveload') },
      { label: () => 'Options', action: () => this.showPage('options') },
      { label: () => 'Exit', action: () => this.exitGame() },
    ];
  }

  private saveLoadItems(): MenuItem[] {
    return [
      { label: () => 'Save', action: () => (saveGame() ? 'Game saved' : 'Save failed') },
      { label: () => (hasSave() ? 'Load' : 'Load  (no save)'), action: () => this.loadFromSave() },
      { label: () => 'Back', action: () => this.showPage('main') },
    ];
  }

  /** Restore the last save and rebuild the world from it (checkpoint state). */
  private loadFromSave(): string | void {
    if (!loadGame()) return 'No save to load';
    audio.playSfx('rested');
    // loadGame() has rehydrated WorldState; restart the world so it rebuilds from
    // the restored flags (area, hearth, abilities), then drop the menu.
    this.scene.get(SceneKeys.World).scene.restart();
    this.scene.stop();
  }

  private optionsItems(): MenuItem[] {
    return [
      {
        label: () => `Volume  ${Math.round(audio.getVolume() * 10)} / 10`,
        adjust: (dir) => audio.setVolume(Math.round(audio.getVolume() * 10 + dir) / 10),
        action: () => audio.setVolume(Math.round(audio.getVolume() * 10 + 1) / 10),
      },
      {
        label: () => `Music   ${audio.isMusicEnabled() ? 'On' : 'Off'}`,
        adjust: () => audio.setMusicEnabled(!audio.isMusicEnabled()),
        action: () => audio.setMusicEnabled(!audio.isMusicEnabled()),
      },
      { label: () => 'Back', action: () => this.showPage('main') },
    ];
  }

  // --- input ---------------------------------------------------------------

  private bindKeys(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.moveCursor(-1));
    kb.on('keydown-W', () => this.moveCursor(-1));
    kb.on('keydown-DOWN', () => this.moveCursor(1));
    kb.on('keydown-S', () => this.moveCursor(1));
    kb.on('keydown-LEFT', () => this.adjust(-1));
    kb.on('keydown-A', () => this.adjust(-1));
    kb.on('keydown-RIGHT', () => this.adjust(1));
    kb.on('keydown-D', () => this.adjust(1));
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-E', () => this.confirm());
    kb.on('keydown-ESC', () => this.back());
  }

  private moveCursor(dir: number): void {
    const n = this.items.length;
    this.cursor = (this.cursor + dir + n) % n;
    audio.playSfx('clink');
    this.refresh();
  }

  private adjust(dir: number): void {
    const item = this.items[this.cursor];
    if (!item.adjust) return;
    item.adjust(dir);
    audio.playSfx('clink');
    this.refresh();
  }

  private confirm(): void {
    const result = this.items[this.cursor].action?.();
    if (typeof result === 'string') this.flash(result);
  }

  /** ESC steps back: from Options to main, from main it resumes the game. */
  private back(): void {
    if (this.time.now - this.openedAt < 200) return; // ignore the opening keypress
    if (this.page !== 'main') this.showPage('main');
    else this.resumeGame();
  }

  // --- rendering -----------------------------------------------------------

  /** Re-render labels (pointer + live values) and highlight the active row. */
  private refresh(): void {
    this.labels.forEach((label, i) => {
      const active = i === this.cursor;
      label.setText((active ? '> ' : '  ') + this.items[i].label());
      label.setTint(active ? 0xffffff : 0x9a9ab0);
      label.setX(Math.round(this.cx - label.width / 2));
    });
  }

  /** Briefly show feedback under the menu (placeholder options, blocked exit). */
  private flash(text: string): void {
    audio.playSfx('chime');
    this.feedback.setText(text).setAlpha(1);
    this.feedback.setX(Math.round(this.cx - this.feedback.width / 2));
    this.feedback.setY(Math.round(this.cy + this.panelH / 2 + LINE_H * 0.4));
    this.tweens.killTweensOf(this.feedback);
    this.tweens.add({ targets: this.feedback, alpha: 0, delay: 1200, duration: 600 });
  }

  // --- actions -------------------------------------------------------------

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
