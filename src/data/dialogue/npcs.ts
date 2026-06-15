import { bramNpc } from './bram';
import { mapleNpc } from './maple';
import type { NpcDef } from './types';
import { wrenNpc } from './wren';

/** Registry of named NPCs, keyed by the id carried on their Interactable. */
export const NPCS: Record<string, NpcDef> = {
  maple: mapleNpc,
  wren: wrenNpc,
  bram: bramNpc,
};
