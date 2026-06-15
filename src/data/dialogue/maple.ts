import type { NpcDef } from './types';

/**
 * Maple — Thistledown's shopkeeper and first to wake at the peal (DESIGN.md
 * §16 worked example, §18). One definition; entries matched top-down by state
 * so she's asleep before the bell, grateful after. "Show me your wares" fires
 * the `openShop` effect, which hands off to the dedicated trade UI (ShopScene).
 */
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
        { text: 'Show me your wares', effects: [{ openShop: 'maple' }] },
        { text: 'Is anyone still asleep?', next: 'bram' },
        { text: 'Just saying hello' },
      ],
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
