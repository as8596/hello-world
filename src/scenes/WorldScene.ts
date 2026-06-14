import Phaser from 'phaser';
import { sleepingVillagerLines } from '../data/dialogue/villagers';
import { bramblewerth } from '../data/bossConfig';
import { NPCS } from '../data/dialogue/npcs';
import { oathNpc } from '../data/dialogue/oath';
import type { Effect } from '../data/dialogue/types';
import { ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { handbellConfig } from '../data/handbellConfig';
import { thistledownMap } from '../data/maps/thistledown';
import { playerConfig } from '../data/playerConfig';
import { Boss } from '../entities/Boss';
import { BossDoor } from '../entities/BossDoor';
import { Chime } from '../entities/Chime';
import { Destructible } from '../entities/Destructible';
import { EnemyBase } from '../entities/EnemyBase';
import { FogPatch } from '../entities/FogPatch';
import { HeartPickup } from '../entities/HeartPickup';
import { Interactable } from '../entities/Interactable';
import { Player } from '../entities/Player';
import { addPixelText } from '../systems/PixelFont';
import { TextureKeys } from '../systems/TextureFactory';
import { buildTilemap } from '../systems/TilemapBuilder';
import { DialogueRunner } from '../systems/DialogueRunner';
import { eventBus } from '../systems/EventBus';
import { QuestManager } from '../systems/QuestManager';
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
  private dialogueRunner!: DialogueRunner;
  private quests!: QuestManager;
  private navUpKeys: Phaser.Input.Keyboard.Key[] = [];
  private navDownKeys: Phaser.Input.Keyboard.Key[] = [];
  private vines: Destructible[] = [];
  private fog: FogPatch[] = [];
  private interactables: Interactable[] = [];
  private enemies: EnemyBase[] = [];
  private pickups: HeartPickup[] = [];
  private chimes: Chime[] = [];
  private bossDoors: BossDoor[] = [];
  private chimesRung = 0;
  private boss?: Boss;
  private bossSpawn?: { x: number; y: number };
  private villagers: Interactable[] = [];
  private greatBell?: Interactable;
  private waking = false;
  private bossBarBg?: Phaser.GameObjects.Rectangle;
  private bossBarFill?: Phaser.GameObjects.Rectangle;
  private bossName?: Phaser.GameObjects.BitmapText;
  private interactKeys: Phaser.Input.Keyboard.Key[] = [];
  private attackKeys: Phaser.Input.Keyboard.Key[] = [];
  private ringKeys: Phaser.Input.Keyboard.Key[] = [];
  private promptText!: Phaser.GameObjects.BitmapText;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private gateRemaining = 0;
  private fogRemaining = 0;
  private dyingPlayer = false;

  constructor() {
    super(SceneKeys.World);
  }

  create(): void {
    this.vines = [];
    this.fog = [];
    this.interactables = [];
    this.enemies = [];
    this.pickups = [];
    this.chimes = [];
    this.bossDoors = [];
    this.chimesRung = 0;
    this.boss = undefined;
    this.bossSpawn = undefined;
    this.villagers = [];
    this.greatBell = undefined;
    this.waking = false;
    this.gateRemaining = 0;
    this.fogRemaining = 0;
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
      } else if (obj.type === 'fog') {
        const patch = new FogPatch(this, obj.x, obj.y, {
          group: obj.group,
          onDispel: (p) => this.onFogDispelled(p),
        });
        this.fog.push(patch);
        this.fogRemaining++;
      } else if (obj.type === 'enemy') {
        const def = ENEMIES[obj.enemyId ?? ''];
        if (def) {
          this.enemies.push(new EnemyBase(this, obj.x, obj.y, def, { onDeath: (e) => this.onEnemyDeath(e) }));
        }
      } else if (obj.type === 'heart') {
        this.pickups.push(new HeartPickup(this, obj.x, obj.y, { onCollect: (p) => this.onHeartCollected(p) }));
      } else if (obj.type === 'hearth') {
        this.interactables.push(
          new Interactable(this, obj.x, obj.y, {
            texture: TextureKeys.Hearth,
            label: 'rest',
            onInteract: () => this.useHearth(),
          }),
        );
      } else if (obj.type === 'chime') {
        this.chimes.push(new Chime(this, obj.x, obj.y, { onActivate: () => this.onChimeRung() }));
      } else if (obj.type === 'door') {
        this.bossDoors.push(new BossDoor(this, obj.x, obj.y));
      } else if (obj.type === 'boss') {
        this.bossSpawn = { x: obj.x, y: obj.y }; // spawned when the door opens
      } else if (obj.type === 'maple') {
        const maple = new Interactable(this, obj.x, obj.y, { npcId: 'maple', label: 'talk' });
        this.interactables.push(maple);
        this.villagers.push(maple); // wakes with the peal
      } else if (obj.type === 'greatbell') {
        this.greatBell = new Interactable(this, obj.x, obj.y, {
          texture: TextureKeys.GreatBell,
          label: 'ring',
          onInteract: () => this.ringGreatBell(),
        });
        this.interactables.push(this.greatBell);
      } else {
        const lines = sleepingVillagerLines[villagerIndex % sleepingVillagerLines.length];
        villagerIndex++;
        const villager = new Interactable(this, obj.x, obj.y, { lines });
        this.interactables.push(villager);
        this.villagers.push(villager);
      }
    }

    Player.registerAnims(this);
    this.player = new Player(this, map.spawn.x, map.spawn.y);
    this.physics.add.collider(this.player, map.layer);
    this.physics.add.collider(this.player, this.vines);
    this.physics.add.collider(this.player, this.fog);
    this.physics.add.collider(this.player, this.bossDoors);
    this.physics.add.collider(this.enemies, map.layer);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, undefined, this);

    // Camera: bounded, follows with a small dead-zone + slight lerp (§14 P1).
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthPx, map.heightPx);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(36, 28);
    cam.fadeIn(250);

    this.dialogue = new DialogueBox(this);
    this.dialogueRunner = new DialogueRunner(this.dialogue, worldState, (e) => this.runDialogueEffect(e));
    this.quests = new QuestManager(worldState);

    this.promptBg = this.add
      .rectangle(0, 0, 1, 1, 0xe8e6d8, 0.92)
      .setOrigin(0.5, 0.5)
      .setDepth(1500)
      .setVisible(false);
    this.promptText = addPixelText(this, 0, 0, '', { color: 0x10101a })
      .setDepth(1501)
      .setVisible(false);

    // Hearts HUD lives in a parallel overlay scene; launch it once.
    if (!this.scene.isActive(SceneKeys.UI)) this.scene.launch(SceneKeys.UI);
    this.player.emitHealth();

    const kb = this.input.keyboard!;
    this.interactKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    ];
    this.attackKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    ];
    this.ringKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    ];
    this.navUpKeys = [kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP), kb.addKey(Phaser.Input.Keyboard.KeyCodes.W)];
    this.navDownKeys = [kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), kb.addKey(Phaser.Input.Keyboard.KeyCodes.S)];
    this.input.on('pointerdown', () => {
      if (!this.dyingPlayer && !this.dialogue.isOpen && !this.physics.world.isPaused) {
        this.player.queueAttack(this.time.now);
      }
    });

    this.addControlHint();

    // Death handling (the HUD listens to playerHealth in UIScene).
    const offDied = eventBus.on('playerDied', () => this.handlePlayerDeath());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, offDied);

    this.buildBossBar();
    // If the shrine was already opened (e.g. retrying after death), skip straight
    // to the boss so the fight is retryable without re-ringing the chimes.
    if (worldState.hasFlag('thistledown_belldoor_open')) {
      for (const door of this.bossDoors) door.open();
      this.spawnBoss();
    }

    worldState.addCounter('world:entered');
    eventBus.emit('world:ready', undefined);
  }

  update(_time: number, deltaMs: number): void {
    if (this.dyingPlayer) return;
    // Hit-stop: while physics is paused on a connecting hit, freeze everything.
    if (this.physics.world.isPaused) return;
    // The waking peal plays out as a cutscene; hold the player.
    if (this.waking) {
      this.player.halt();
      return;
    }

    const now = this.time.now;
    const interactPressed = this.interactKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));
    const attackPressed = this.attackKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));
    const ringPressed = this.ringKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));

    // While a dialogue is open, freeze the player and route input to it.
    if (this.dialogueRunner.isActive) {
      this.player.halt();
      this.promptText.setVisible(false);
      this.promptBg.setVisible(false);
      if (this.navUpKeys.some((k) => Phaser.Input.Keyboard.JustDown(k))) this.dialogueRunner.move(-1);
      if (this.navDownKeys.some((k) => Phaser.Input.Keyboard.JustDown(k))) this.dialogueRunner.move(1);
      if (interactPressed) this.dialogueRunner.advance();
      return;
    }

    this.player.update(deltaMs);
    for (const enemy of this.enemies) enemy.think(this.player.x, this.player.y);
    if (this.boss) {
      this.boss.think(this.player.x, this.player.y);
      this.updateBossBar();
    }

    if (attackPressed) this.player.queueAttack(now);
    this.resolveAttackHits();

    if (ringPressed && this.player.ringBell(now)) this.ringHandbell();

    this.collectNearbyPickups();

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

    if (
      this.boss &&
      !this.boss.isDying &&
      Phaser.Geom.Intersects.RectangleToRectangle(rect, this.boss.getBounds()) &&
      this.player.registerHit(this.boss)
    ) {
      const vulnerable = this.boss.isVulnerable;
      this.boss.takeDamage(playerConfig.attack.damage, this.player.x, this.player.y);
      if (vulnerable) this.onHitConnected(); // armored clang otherwise: no freeze
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
    this.addCoin(2); // a bounded coin faucet (DESIGN.md §19)
  }

  // --- Handbell -----------------------------------------------------------

  /** Apply the ring: AoE stun + fog dispel within radius, with feedback. */
  private ringHandbell(): void {
    const px = this.player.x;
    const py = this.player.y;
    const r = handbellConfig.radius;

    this.spawnShockwave(px, py, r);
    this.screenPulse();

    for (const enemy of this.enemies) {
      if (!enemy.isDead && Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y) <= r) {
        enemy.stun(handbellConfig.stunMs);
      }
    }
    for (const patch of this.fog) {
      if (patch.active && Phaser.Math.Distance.Between(px, py, patch.x, patch.y) <= r) {
        patch.dispel();
      }
    }
    for (const chime of this.chimes) {
      if (!chime.isActivated && Phaser.Math.Distance.Between(px, py, chime.x, chime.y) <= r) {
        chime.activate();
      }
    }
    if (this.boss && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= r) {
      this.boss.onBellRung(); // only stuns while it's venting
    }

    worldState.addCounter('bell_rung');
    eventBus.emit('bellRung', { region: 'thistledown' });
  }

  /** Each rung chime advances the door; all three opens it (DESIGN.md §12). */
  private onChimeRung(): void {
    this.chimesRung++;
    worldState.setCounter('chimes_rung', this.chimesRung);
    const total = this.chimes.length;
    if (this.chimesRung < total) {
      this.showToast(`Resonance chime ${this.chimesRung} / ${total}`);
      return;
    }
    if (!worldState.hasFlag('thistledown_belldoor_open')) {
      worldState.setFlag('thistledown_belldoor_open', true);
      eventBus.emit('bellDoorOpened', { region: 'thistledown' });
      for (const door of this.bossDoors) door.open();
      this.showToast('The shrine door opens.');
      this.time.delayedCall(900, () => this.spawnBoss());
    }
  }

  // --- Boss ---------------------------------------------------------------

  private spawnBoss(): void {
    if (this.boss || !this.bossSpawn) return;
    this.boss = new Boss(this, this.bossSpawn.x, this.bossSpawn.y, bramblewerth, {
      onPlayerHit: (damage, fromX, fromY) => {
        if (this.player.takeHit(damage, fromX, fromY)) this.cameras.main.shake(140, 0.005);
      },
      onRequestAdd: (x, y) => this.spawnBossAdd(x, y),
      onDefeated: () => this.onBossDefeated(),
    });
    this.physics.add.collider(this.player, this.boss);
    this.showBossBar();
    this.cameras.main.shake(220, 0.004);
    this.showToast('Bramblewerth, the Thornwarden');
  }

  private spawnBossAdd(x: number, y: number): void {
    if (this.enemies.length >= bramblewerth.adds.cap) return;
    const def = ENEMIES.thorn_sprite;
    if (!def) return;
    const ex = Phaser.Math.Clamp(x, 96, 288);
    const ey = Phaser.Math.Clamp(y, 28, 88);
    this.enemies.push(new EnemyBase(this, ex, ey, def, { onDeath: (e) => this.onEnemyDeath(e) }));
  }

  private onBossDefeated(): void {
    worldState.setFlag('bramblewerth_defeated', true);
    this.hideBossBar();
    this.showToast('The thorns fall still. The great bell may be rung.');
  }

  // --- The waking peal (DESIGN.md §12 payoff) ------------------------------

  private ringGreatBell(): void {
    if (!worldState.hasFlag('bramblewerth_defeated')) {
      this.showToast('The bell stays silent while the thorns dream.');
      return;
    }
    if (this.waking || worldState.hasFlag('bell_thistledown_rung')) {
      this.greatBellToll(false);
      return;
    }
    this.startWaking();
  }

  /** Ring the great bell -> wake the valley. The emotional climax (§12, §14). */
  private startWaking(): void {
    this.waking = true;
    this.player.halt();
    worldState.setFlag('bell_thistledown_rung', true);
    worldState.addCounter('great_bell_rung');
    eventBus.emit('greatBellRung', { region: 'thistledown' });

    this.greatBellToll(true);

    // The peal calms the last foes...
    for (const enemy of this.enemies) {
      this.tweens.add({ targets: enemy, alpha: 0, scale: 0.4, duration: 500, onComplete: () => enemy.destroy() });
    }
    this.enemies = [];

    // ...the Hush-fog lifts everywhere...
    for (const patch of [...this.fog]) patch.dispel();

    // ...and the sleepers rise, one after another.
    this.villagers.forEach((villager, i) => {
      this.time.delayedCall(700 + i * 160, () => {
        villager.setTexture(TextureKeys.VillagerAwake);
        this.tweens.add({ targets: villager, y: villager.y - 2, yoyo: true, duration: 180 });
      });
    });

    // The bell's reward: your first full heart, and the valley is awake.
    this.time.delayedCall(1600, () => {
      this.player.gainMaxHalfHearts(2);
      worldState.setFlag('thistledown_woken', true);
      this.showToast('Thistledown wakes.');
      this.waking = false;
      // The Oath choice, offered by a Warden's resonance at the shrine (§12).
      if (!worldState.getFlag('oath')) {
        this.time.delayedCall(800, () => this.dialogueRunner.startNpc(oathNpc));
      }
    });
  }

  /** The resonant toll: shake, a held golden flash, and a clear-air wave. */
  private greatBellToll(big: boolean): void {
    this.cameras.main.shake(big ? 520 : 160, big ? 0.008 : 0.004);

    const flash = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xfff2c0, big ? 0.6 : 0.25)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(2300);
    this.tweens.add({ targets: flash, alpha: 0, duration: big ? 1400 : 420, ease: 'Cubic.Out', onComplete: () => flash.destroy() });

    if (this.greatBell) {
      this.tweens.add({ targets: this.greatBell, scaleX: 1.2, scaleY: 1.2, yoyo: true, duration: 200, repeat: big ? 2 : 0 });
    }

    if (big) {
      // A clear-air wave sweeping across the whole valley.
      const ox = this.greatBell?.x ?? this.player.x;
      const oy = this.greatBell?.y ?? this.player.y;
      const wave = this.add
        .circle(ox, oy, 700, 0xfff2c0, 0.12)
        .setStrokeStyle(4, 0xffffff, 0.9)
        .setScale(0.02)
        .setDepth(1900);
      this.tweens.add({ targets: wave, scale: 1, alpha: 0, duration: 1500, ease: 'Cubic.Out', onComplete: () => wave.destroy() });
    }
  }

  private buildBossBar(): void {
    const cx = Math.round(this.scale.width / 2);
    const y = 13;
    const width = 140;
    this.bossBarBg = this.add
      .rectangle(cx, y, width + 4, 6, 0x10101a, 0.85)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);
    this.bossBarFill = this.add
      .rectangle(cx - width / 2, y, width, 4, 0xc0432b)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(2001)
      .setVisible(false);
    this.bossName = addPixelText(this, 0, 0, bramblewerth.name, { color: 0xe8e6d8 })
      .setScrollFactor(0)
      .setDepth(2001)
      .setVisible(false);
    this.bossName.setPosition(Math.round(cx - this.bossName.width / 2), 4);
  }

  private showBossBar(): void {
    this.bossBarBg?.setVisible(true);
    this.bossBarFill?.setVisible(true);
    this.bossName?.setVisible(true);
  }

  private hideBossBar(): void {
    this.bossBarBg?.setVisible(false);
    this.bossBarFill?.setVisible(false);
    this.bossName?.setVisible(false);
  }

  private updateBossBar(): void {
    if (!this.boss || !this.bossBarFill) return;
    if (this.boss.isDying) {
      this.hideBossBar();
      return;
    }
    this.bossBarFill.width = 140 * this.boss.hpRatio;
  }

  /** An expanding shockwave ring synced to the ring (§14 P0). */
  private spawnShockwave(x: number, y: number, radius: number): void {
    const ring = this.add
      .circle(x, y, radius)
      .setStrokeStyle(2, 0xfff2c0, 0.9)
      .setFillStyle(0xfff2c0, 0.08)
      .setScale(0.05)
      .setDepth(15);
    this.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
  }

  /** A gentle, cozy screen pulse on ring (§14 P1). */
  private screenPulse(): void {
    const flash = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xfff2c0, 0.16)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(2200);
    this.tweens.add({ targets: flash, alpha: 0, duration: 220, onComplete: () => flash.destroy() });
  }

  private onFogDispelled(patch: FogPatch): void {
    const idx = this.fog.indexOf(patch);
    if (idx >= 0) this.fog.splice(idx, 1);
    worldState.addCounter('fog_dispelled');

    this.fogRemaining = Math.max(0, this.fogRemaining - 1);
    if (this.fogRemaining === 0 && !worldState.hasFlag('thistledown_fog_cleared')) {
      worldState.setFlag('thistledown_fog_cleared', true);
      this.showToast('The fog lifts.');
    }
  }

  private handlePlayerDeath(): void {
    if (this.dyingPlayer) return;
    this.dyingPlayer = true;
    if (this.physics.world.isPaused) this.physics.world.resume();
    this.player.halt();
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart());
  }

  // --- Pickups & hearth ---------------------------------------------------

  /** Auto-collect heart fragments the player walks over. */
  private collectNearbyPickups(): void {
    for (const pickup of this.pickups) {
      if (pickup.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y) <= 12) {
        pickup.collect();
      }
    }
  }

  private onHeartCollected(pickup: HeartPickup): void {
    const idx = this.pickups.indexOf(pickup);
    if (idx >= 0) this.pickups.splice(idx, 1);
    worldState.addCounter('heart_fragments');
    this.player.gainMaxHalfHearts(playerConfig.heartFragmentHalfHearts);
    this.showToast('Heart container! Max health up.');
  }

  /** Rest at a hearth: heal to full and save (save system is a later step). */
  private useHearth(): void {
    this.player.healFull();
    worldState.setFlag('rested', true);
    eventBus.emit('rested', { region: 'thistledown' });
    this.showToast('You rest by the hearth.');
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
    if (target.npcId) {
      const npc = NPCS[target.npcId];
      if (npc) {
        eventBus.emit('npcTalked', { id: target.npcId });
        this.dialogueRunner.startNpc(npc);
      }
      return;
    }
    if (target.onInteract) {
      target.onInteract(this);
      return;
    }
    worldState.addCounter('villagers_read');
    eventBus.emit('npcTalked', { x: target.x, y: target.y });
    this.dialogueRunner.startLines('', target.lines);
  }

  // --- Coin, dialogue effects, the Oath -----------------------------------

  private addCoin(amount: number): void {
    const coin = worldState.addCounter('coin', amount);
    eventBus.emit('coinChanged', { coin });
  }

  /** Apply a dialogue/shop Effect (DESIGN.md §16/§19). */
  private runDialogueEffect(effect: Effect): void {
    if ('setFlag' in effect) {
      worldState.setFlag(effect.setFlag, effect.to);
    } else if ('startQuest' in effect) {
      this.quests.start(effect.startQuest);
    } else if ('advanceQuest' in effect) {
      this.quests.complete(effect.advanceQuest);
    } else if ('spendCoin' in effect) {
      this.addCoin(-effect.spendCoin);
    } else if ('giveItem' in effect) {
      const amount = effect.amount ?? 1;
      if (effect.giveItem === 'coin') this.addCoin(amount);
      else {
        worldState.addCounter(`item_${effect.giveItem}`, amount);
        this.showToast(`Bought ${ITEMS[effect.giveItem]?.name ?? effect.giveItem}.`);
      }
    } else if ('giveXp' in effect) {
      worldState.addCounter('xp', effect.giveXp);
    } else if ('chooseOath' in effect) {
      this.chooseOath(effect.chooseOath);
    }
  }

  private chooseOath(id: string): void {
    worldState.setFlag('oath', id);
    worldState.setFlag(`oath_${id}`, true);
    // A small starting blessing for now (skill trees arrive in step 14).
    this.player.healFull();
    const names: Record<string, string> = {
      oathblade: 'Oathblade',
      wildstrider: 'Wildstrider',
      bellsinger: 'Bellsinger',
    };
    this.showToast(`You swear the Oath of the ${names[id] ?? id}.`);
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
    const hint = addPixelText(this, 0, 0, 'WASD move - J attack - F bell - E read', { color: 0xe8e6d8 })
      .setScrollFactor(0)
      .setDepth(1000);
    hint.setPosition(Math.round((this.scale.width - hint.width) / 2), this.scale.height - 16);
    this.tweens.add({ targets: hint, alpha: 0, delay: 4500, duration: 1200, onComplete: () => hint.destroy() });
  }
}
