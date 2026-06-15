import Phaser from 'phaser';
import { sleepingVillagerLines } from '../data/dialogue/villagers';
import { bramblewerth } from '../data/bossConfig';
import { NPCS } from '../data/dialogue/npcs';
import { oathNpc } from '../data/dialogue/oath';
import type { Effect } from '../data/dialogue/types';
import { LORE } from '../data/dialogue/lore';
import { ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { handbellConfig } from '../data/handbellConfig';
import { AREAS, type AreaId, isAreaId, START_AREA } from '../data/maps/areas';
import type { MapObjectInstance } from '../data/maps/types';
import { playerConfig } from '../data/playerConfig';
import { RENDER_SCALE as RS } from '../data/render';
import { Boss } from '../entities/Boss';
import { BossDoor } from '../entities/BossDoor';
import { Chime } from '../entities/Chime';
import { Destructible } from '../entities/Destructible';
import { EnemyBase } from '../entities/EnemyBase';
import { FogPatch } from '../entities/FogPatch';
import { Interactable } from '../entities/Interactable';
import { Pickup } from '../entities/Pickup';
import { Player } from '../entities/Player';
import { Tree } from '../entities/Tree';
import { HintSystem } from '../systems/HintSystem';
import { addPixelText } from '../systems/PixelFont';
import { TextureKeys } from '../systems/TextureFactory';
import { buildTilemap } from '../systems/TilemapBuilder';
import { DialogueRunner } from '../systems/DialogueRunner';
import { eventBus } from '../systems/EventBus';
import { QuestManager } from '../systems/QuestManager';
import { saveGame } from '../systems/SaveSystem';
import { worldState } from '../systems/WorldState';
import { audio } from '../systems/AudioManager';
import { DialogueBox } from '../ui/DialogueBox';
import { SceneKeys } from './SceneKeys';

/** How close (px) the player must be to read a villager. */
const INTERACT_RADIUS = 22 * RS;
const BOSS_BAR_WIDTH = 140 * RS;

// Nighttime mood. NIGHT_TINT is multiplied over the world (purple → darker,
// blue-leaning); NIGHT_STRENGTH is how strongly (0 = off, 1 = full). The glow
// textures are warm light added back at hearths + drifting fireflies.
const NIGHT_TINT = 0x2a2148;
const NIGHT_STRENGTH = 0.6;
const GLOW_TEXTURE = 'warm-glow';
const FIREFLY_TEXTURE = 'firefly-glow';
const HURT_VIGNETTE_TEXTURE = 'hurt-vignette';

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
  private wards: Destructible[] = [];
  private trees: Tree[] = [];
  private treeTrunks: Phaser.GameObjects.Rectangle[] = [];
  private fog: FogPatch[] = [];
  private interactables: Interactable[] = [];
  // Scripted encounters: a trigger zone raises its deferred spawns; clearing the
  // pack dispels the matching ward(s). Keyed by encounter group.
  private triggers: { x: number; y: number; group: string }[] = [];
  private encounterSpawns = new Map<string, MapObjectInstance[]>();
  private startedEncounters = new Set<string>();
  private encounterRemaining = new Map<string, number>();
  private enemies: EnemyBase[] = [];
  private pickups: Pickup[] = [];
  private itemPickups: Pickup[] = [];
  private bellVineExamine?: Interactable;
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
  private dodgeKeys: Phaser.Input.Keyboard.Key[] = [];
  private promptText!: Phaser.GameObjects.BitmapText;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private gateRemaining = 0;
  private fogRemaining = 0;
  private dyingPlayer = false;
  private readonly hearthPositions: { x: number; y: number }[] = [];
  private nightOverlay?: Phaser.GameObjects.Rectangle;
  private readonly fireflies: Phaser.GameObjects.Image[] = [];
  private hurtVignette?: Phaser.GameObjects.Image;

  /** The area currently loaded, its edge exits, and named arrival points. */
  private areaId: AreaId = START_AREA;
  private exits: { x: number; y: number; toArea: AreaId; toEntry: string }[] = [];
  private entries = new Map<string, { x: number; y: number }>();
  private transitioning = false;

  constructor() {
    super(SceneKeys.World);
  }

  create(): void {
    this.vines = [];
    this.fog = [];
    this.wards = [];
    this.trees = [];
    this.treeTrunks = [];
    this.triggers = [];
    this.encounterSpawns.clear();
    this.startedEncounters.clear();
    this.encounterRemaining.clear();
    this.interactables = [];
    this.enemies = [];
    this.pickups = [];
    this.itemPickups = [];
    this.bellVineExamine = undefined;
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
    this.transitioning = false;
    this.hearthPositions.length = 0;
    this.fireflies.length = 0;
    this.exits = [];
    this.entries.clear();

    // Which area are we in? (set by a transition / load; defaults to the start.)
    const savedArea = worldState.getFlag('area');
    this.areaId = isAreaId(savedArea) ? savedArea : START_AREA;
    const map = buildTilemap(this, AREAS[this.areaId]);
    this.physics.world.setBounds(0, 0, map.widthPx, map.heightPx);

    // Hand-placed objects. The map reacts to saved/earned flags so a reload (or
    // a death-respawn) rebuilds the world in its current state, not from scratch
    // (DESIGN.md §22): opened gates stay open, the boss stays beaten, etc.
    const woken = worldState.hasFlag('thistledown_woken');
    // A woken valley implies you long since took up the blade + bell (defensive
    // against hand-edited/late saves, so verbs are never locked in the hub).
    if (woken) {
      worldState.setFlag('has_blade', true);
      worldState.setFlag('has_handbell', true);
    }
    let villagerIndex = 0;
    for (const obj of map.objects) {
      if (obj.type === 'vine') {
        if (obj.group === 'gate' && (woken || worldState.hasFlag('thistledown_lane_opened'))) continue;
        if (obj.group === 'bell' && (woken || worldState.hasFlag('has_handbell'))) continue; // bell already taken
        const vine = new Destructible(this, obj.x, obj.y, {
          group: obj.group,
          onCut: (cut) => this.onVineCut(cut),
        });
        this.vines.push(vine);
        if (obj.group === 'gate') this.gateRemaining++;
        // The bell-vine can be examined (E) before you have a blade to cut it.
        if (obj.group === 'bell' && !worldState.hasFlag('has_blade')) {
          this.bellVineExamine = new Interactable(this, obj.x, obj.y, {
            label: 'examine',
            lines: ['A dense snarl of thorny vines seals the way. Something sharp would cut right through it.'],
          }).setVisible(false);
          this.interactables.push(this.bellVineExamine);
        }
      } else if (obj.type === 'fog') {
        if (woken || worldState.hasFlag('thistledown_fog_cleared')) continue;
        const patch = new FogPatch(this, obj.x, obj.y, {
          group: obj.group,
          onDispel: (p) => this.onFogDispelled(p),
        });
        this.fog.push(patch);
        this.fogRemaining++;
      } else if (obj.type === 'enemy') {
        if (woken) continue; // the woken valley is a safe hub
        const def = ENEMIES[obj.enemyId ?? ''];
        if (def) {
          this.enemies.push(
            new EnemyBase(this, obj.x, obj.y, def, {
              onDeath: (e) => this.onEnemyDeath(e),
              onPlayerHit: this.hurtPlayerFrom,
            }),
          );
        }
      } else if (obj.type === 'heart') {
        // Per-fragment persistence (there are several across the world now), keyed
        // by area + tile so taking one doesn't suppress the others.
        const key = `heart_taken_${this.areaId}_${Math.round(obj.x)}_${Math.round(obj.y)}`;
        if (worldState.hasFlag(key)) continue;
        this.pickups.push(
          new Pickup(this, obj.x, obj.y, TextureKeys.HeartFragment, { onCollect: (p) => this.onHeartCollected(p, key) }),
        );
      } else if (obj.type === 'marker') {
        const lines = LORE[obj.loreId ?? ''] ?? ['...'];
        this.interactables.push(
          new Interactable(this, obj.x, obj.y, { texture: TextureKeys.Cairn, label: 'examine', lines }),
        );
      } else if (obj.type === 'trigger') {
        if (obj.group && !worldState.hasFlag(`encounter_${obj.group}_cleared`)) {
          this.triggers.push({ x: obj.x, y: obj.y, group: obj.group });
        }
      } else if (obj.type === 'spawn') {
        if (obj.group && obj.enemyId && !worldState.hasFlag(`encounter_${obj.group}_cleared`)) {
          const list = this.encounterSpawns.get(obj.group) ?? [];
          list.push(obj);
          this.encounterSpawns.set(obj.group, list);
        }
      } else if (obj.type === 'ward') {
        if (obj.group && !worldState.hasFlag(`encounter_${obj.group}_cleared`)) {
          const ward = new Destructible(this, obj.x, obj.y, { group: obj.group });
          ward.setTint(0x9a6cd0); // a sickly violet so it reads as "magic — can't just cut it"
          this.wards.push(ward);
        }
      } else if (obj.type === 'tree') {
        this.trees.push(new Tree(this, obj.x, obj.y));
        // A small invisible static trunk at the base so the player rounds it.
        // Aligned to the art's actual trunk (measured), centered on the tile.
        const trunk = this.add.rectangle(obj.x, obj.y - 1 * RS, 7 * RS, 5 * RS).setOrigin(0.5).setVisible(false);
        this.physics.add.existing(trunk, true);
        this.treeTrunks.push(trunk);
      } else if (obj.type === 'blade') {
        if (woken || worldState.hasFlag('has_blade')) continue;
        const glow = this.makePickupGlint(obj.x, obj.y, [180, 210, 255]); // cool steel glint
        const tex = this.textures.exists('item-blade') ? 'item-blade' : TextureKeys.Blade;
        this.itemPickups.push(
          new Pickup(this, obj.x, obj.y, tex, { glow, scale: 0.55, onCollect: () => this.onBladeCollected() }),
        );
      } else if (obj.type === 'handbell') {
        if (woken || worldState.hasFlag('has_handbell')) continue;
        const glow = this.makePickupGlint(obj.x, obj.y, [255, 220, 140]); // warm gold glint
        const tex = this.textures.exists('item-handbell') ? 'item-handbell' : TextureKeys.Handbell;
        this.itemPickups.push(
          new Pickup(this, obj.x, obj.y, tex, { glow, scale: 0.55, onCollect: () => this.onHandbellCollected() }),
        );
      } else if (obj.type === 'hearth') {
        this.hearthPositions.push({ x: obj.x, y: obj.y });
        this.interactables.push(
          new Interactable(this, obj.x, obj.y, {
            texture: TextureKeys.Hearth,
            label: 'rest',
            onInteract: () => this.useHearth(obj.x, obj.y),
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
      } else if (obj.type === 'exit') {
        if (obj.toArea && isAreaId(obj.toArea) && obj.toEntry) {
          this.exits.push({ x: obj.x, y: obj.y, toArea: obj.toArea, toEntry: obj.toEntry });
        }
      } else if (obj.type === 'entry') {
        if (obj.entryId) this.entries.set(obj.entryId, { x: obj.x, y: obj.y });
      } else {
        const lines = sleepingVillagerLines[villagerIndex % sleepingVillagerLines.length];
        villagerIndex++;
        const villager = new Interactable(this, obj.x, obj.y, { lines });
        this.interactables.push(villager);
        this.villagers.push(villager);
      }
    }

    // A loaded woken valley shows its people already risen.
    if (woken) for (const v of this.villagers) v.setTexture(TextureKeys.VillagerAwake);

    Player.registerAnims(this);
    // Spawn priority: (1) the entry we just transitioned to, (2) the last hearth
    // if it's in this area, (3) the area's default spawn.
    const pendingEntry = worldState.getFlag('area_entry');
    worldState.clearFlag('area_entry'); // consume it
    let spawn = map.spawn;
    if (typeof pendingEntry === 'string' && this.entries.has(pendingEntry)) {
      spawn = this.entries.get(pendingEntry)!;
    } else if (worldState.hasFlag('has_hearth') && worldState.getFlag('hearth_area') === this.areaId) {
      spawn = { x: worldState.getCounter('hearth_x'), y: worldState.getCounter('hearth_y') };
    }
    this.player = new Player(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player, map.layer);
    this.physics.add.collider(this.player, this.vines);
    this.physics.add.collider(this.player, this.wards);
    this.physics.add.collider(this.player, this.treeTrunks);
    this.physics.add.collider(this.player, this.fog);
    this.physics.add.collider(this.player, this.bossDoors);
    this.physics.add.collider(this.enemies, map.layer);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, undefined, this);

    // Camera: bounded, follows with a small dead-zone + slight lerp (§14 P1).
    // Zoomed in 30% for a cozier, closer view (scroll-factor-0 overlays grow with
    // zoom about the centre, so they still cover the screen).
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthPx, map.heightPx);
    cam.setZoom(1.3);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(36 * RS, 28 * RS);
    cam.fadeIn(250);

    this.setupNightAmbiance(map.widthPx, map.heightPx);

    // Audio: create the (suspended) context now, unlock it on the first input
    // (browsers require a gesture), and a mute toggle.
    audio.init();
    const unlock = (): void => audio.resume();
    this.input.keyboard?.once('keydown', unlock);
    this.input.once('pointerdown', unlock);
    this.input.keyboard?.on('keydown-M', () => {
      const muted = audio.toggleMute();
      this.showToast(muted ? 'Sound off' : 'Sound on');
    });

    // The adaptive score runs for the whole session; intensity is driven below.
    audio.startMusic();

    // Escape opens the pause menu: freeze the world and hand input to MenuScene
    // (which resumes us when dismissed). Skip while dying/transitioning or with
    // a dialogue open — those own the moment and have their own dismissal.
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.dyingPlayer || this.transitioning || this.waking || this.dialogueRunner.isActive) return;
      if (this.scene.isActive(SceneKeys.Menu)) return;
      this.scene.pause();
      this.scene.launch(SceneKeys.Menu);
    });

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
    this.player.emitStamina(true);

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
    this.dodgeKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.K),
    ];
    this.navUpKeys = [kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP), kb.addKey(Phaser.Input.Keyboard.KeyCodes.W)];
    this.navDownKeys = [kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), kb.addKey(Phaser.Input.Keyboard.KeyCodes.S)];
    this.input.on('pointerdown', () => {
      if (!this.dyingPlayer && !this.dialogue.isOpen && !this.physics.world.isPaused) {
        this.player.queueAttack(this.time.now);
      }
    });

    HintSystem.tryShow(this, 'move', 'WASD / Arrows  -  move');

    // Death handling (the HUD listens to playerHealth in UIScene).
    const offDied = eventBus.on('playerDied', () => this.handlePlayerDeath());
    const offHurt = eventBus.on('playerHurt', () => {
      this.hurtFlash();
      audio.playSfx('playerHurt');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offDied();
      offHurt();
    });

    this.buildBossBar();
    // If the shrine was already opened (e.g. retrying after death), skip straight
    // to the boss so the fight is retryable without re-ringing the chimes.
    if (worldState.hasFlag('thistledown_belldoor_open')) {
      for (const door of this.bossDoors) door.open();
      if (!worldState.hasFlag('bramblewerth_defeated')) this.spawnBoss();
    } else {
      // Otherwise restore any partial chime progress so a load/return mid-puzzle
      // shows the chimes already rung instead of silently resetting to zero.
      const rung = Math.min(worldState.getCounter('chimes_rung'), this.chimes.length);
      for (let i = 0; i < rung; i++) this.chimes[i].markRung();
      this.chimesRung = rung;
    }

    worldState.addCounter('world:entered');
    eventBus.emit('world:ready', undefined);
  }

  update(_time: number, deltaMs: number): void {
    if (this.dyingPlayer || this.transitioning) return;
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
    const dodgePressed = this.dodgeKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));

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
    // After movement: a dash press overrides this frame's velocity.
    if (dodgePressed) this.player.tryDodge(now);
    for (const enemy of this.enemies) enemy.think(this.player.x, this.player.y);
    if (this.boss) {
      this.boss.think(this.player.x, this.player.y);
      this.updateBossBar();
    }
    audio.setMusicIntensity(this.dangerLevel());

    if (attackPressed) this.player.queueAttack(now);
    this.resolveAttackHits();

    if (ringPressed && this.player.ringBell(now)) this.ringHandbell();

    this.collectNearbyPickups();
    this.maybeShowContextHints();
    this.checkTriggers();
    for (const tree of this.trees) tree.syncDepth(this.player.y);
    if (this.checkAreaTransition()) return;

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
        // Armored foes clink (0 dmg) unless stunned — only a real hit freezes.
        if (enemy.takeDamage(playerConfig.attack.damage, this.player.x, this.player.y)) {
          this.onHitConnected();
        }
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
    audio.playSfx('hit');
    if (this.physics.world.isPaused) return;
    this.physics.world.pause();
    this.time.delayedCall(playerConfig.attack.hitStopMs, () => {
      if (this.scene.isActive() && this.physics.world.isPaused) this.physics.world.resume();
    });
  }

  private onPlayerTouchEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, enemyObj) => {
    const enemy = enemyObj as unknown as EnemyBase;
    if (enemy.isDead || enemy.def.contactDamage <= 0) return; // telegraph-only foes don't touch-damage
    this.hurtPlayerFrom(enemy.def.contactDamage, enemy.x, enemy.y);
  };

  /** A telegraphed enemy/boss attack (or contact) landing on the player. */
  private hurtPlayerFrom = (amount: number, fromX: number, fromY: number): void => {
    if (this.player.takeHit(amount, fromX, fromY)) {
      this.cameras.main.shake(120, 0.004); // screenshake on taking damage (§14 P1)
    }
  };

  private onEnemyDeath(dead: EnemyBase): void {
    const idx = this.enemies.indexOf(dead);
    if (idx >= 0) this.enemies.splice(idx, 1);
    worldState.addCounter('enemies_killed');
    this.addCoin(2); // a bounded coin faucet (DESIGN.md §19)
  }

  // --- Scripted encounters ------------------------------------------------

  /** Spring an ambush the moment the player steps onto a trigger zone. */
  private checkTriggers(): void {
    if (this.triggers.length === 0) return;
    const px = this.player.x;
    const py = this.player.y;
    for (const t of this.triggers) {
      if (!this.startedEncounters.has(t.group) && Phaser.Math.Distance.Between(px, py, t.x, t.y) <= 20 * RS) {
        this.startEncounter(t.group);
      }
    }
  }

  /** Raise an encounter's deferred spawns and start tracking them. */
  private startEncounter(group: string): void {
    if (this.startedEncounters.has(group)) return;
    this.startedEncounters.add(group);
    const spawns = this.encounterSpawns.get(group) ?? [];
    let count = 0;
    for (const s of spawns) {
      const def = ENEMIES[s.enemyId ?? ''];
      if (!def) continue;
      const enemy = new EnemyBase(this, s.x, s.y, def, {
        onDeath: (e) => {
          this.onEnemyDeath(e);
          this.onEncounterEnemyDown(group);
        },
        onPlayerHit: this.hurtPlayerFrom,
      });
      enemy.setScale(enemy.scale * 0.2); // a quick "burst from the thorns" pop-in
      this.tweens.add({ targets: enemy, scale: enemy.scale, duration: 220, ease: 'Back.Out' });
      this.enemies.push(enemy);
      count++;
    }
    if (count === 0) {
      // Nothing to fight (shouldn't happen) — just release the reward.
      this.clearEncounter(group);
      return;
    }
    this.encounterRemaining.set(group, count);
    this.cameras.main.shake(180, 0.005);
    this.showToast('The thicket springs to life!');
  }

  private onEncounterEnemyDown(group: string): void {
    const left = (this.encounterRemaining.get(group) ?? 0) - 1;
    this.encounterRemaining.set(group, left);
    if (left <= 0) this.clearEncounter(group);
  }

  /** Encounter beaten: persist it, dissolve its ward(s), reveal the reward. */
  private clearEncounter(group: string): void {
    if (worldState.hasFlag(`encounter_${group}_cleared`)) return;
    worldState.setFlag(`encounter_${group}_cleared`, true);
    let dispelled = false;
    for (const ward of this.wards) {
      if (ward.active && ward.group === group) {
        ward.hit(999); // force it open (wards aren't sword-cuttable, only the clear opens them)
        dispelled = true;
      }
    }
    audio.playSfx('chime');
    this.showToast(dispelled ? 'The thorns wither — the way beyond opens.' : 'The den falls quiet.');
  }

  // --- Handbell -----------------------------------------------------------

  /** Apply the ring: AoE stun + fog dispel within radius, with feedback. */
  private ringHandbell(): void {
    const px = this.player.x;
    const py = this.player.y;
    const r = handbellConfig.radius;

    audio.playSfx('handbell');
    this.spawnShockwave(px, py, r);
    this.screenPulse();

    for (const enemy of this.enemies) {
      if (!enemy.isDead && Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y) <= r) {
        enemy.stun(handbellConfig.stunMs);
      }
    }
    // Snapshot: dispel() removes the patch from this.fog mid-loop, which would
    // otherwise skip the next in-range patch (e.g. the middle of three).
    let dispelledAny = false;
    for (const patch of [...this.fog]) {
      if (patch.active && Phaser.Math.Distance.Between(px, py, patch.x, patch.y) <= r) {
        patch.dispel();
        dispelledAny = true;
      }
    }
    if (dispelledAny) audio.playSfx('fog');
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
    audio.playSfx('chime');
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
    const ex = Phaser.Math.Clamp(x, 96 * RS, 288 * RS);
    const ey = Phaser.Math.Clamp(y, 28 * RS, 88 * RS);
    this.enemies.push(
      new EnemyBase(this, ex, ey, def, { onDeath: (e) => this.onEnemyDeath(e), onPlayerHit: this.hurtPlayerFrom }),
    );
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
      saveGame(); // the payoff is a save point (DESIGN.md §22)
      this.showToast('Thistledown wakes.');
      // Dawn: as the curse lifts, so does the night — and the fireflies wink out.
      if (this.nightOverlay) {
        this.tweens.add({ targets: this.nightOverlay, alpha: 0.25, duration: 1800, ease: 'Sine.inOut' });
      }
      for (const fly of this.fireflies) {
        this.tweens.killTweensOf(fly);
        this.tweens.add({ targets: fly, alpha: 0, duration: 1400, onComplete: () => fly.destroy() });
      }
      this.fireflies.length = 0;
      this.waking = false;
      // The Oath choice, offered by a Warden's resonance at the shrine (§12).
      if (!worldState.getFlag('oath')) {
        this.time.delayedCall(800, () => this.dialogueRunner.startNpc(oathNpc));
      }
    });
  }

  /** The resonant toll: shake, a held golden flash, and a clear-air wave. */
  private greatBellToll(big: boolean): void {
    audio.playSfx('greatbell');
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
        .circle(ox, oy, 700 * RS, 0xfff2c0, 0.12)
        .setStrokeStyle(4 * RS, 0xffffff, 0.9)
        .setScale(0.02)
        .setDepth(1900);
      this.tweens.add({ targets: wave, scale: 1, alpha: 0, duration: 1500, ease: 'Cubic.Out', onComplete: () => wave.destroy() });
    }
  }

  private buildBossBar(): void {
    const cx = Math.round(this.scale.width / 2);
    const y = 13 * RS;
    const width = BOSS_BAR_WIDTH;
    this.bossBarBg = this.add
      .rectangle(cx, y, width + 4 * RS, 6 * RS, 0x10101a, 0.85)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);
    this.bossBarFill = this.add
      .rectangle(cx - width / 2, y, width, 4 * RS, 0xc0432b)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(2001)
      .setVisible(false);
    this.bossName = addPixelText(this, 0, 0, bramblewerth.name, { color: 0xe8e6d8 })
      .setScrollFactor(0)
      .setDepth(2001)
      .setVisible(false);
    this.bossName.setPosition(Math.round(cx - this.bossName.width / 2), 4 * RS);
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
    this.bossBarFill.width = BOSS_BAR_WIDTH * this.boss.hpRatio;
  }

  /** An expanding shockwave ring synced to the ring (§14 P0). */
  private spawnShockwave(x: number, y: number, radius: number): void {
    const ring = this.add
      .circle(x, y, radius)
      .setStrokeStyle(2 * RS, 0xfff2c0, 0.9)
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

  /**
   * Nighttime mood: a purple wash over the world (a screen-fixed MULTIPLY layer
   * below all UI), with a warm pulsing firelight added back at each hearth so
   * the rest points read as cozy islands of light in the dark.
   */
  private setupNightAmbiance(mapW: number, mapH: number): void {
    // If the valley already woke (e.g. retrying after death), start at dawn.
    const woken = worldState.hasFlag('thistledown_woken');
    this.nightOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, NIGHT_TINT, NIGHT_STRENGTH)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(400)
      .setAlpha(woken ? 0.25 : 1);

    // Warm orange firelight at each hearth — small, soft, slowly breathing.
    this.makeRadialGlow(GLOW_TEXTURE, 256, [255, 134, 50], 0.85, 2.8);
    for (const p of this.hearthPositions) {
      const glow = this.add
        .image(p.x, p.y, GLOW_TEXTURE)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(401)
        .setScale(0.82)
        .setAlpha(0.5);
      this.tweens.add({
        targets: glow,
        scale: 0.96,
        alpha: 0.66,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    // Random pixel fireflies drifting through the dark forest.
    if (woken) return;
    this.makeFireflyTexture();
    const count = Phaser.Math.Clamp(Math.round((mapW * mapH) / 90000), 16, 48);
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(24, mapW - 24);
      const y = Phaser.Math.Between(24, mapH - 24);
      const fly = this.add
        .image(x, y, FIREFLY_TEXTURE)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(401)
        .setScale(Phaser.Math.FloatBetween(0.7, 1.4))
        .setAlpha(Phaser.Math.FloatBetween(0.12, 0.4));
      if (Math.random() < 0.5) fly.setTint(0xfff0a0); // some warmer/yellower
      this.fireflies.push(fly);
      // Slow wander.
      this.tweens.add({
        targets: fly,
        x: x + Phaser.Math.Between(-26, 26),
        y: y + Phaser.Math.Between(-22, 22),
        duration: Phaser.Math.Between(2400, 4400),
        delay: Phaser.Math.Between(0, 1500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      // Out-of-sync twinkle.
      this.tweens.add({
        targets: fly,
        alpha: Phaser.Math.FloatBetween(0.6, 0.95),
        duration: Phaser.Math.Between(700, 1500),
        delay: Phaser.Math.Between(0, 1200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }
  }

  /** Bake a soft radial glow texture with a smooth power-curve falloff. */
  private makeRadialGlow(key: string, size: number, rgb: [number, number, number], peak: number, pow: number): void {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const img = ctx.createImageData(size, size);
    const c = size / 2;
    const [r, g, b] = rgb;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - c + 0.5, y - c + 0.5) / c;
        const a = d >= 1 ? 0 : Math.pow(1 - d, pow) * peak;
        const i = (y * size + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
  }

  /** Bake the tiny firefly glow: a soft green-gold halo with a bright pixel core. */
  private makeFireflyTexture(): void {
    if (this.textures.exists(FIREFLY_TEXTURE)) return;
    const size = 24;
    // Reuse the shared radial-falloff baker for the halo, then stamp the spark.
    this.makeRadialGlow(FIREFLY_TEXTURE, size, [205, 255, 150], 0.85, 2.4);
    const tex = this.textures.get(FIREFLY_TEXTURE) as Phaser.Textures.CanvasTexture;
    const ctx = tex.getContext();
    const c = size / 2;
    ctx.fillStyle = 'rgba(255,255,210,1)'; // bright near-white core (2x2)
    ctx.fillRect(c - 1, c - 1, 2, 2);
    tex.refresh();
  }

  /** A quick red edge-vignette flash when the player takes damage (§14 P1). */
  private hurtFlash(): void {
    this.ensureVignette();
    const v = this.hurtVignette;
    if (!v) return;
    this.tweens.killTweensOf(v);
    v.setVisible(true).setAlpha(0.75);
    this.tweens.add({
      targets: v,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => v.setVisible(false),
    });
  }

  /** Build the red edge-vignette (transparent center → red at the borders) once. */
  private ensureVignette(): void {
    if (this.hurtVignette) return;
    if (!this.textures.exists(HURT_VIGNETTE_TEXTURE)) {
      const W = 256;
      const H = 144;
      const tex = this.textures.createCanvas(HURT_VIGNETTE_TEXTURE, W, H);
      if (!tex) return;
      const ctx = tex.getContext();
      const img = ctx.createImageData(W, H);
      const EDGE = 0.26; // vignette occupies the outer ~26% on each side
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const n = Math.min(Math.min(x, W - 1 - x) / (W * EDGE), Math.min(y, H - 1 - y) / (H * EDGE));
          const a = n >= 1 ? 0 : Math.pow(1 - n, 1.7);
          const i = (y * W + x) * 4;
          img.data[i] = 200;
          img.data[i + 1] = 24;
          img.data[i + 2] = 24;
          img.data[i + 3] = Math.round(a * 255);
        }
      }
      ctx.putImageData(img, 0, 0);
      tex.refresh();
    }
    this.hurtVignette = this.add
      .image(0, 0, HURT_VIGNETTE_TEXTURE)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(2500)
      .setVisible(false)
      .setAlpha(0);
    this.hurtVignette.setDisplaySize(this.scale.width, this.scale.height);
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
    // Respawn in the hearth's area (create() then spawns at the hearth itself).
    const hearthArea = worldState.getFlag('hearth_area');
    if (worldState.hasFlag('has_hearth') && isAreaId(hearthArea)) worldState.setFlag('area', hearthArea);
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart());
  }

  // --- Area transitions ---------------------------------------------------

  /** Walked onto an edge opening? Fade out, swap area, fade in at its entry. */
  private checkAreaTransition(): boolean {
    const px = this.player.x;
    const py = this.player.y;
    for (const exit of this.exits) {
      if (Phaser.Math.Distance.Between(px, py, exit.x, exit.y) <= 14 * RS) {
        this.transitionTo(exit.toArea, exit.toEntry);
        return true;
      }
    }
    return false;
  }

  private transitionTo(toArea: AreaId, toEntry: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.halt();
    this.cameras.main.fadeOut(320, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      worldState.setFlag('area', toArea);
      worldState.setFlag('area_entry', toEntry);
      this.scene.restart();
    });
  }

  // --- Pickups & hearth ---------------------------------------------------

  /** Auto-collect heart fragments + Hollow items the player walks over. */
  private collectNearbyPickups(): void {
    const px = this.player.x;
    const py = this.player.y;
    for (const pickup of this.pickups) {
      if (pickup.active && Phaser.Math.Distance.Between(px, py, pickup.x, pickup.y) <= 12 * RS) {
        pickup.collect();
      }
    }
    for (const item of this.itemPickups) {
      if (item.active && Phaser.Math.Distance.Between(px, py, item.x, item.y) <= 12 * RS) {
        item.collect();
      }
    }
  }

  /** A soft ADD glow drawn above the night overlay so a pickup beacons in the dark. */
  private makePickupGlint(x: number, y: number, rgb: [number, number, number]): Phaser.GameObjects.Image {
    const key = `pickup-glow-${rgb.join('-')}`;
    this.makeRadialGlow(key, 96, rgb, 0.7, 2.6);
    const glow = this.add
      .image(x, y, key)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(402)
      .setScale(0.6)
      .setAlpha(0.35);
    this.tweens.add({ targets: glow, scale: 0.9, alpha: 0.62, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return glow;
  }

  private onBladeCollected(): void {
    worldState.setFlag('has_blade', true);
    audio.playSfx('chime');
    this.showToast('You take up the blade.');
    HintSystem.tryShow(this, 'attack', 'J / Click  -  attack');
    // With a blade in hand you can cut the vines, so drop the "examine" prompt.
    if (this.bellVineExamine) {
      const i = this.interactables.indexOf(this.bellVineExamine);
      if (i >= 0) this.interactables.splice(i, 1);
      this.bellVineExamine.destroy();
      this.bellVineExamine = undefined;
    }
  }

  private onHandbellCollected(): void {
    worldState.setFlag('has_handbell', true);
    audio.playSfx('handbell');
    this.showToast("You lift the Warden's Handbell.");
    HintSystem.tryShow(this, 'ring', 'F  -  ring the bell');
  }

  private onHeartCollected(pickup: Pickup, takenKey: string): void {
    const idx = this.pickups.indexOf(pickup);
    if (idx >= 0) this.pickups.splice(idx, 1);
    worldState.addCounter('heart_fragments');
    worldState.setFlag(takenKey, true); // this fragment won't respawn on death/load
    this.player.gainMaxHalfHearts(playerConfig.heartFragmentHalfHearts);
    audio.playSfx('heart');
    this.showToast('Heart container! Max health up.');
  }

  /** Rest at a hearth: heal to full, set it as the respawn point, and save (§22). */
  private useHearth(x: number, y: number): void {
    this.player.healFull();
    worldState.setFlag('rested', true);
    worldState.setFlag('has_hearth', true);
    worldState.setFlag('hearth_area', this.areaId);
    worldState.setCounter('hearth_x', Math.round(x));
    worldState.setCounter('hearth_y', Math.round(y));
    audio.playSfx('rested');
    saveGame();
    eventBus.emit('rested', { region: 'thistledown' });
    this.showToast('You rest by the hearth. (saved)');
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
    const cy = Math.round(target.y - 16 * RS);
    this.promptText.setPosition(Math.round(cx - w / 2), Math.round(cy - h / 2)).setVisible(true);
    this.promptBg.setPosition(cx, cy).setSize(w + 4 * RS, h + 3 * RS).setVisible(true);
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
    const cy = 24 * RS;
    const toast = addPixelText(this, 0, 0, text, { color: 0xe8e6d8 }).setScrollFactor(0).setDepth(2101);
    const w = toast.width;
    const h = toast.height;
    toast.setPosition(Math.round(cx - w / 2), Math.round(cy - h / 2));
    const bg = this.add
      .rectangle(cx, cy, w + 6 * RS, h + 4 * RS, 0x10101a, 0.85)
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

  /**
   * Raw danger level (0..1) for the adaptive score. The boss fight pins it high;
   * otherwise it rises with the nearest *engaged* enemy (closer = tenser), with a
   * faint floor of unease near unbroken fog. The MusicEngine smooths the result,
   * so an instantaneous drop (enemy dies) fades out rather than cutting.
   */
  private dangerLevel(): number {
    if (this.boss && this.boss.active && !this.boss.isDying) return 1;
    const px = this.player.x;
    const py = this.player.y;
    let level = 0;
    for (const e of this.enemies) {
      if (e.isDead || !e.isHostile) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
      const prox = Phaser.Math.Clamp(1 - d / (e.def.aggroRange * 1.5), 0.35, 1);
      if (prox > level) level = prox;
    }
    if (level < 0.25 && this.fog.some((f) => f.active && Phaser.Math.Distance.Between(px, py, f.x, f.y) <= 80 * RS)) {
      level = 0.25;
    }
    return level;
  }

  /**
   * Contextual verb hints (§14a): surface a fading one-time hint the moment its
   * verb becomes relevant. Each is self-rate-limited by its `hint_*` flag, so
   * the array scans stop after each fires. The pickup handlers also fire the
   * attack/ring hints; this covers the "already armed, approach a target" case.
   */
  private maybeShowContextHints(): void {
    const px = this.player.x;
    const py = this.player.y;
    if (worldState.hasFlag('has_blade') && !worldState.hasFlag('hint_attack')) {
      const near =
        this.enemies.some((e) => !e.isDead && Phaser.Math.Distance.Between(px, py, e.x, e.y) <= e.def.aggroRange) ||
        this.vines.some((v) => v.active && Phaser.Math.Distance.Between(px, py, v.x, v.y) <= 40 * RS);
      if (near) HintSystem.tryShow(this, 'attack', 'J / Click  -  attack');
    }
    if (worldState.hasFlag('has_handbell') && !worldState.hasFlag('hint_ring')) {
      if (this.fog.some((f) => f.active && Phaser.Math.Distance.Between(px, py, f.x, f.y) <= 48 * RS)) {
        HintSystem.tryShow(this, 'ring', 'F  -  ring the bell');
      }
    }
    if (!worldState.hasFlag('hint_read')) {
      if (this.interactables.some((n) => Phaser.Math.Distance.Between(px, py, n.x, n.y) <= INTERACT_RADIUS)) {
        HintSystem.tryShow(this, 'read', 'E  -  read');
      }
    }
  }
}
