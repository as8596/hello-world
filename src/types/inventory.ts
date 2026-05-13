import type { Stats, CharacterClass } from './character';

export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'key_item';

export type ItemEffectType = 'heal_hp' | 'heal_mp' | 'revive' | 'cure_status';

export interface ItemEffect {
  type: ItemEffectType;
  magnitude?: number;
  statusToCure?: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  icon: string;
  value: number;
  statBonus?: Partial<Stats>;
  requiredClass?: CharacterClass[];
  effect?: ItemEffect;
  isKeyItem?: boolean;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}
