import type { NpcDef } from './types';

/**
 * Bram — the lost child Maple frets over (the `sleeping_child` quest, §16). He
 * bolted east the night of the Hush and is hiding deep in the Bramble Warren,
 * behind the thorn-ward that only lifts once the den is cleared. Finding him
 * completes the quest, rewards a little coin, and sends him home to Maple.
 */
export const bramNpc: NpcDef = {
  name: 'Bram',
  entries: [
    { when: [{ flag: 'bram_found' }], nodeId: 'safe' },
    { nodeId: 'rescue' },
  ],
  nodes: {
    rescue: {
      id: 'rescue',
      speaker: 'Bram',
      text: "Is — is someone there? I hid when the thorns woke up. I couldn't find the way back, and then the bell rang and... are you a Warden? Really?",
      effects: [{ setFlag: 'bram_found', to: true }, { advanceQuest: 'sleeping_child' }, { giveItem: 'coin', amount: 15 }],
      next: 'thanks',
    },
    thanks: {
      id: 'thanks',
      speaker: 'Bram',
      text: "Maple's shop — that's home. I can find it from the trail now the thorns are quiet. Here, I found this hiding. You should have it. Thank you, Warden!",
    },
    safe: {
      id: 'safe',
      speaker: 'Bram',
      text: "I'm alright now. Catching my breath, then it's straight home to Maple's. I won't wander off again — promise.",
    },
  },
};
