import Phaser from 'phaser';
import { PIXEL_FONT_KEY } from '../systems/PixelFont';

/**
 * DialogueBox — a minimal bottom dialogue panel with a typewriter reveal
 * (DESIGN.md §16). Linear lines for now: advance reveals the rest of the
 * current line, or moves to the next, or closes. Branching choices, portraits,
 * and the full journal are later (P1).
 *
 * Camera-fixed (scrollFactor 0), pixel-font text, built from primitives so it
 * needs no art.
 */
export class DialogueBox {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly textObj: Phaser.GameObjects.BitmapText;
  private readonly indicator: Phaser.GameObjects.BitmapText;
  private queue: string[] = [];
  private current = '';
  private revealed = 0;
  private timer?: Phaser.Time.TimerEvent;
  private open = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const margin = 8;
    const panelH = 42;
    const panelW = w - margin * 2;

    const bg = scene.add
      .rectangle(0, 0, panelW, panelH, 0x10101a, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x6fb3ff, 0.8);

    this.textObj = scene.add
      .bitmapText(8, 8, PIXEL_FONT_KEY, '')
      .setMaxWidth(panelW - 16)
      .setTint(0xe8e6d8);

    this.indicator = scene.add
      .bitmapText(panelW - 12, panelH - 13, PIXEL_FONT_KEY, '>')
      .setTint(0x6fb3ff)
      .setVisible(false);

    this.container = scene.add
      .container(margin, h - panelH - margin, [bg, this.textObj, this.indicator])
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** Open the box on a sequence of lines. */
  openLines(lines: string[]): void {
    if (lines.length === 0) return;
    this.queue = [...lines];
    this.open = true;
    this.container.setVisible(true);
    this.showNext();
  }

  /** Reveal the rest of the line, advance to the next, or close. */
  advance(): void {
    if (!this.open) return;
    if (this.revealed < this.current.length) {
      this.revealAll();
    } else {
      this.showNext();
    }
  }

  private showNext(): void {
    const next = this.queue.shift();
    if (next === undefined) {
      this.close();
      return;
    }
    this.current = next;
    this.revealed = 0;
    this.indicator.setVisible(false);
    this.textObj.setText('');
    this.timer?.remove();
    this.timer = this.scene.time.addEvent({
      delay: 22,
      loop: true,
      callback: () => {
        this.revealed++;
        this.textObj.setText(this.current.slice(0, this.revealed));
        if (this.revealed >= this.current.length) {
          this.timer?.remove();
          this.indicator.setVisible(true);
        }
      },
    });
  }

  private revealAll(): void {
    this.timer?.remove();
    this.revealed = this.current.length;
    this.textObj.setText(this.current);
    this.indicator.setVisible(true);
  }

  private close(): void {
    this.open = false;
    this.timer?.remove();
    this.container.setVisible(false);
  }
}
