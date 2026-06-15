/**
 * Item definitions (DESIGN.md §19). `value` doubles as the shop price for now.
 * Consumables restore hearts/Echoes when used; charms are passive; tools and
 * materials are carried (no use effect yet).
 */
export interface ItemDef {
  id: string;
  name: string;
  kind: 'consumable' | 'charm' | 'tool' | 'material';
  value: number;
  desc: string;
  /** Icon texture key, for the inventory/shop list. */
  texture: string;
}

export const ITEMS: Record<string, ItemDef> = {
  fishing_rod: {
    id: 'fishing_rod',
    name: 'Fishing rod',
    kind: 'tool',
    value: 30,
    desc: 'A sturdy rod for coaxing fish from the still ponds.',
    texture: 'item-fishing-rod',
  },
  wheel_of_cheese: {
    id: 'wheel_of_cheese',
    name: 'Wheel of cheese',
    kind: 'consumable',
    value: 9,
    desc: 'A whole farmhouse wheel. Restores 3 hearts.',
    texture: 'item-cheese',
  },
  health_potion: {
    id: 'health_potion',
    name: 'Health potion',
    kind: 'consumable',
    value: 12,
    desc: 'A bright red tonic. Restores 4 hearts.',
    texture: 'item-health-potion',
  },
  bread: {
    id: 'bread',
    name: 'Bread',
    kind: 'consumable',
    value: 4,
    desc: 'A fresh-baked loaf. Restores 1 heart.',
    texture: 'item-bread',
  },
  sproutling_charm: {
    id: 'sproutling_charm',
    name: 'Sproutling charm',
    kind: 'charm',
    value: 14,
    desc: 'A lucky charm. +Echo regen.',
    texture: 'item-sproutling-charm',
  },
  pickled_roots: {
    id: 'pickled_roots',
    name: 'Jar of pickled roots',
    kind: 'consumable',
    value: 5,
    desc: 'Tangy and sharp. Restores 2 hearts.',
    texture: 'item-pickled-roots',
  },
  rope: {
    id: 'rope',
    name: 'Rope',
    kind: 'material',
    value: 6,
    desc: 'A coil of strong hemp rope. Always useful.',
    texture: 'item-rope',
  },
  firewood: {
    id: 'firewood',
    name: 'Bundle of firewood',
    kind: 'material',
    value: 5,
    desc: 'Dry-split wood for the hearth.',
    texture: 'item-firewood',
  },
  flint_and_steel: {
    id: 'flint_and_steel',
    name: 'Flint and steel',
    kind: 'tool',
    value: 8,
    desc: 'Strikes a reliable spark.',
    texture: 'item-flint-steel',
  },
  herbs: {
    id: 'herbs',
    name: 'Bundle of herbs',
    kind: 'consumable',
    value: 6,
    desc: 'Fragrant and restorative. Restores your Echoes.',
    texture: 'item-herbs',
  },

  // Carried/used outside the shop (kept for inventory + gathering).
  bell_pear_preserve: {
    id: 'bell_pear_preserve',
    name: 'Bell-pear preserve',
    kind: 'consumable',
    value: 6,
    desc: 'Restores 2 hearts.',
    texture: 'item-preserve',
  },
  resonant_draught: {
    id: 'resonant_draught',
    name: 'Resonant draught',
    kind: 'consumable',
    value: 8,
    desc: 'Restores your Echoes (stamina).',
    texture: 'item-draught',
  },
  berry: {
    id: 'berry',
    name: 'Wild berries',
    kind: 'consumable',
    value: 3,
    desc: 'A sweet handful, gathered from a bush. Restores 1 heart.',
    texture: 'item-berry',
  },
};

/** Maple's store stock for the slice. */
export const MAPLE_STOCK: string[] = [
  'fishing_rod',
  'wheel_of_cheese',
  'health_potion',
  'bread',
  'sproutling_charm',
  'pickled_roots',
  'rope',
  'firewood',
  'flint_and_steel',
  'herbs',
];
