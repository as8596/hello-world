import type { Character, Stats } from '../types/character';
import type {
  CombatState, CombatantState, CombatAction, ActionResult, CombatRewards
} from '../types/combat';
import type { SkillDefinition } from '../data/skills/skills';
import { ENEMY_TEMPLATES } from '../data/enemies/enemies';
import { ENCOUNTERS } from '../data/world/encounters';
import { SKILLS } from '../data/skills/skills';
import { ITEMS } from '../data/items/items';

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function initCombat(
  encounterId: string,
  victoryScene: string,
  defeatScene: string,
  partyIds: string[],
  characters: Record<string, Character>
): CombatState {
  const encounter = ENCOUNTERS[encounterId];
  const combatants: CombatantState[] = [];

  // Add party members
  partyIds.forEach(id => {
    const char = characters[id];
    if (!char || char.currentHP <= 0) return;
    combatants.push({
      instanceId: id,
      characterId: id,
      isEnemy: false,
      currentHP: char.currentHP,
      currentMP: char.currentMP,
      statusEffects: [],
      isDefending: false,
      isAlive: true,
    });
  });

  // Add enemies
  encounter.enemies.forEach(({ templateId, count }) => {
    const template = ENEMY_TEMPLATES[templateId];
    for (let i = 0; i < count; i++) {
      const instanceId = count > 1 ? `${templateId}_${i + 1}` : templateId;
      combatants.push({
        instanceId,
        characterId: templateId,
        isEnemy: true,
        currentHP: template.stats.maxHP,
        currentMP: template.stats.maxMP,
        statusEffects: [],
        isDefending: false,
        isAlive: true,
      });
    }
  });

  // Calculate turn order by speed
  const turnOrder = [...combatants]
    .sort((a, b) => {
      const speedA = getSpeed(a, characters);
      const speedB = getSpeed(b, characters);
      return speedB - speedA + (Math.random() - 0.5) * 2;
    })
    .map(c => c.instanceId);

  return {
    active: true,
    encounterId,
    victoryScene,
    defeatScene,
    phase: 'player_input',
    combatants,
    turnOrder,
    currentTurnIndex: 0,
    roundNumber: 1,
    log: [`⚔️ Battle begins! ${encounter.enemies.map(e => ENEMY_TEMPLATES[e.templateId]?.name).join(', ')} appeared!`],
    pendingAction: null,
  };
}

function getSpeed(combatant: CombatantState, characters: Record<string, Character>): number {
  if (!combatant.isEnemy) {
    return characters[combatant.characterId]?.stats.speed ?? 5;
  }
  return ENEMY_TEMPLATES[combatant.characterId]?.stats.speed ?? 5;
}

function getStats(combatant: CombatantState, characters: Record<string, Character>): Stats {
  if (!combatant.isEnemy) {
    return characters[combatant.characterId]?.stats ?? defaultStats();
  }
  return ENEMY_TEMPLATES[combatant.characterId]?.stats ?? defaultStats();
}

function getName(combatant: CombatantState, characters: Record<string, Character>): string {
  if (!combatant.isEnemy) {
    return characters[combatant.characterId]?.name ?? combatant.characterId;
  }
  const template = ENEMY_TEMPLATES[combatant.characterId];
  if (!template) return combatant.instanceId;
  const enemies = Object.values(ENEMY_TEMPLATES);
  const sameType = enemies.filter(e => e.id === combatant.characterId);
  if (sameType.length > 1 || combatant.instanceId.endsWith('_2') || combatant.instanceId.endsWith('_3')) {
    return `${template.name} ${combatant.instanceId.split('_').pop()?.toUpperCase() ?? ''}`;
  }
  return template.name;
}

function defaultStats(): Stats {
  return { maxHP: 1, maxMP: 0, strength: 1, defense: 1, magic: 1, magicDefense: 1, speed: 1, luck: 1 };
}

export function calculatePhysicalDamage(
  attacker: Stats,
  defender: Stats,
  power = 1.0
): { damage: number; isCrit: boolean } {
  const base = Math.max(1, (attacker.strength * 2 - defender.defense) * power);
  const variance = randomBetween(0.85, 1.15);
  const critChance = (attacker.luck * 0.02) - (defender.luck * 0.01);
  const isCrit = Math.random() < clamp(critChance + 0.05, 0.02, 0.4);
  const damage = Math.round(base * variance * (isCrit ? 1.5 : 1));
  return { damage: Math.max(1, damage), isCrit };
}

export function calculateMagicDamage(
  attacker: Stats,
  defender: Stats,
  power = 1.0
): { damage: number; isCrit: boolean } {
  const base = Math.max(1, (attacker.magic * 2.5 - defender.magicDefense) * power);
  const variance = randomBetween(0.85, 1.15);
  const isCrit = Math.random() < 0.05;
  const damage = Math.round(base * variance * (isCrit ? 1.5 : 1));
  return { damage: Math.max(1, damage), isCrit };
}

export function resolveAction(
  state: CombatState,
  action: CombatAction,
  characters: Record<string, Character>
): { nextState: CombatState; result: ActionResult } {
  const newState: CombatState = JSON.parse(JSON.stringify(state));
  const actor = newState.combatants.find(c => c.instanceId === action.actorId)!;
  const actorStats = getStats(actor, characters);
  const actorName = getName(actor, characters);

  let result: ActionResult = {
    actorId: action.actorId,
    targetId: action.targetId ?? '',
    type: action.type,
    isCrit: false,
    missed: false,
    logLine: '',
  };

  if (action.type === 'flee') {
    const fleeChance = 0.5 + (actorStats.speed / 100);
    if (Math.random() < fleeChance) {
      newState.phase = 'fled';
      result.logLine = `🏃 ${actorName} fled from battle!`;
    } else {
      result.logLine = `${actorName} tried to flee but couldn't escape!`;
    }
    newState.log.push(result.logLine);
    return { nextState: newState, result };
  }

  if (action.type === 'defend') {
    actor.isDefending = true;
    result.logLine = `🛡️ ${actorName} takes a defensive stance.`;
    newState.log.push(result.logLine);
    return { nextState: newState, result };
  }

  const target = newState.combatants.find(c => c.instanceId === action.targetId);
  if (!target) return { nextState: newState, result };
  const targetStats = getStats(target, characters);
  const targetName = getName(target, characters);
  const defenseMultiplier = target.isDefending ? 0.5 : 1.0;

  if (action.type === 'attack') {
    const { damage, isCrit } = calculatePhysicalDamage(actorStats, targetStats);
    const finalDamage = Math.max(1, Math.round(damage * defenseMultiplier));
    target.currentHP = Math.max(0, target.currentHP - finalDamage);
    if (target.currentHP === 0) target.isAlive = false;
    result.damage = finalDamage;
    result.isCrit = isCrit;
    const critStr = isCrit ? ' CRITICAL HIT!' : '';
    result.logLine = `⚔️ ${actorName} attacks ${targetName} for ${finalDamage} damage!${critStr}`;
  }

  if (action.type === 'skill' && action.skillId) {
    const skill: SkillDefinition = SKILLS[action.skillId];
    if (!skill) return { nextState: newState, result };
    actor.currentMP = Math.max(0, actor.currentMP - skill.mpCost);

    if (skill.damageType === 'physical' && skill.power !== undefined) {
      if (skill.targetType === 'all_enemies') {
        const targets = newState.combatants.filter(c =>
          c.isEnemy !== actor.isEnemy && c.isAlive
        );
        let totalDmg = 0;
        targets.forEach(t => {
          const tStats = getStats(t, characters);
          const { damage, isCrit } = calculatePhysicalDamage(actorStats, tStats, skill.power);
          const def = t.isDefending ? 0.5 : 1.0;
          const dmg = Math.max(1, Math.round(damage * def));
          t.currentHP = Math.max(0, t.currentHP - dmg);
          if (t.currentHP === 0) t.isAlive = false;
          totalDmg += dmg;
          if (isCrit) result.isCrit = true;
        });
        result.damage = totalDmg;
        result.logLine = `${skill.icon} ${actorName} uses ${skill.name} on all enemies for ${totalDmg} total damage!`;
      } else {
        const { damage, isCrit } = calculatePhysicalDamage(actorStats, targetStats, skill.power);
        const finalDamage = Math.max(1, Math.round(damage * defenseMultiplier));
        // Twin strike hits twice
        const hits = skill.id === 'twin_strike' ? 2 : 1;
        const totalDamage = finalDamage * hits;
        target.currentHP = Math.max(0, target.currentHP - totalDamage);
        if (target.currentHP === 0) target.isAlive = false;
        result.damage = totalDamage;
        result.isCrit = isCrit;
        const hitsStr = hits > 1 ? ` (${hits} hits)` : '';
        result.logLine = `${skill.icon} ${actorName} uses ${skill.name} on ${targetName} for ${totalDamage} damage!${hitsStr}`;
      }
    } else if (skill.damageType === 'magic' && skill.power !== undefined) {
      if (skill.targetType === 'all_enemies') {
        const targets = newState.combatants.filter(c =>
          c.isEnemy !== actor.isEnemy && c.isAlive
        );
        let totalDmg = 0;
        targets.forEach(t => {
          const tStats = getStats(t, characters);
          const { damage } = calculateMagicDamage(actorStats, tStats, skill.power);
          const dmg = Math.max(1, Math.round(damage * (t.isDefending ? 0.5 : 1.0)));
          t.currentHP = Math.max(0, t.currentHP - dmg);
          if (t.currentHP === 0) t.isAlive = false;
          totalDmg += dmg;
        });
        result.damage = totalDmg;
        result.logLine = `${skill.icon} ${actorName} casts ${skill.name} on all enemies for ${totalDmg} damage!`;
      } else {
        const { damage, isCrit } = calculateMagicDamage(actorStats, targetStats, skill.power);
        const finalDamage = Math.max(1, Math.round(damage * defenseMultiplier));
        target.currentHP = Math.max(0, target.currentHP - finalDamage);
        if (target.currentHP === 0) target.isAlive = false;
        result.damage = finalDamage;
        result.isCrit = isCrit;
        result.logLine = `${skill.icon} ${actorName} casts ${skill.name} on ${targetName} for ${finalDamage} magic damage!`;
      }
    } else if (skill.healPower !== undefined) {
      const healAmount = Math.round(actorStats.magic * skill.healPower * randomBetween(0.9, 1.1));
      const tStats = getStats(target, characters);
      target.currentHP = Math.min(tStats.maxHP, target.currentHP + healAmount);
      result.healing = healAmount;
      result.logLine = `${skill.icon} ${actorName} uses ${skill.name} on ${targetName}, restoring ${healAmount} HP!`;
    } else if (skill.statusEffect && !skill.power && !skill.healPower) {
      result.logLine = `${skill.icon} ${actorName} uses ${skill.name}!`;
    }

    if (skill.statusEffect) {
      const statusTargets = skill.targetType === 'all_enemies'
        ? newState.combatants.filter(c => c.isEnemy !== actor.isEnemy && c.isAlive)
        : skill.targetType === 'all_allies'
        ? newState.combatants.filter(c => c.isEnemy === actor.isEnemy && c.isAlive)
        : [target];

      statusTargets.forEach(t => {
        t.statusEffects = t.statusEffects.filter(e => e.id !== skill.statusEffect!.id);
        t.statusEffects.push({ ...skill.statusEffect!, duration: skill.statusEffect!.duration });
      });
    }
  }

  if (action.type === 'item' && action.itemId) {
    const item = ITEMS[action.itemId];
    if (!item?.effect) return { nextState: newState, result };
    if (item.effect.type === 'heal_hp' && item.effect.magnitude) {
      const tStats = getStats(target, characters);
      const healed = Math.min(item.effect.magnitude, tStats.maxHP - target.currentHP);
      target.currentHP = Math.min(tStats.maxHP, target.currentHP + healed);
      result.healing = healed;
      result.logLine = `🧪 ${actorName} uses ${item.name} on ${targetName}, restoring ${healed} HP!`;
    } else if (item.effect.type === 'heal_mp' && item.effect.magnitude) {
      const tStats = getStats(target, characters);
      target.currentMP = Math.min(tStats.maxMP, target.currentMP + item.effect.magnitude);
      result.logLine = `💧 ${actorName} uses ${item.name} on ${targetName}, restoring ${item.effect.magnitude} MP!`;
    } else if (item.effect.type === 'revive') {
      if (!target.isAlive) {
        target.isAlive = true;
        target.currentHP = 1;
        result.logLine = `🪶 ${actorName} uses ${item.name} on ${targetName}! They rise again!`;
      }
    }
  }

  newState.log.push(result.logLine);
  return { nextState: newState, result };
}

export function checkCombatEnd(state: CombatState): 'ongoing' | 'victory' | 'defeat' {
  const partyAlive = state.combatants.some(c => !c.isEnemy && c.isAlive);
  const enemiesAlive = state.combatants.some(c => c.isEnemy && c.isAlive);
  if (!partyAlive) return 'defeat';
  if (!enemiesAlive) return 'victory';
  return 'ongoing';
}

export function advanceTurn(state: CombatState): CombatState {
  const newState: CombatState = JSON.parse(JSON.stringify(state));

  // Reset defending for the current combatant
  const current = newState.combatants.find(c => c.instanceId === newState.turnOrder[newState.currentTurnIndex]);
  if (current) current.isDefending = false;

  // Tick status effects
  if (current) {
    current.statusEffects = current.statusEffects
      .map(e => {
        if (e.damagePerTurn) {
          current.currentHP = Math.max(0, current.currentHP - e.damagePerTurn);
          if (current.currentHP === 0) current.isAlive = false;
          newState.log.push(`💀 ${e.name} deals ${e.damagePerTurn} damage to ${current.instanceId}!`);
        }
        return { ...e, duration: e.duration - 1 };
      })
      .filter(e => e.duration > 0);
  }

  // Advance turn index, skip dead combatants
  let nextIndex = (newState.currentTurnIndex + 1) % newState.turnOrder.length;
  let tries = 0;
  while (tries < newState.turnOrder.length) {
    const nextCombatant = newState.combatants.find(c => c.instanceId === newState.turnOrder[nextIndex]);
    if (nextCombatant?.isAlive) break;
    nextIndex = (nextIndex + 1) % newState.turnOrder.length;
    tries++;
  }

  if (nextIndex <= newState.currentTurnIndex) {
    newState.roundNumber++;
  }

  newState.currentTurnIndex = nextIndex;

  const nextActor = newState.combatants.find(c => c.instanceId === newState.turnOrder[nextIndex]);
  if (nextActor?.isEnemy) {
    newState.phase = 'enemy_turn';
  } else {
    newState.phase = 'player_input';
  }

  return newState;
}

export function runEnemyTurn(state: CombatState, _characters: Record<string, Character>): CombatAction {
  const currentId = state.turnOrder[state.currentTurnIndex];
  const actor = state.combatants.find(c => c.instanceId === currentId)!;
  const template = ENEMY_TEMPLATES[actor.characterId];
  const aliveParty = state.combatants.filter(c => !c.isEnemy && c.isAlive);

  if (aliveParty.length === 0) {
    return { type: 'defend', actorId: currentId };
  }

  const roll = Math.random();

  if (template?.skills.length && roll < 0.3) {
    const skillId = template.skills[Math.floor(Math.random() * template.skills.length)];
    const skill = SKILLS[skillId];
    if (skill && actor.currentMP >= skill.mpCost) {
      const target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
      return {
        type: 'skill',
        actorId: currentId,
        targetId: skill.targetType === 'all_allies' ? aliveParty[0].instanceId : target.instanceId,
        skillId,
      };
    }
  }

  if (roll > 0.9 && template?.aiPattern === 'defensive') {
    return { type: 'defend', actorId: currentId };
  }

  // Target the party member with lowest HP
  const target = aliveParty.reduce((weakest, c) =>
    c.currentHP < weakest.currentHP ? c : weakest
  );

  return { type: 'attack', actorId: currentId, targetId: target.instanceId };
}

export function calculateRewards(state: CombatState): CombatRewards {
  let totalXP = 0;
  let totalGold = 0;
  const items: string[] = [];

  state.combatants
    .filter(c => c.isEnemy)
    .forEach(enemy => {
      const template = ENEMY_TEMPLATES[enemy.characterId];
      if (!template) return;
      totalXP += template.xpReward;
      totalGold += template.goldReward;
      template.lootTable.forEach(entry => {
        if (Math.random() < entry.dropChance) {
          const qty = entry.quantity[0] + Math.floor(Math.random() * (entry.quantity[1] - entry.quantity[0] + 1));
          for (let i = 0; i < qty; i++) items.push(entry.itemId);
        }
      });
    });

  return { experience: totalXP, gold: totalGold, items };
}
