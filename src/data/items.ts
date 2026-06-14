/**
 * Item definitions (DESIGN.md §19). MVP Thistledown stock: two consumables and
 * a starter charm. `value` doubles as the shop price for now.
 */
export interface ItemDef {
  id: string;
  name: string;
  kind: 'consumable' | 'charm';
  value: number;
  desc: string;
}

export const ITEMS: Record<string, ItemDef> = {
  bell_pear_preserve: {
    id: 'bell_pear_preserve',
    name: 'Bell-pear preserve',
    kind: 'consumable',
    value: 6,
    desc: 'Restores health.',
  },
  resonant_draught: {
    id: 'resonant_draught',
    name: 'Resonant draught',
    kind: 'consumable',
    value: 8,
    desc: 'Restores Echoes.',
  },
  sproutling_charm: {
    id: 'sproutling_charm',
    name: 'Sproutling charm',
    kind: 'charm',
    value: 14,
    desc: '+Echo regen.',
  },
};

/** Maple's store stock for the slice. */
export const MAPLE_STOCK: string[] = ['bell_pear_preserve', 'resonant_draught', 'sproutling_charm'];
