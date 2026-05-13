import type { Character, Stats } from '../types/character';

const XP_TABLE = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250,
  3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
];

export function getXPThreshold(level: number): number {
  return XP_TABLE[Math.min(level, XP_TABLE.length - 1)] ?? 9999999;
}

export function getXPToNextLevel(character: Character): number {
  return getXPThreshold(character.level) - character.experience;
}

const CLASS_GROWTH: Record<string, Partial<Stats>> = {
  knight: { maxHP: 20, maxMP: 3, strength: 3, defense: 3, magic: 1, magicDefense: 1, speed: 1, luck: 1 },
  mage:   { maxHP: 8,  maxMP: 12, strength: 1, defense: 1, magic: 3, magicDefense: 3, speed: 1, luck: 2 },
  ranger: { maxHP: 14, maxMP: 6, strength: 2, defense: 2, magic: 1, magicDefense: 2, speed: 3, luck: 2 },
};

export function levelUp(character: Character): Character {
  const growth = CLASS_GROWTH[character.class] ?? {};
  const newStats: Stats = { ...character.stats };
  (Object.keys(growth) as (keyof Stats)[]).forEach(stat => {
    newStats[stat] = (newStats[stat] ?? 0) + (growth[stat] ?? 0);
  });
  return {
    ...character,
    level: character.level + 1,
    stats: newStats,
    currentHP: newStats.maxHP,
    currentMP: newStats.maxMP,
  };
}

export function applyXP(character: Character, xp: number): { character: Character; leveledUp: boolean; levels: number } {
  let updated = { ...character, experience: character.experience + xp };
  let leveledUp = false;
  let levels = 0;
  while (updated.experience >= getXPThreshold(updated.level)) {
    updated = levelUp(updated);
    leveledUp = true;
    levels++;
  }
  return { character: updated, leveledUp, levels };
}
