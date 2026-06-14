/**
 * Data-driven dialogue & condition/effect vocabulary (DESIGN.md §16). Shops
 * (§19) reuse the same choices/effects. An NPC has a list of entries; the
 * engine plays the first whose conditions pass, so one NPC says different
 * things as flags change over time.
 */

export type Condition =
  | { flag: string; is?: boolean | string | number }
  | { quest: string; state: string }
  | { counter: string; atLeast: number };

export type Effect =
  | { setFlag: string; to: boolean | string | number }
  | { startQuest: string }
  | { advanceQuest: string }
  | { giveItem: string; amount?: number }
  | { spendCoin: number }
  | { giveXp: number }
  | { chooseOath: string };

export interface Choice {
  text: string;
  /** Only offered if all conditions pass (e.g. affordable shop items). */
  when?: Condition[];
  effects?: Effect[];
  next?: string;
}

export interface DialogueNode {
  id: string;
  speaker?: string;
  text: string;
  /** Side-effects run when the node is entered. */
  effects?: Effect[];
  /** Linear continuation. */
  next?: string;
  /** Player picks a response. */
  choices?: Choice[];
}

export interface NpcDef {
  name: string;
  nodes: Record<string, DialogueNode>;
  /** Checked top-down; the first passing entry's node is played. */
  entries: { when?: Condition[]; nodeId: string }[];
}
