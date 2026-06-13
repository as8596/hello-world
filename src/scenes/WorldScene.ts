import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { TextureKeys } from '../systems/TextureFactory';
import { eventBus } from '../systems/EventBus';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

// Empty placeholder overworld, several screens wide so camera-follow is
// meaningful. A real Tiled map + collision layer arrives in step 3.
const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;

/**
 * WorldScene — the playable overworld. Currently: a tiled ground, a
 * controllable Player with 8-dir delta-time movement, and a camera that
 * follows. Proves Milestone A.2 ("you walk around an empty map").
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super(SceneKeys.World);
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Tiled ground so movement reads against the world.
    this.add
      .tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, TextureKeys.Ground)
      .setOrigin(0, 0)
      .setDepth(-10);

    Player.registerAnims(this);
    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    // Camera: bounded, follows with a small dead-zone + slight lerp (§14 P1),
    // roundPixels for crisp pixels.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
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
