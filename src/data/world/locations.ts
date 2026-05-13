import type { WorldLocation } from '../../types/world';

export const LOCATIONS: Record<string, WorldLocation> = {
  thornhaven: {
    id: 'thornhaven',
    name: 'Thornhaven',
    description: 'A modest town nestled at the edge of Ashwood Forest. Your journey begins here.',
    mapCoords: { x: 28, y: 62 },
    iconType: 'town',
    entryScene: 'prologue_tavern',
    status: 'visited',
  },
  ashwood_forest: {
    id: 'ashwood_forest',
    name: 'Ashwood Forest',
    description: 'An ancient forest dark with shadow. The trees here seem to watch and whisper.',
    mapCoords: { x: 48, y: 45 },
    iconType: 'wilderness',
    unlockCondition: { flag: 'prologue_complete', operator: 'isset' },
    entryScene: 'ch1_forest_entrance',
    status: 'locked',
  },
  ruins_velshan: {
    id: 'ruins_velshan',
    name: "Ruins of Vel'shan",
    description: 'The crumbling remains of an ancient civilization. Something dark stirs within.',
    mapCoords: { x: 68, y: 30 },
    iconType: 'ruins',
    unlockCondition: { flag: 'ch1_complete', operator: 'isset' },
    entryScene: 'ch2_ruins_gate',
    status: 'locked',
  },
};
