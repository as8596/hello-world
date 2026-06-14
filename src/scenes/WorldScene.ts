import Phaser from 'phaser';
import { sleepingVillagerLines } from '../data/dialogue/villagers';
import { thistledownMap } from '../data/maps/thistledown';
import { Destructible } from '../entities/Destructible';
import { Interactable } from '../entities/Interactable';
import { Player } from '../entities/Player';
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
  private prompt!: Phaser.GameObjects.Text;
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

    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#10101a',
        backgroundColor: 'rgba(232,230,216,0.92)',
      })
      .setOrigin(0.5, 1)
      .setPadding(2, 1, 2, 1)
      .setDepth(1500)
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
      this.prompt.setVisible(false);
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
      this.prompt.setVisible(false);
      return;
    }
    const label = target instanceof Destructible ? 'E ▸ cut' : `E ▸ ${target.label}`;
    this.prompt
      .setText(label)
      .setPosition(Math.round(target.x), Math.round(target.y - 12))
      .setVisible(true);
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
    const toast = this.add
      .text(this.scale.width / 2, 24, text, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#e8e6d8',
        backgroundColor: 'rgba(16,16,26,0.85)',
      })
      .setOrigin(0.5)
      .setPadding(3, 2, 3, 2)
      .setScrollFactor(0)
      .setDepth(2100);
    this.tweens.add({ targets: toast, alpha: 0, delay: 1600, duration: 800, onComplete: () => toast.destroy() });
  }

  /** A soft, fading control hint instead of a wall of tutorial text (§14 P1). */
  private addControlHint(): void {
    const hint = this.add
      .text(this.scale.width / 2, this.scale.height - 14, 'WASD / Arrows to move  ·  E to interact', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#e8e6d8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.tweens.add({ targets: hint, alpha: 0, delay: 4500, duration: 1200, onComplete: () => hint.destroy() });
  }
}
