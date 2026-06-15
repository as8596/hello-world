import Phaser from 'phaser';
import { CAMERA_ZOOM, RENDER_SCALE as RS } from '../data/render';
import { audio } from '../systems/AudioManager';
import { addPixelText, type PixelText } from '../systems/PixelFont';

/** Speaker-name colour — a warm gold so it pops off the body text. */
const NAME_COLOR = 0xffd23f;

/**
 * DialogueBox — the bottom dialogue panel (DESIGN.md §16). A dumb renderer
 * driven by DialogueRunner: an optional speaker portrait on the left, an
 * emphasised speaker name, typewriter body text, an advance indicator, and a
 * selectable choice list. Built from primitives in a container that counter-
 * scales the world camera's zoom, so it renders at native size + screen-fixed
 * (the world is zoomed; UI shouldn't be).
 */
export class DialogueBox {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly portrait: Phaser.GameObjects.Image;
  private readonly portraitFrame: Phaser.GameObjects.Rectangle;
  private readonly name: PixelText; // speaker label (bold)
  private readonly body: PixelText;
  private readonly indicator: PixelText;
  private choiceTexts: PixelText[] = [];

  private full = '';
  private revealed = 0;
  private voiceHz = 360;
  private timer?: Phaser.Time.TimerEvent;
  private open = false;

  private readonly panelW: number;
  private readonly panelH: number;
  private readonly pad = 5 * RS;
  private readonly portraitBox: number;
  /** Current left edge of the text column (shifts right when a portrait shows). */
  private textX: number;
  private choicesY = 28 * RS;

  /** Set by the runner; fires when the body text finishes typing. */
  onTyped?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const margin = 8 * RS;
    this.panelH = 54 * RS;
    this.panelW = w - margin * 2;
    const panelY = h - this.panelH - 6 * RS;
    this.portraitBox = this.panelH - this.pad * 2;
    this.textX = 6 * RS;

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
      .rectangle(0, 0, this.panelW, this.panelH, 0x10101a, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(1 * RS, 0x6fb3ff, 0.8);

    // Portrait panel (left). Hidden until a speaker with portrait art appears.
    this.portrait = scene.add.image(this.pad, this.pad, '__DEFAULT').setOrigin(0, 0).setVisible(false);
    this.portraitFrame = scene.add
      .rectangle(this.pad, this.pad, this.portraitBox, this.portraitBox)
      .setOrigin(0, 0)
      .setFillStyle(0, 0)
      .setStrokeStyle(1 * RS, 0x6fb3ff, 0.9)
      .setVisible(false);

    // Speaker name — emphasised in bold gold so it pops off the body.
    this.name = addPixelText(scene, 0, 0, '', { color: NAME_COLOR, bold: true });

    this.body = addPixelText(scene, this.textX, 6 * RS, '', { color: 0xe8e6d8, maxWidth: this.panelW - this.textX - 6 * RS });
    this.indicator = addPixelText(scene, this.panelW - 12 * RS, this.panelH - 11 * RS, '>', { color: 0x6fb3ff }).setVisible(false);

    this.root.add([bg, this.portrait, this.portraitFrame, this.name, this.body, this.indicator]);
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
    this.setName(undefined);
    this.setPortrait(undefined);
    this.root.setVisible(false);
  }

  /**
   * Start the typewriter on a body string. `opts.speaker` drives the emphasised
   * name label and `opts.voiceHz` the talk-blip; `opts.portrait` shows a bust.
   */
  renderText(text: string, opts: { speaker?: string; voiceHz?: number; portrait?: string } = {}): void {
    this.clearChoices();
    this.indicator.setVisible(false);
    this.voiceHz = opts.voiceHz ?? 360;

    this.setPortrait(opts.portrait);
    this.textX = this.portrait.visible ? this.pad + this.portraitBox + 6 * RS : 6 * RS;
    this.setName(opts.speaker);

    // Body sits below the name (if any), in the column right of the portrait.
    const bodyY = opts.speaker ? this.name.y + this.name.height + 3 * RS : 6 * RS;
    this.body.setPosition(this.textX, bodyY).setWordWrapWidth(this.panelW - this.textX - 6 * RS, true);
    this.choicesY = Math.max(this.choicesY, bodyY);

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
    // Stack choices under the body, in the same text column as the portrait allows.
    const lineH = 10 * RS; // roomy enough for the proportional font
    const startY = Math.min(this.choicesY, this.panelH - labels.length * lineH - 4 * RS);
    labels.forEach((label, i) => {
      const bt = addPixelText(this.scene, this.textX, startY + i * lineH, `${i === selected ? '> ' : '  '}${label}`, {
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

  // --- internals -----------------------------------------------------------

  /** Show/scale a speaker bust in the left panel, or hide it if none. */
  private setPortrait(key?: string): void {
    if (key && this.scene.textures.exists(key)) {
      const src = this.scene.textures.get(key).getSourceImage();
      this.portrait.setTexture(key).setScale(this.portraitBox / src.width).setVisible(true);
      this.portraitFrame.setVisible(true);
    } else {
      this.portrait.setVisible(false);
      this.portraitFrame.setVisible(false);
    }
  }

  /** Set the emphasised speaker name (bold gold), or clear it. */
  private setName(speaker?: string): void {
    if (!speaker) {
      this.name.setVisible(false);
      return;
    }
    this.name.setText(speaker).setPosition(this.textX, 5 * RS).setVisible(true);
  }
}
