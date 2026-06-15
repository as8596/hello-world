/**
 * Quest definitions (DESIGN.md §16). MVP: one quest with a pinned HUD
 * objective. Its steps would advance on events; for the slice it points east
 * (Region 2) and stays open — the eastern fog is too thick until the next tool.
 */
export interface QuestDef {
  id: string;
  title: string;
  /** One-line objective pinned to the HUD. */
  objective: string;
}

export const QUESTS: Record<string, QuestDef> = {
  sleeping_child: {
    id: 'sleeping_child',
    title: 'The Sleeping Child',
    objective: 'Search the brambles east of the Thornwood Trail for Bram.',
  },
};
