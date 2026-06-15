import type { NpcDef } from './types';

/**
 * Wren — a forager who woke early by the Mistmere, west of the village. She
 * carries the glade's lore and, crucially, points the player *east* after Bram
 * (tying Maple's quest to the Bramble Warren). Pure dialogue; no hard effects
 * beyond a "met" flag so she greets you once, then settles into her hub.
 */
export const wrenNpc: NpcDef = {
  name: 'Wren',
  entries: [
    { when: [{ flag: 'met_wren' }], nodeId: 'hub' },
    { nodeId: 'intro' },
  ],
  nodes: {
    intro: {
      id: 'intro',
      speaker: 'Wren',
      text: "Oh — another waker! I couldn't sleep through the Hush, not with the Mistmere whispering all night. Mind the thorn-beasts; they don't like visitors.",
      effects: [{ setFlag: 'met_wren', to: true }],
      next: 'hub',
    },
    hub: {
      id: 'hub',
      speaker: 'Wren',
      text: 'Was there something you needed?',
      choices: [
        { text: 'What is this place?', next: 'place' },
        { text: 'Seen anyone else out here?', next: 'bram' },
        { text: 'Just passing through' },
      ],
    },
    place: {
      id: 'place',
      speaker: 'Wren',
      text: "The Mistmere. Still water that never freezes — they say the great bell was forged with it. Folk leave stones at the old cairn so the spring remembers them.",
      next: 'hub',
    },
    bram: {
      id: 'bram',
      speaker: 'Wren',
      text: "A little one? Aye — a boy bolted the night of the Hush, but east, not here. Into the brambles past the trail. Nobody fool enough to follow him in there... well. Until you, maybe.",
      next: 'hub',
    },
  },
};
