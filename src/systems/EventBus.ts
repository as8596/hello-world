/**
 * EventBus — decoupled pub/sub for cross-system communication (DESIGN.md §16).
 *
 * Combat, quests, dialogue, UI, and audio talk to each other by emitting
 * named events rather than holding direct references. Keeps systems
 * independent and testable.
 *
 * Stub for now — emit/on plus once/off. `GameEvents` is intentionally an
 * open interface: each system augments it (via declaration merging) with
 * the events it owns and their payload types, so emit/on stay type-checked.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GameEvents {
  // Augmented by systems, e.g.:
  //   'enemy:killed': { id: string; xp: number };
  //   'flag:changed': { key: string; value: boolean };
}

export type EventName = keyof GameEvents | (string & {});

type Payload<E extends EventName> = E extends keyof GameEvents ? GameEvents[E] : unknown;

export type EventHandler<E extends EventName> = (payload: Payload<E>) => void;

/** Returned by `on`/`once`; call it to remove the listener. */
export type Unsubscribe = () => void;

export class EventBus {
  private readonly handlers = new Map<EventName, Set<EventHandler<EventName>>>();

  on<E extends EventName>(event: E, handler: EventHandler<E>): Unsubscribe {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as EventHandler<EventName>);
    return () => this.off(event, handler);
  }

  once<E extends EventName>(event: E, handler: EventHandler<E>): Unsubscribe {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<E extends EventName>(event: E, handler: EventHandler<E>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler as EventHandler<EventName>);
    if (set.size === 0) this.handlers.delete(event);
  }

  emit<E extends EventName>(event: E, payload: Payload<E>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Iterate a copy so handlers may safely unsubscribe during dispatch.
    for (const handler of [...set]) handler(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** Shared singleton — one bus for the whole game. */
export const eventBus = new EventBus();
