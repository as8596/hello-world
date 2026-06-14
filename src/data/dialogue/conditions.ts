import type { WorldState } from '../../systems/WorldState';
import type { Condition } from './types';

/** Quest state is stored as a flag `quest_<id>` ('active' | 'done'). */
export function condPass(ws: WorldState, c: Condition): boolean {
  if ('flag' in c) return ws.getFlag(c.flag) === (c.is ?? true);
  if ('quest' in c) return ws.getFlag(`quest_${c.quest}`) === c.state;
  if ('counter' in c) return ws.getCounter(c.counter) >= c.atLeast;
  return false;
}

export function allPass(ws: WorldState, conds?: Condition[]): boolean {
  return !conds || conds.every((c) => condPass(ws, c));
}
