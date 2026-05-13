import type { Scene } from '../../types/story';

export const PROLOGUE_SCENES: Scene[] = [
  {
    id: 'prologue_tavern',
    background: 'tavern',
    lines: [
      {
        text: 'The Hearthfire Tavern — Thornhaven, on the eve of the Harvest Moon.',
      },
      {
        speaker: 'Narrator',
        text: 'Three weeks since the last trade caravan passed through Thornhaven. The roads east have gone silent.',
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'neutral',
        text: "Another quiet evening. Exactly the kind I used to dream about, back when the army kept us marching.",
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'neutral',
        text: 'The quiet is the problem, Aldric. Three caravans missed. No messengers. Something is very wrong in the east.',
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'neutral',
        text: "You worry too much.",
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'shocked',
        text: "Someone's coming — fast. Riding hard.",
      },
    ],
    autoTransition: { type: 'goto_scene', sceneId: 'prologue_messenger' },
  },
  {
    id: 'prologue_messenger',
    background: 'tavern',
    lines: [
      {
        text: 'The tavern door bursts open. A rider stumbles in, clutching a sealed letter.',
      },
      {
        speaker: 'Messenger',
        portrait: 'messenger',
        emotion: 'fearful',
        text: "I need... the adventurers. From the guild. Are any of you— please, there's no time.",
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'determined',
        text: "We're here. Catch your breath.",
      },
      {
        speaker: 'Messenger',
        portrait: 'messenger',
        emotion: 'fearful',
        text: 'Lord Valdris sent me. The Ashwood is cursed — the trees moved last night. Three villages have gone dark. He needs your help.',
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'shocked',
        text: "Trees don't move. Something is using the forest.",
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'neutral',
        text: 'What kind of pay are we talking?',
      },
      {
        speaker: 'Messenger',
        portrait: 'messenger',
        emotion: 'fearful',
        text: "Whatever Valdris has — all of it. Please. My family lives in Millhaven. That's one of the dark villages.",
      },
    ],
    choices: [
      {
        text: 'We\'ll leave at dawn.',
        effects: [{ type: 'set_flag', flag: 'accepted_honorably', value: true }],
        nextScene: 'prologue_accept',
      },
      {
        text: 'Tell us more about what you saw first.',
        effects: [{ type: 'set_flag', flag: 'demanded_info', value: true }],
        nextScene: 'prologue_demand_info',
      },
    ],
  },
  {
    id: 'prologue_demand_info',
    background: 'tavern',
    lines: [
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'neutral',
        text: 'We ride into the unknown, we want the full picture. What did you see?',
      },
      {
        speaker: 'Messenger',
        portrait: 'messenger',
        emotion: 'fearful',
        text: 'I — I only saw it from the road. The tree line had moved. I swear it. Branches where there were none before.',
      },
      {
        speaker: 'Messenger',
        portrait: 'messenger',
        emotion: 'fearful',
        text: 'And there were shapes in the fog. Not animals. Taller. They just... watched.',
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'determined',
        text: "Wraiths. Bound to the forest, perhaps. This is worse than bandits.",
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'neutral',
        text: "All the more reason not to delay.",
      },
    ],
    autoTransition: { type: 'goto_scene', sceneId: 'prologue_accept' },
  },
  {
    id: 'prologue_accept',
    background: 'tavern_night',
    lines: [
      {
        text: 'The party gathers their supplies. The Hearthfire dims to embers.',
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'determined',
        text: "We head for the Ashwood road at first light. Senna, Ryn — get some rest if you can.",
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'neutral',
        text: "I'll be preparing wards. Sleep can wait.",
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'happy',
        text: "I've slept in worse places than a warm tavern before a job. Wake me before dawn.",
      },
    ],
    onEnter: [{ type: 'set_flag', flag: 'prologue_accepted', value: true }],
    autoTransition: { type: 'goto_scene', sceneId: 'prologue_road' },
  },
  {
    id: 'prologue_road',
    background: 'forest_road',
    lines: [
      {
        text: 'The Ashwood Road — just after dawn.',
      },
      {
        speaker: 'Narrator',
        text: 'The forest is silent in a way it should not be. No birdsong. No wind through the leaves. Just the crunch of boots on gravel.',
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'determined',
        text: "I've hunted this wood for years. Something changed. The animals are gone.",
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'determined',
        text: 'The wards I prepared are reacting. There\'s a corruption here — old and deep.',
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'shocked',
        text: "On your guard!",
      },
      {
        text: 'A group of bandits emerge from the tree line, blades drawn. The corruption has driven them to desperate acts — or something worse has.',
      },
    ],
    autoTransition: {
      type: 'start_combat',
      encounterId: 'enc_bandit_ambush',
      victoryScene: 'prologue_post_combat',
      defeatScene: 'prologue_defeat',
    },
  },
  {
    id: 'prologue_post_combat',
    background: 'forest_road',
    onEnter: [{ type: 'set_flag', flag: 'prologue_complete', value: true }],
    lines: [
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'neutral',
        text: "Bandits on the Ashwood Road. That's new.",
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'determined',
        text: 'Not bandits. Look at their eyes. They were terrified of something behind them.',
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'determined',
        text: "We're too late to stop whatever entered the forest. We can only press forward and try to end it.",
      },
    ],
    choices: [
      {
        text: 'Press on into the Ashwood.',
        effects: [{ type: 'unlock_location', locationId: 'ashwood_forest' }],
        nextScene: 'world_map_transition',
      },
    ],
  },
  {
    id: 'world_map_transition',
    background: 'forest_road',
    lines: [
      {
        speaker: 'Narrator',
        text: "The Ashwood Forest looms ahead. The path splits here — your journey has truly begun.",
      },
    ],
    onEnter: [{ type: 'unlock_location', locationId: 'ashwood_forest' }],
    autoTransition: { type: 'goto_world_map' },
  },
  {
    id: 'prologue_defeat',
    background: 'forest_road',
    lines: [
      {
        speaker: 'Narrator',
        text: 'The bandits overwhelm you. You retreat back toward Thornhaven, battered and bruised.',
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'sad',
        text: "We need to regroup. Rest up and try again.",
      },
    ],
    autoTransition: { type: 'goto_scene', sceneId: 'prologue_road' },
  },
  {
    id: 'ch1_forest_entrance',
    background: 'deep_forest',
    lines: [
      {
        text: 'The Ashwood — deeper than before.',
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'fearful',
        text: "The trees... they're different. Twisted. I don't recognize this part of the forest.",
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'determined',
        text: 'The corruption is centered somewhere ahead. Follow the dead patches of ground.',
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'determined',
        text: "Whatever's waiting, we face it together.",
      },
      {
        text: 'A Forest Wraith materializes from the shadows, its hollow eyes fixing on Senna.',
      },
    ],
    autoTransition: {
      type: 'start_combat',
      encounterId: 'enc_forest_wraith',
      victoryScene: 'ch1_wraith_defeated',
      defeatScene: 'ch1_defeat',
    },
  },
  {
    id: 'ch1_wraith_defeated',
    background: 'deep_forest',
    onEnter: [{ type: 'set_flag', flag: 'ch1_complete', value: true }],
    lines: [
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'determined',
        text: "The wraith dissipates — but it wasn't the source. It was drawn here, like a moth to flame.",
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'neutral',
        text: 'Something else is calling them. Something at the ruins to the northeast.',
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'neutral',
        text: "Vel'shan. The old stories say those ruins were sealed for a reason.",
      },
    ],
    choices: [
      {
        text: "Head for Vel'shan.",
        effects: [{ type: 'unlock_location', locationId: 'ruins_velshan' }],
        nextScene: 'ch1_world_map',
      },
    ],
  },
  {
    id: 'ch1_world_map',
    background: 'deep_forest',
    lines: [
      {
        speaker: 'Narrator',
        text: "The ruins of Vel'shan have revealed themselves on your map. The corruption's heart awaits.",
      },
    ],
    autoTransition: { type: 'goto_world_map' },
  },
  {
    id: 'ch1_defeat',
    background: 'deep_forest',
    lines: [
      {
        speaker: 'Narrator',
        text: 'The wraith\'s dark magic overwhelms the party. You retreat to the forest edge.',
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'sad',
        text: "We're not ready. We need to recover and try again.",
      },
    ],
    autoTransition: { type: 'goto_world_map' },
  },
  {
    id: 'ch2_ruins_gate',
    background: 'ruins',
    lines: [
      {
        text: "The Ruins of Vel'shan — what once was a seat of ancient power.",
      },
      {
        speaker: 'Senna',
        portrait: 'senna',
        emotion: 'shocked',
        text: "I can feel it from here. Whatever was sealed in these ruins — it's been awakened.",
      },
      {
        speaker: 'Aldric',
        portrait: 'aldric',
        emotion: 'determined',
        text: "Then we go in and put it back to sleep. Permanently.",
      },
      {
        speaker: 'Ryn',
        portrait: 'ryn',
        emotion: 'determined',
        text: "Right behind you.",
      },
    ],
    choices: [
      {
        text: 'Enter the ruins.',
        nextScene: 'ch2_ruins_gate',
      },
    ],
  },
];

export const SCENE_REGISTRY: Record<string, Scene> = Object.fromEntries(
  PROLOGUE_SCENES.map(s => [s.id, s])
);
