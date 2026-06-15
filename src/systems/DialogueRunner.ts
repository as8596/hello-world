import { allPass } from '../data/dialogue/conditions';
import type { Choice, DialogueNode, Effect, NpcDef } from '../data/dialogue/types';
import type { DialogueBox } from '../ui/DialogueBox';
import type { WorldState } from './WorldState';

/**
 * Pick a stable "voice" pitch (Hz) for a speaker so each character babbles at
 * its own register as the text types. Named NPCs get hand-tuned voices; anyone
 * else (and unattributed narration) hashes their name into a pleasant range.
 */
const NAMED_VOICES: Record<string, number> = {
  Maple: 430, // bright, friendly shopkeeper
  Wren: 500, // small, high forager
  Bram: 290, // gruff, low
};
function voiceFor(speaker?: string): number {
  if (!speaker) return 360; // neutral narration (signs, lore)
  if (NAMED_VOICES[speaker]) return NAMED_VOICES[speaker];
  let h = 0;
  for (let i = 0; i < speaker.length; i++) h = (h * 31 + speaker.charCodeAt(i)) & 0xffff;
  return 300 + (h % 180); // 300..479 Hz
}

/** Speaker → baked bust texture key for the dialogue portrait (if any). */
const PORTRAITS: Record<string, string> = {
  Maple: 'portrait-maple',
};
function portraitFor(speaker?: string): string | undefined {
  return speaker ? PORTRAITS[speaker] : undefined;
}

/**
 * DialogueRunner — plays a data-driven NpcDef through the DialogueBox (§16):
 * picks the first entry whose conditions pass, runs node effects, types the
 * body, then offers condition-filtered choices. Effects are handed back to the
 * scene to apply (flags, quests, shop purchases, the Oath choice).
 */
export class DialogueRunner {
  private npc?: NpcDef;
  private node?: DialogueNode;
  private mode: 'text' | 'choices' = 'text';
  private choices: Choice[] = [];
  private selected = 0;

  constructor(
    private readonly box: DialogueBox,
    private readonly ws: WorldState,
    private readonly runEffect: (effect: Effect) => void,
  ) {
    this.box.onTyped = () => this.onTextDone();
  }

  get isActive(): boolean {
    return this.box.isOpen;
  }

  /** Play a named NPC's first matching entry. */
  startNpc(npc: NpcDef): void {
    this.npc = npc;
    const entry = npc.entries.find((e) => allPass(this.ws, e.when));
    if (!entry || !npc.nodes[entry.nodeId]) {
      this.box.close();
      return;
    }
    this.playNode(npc.nodes[entry.nodeId]);
  }

  /** Play a simple linear sequence of lines (e.g. flavor for a sleeper). */
  startLines(speaker: string, lines: string[]): void {
    if (lines.length === 0) return;
    const nodes: Record<string, DialogueNode> = {};
    lines.forEach((text, i) => {
      nodes[`n${i}`] = {
        id: `n${i}`,
        speaker: speaker || undefined,
        text,
        next: i < lines.length - 1 ? `n${i + 1}` : undefined,
      };
    });
    this.npc = { name: speaker, nodes, entries: [{ nodeId: 'n0' }] };
    this.playNode(nodes.n0);
  }

  advance(): void {
    if (!this.isActive) return;
    if (this.box.isTyping) {
      this.box.finishTyping();
      return;
    }
    if (this.mode === 'choices') {
      this.confirm(this.choices[this.selected]);
    } else {
      this.goNext(this.node);
    }
  }

  move(dir: number): void {
    if (this.mode !== 'choices' || this.choices.length === 0) return;
    this.selected = (this.selected + dir + this.choices.length) % this.choices.length;
    this.box.renderChoices(this.choices.map((c) => c.text), this.selected);
  }

  private playNode(node: DialogueNode): void {
    this.node = node;
    this.mode = 'text';
    for (const effect of node.effects ?? []) this.runEffect(effect);
    this.box.openBox();
    this.box.renderText(node.text, {
      speaker: node.speaker,
      voiceHz: voiceFor(node.speaker),
      portrait: portraitFor(node.speaker),
    });
  }

  private onTextDone(): void {
    if (!this.node) return;
    const choices = (this.node.choices ?? []).filter((c) => allPass(this.ws, c.when));
    if (choices.length > 0) {
      this.mode = 'choices';
      this.choices = choices;
      this.selected = 0;
      this.box.setAdvanceIndicator(false);
      this.box.renderChoices(choices.map((c) => c.text), 0);
    } else {
      this.mode = 'text';
      this.box.setAdvanceIndicator(true);
    }
  }

  private goNext(node?: DialogueNode): void {
    const next = node?.next;
    if (next && this.npc?.nodes[next]) this.playNode(this.npc.nodes[next]);
    else this.box.close();
  }

  private confirm(choice: Choice): void {
    for (const effect of choice.effects ?? []) this.runEffect(effect);
    if (choice.next && this.npc?.nodes[choice.next]) this.playNode(this.npc.nodes[choice.next]);
    else this.box.close();
  }
}
