export interface EncounterDefinition {
  id: string;
  enemies: Array<{ templateId: string; count: number }>;
}

export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  enc_bandit_ambush: {
    id: 'enc_bandit_ambush',
    enemies: [
      { templateId: 'bandit', count: 2 },
      { templateId: 'bandit_captain', count: 1 },
    ],
  },
  enc_forest_wraith: {
    id: 'enc_forest_wraith',
    enemies: [
      { templateId: 'forest_wraith', count: 1 },
      { templateId: 'goblin_scout', count: 2 },
    ],
  },
};
