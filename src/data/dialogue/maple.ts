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
      text: "Bram — a boy who wandered toward the eastern fog the night of the Hush. It's too thick out there for a handbell. If you find a way through... please, bring him home.",
      effects: [{ startQuest: 'sleeping_child' }],
      next: 'hub',
    },
  },
};
