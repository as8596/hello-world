import type { NpcDef } from './types';

/**
 * The Oath choice (DESIGN.md §8, §12, §18). Offered by a Warden's resonance at
 * the shrine right after the waking peal. Picking one swears your class and
 * applies a small starting blessing (a stub until the skill trees in step 14).
 */
export const oathNpc: NpcDef = {
  name: 'A Warden’s resonance',
  entries: [{ nodeId: 'choose' }],
  nodes: {
    choose: {
      id: 'choose',
      text: 'An old Warden’s resonance lingers in the cleared air, offering three lost traditions. Which Oath do you swear?',
      choices: [
        {
          text: 'Oathblade - guard the bell',
          effects: [{ chooseOath: 'oathblade' }],
        },
        {
          text: 'Wildstrider - walk with the wild',
          effects: [{ chooseOath: 'wildstrider' }],
        },
        {
          text: 'Bellsinger - answer with your voice',
          effects: [{ chooseOath: 'bellsinger' }],
        },
      ],
    },
  },
};
