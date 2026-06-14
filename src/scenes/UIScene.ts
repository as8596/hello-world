import Phaser from 'phaser';
import { playerConfig } from '../data/playerConfig';
import { RENDER_SCALE as RS } from '../data/render';
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

  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    this.hearts = [];
    this.currentMax = -1;
    const full = playerConfig.maxHearts * 2;
    this.renderHearts(full, full);

    this.coinText = addPixelText(this, 5 * RS, 14 * RS, '', { color: 0xffe066 });
    this.renderCoin(worldState.getCounter('coin'));

    this.questText = addPixelText(this, 0, 0, '', { color: 0xe8e6d8, maxWidth: 150 * RS }).setVisible(false);
    this.restorePinnedQuest();

    const offHealth = eventBus.on('playerHealth', (p) => {
      const { hp, max } = p as { hp: number; max: number };
      this.renderHearts(hp, max);
    });
    const offCoin = eventBus.on('coinChanged', (p) => this.renderCoin((p as { coin: number }).coin));
    const offQuest = eventBus.on('questObjective', (p) => {
      const { objective } = p as { objective: string };
      this.renderQuest(objective);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offHealth();
      offCoin();
      offQuest();
    });
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
    this.questText.setPosition(this.scale.width - this.questText.width - 5 * RS, 5 * RS).setVisible(true);
  }

  private restorePinnedQuest(): void {
    for (const id of Object.keys(QUESTS)) {
      if (worldState.getFlag(`quest_${id}`) === 'active') this.renderQuest(QUESTS[id].objective);
    }
  }
}
