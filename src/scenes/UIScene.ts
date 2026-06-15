import Phaser from 'phaser';
import { playerConfig } from '../data/playerConfig';
import { xpToNext } from '../data/progression';
import { CAMERA_ZOOM, RENDER_SCALE as RS } from '../data/render';
import { QUESTS } from '../data/quests';
import { eventBus } from '../systems/EventBus';
import { addPixelText } from '../systems/PixelFont';
import { TextureKeys } from '../systems/TextureFactory';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

/**
 * UIScene — the HUD overlay (DESIGN.md §13 step 9, §16). Runs in parallel above
 * the World, independent of the world camera: the hearts row, a coin count, and
 * the pinned quest objective. Driven by EventBus events; reads WorldState for
 * initial state so it survives World restarts.
 */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private currentMax = -1;
  private coinText!: Phaser.GameObjects.BitmapText;
  private questText!: Phaser.GameObjects.BitmapText;
  private staminaFill!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.BitmapText;
  private xpFill!: Phaser.GameObjects.Rectangle;
  private readonly staminaWidth = 28 * RS;
  private readonly xpWidth = 28 * RS;

  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    // Match the world's zoom so the HUD scales with it (anchored at the top-left,
    // so the top-left cluster stays pinned and just grows).
    this.cameras.main.setZoom(CAMERA_ZOOM).setOrigin(0, 0);

    this.hearts = [];
    this.currentMax = -1;
    const full = playerConfig.maxHearts * 2;
    this.renderHearts(full, full);

    // Stamina bar under the hearts (gates the dodge).
    const sy = 12 * RS;
    this.add.rectangle(5 * RS, sy, this.staminaWidth + 2 * RS, 3 * RS, 0x10101a, 0.85).setOrigin(0, 0);
    this.staminaFill = this.add.rectangle(6 * RS, sy + 1 * RS, this.staminaWidth, 1 * RS, 0x76c44a).setOrigin(0, 0);
    this.renderStamina(1);

    this.coinText = addPixelText(this, 5 * RS, 17 * RS, '', { color: 0xffe066 });
    this.renderCoin(worldState.getCounter('coin'));

    // Level + XP bar under the coin count.
    this.levelText = addPixelText(this, 5 * RS, 24 * RS, '', { color: 0xbfa8ff });
    const xy = 31 * RS;
    this.add.rectangle(5 * RS, xy, this.xpWidth + 2 * RS, 3 * RS, 0x10101a, 0.85).setOrigin(0, 0);
    this.xpFill = this.add.rectangle(6 * RS, xy + 1 * RS, this.xpWidth, 1 * RS, 0x8d6cf0).setOrigin(0, 0);
    this.renderProgress();

    this.questText = addPixelText(this, 0, 0, '', { color: 0xe8e6d8, maxWidth: 150 * RS }).setVisible(false);
    this.restorePinnedQuest();

    const offHealth = eventBus.on('playerHealth', (p) => {
      const { hp, max } = p as { hp: number; max: number };
      this.renderHearts(hp, max);
    });
    const offCoin = eventBus.on('coinChanged', (p) => this.renderCoin((p as { coin: number }).coin));
    const offStamina = eventBus.on('playerStamina', (p) => this.renderStamina((p as { ratio: number }).ratio));
    const offXp = eventBus.on('xpChanged', (p) => this.renderProgress(p as { level: number; xp: number; need: number }));
    const offQuest = eventBus.on('questObjective', (p) => {
      const { objective } = p as { objective: string };
      this.renderQuest(objective);
    });
    // The World can rebuild under us (restart on death, or a menu Load) without
    // restarting this parallel HUD, so re-seed coin + quest from WorldState then.
    const offReady = eventBus.on('world:ready', () => {
      this.renderCoin(worldState.getCounter('coin'));
      this.renderProgress();
      this.restorePinnedQuest();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offHealth();
      offCoin();
      offStamina();
      offXp();
      offQuest();
      offReady();
    });
  }

  /** Render the level number + XP bar fill (reads WorldState if no payload). */
  private renderProgress(p?: { level: number; xp: number; need: number }): void {
    const level = p?.level ?? Math.max(1, worldState.getCounter('level') || 1);
    const xp = p?.xp ?? worldState.getCounter('xp');
    const need = p?.need ?? xpToNext(level);
    this.levelText.setText(`Lv ${level}`);
    this.xpFill.width = this.xpWidth * Phaser.Math.Clamp(need > 0 ? xp / need : 0, 0, 1);
  }

  private renderStamina(ratio: number): void {
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    this.staminaFill.width = this.staminaWidth * r;
    // Dim toward amber when nearly empty so "can't dodge" reads at a glance.
    this.staminaFill.setFillStyle(r < 0.34 ? 0xc4a24a : 0x76c44a);
  }

  private renderHearts(hp: number, max: number): void {
    if (max !== this.currentMax) this.buildHearts(max);
    for (let i = 0; i < this.hearts.length; i++) {
      const v = Phaser.Math.Clamp(hp - i * 2, 0, 2);
      this.hearts[i].setFrame(v >= 2 ? 'full' : v === 1 ? 'half' : 'empty');
    }
  }

  private buildHearts(max: number): void {
    for (const h of this.hearts) h.destroy();
    this.hearts = [];
    this.currentMax = max;
    for (let i = 0; i < max / 2; i++) {
      this.hearts.push(this.add.image((5 + i * 8) * RS, 5 * RS, TextureKeys.Hearts, 'full').setOrigin(0, 0));
    }
  }

  private renderCoin(coin: number): void {
    this.coinText.setText(`${coin}c`);
  }

  private renderQuest(objective: string): void {
    if (!objective) {
      this.questText.setVisible(false);
      return;
    }
    this.questText.setText(`* ${objective}`);
    // Right-anchored: the camera zoom scales coords from the top-left, so divide
    // the screen width by the zoom to keep the pin against the right edge.
    const right = this.scale.width / CAMERA_ZOOM;
    this.questText.setPosition(right - this.questText.width - 5 * RS, 5 * RS).setVisible(true);
  }

  private restorePinnedQuest(): void {
    this.questText.setVisible(false); // clear any stale pin first (e.g. after a load)
    for (const id of Object.keys(QUESTS)) {
      if (worldState.getFlag(`quest_${id}`) === 'active') this.renderQuest(QUESTS[id].objective);
    }
  }
}
