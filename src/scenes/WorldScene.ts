import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config';
import { eventBus } from '../systems/EventBus';
import { worldState } from '../systems/WorldState';
import { SceneKeys } from './SceneKeys';

/**
 * WorldScene — the playable overworld. Empty for now: it just confirms the
 * Boot -> Preload -> World flow renders at the crisp fixed pixel scale, and
 * smoke-tests that the architectural spine (WorldState + EventBus) is wired.
 *
 * The map, player entity, enemies, and systems get layered in here next,
 * all driven by typed config from src/data per DESIGN.md.
 */
export class WorldScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.World);
  }

  create(): void {
    // Smoke-test the spine: bump a counter, listen for an event, emit it.
    worldState.addCounter('world:entered');
    eventBus.once('world:ready', () => {
      console.log(
        `[Brackenvale] World ready (entered x${worldState.getCounter('world:entered')}).`,
      );
    });

    this.add
      .text(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 8, 'BRACKENVALE', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e8e6d8',
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH / 2, BASE_HEIGHT / 2 + 10, 'world scene', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#6fb3ff',
      })
      .setOrigin(0.5);

    eventBus.emit('world:ready', undefined);
  }

  // delta-time driven; movement systems plug in here so feel stays
  // framerate-independent (see DESIGN.md movement conventions).
  update(_time: number, _deltaMs: number): void {
    // no-op for the empty scene
  }
}
