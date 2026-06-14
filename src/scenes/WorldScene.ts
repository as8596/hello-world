import Phaser from 'phaser';
import { sleepingVillagerLines } from '../data/dialogue/villagers';
import { ENEMIES } from '../data/enemies';
import { thistledownMap } from '../data/maps/thistledown';
import { playerConfig } from '../data/playerConfig';
import { Destructible } from '../entities/Destructible';
import { EnemyBase } from '../entities/EnemyBase';
import { Interactable } from '../entities/Interactable';
import { Player } from '../entities/Player';
import { addPixelText } from '../systems/PixelFont';
import { TextureKeys } from '../systems/TextureFactory';
import { buildTilemap } from '../systems/TilemapBuilder';
import { eventBus } from '../systems/EventBus';
import { worldState } from '../systems/WorldState';
import { DialogueBox } from '../ui/DialogueBox';
import { SceneKeys } from './SceneKeys';

/** How close (px) the player must be to read a villager. */
const INTERACT_RADIUS = 22;

/**
 * WorldScene — the playable overworld. Builds the Thistledown tilemap, spawns
 * the player, vines, villagers, and enemies, and runs the combat loop (sword
 * vs. enemies/vines, enemy contact damage, hit-stop, death -> restart) through
 * the WorldState/EventBus spine. Proves Milestone C.6 ("you can fight and be hurt").
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private dialogue!: DialogueBox;
  private vines: Destructible[] = [];
  private interactables: Interactable[] = [];
  private enemies: EnemyBase[] = [];
  private hearts: Phaser.GameObjects.Image[] = [];
  private interactKeys: Phaser.Input.Keyboard.Key[] = [];
  private attackKeys: Phaser.Input.Keyboard.Key[] = [];
  private promptText!: Phaser.GameObjects.BitmapText;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private gateRemaining = 0;
  private dyingPlayer = false;

  constructor() {
    super(SceneKeys.World);
  }

  create(): void {
    this.vines = [];
    this.interactables = [];
    this.enemies = [];
    this.hearts = [];
    this.gateRemaining = 0;
    this.dyingPlayer = false;

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
      } else if (obj.type === 'enemy') {
        const def = ENEMIES[obj.enemyId ?? ''];
        if (def) {
          this.enemies.push(new EnemyBase(this, obj.x, obj.y, def, { onDeath: (e) => this.onEnemyDeath(e) }));
        }
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
    this.physics.add.collider(this.enemies, map.layer);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, undefined, this);

    // Camera: bounded, follows with a small dead-zone + slight lerp (§14 P1).
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthPx, map.heightPx);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(36, 28);
    cam.fadeIn(250);

    this.dialogue = new DialogueBox(this);

    this.promptBg = this.add
      .rectangle(0, 0, 1, 1, 0xe8e6d8, 0.92)
      .setOrigin(0.5, 0.5)
      .setDepth(1500)
      .setVisible(false);
    this.promptText = addPixelText(this, 0, 0, '', { color: 0x10101a })
      .setDepth(1501)
      .setVisible(false);

    this.buildHearts();

    const kb = this.input.keyboard!;
    this.interactKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    ];
    this.attackKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    ];
    this.input.on('pointerdown', () => {
      if (!this.dyingPlayer && !this.dialogue.isOpen && !this.physics.world.isPaused) {
        this.player.queueAttack(this.time.now);
      }
    });

    this.addControlHint();

    // Spine wiring (DESIGN.md §16): keep the HUD in sync, handle death.
    const offHealth = eventBus.on('playerHealth', (p) => this.updateHearts((p as { hp: number }).hp));
    const offDied = eventBus.on('playerDied', () => this.handlePlayerDeath());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offHealth();
      offDied();
    });

    worldState.addCounter('world:entered');
    eventBus.emit('world:ready', undefined);
  }

  update(_time: number, deltaMs: number): void {
    if (this.dyingPlayer) return;
    // Hit-stop: while physics is paused on a connecting hit, freeze everything.
    if (this.physics.world.isPaused) return;

    const now = this.time.now;
    const interactPressed = this.interactKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));
    const attackPressed = this.attackKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));

    // While a dialogue is open, freeze the player and route input to it.
    if (this.dialogue.isOpen) {
      this.player.halt();
      this.promptText.setVisible(false);
      this.promptBg.setVisible(false);
      if (interactPressed) this.dialogue.advance();
      return;
    }

    this.player.update(deltaMs);
    for (const enemy of this.enemies) enemy.think(this.player.x, this.player.y);

    if (attackPressed) this.player.queueAttack(now);
    this.resolveAttackHits();

    const target = this.nearestActionable();
    this.updatePrompt(target);
    if (interactPressed && target) this.act(target);
  }

  /** While the swing is live, hit any vine/enemy the hitbox overlaps (once each). */
  private resolveAttackHits(): void {
    if (!this.player.isAttacking) return;
    const rect = this.player.getHitRect();
    if (!rect) return;

    for (const vine of this.vines) {
      if (
        vine.active &&
        Phaser.Geom.Intersects.RectangleToRectangle(rect, vine.getBounds()) &&
        this.player.registerHit(vine)
      ) {
        vine.hit(playerConfig.attack.damage);
        this.onHitConnected();
      }
    }

    for (const enemy of this.enemies) {
      if (
        !enemy.isDead &&
        Phaser.Geom.Intersects.RectangleToRectangle(rect, enemy.getBounds()) &&
        this.player.registerHit(enemy)
      ) {
        enemy.takeDamage(playerConfig.attack.damage, this.player.x, this.player.y);
        this.onHitConnected();
      }
    }
  }

  /** Shared reaction to a melee hit landing: a few frozen frames (§14 P0). */
  private onHitConnected(): void {
    if (this.physics.world.isPaused) return;
    this.physics.world.pause();
    this.time.delayedCall(playerConfig.attack.hitStopMs, () => {
      if (this.scene.isActive() && this.physics.world.isPaused) this.physics.world.resume();
    });
  }

  private onPlayerTouchEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, enemyObj) => {
    const enemy = enemyObj as unknown as EnemyBase;
    if (enemy.isDead) return;
    if (this.player.takeHit(enemy.def.contactDamage, enemy.x, enemy.y)) {
      this.cameras.main.shake(110, 0.004); // a little screenshake on taking damage (§14 P1)
    }
  };

  private onEnemyDeath(dead: EnemyBase): void {
    const idx = this.enemies.indexOf(dead);
    if (idx >= 0) this.enemies.splice(idx, 1);
    worldState.addCounter('enemies_killed');
  }

  private handlePlayerDeath(): void {
    if (this.dyingPlayer) return;
    this.dyingPlayer = true;
    if (this.physics.world.isPaused) this.physics.world.resume();
    this.player.halt();
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart());
  }

  // --- Hearts HUD ---------------------------------------------------------

  private buildHearts(): void {
    const count = this.player.heartsMax / 2;
    for (let i = 0; i < count; i++) {
      this.hearts.push(
        this.add
          .image(5 + i * 8, 5, TextureKeys.Hearts, 'full')
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(1800),
      );
    }
    this.updateHearts(this.player.heartsHp);
  }

  private updateHearts(hp: number): void {
    for (let i = 0; i < this.hearts.length; i++) {
      const v = Phaser.Math.Clamp(hp - i * 2, 0, 2);
      this.hearts[i].setFrame(v >= 2 ? 'full' : v === 1 ? 'half' : 'empty');
    }
  }

  // --- Interaction --------------------------------------------------------

  /** Nearest readable villager within reach, or null. */
  private nearestActionable(): Interactable | null {
    let best: Interactable | null = null;
    let bestDist = INTERACT_RADIUS;
    for (const npc of this.interactables) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (d <= bestDist) {
        bestDist = d;
        best = npc;
      }
    }
    return best;
  }

  private updatePrompt(target: Interactable | null): void {
    if (!target) {
      this.promptText.setVisible(false);
      this.promptBg.setVisible(false);
      return;
    }
    this.promptText.setText(`E > ${target.label}`);
    const w = this.promptText.width;
    const h = this.promptText.height;
    const cx = Math.round(target.x);
    const cy = Math.round(target.y - 12);
    this.promptText.setPosition(Math.round(cx - w / 2), Math.round(cy - h / 2)).setVisible(true);
    this.promptBg.setPosition(cx, cy).setSize(w + 4, h + 3).setVisible(true);
  }

  private act(target: Interactable): void {
    worldState.addCounter('villagers_read');
    eventBus.emit('npcTalked', { x: target.x, y: target.y });
    this.dialogue.openLines(target.lines);
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
    const hint = addPixelText(this, 0, 0, 'WASD move - J attack - E read', { color: 0xe8e6d8 })
      .setScrollFactor(0)
      .setDepth(1000);
    hint.setPosition(Math.round((this.scale.width - hint.width) / 2), this.scale.height - 16);
    this.tweens.add({ targets: hint, alpha: 0, delay: 4500, duration: 1200, onComplete: () => hint.destroy() });
  }
}
