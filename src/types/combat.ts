import type { StatusEffect } from './character';

export type CombatPhase =
  | 'start'
  | 'player_input'
  | 'player_target'
  | 'player_skill'
  | 'player_item'
  | 'resolving'
  | 'enemy_turn'
  | 'victory'
  | 'defeat'
  | 'fled';

export type ActionType = 'attack' | 'skill' | 'item' | 'defend' | 'flee';

export interface CombatantState {
  instanceId: string;
  characterId: string;
  isEnemy: boolean;
  currentHP: number;
  currentMP: number;
  statusEffects: StatusEffect[];
  isDefending: boolean;
  isAlive: boolean;
}

export interface CombatAction {
  type: ActionType;
  actorId: string;
  targetId?: string;
  skillId?: string;
  itemId?: string;
}

export interface ActionResult {
  actorId: string;
  targetId: string;
  type: ActionType;
  damage?: number;
  healing?: number;
  isCrit: boolean;
  missed: boolean;
  logLine: string;
}

export interface CombatRewards {
  experience: number;
  gold: number;
  items: string[];
}

export interface CombatState {
  active: boolean;
  encounterId: string;
  victoryScene: string;
  defeatScene: string;
  phase: CombatPhase;
  combatants: CombatantState[];
  turnOrder: string[];
  currentTurnIndex: number;
  roundNumber: number;
  log: string[];
  pendingAction: Partial<CombatAction> | null;
  rewards?: CombatRewards;
}
