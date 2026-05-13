export type CharacterId = string;
export type EnemyId = string;
export type SkillId = string;
export type ItemId = string;
export type CharacterClass = 'knight' | 'mage' | 'ranger';
export type AIPattern = 'aggressive' | 'defensive' | 'random';

export interface Stats {
  maxHP: number;
  maxMP: number;
  strength: number;
  defense: number;
  magic: number;
  magicDefense: number;
  speed: number;
  luck: number;
}

export interface Equipment {
  weapon?: ItemId;
  armor?: ItemId;
  accessory?: ItemId;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'dot' | 'hot';
  stat?: keyof Stats;
  modifier?: number;
  damagePerTurn?: number;
  duration: number;
}

export interface Character {
  id: CharacterId;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  stats: Stats;
  currentHP: number;
  currentMP: number;
  skills: SkillId[];
  equipment: Equipment;
  statusEffects: StatusEffect[];
  portrait: string;
  isPartyMember: boolean;
}

export interface EnemyTemplate {
  id: EnemyId;
  name: string;
  level: number;
  stats: Stats;
  skills: SkillId[];
  sprite: string;
  xpReward: number;
  goldReward: number;
  lootTable: LootEntry[];
  aiPattern: AIPattern;
}

export interface LootEntry {
  itemId: ItemId;
  dropChance: number;
  quantity: [number, number];
}
