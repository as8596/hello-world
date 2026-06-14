/**
 * Flavor text for the sleeping villagers of Thistledown (DESIGN.md §18).
 * Data, not hardcoded into entities — villagers are assigned a set round-robin.
 * Branching/conditional dialogue (the full §16 schema) arrives with Maple in a
 * later step; these are linear observations for the sleeping village.
 */
export const sleepingVillagerLines: string[][] = [
  [
    'A villager sleeps where the Hush found them, chest rising slow as tides.',
    'The brambles grew politely around them, never once touching.',
  ],
  ['An old man dozes against a fence post. A kettle beside him is somehow still warm.'],
  ['A child is curled asleep on a chalk hopscotch grid, dreaming on the squares.'],
  ['A woman sleeps cradling a basket of bell-pears, long since gone to seed.'],
];
