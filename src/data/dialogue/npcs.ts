import { mapleNpc } from './maple';
import type { NpcDef } from './types';

/** Registry of named NPCs, keyed by the id carried on their Interactable. */
export const NPCS: Record<string, NpcDef> = {
  maple: mapleNpc,
};
