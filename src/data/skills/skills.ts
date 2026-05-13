export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  targetType: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self';
  damageType?: 'physical' | 'magic';
  power?: number;
  healPower?: number;
  statusEffect?: {
    id: string;
    name: string;
    type: 'buff' | 'debuff' | 'dot' | 'hot';
    duration: number;
    modifier?: number;
    stat?: 'maxHP' | 'maxMP' | 'strength' | 'defense' | 'magic' | 'magicDefense' | 'speed' | 'luck';
    damagePerTurn?: number;
  };
  icon: string;
}

export const SKILLS: Record<string, SkillDefinition> = {
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Strike with your shield. May stun the target.',
    mpCost: 8,
    targetType: 'single_enemy',
    damageType: 'physical',
    power: 1.1,
    statusEffect: {
      id: 'stun',
      name: 'Stun',
      type: 'debuff',
      duration: 1,
      modifier: -100,
      stat: 'speed',
    },
    icon: '🛡️',
  },
  provoke: {
    id: 'provoke',
    name: 'Provoke',
    description: 'Taunt enemies to target you. Raise your defense.',
    mpCost: 6,
    targetType: 'self',
    statusEffect: {
      id: 'provoked',
      name: 'Provoked',
      type: 'buff',
      duration: 2,
      modifier: 4,
      stat: 'defense',
    },
    icon: '⚔️',
  },
  arcane_bolt: {
    id: 'arcane_bolt',
    name: 'Arcane Bolt',
    description: 'A focused blast of raw magical energy.',
    mpCost: 12,
    targetType: 'single_enemy',
    damageType: 'magic',
    power: 1.6,
    icon: '✨',
  },
  frost_veil: {
    id: 'frost_veil',
    name: 'Frost Veil',
    description: 'Encase the party in frost. Lowers enemy attack.',
    mpCost: 14,
    targetType: 'all_enemies',
    damageType: 'magic',
    power: 0.6,
    statusEffect: {
      id: 'chilled',
      name: 'Chilled',
      type: 'debuff',
      duration: 2,
      modifier: -3,
      stat: 'strength',
    },
    icon: '❄️',
  },
  twin_strike: {
    id: 'twin_strike',
    name: 'Twin Strike',
    description: 'Two rapid hits in quick succession.',
    mpCost: 10,
    targetType: 'single_enemy',
    damageType: 'physical',
    power: 0.65,
    icon: '🏹',
  },
  healing_arrow: {
    id: 'healing_arrow',
    name: 'Healing Arrow',
    description: 'A mystical arrow that restores an ally\'s health.',
    mpCost: 12,
    targetType: 'single_ally',
    healPower: 0.8,
    icon: '💚',
  },
  intimidate: {
    id: 'intimidate',
    name: 'Intimidate',
    description: 'A fearsome roar that lowers defense.',
    mpCost: 10,
    targetType: 'all_allies',
    statusEffect: {
      id: 'intimidated',
      name: 'Intimidated',
      type: 'debuff',
      duration: 2,
      modifier: -3,
      stat: 'defense',
    },
    icon: '😤',
  },
  soul_drain: {
    id: 'soul_drain',
    name: 'Soul Drain',
    description: 'Drains the life force from an enemy.',
    mpCost: 16,
    targetType: 'single_enemy',
    damageType: 'magic',
    power: 0.9,
    statusEffect: {
      id: 'drained',
      name: 'Drained',
      type: 'dot',
      duration: 3,
      damagePerTurn: 5,
    },
    icon: '👻',
  },
};
