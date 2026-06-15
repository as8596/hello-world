import type { WorldState } from '../../systems/WorldState';
import type { Condition } from './types';

/** Quest state is stored as a flag `quest_<id>` ('active' | 'done'). */
export function condPass(ws: WorldState, c: Condition): boolean {
  if ('flag' in c) {
    const want = c.is ?? true;
    const val = ws.getFlag(c.flag);
    // Boolean checks treat an unset flag as false (so `is: false` matches a flag
    // that was never set); string/number checks compare exactly.
    return typeof want === 'boolean' ? Boolean(val) === want : val === want;
  }
  if ('quest' in c) return ws.getFlag(`quest_${c.quest}`) === c.state;
  if ('counter' in c) return ws.getCounter(c.counter) >= c.atLeast;
  return false;
}

export function allPass(ws: WorldState, conds?: Condition[]): boolean {
  return !conds || conds.every((c) => condPass(ws, c));
}
