import Phaser from 'phaser';
import { CAMERA_ZOOM, RENDER_SCALE as RS } from '../data/render';
import { audio } from '../systems/AudioManager';
import { addPixelText, PIXEL_FONT_KEY } from '../systems/PixelFont';

/**
 * DialogueBox — the bottom dialogue panel (DESIGN.md §16). A dumb renderer
 * driven by DialogueRunner: typewriter body text, an advance indicator, and a
 * selectable choice list. Built from primitives in a container that counter-
 * scales the world camera's zoom, so it renders at native size + screen-fixed
 * (the world is zoomed; UI shouldn't be).
 */
export class DialogueBox {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.BitmapText;
  private readonly indicator: Phaser.GameObjects.BitmapText;
  private choiceTexts: Phaser.GameObjects.BitmapText[] = [];

  private full = '';
  private revealed = 0;
  private voiceHz = 360;
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

    // The world camera zooms about its centre; place a scroll-fixed container at
    // the inverse-transformed panel anchor and scale it 1/zoom so its children
    // (in local, native coords) land screen-fixed at native size.
    const Z = CAMERA_ZOOM;
    const cx = w / 2;
    const cy = h / 2;
    this.root = scene.add
      .container(cx + (margin - cx) / Z, cy + (panelY - cy) / Z)
      .setScrollFactor(0)
      .setScale(1 / Z)
      .setDepth(2000)
      .setVisible(false);

    const bg = scene.add
      .rectangle(0, 0, panelW, panelH, 0x10101a, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(1 * RS, 0x6fb3ff, 0.8);
    this.body = addPixelText(scene, 6 * RS, 6 * RS, '', { color: 0xe8e6d8, maxWidth: panelW - 16 * RS });
    this.indicator = scene.add
      .bitmapText(panelW - 12 * RS, panelH - 11 * RS, PIXEL_FONT_KEY, '>')
      .setTint(0x6fb3ff)
      .setVisible(false);
    this.root.add([bg, this.body, this.indicator]);

    this.choiceX = 8 * RS;
    this.choiceStartY = 26 * RS;
  }

  get isOpen(): boolean {
    return this.open;
  }

  get isTyping(): boolean {
    return this.open && this.revealed < this.full.length;
  }

  openBox(): void {
    this.open = true;
    this.root.setVisible(true);
  }

  close(): void {
    this.open = false;
    this.timer?.remove();
    this.clearChoices();
    this.indicator.setVisible(false);
    this.body.setText('');
    this.root.setVisible(false);
  }

  /** Start the typewriter on a single body string. `voiceHz` tints the talk blip. */
  renderText(text: string, voiceHz = 360): void {
    this.clearChoices();
    this.indicator.setVisible(false);
    this.full = text;
    this.revealed = 0;
    this.voiceHz = voiceHz;
    this.body.setText('');
    this.timer?.remove();
    this.timer = this.scene.time.addEvent({
      delay: 22,
      loop: true,
      callback: () => {
        this.revealed++;
        this.body.setText(this.full.slice(0, this.revealed));
        // Animal-Crossing babble: a blip as letters appear. Throttled to every
        // other character and skipping whitespace so it chatters, not buzzes.
        const ch = this.full.charCodeAt(this.revealed - 1);
        if (this.revealed % 2 === 0 && ch !== 32 && ch !== 10) audio.talkBlip(this.voiceHz, ch);
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
      });
      this.root.add(bt);
      this.choiceTexts.push(bt);
    });
  }

  clearChoices(): void {
    for (const c of this.choiceTexts) c.destroy();
    this.choiceTexts = [];
  }
}
