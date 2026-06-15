import { ITEMS, MAPLE_STOCK } from '../items';
import type { Choice, NpcDef } from './types';

/**
 * Maple — Thistledown's shopkeeper and first to wake at the peal (DESIGN.md
 * §16 worked example, §18). One definition; entries matched top-down by state
 * so she's asleep before the bell, grateful after, and her shop + the first
 * quest hang off the §16 effect vocabulary. The shop reuses dialogue choices
 * (§19): each item is a choice gated by an affordability condition.
 */
const shopChoices: Choice[] = [
  ...MAPLE_STOCK.map((id): Choice => {
    const item = ITEMS[id];
    return {
      text: `${item.name} - ${item.value}c`,
      when: [{ counter: 'coin', atLeast: item.value }],
      effects: [{ spendCoin: item.value }, { giveItem: id }],
      next: 'shop',
    };
  }),
  { text: 'Maybe later', next: 'hub' },
];

export const mapleNpc: NpcDef = {
  name: 'Maple',
  entries: [
    // Bram's home safe and Maple hasn't thanked you yet — a one-time payoff.
    {
      when: [{ flag: 'thistledown_woken' }, { flag: 'bram_found' }, { flag: 'maple_thanked_bram', is: false }],
      nodeId: 'reunited',
    },
    { when: [{ flag: 'thistledown_woken' }, { flag: 'met_maple' }], nodeId: 'hub' },
    { when: [{ flag: 'thistledown_woken' }], nodeId: 'firstChat' },
    { nodeId: 'asleep' },
  ],
  nodes: {
    asleep: {
      id: 'asleep',
      text: 'Maple is curled behind her shop counter, fast asleep. The kettle beside her is still warm.',
    },
    firstChat: {
      id: 'firstChat',
      speaker: 'Maple',
      text: "You're awake — and so am I! That was the bell, wasn't it? Bless you, Warden. The whole valley's stirring.",
      effects: [{ setFlag: 'met_maple', to: true }],
      next: 'hub',
    },
    hub: {
      id: 'hub',
      speaker: 'Maple',
      text: 'What do you need, love?',
      choices: [
        { text: 'Show me your wares', next: 'shop' },
        { text: 'Is anyone still asleep?', next: 'bram' },
        { text: 'Just saying hello' },
      ],
    },
    shop: {
      id: 'shop',
      speaker: 'Maple',
      text: 'Fresh from the orchard and the old recipes. What catches your eye?',
      choices: shopChoices,
    },
    bram: {
      id: 'bram',
      speaker: 'Maple',
      text: "Bram — a boy who ran east the night of the Hush, into the brambles past the Thornwood Trail. Thorny, mean country out there. If you've the steel for it... please, bring him home.",
      effects: [{ startQuest: 'sleeping_child' }],
      next: 'hub',
    },
    reunited: {
      id: 'reunited',
      speaker: 'Maple',
      text: 'You found Bram! Bless you, Warden — he\'s home safe, asleep by the fire where he belongs. Here, take this. It\'s the least an old shopkeep can do.',
      effects: [{ setFlag: 'maple_thanked_bram', to: true }, { giveItem: 'coin', amount: 25 }],
      next: 'hub',
    },
  },
};
