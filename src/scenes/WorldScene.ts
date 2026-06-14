import Phaser from 'phaser';
import { sleepingVillagerLines } from '../data/dialogue/villagers';
import { thistledownMap } from '../data/maps/thistledown';
import { Destructible } from '../entities/Destructible';
import { Interactable } from '../entities/Interactable';
import { Player } from '../entities/Player';
import { addPixelText } from '../systems/PixelFont';
import { buildTilemap } from '../systems/TilemapBuilder';
import { eventBus } from '../systems/EventBus';
import { worldState } from '../systems/WorldState';
import { DialogueBox } from '../ui/DialogueBox';
import { SceneKeys } from './SceneKeys';

/** How close (px) the player must be to read/cut a target. */
const INTERACT_RADIUS = 22;

type Actionable = Destructible | Interactable;

/**
 * WorldScene — the playable overworld. Builds the Thistledown tilemap, spawns
 * the player plus hand-placed objects (cuttable vines, readable villagers),
 * and routes interaction through the WorldState/EventBus spine. Proves
 * Milestone B.4 ("clearing vines opens a lane").
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private dialogue!: DialogueBox;
  private vines: Destructible[] = [];
  private interactables: Interactable[] = [];
  private interactKeys: Phaser.Input.Keyboard.Key[] = [];
  private promptText!: Phaser.GameObjects.BitmapText;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private gateRemaining = 0;

  constructor() {
    super(SceneKeys.World);
  }

  create(): void {
    this.vines = [];
    this.interactables = [];
    this.gateRemaining = 0;

    const map = buildTilemap(this, thistledownMap);
    this.physics.world.setBounds(0, 0, map.widthPx, map.heightPx);

    // Hand-placed objects.
    let villagerIndex = 0;
    for (const obj of map.objects) {
      if (obj.type === 'vine') {
        const vine = new Destructible(this, obj.x, obj.y, {
          group: obj.group,
          onCut: (cut) => this.onVineCut(cut),
        });
        this.vines.push(vine);
        if (obj.group === 'gate') this.gateRemaining++;
      } else {
        const lines = sleepingVillagerLines[villagerIndex % sleepingVillagerLines.length];
        villagerIndex++;
        this.interactables.push(new Interactable(this, obj.x, obj.y, { lines }));
      }
    }

    Player.registerAnims(this);
    this.player = new Player(this, map.spawn.x, map.spawn.y);
    this.physics.add.collider(this.player, map.layer);
    this.physics.add.collider(this.player, this.vines);

    // Camera: bounded, follows with a small dead-zone + slight lerp (§14 P1).
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthPx, map.heightPx);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(36, 28);

    this.dialogue = new DialogueBox(this);

    this.promptBg = this.add
      .rectangle(0, 0, 1, 1, 0xe8e6d8, 0.92)
      .setOrigin(0.5, 0.5)
      .setDepth(1500)
      .setVisible(false);
    this.promptText = addPixelText(this, 0, 0, '', { color: 0x10101a })
      .setDepth(1501)
      .setVisible(false);

    const kb = this.input.keyboard!;
    this.interactKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    ];

    this.addControlHint();

    // Spine smoke-test (DESIGN.md §16).
    worldState.addCounter('world:entered');
    eventBus.once('world:ready', () => console.log('[Brackenvale] World ready.'));
    eventBus.emit('world:ready', undefined);
  }

  update(_time: number, deltaMs: number): void {
    const interactPressed = this.interactKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));

    // While a dialogue is open, freeze the player and route input to it.
    if (this.dialogue.isOpen) {
      this.player.halt();
      this.promptText.setVisible(false);
      this.promptBg.setVisible(false);
      if (interactPressed) this.dialogue.advance();
      return;
    }

    this.player.update(deltaMs);

    const target = this.nearestActionable();
    this.updatePrompt(target);
    if (interactPressed && target) this.act(target);
  }

  /** Nearest cuttable/readable object within reach, or null. */
  private nearestActionable(): Actionable | null {
    let best: Actionable | null = null;
    let bestDist = INTERACT_RADIUS;
    const consider = (o: Actionable): void => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, o.x, o.y);
      if (d <= bestDist) {
        bestDist = d;
        best = o;
      }
    };
    for (const v of this.vines) if (v.active) consider(v);
    for (const i of this.interactables) consider(i);
    return best;
  }

  private updatePrompt(target: Actionable | null): void {
    if (!target) {
      this.promptText.setVisible(false);
      this.promptBg.setVisible(false);
      return;
    }
    const label = target instanceof Destructible ? 'E > cut' : `E > ${target.label}`;
    this.promptText.setText(label);
    const w = this.promptText.width;
    const h = this.promptText.height;
    const cx = Math.round(target.x);
    const cy = Math.round(target.y - 12);
    this.promptText.setPosition(Math.round(cx - w / 2), Math.round(cy - h / 2)).setVisible(true);
    this.promptBg.setPosition(cx, cy).setSize(w + 4, h + 3).setVisible(true);
  }

  private act(target: Actionable): void {
    if (target instanceof Destructible) {
      target.hit(1);
    } else {
      worldState.addCounter('villagers_read');
      eventBus.emit('npcTalked', { x: target.x, y: target.y });
      this.dialogue.openLines(target.lines);
    }
  }

  private onVineCut(cut: Destructible): void {
    const idx = this.vines.indexOf(cut);
    if (idx >= 0) this.vines.splice(idx, 1);
    worldState.addCounter('vines_cut');

    if (cut.group === 'gate') {
      this.gateRemaining = Math.max(0, this.gateRemaining - 1);
      if (this.gateRemaining === 0 && !worldState.hasFlag('thistledown_lane_opened')) {
        worldState.setFlag('thistledown_lane_opened', true);
        eventBus.emit('laneOpened', { region: 'thistledown' });
        this.showToast('The lane is clear.');
      }
    }
  }

  private showToast(text: string): void {
    const cx = Math.round(this.scale.width / 2);
    const cy = 24;
    const toast = addPixelText(this, 0, 0, text, { color: 0xe8e6d8 }).setScrollFactor(0).setDepth(2101);
    const w = toast.width;
    const h = toast.height;
    toast.setPosition(Math.round(cx - w / 2), Math.round(cy - h / 2));
    const bg = this.add
      .rectangle(cx, cy, w + 6, h + 4, 0x10101a, 0.85)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2100);
    this.tweens.add({
      targets: [toast, bg],
      alpha: 0,
      delay: 1600,
      duration: 800,
      onComplete: () => {
        toast.destroy();
        bg.destroy();
      },
    });
  }

  /** A soft, fading control hint instead of a wall of tutorial text (§14 P1). */
  private addControlHint(): void {
    const hint = addPixelText(this, 0, 0, 'WASD / Arrows to move - E to interact', { color: 0xe8e6d8 })
      .setScrollFactor(0)
      .setDepth(1000);
    hint.setPosition(Math.round((this.scale.width - hint.width) / 2), this.scale.height - 16);
    this.tweens.add({ targets: hint, alpha: 0, delay: 4500, duration: 1200, onComplete: () => hint.destroy() });
  }
}
