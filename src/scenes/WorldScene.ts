import Phaser from 'phaser';
import { thistledownMap } from '../data/maps/thistledown';
import { Player } from '../entities/Player';
import { buildTilemap } from '../systems/TilemapBuilder';
import { eventBus } from '../systems/EventBus';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

/**
 * WorldScene — the playable overworld. Builds the Thistledown tilemap with a
 * collision layer, spawns the Player on it, and follows with a bounded camera.
 * Proves Milestone B.3 ("follow the path and can't clip walls").
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super(SceneKeys.World);
  }

  create(): void {
    const map = buildTilemap(this, thistledownMap);

    this.physics.world.setBounds(0, 0, map.widthPx, map.heightPx);

    Player.registerAnims(this);
    this.player = new Player(this, map.spawn.x, map.spawn.y);
    this.physics.add.collider(this.player, map.layer);

    // Camera: bounded, follows with a small dead-zone + slight lerp (§14 P1),
    // roundPixels for crisp pixels.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthPx, map.heightPx);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(36, 28);

    this.addControlHint();

    // Spine smoke-test (DESIGN.md §16): bump a counter, round-trip an event.
    worldState.addCounter('world:entered');
    eventBus.once('world:ready', () => {
      console.log(
        `[Brackenvale] World ready (entered x${worldState.getCounter('world:entered')}).`,
      );
    });
    eventBus.emit('world:ready', undefined);
  }

  update(_time: number, deltaMs: number): void {
    this.player.update(deltaMs);
  }

  /** A soft, fading control hint instead of a wall of tutorial text (§14 P1). */
  private addControlHint(): void {
    const hint = this.add
      .text(this.scale.width / 2, this.scale.height - 14, 'WASD / Arrows to move', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#e8e6d8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 3500,
      duration: 1200,
      onComplete: () => hint.destroy(),
    });
  }
}
