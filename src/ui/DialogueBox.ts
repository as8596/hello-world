import Phaser from 'phaser';
import { RENDER_SCALE as RS } from '../data/render';
import { addPixelText, PIXEL_FONT_KEY } from '../systems/PixelFont';

/**
 * DialogueBox — the bottom dialogue panel (DESIGN.md §16). A dumb renderer
 * driven by DialogueRunner: typewriter body text, an advance indicator, and a
 * selectable choice list. Camera-fixed, pixel-font, built from primitives.
 */
export class DialogueBox {
  private readonly scene: Phaser.Scene;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.GameObjects.BitmapText;
  private readonly indicator: Phaser.GameObjects.BitmapText;
  private choiceTexts: Phaser.GameObjects.BitmapText[] = [];

  private full = '';
  private revealed = 0;
  private timer?: Phaser.Time.TimerEvent;
  private open = false;
  private readonly choiceStartY: number;
  private readonly choiceX: number;

  /** Set by the runner; fires when the body text finishes typing. */
  onTyped?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const margin = 8 * RS;
    const panelH = 54 * RS;
    const panelW = w - margin * 2;
    const panelY = h - panelH - 6 * RS;

    this.bg = scene.add
      .rectangle(margin, panelY, panelW, panelH, 0x10101a, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(1 * RS, 0x6fb3ff, 0.8)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);

    this.body = addPixelText(scene, margin + 6 * RS, panelY + 6 * RS, '', { color: 0xe8e6d8, maxWidth: panelW - 16 * RS })
      .setScrollFactor(0)
      .setDepth(2001)
      .setVisible(false);

    this.indicator = scene.add
      .bitmapText(margin + panelW - 12 * RS, panelY + panelH - 11 * RS, PIXEL_FONT_KEY, '>')
      .setTint(0x6fb3ff)
      .setScrollFactor(0)
      .setDepth(2001)
      .setVisible(false);

    this.choiceX = margin + 8 * RS;
    this.choiceStartY = panelY + 26 * RS;
  }

  get isOpen(): boolean {
    return this.open;
  }

  get isTyping(): boolean {
    return this.open && this.revealed < this.full.length;
  }

  openBox(): void {
    this.open = true;
    this.bg.setVisible(true);
    this.body.setVisible(true);
  }

  close(): void {
    this.open = false;
    this.timer?.remove();
    this.clearChoices();
    this.indicator.setVisible(false);
    this.body.setText('').setVisible(false);
    this.bg.setVisible(false);
  }

  /** Start the typewriter on a single body string. */
  renderText(text: string): void {
    this.clearChoices();
    this.indicator.setVisible(false);
    this.full = text;
    this.revealed = 0;
    this.body.setText('');
    this.timer?.remove();
    this.timer = this.scene.time.addEvent({
      delay: 22,
      loop: true,
      callback: () => {
        this.revealed++;
        this.body.setText(this.full.slice(0, this.revealed));
        if (this.revealed >= this.full.length) {
          this.timer?.remove();
          this.onTyped?.();
        }
      },
    });
  }

  finishTyping(): void {
    this.timer?.remove();
    this.revealed = this.full.length;
    this.body.setText(this.full);
    this.onTyped?.();
  }

  setAdvanceIndicator(visible: boolean): void {
    this.indicator.setVisible(visible);
  }

  renderChoices(labels: string[], selected: number): void {
    this.clearChoices();
    labels.forEach((label, i) => {
      const bt = addPixelText(this.scene, this.choiceX, this.choiceStartY + i * 8 * RS, `${i === selected ? '> ' : '  '}${label}`, {
        color: i === selected ? 0xffe066 : 0x9a9a8a,
      })
        .setScrollFactor(0)
        .setDepth(2001);
      this.choiceTexts.push(bt);
    });
  }

  clearChoices(): void {
    for (const c of this.choiceTexts) c.destroy();
    this.choiceTexts = [];
  }
}
