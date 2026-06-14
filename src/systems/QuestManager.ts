import { QUESTS } from '../data/quests';
import { eventBus } from './EventBus';
import type { WorldState } from './WorldState';

/**
 * QuestManager — minimal quest state on top of the flag store (DESIGN.md §16).
 * Quest state lives in WorldState as `quest_<id>` so it serializes with
 * everything else. Starting/advancing emits `questObjective` for the HUD.
 */
export class QuestManager {
  constructor(private readonly ws: WorldState) {}

  isActive(id: string): boolean {
    return this.ws.getFlag(`quest_${id}`) === 'active';
  }

  start(id: string): void {
    if (this.ws.getFlag(`quest_${id}`)) return; // already started/done
    const quest = QUESTS[id];
    if (!quest) return;
    this.ws.setFlag(`quest_${id}`, 'active');
    eventBus.emit('questObjective', { id, title: quest.title, objective: quest.objective });
  }

  complete(id: string): void {
    if (!this.isActive(id)) return;
    this.ws.setFlag(`quest_${id}`, 'done');
    eventBus.emit('questObjective', { id, title: QUESTS[id]?.title ?? '', objective: '' });
  }
}
