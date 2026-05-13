import type { Scene, Choice, SceneAction, FlagCondition, StoryFlag } from '../types/story';
import type { GameState } from '../store/gameStore';
import { SCENE_REGISTRY } from '../data/story/prologue';
import { initCombat } from './combatEngine';

export function getScene(sceneId: string): Scene | null {
  return SCENE_REGISTRY[sceneId] ?? null;
}

export function getCurrentLine(scene: Scene, lineIndex: number) {
  return scene.lines[lineIndex] ?? null;
}

export function isSceneComplete(scene: Scene, lineIndex: number): boolean {
  return lineIndex >= scene.lines.length;
}

export function evaluateCondition(
  condition: FlagCondition,
  flags: Record<StoryFlag, boolean | number | string>
): boolean {
  const val = flags[condition.flag];
  switch (condition.operator) {
    case 'isset': return val !== undefined && val !== false;
    case 'notset': return val === undefined || val === false;
    case 'eq': return val === condition.value;
    case 'neq': return val !== condition.value;
    default: return true;
  }
}

export function filterVisibleChoices(
  choices: Choice[],
  flags: Record<StoryFlag, boolean | number | string>
): Choice[] {
  return choices.filter(c => !c.condition || evaluateCondition(c.condition, flags));
}

export function processSceneAction(
  action: SceneAction,
  store: Pick<GameState,
    'gotoScene' | 'setStoryFlag' | 'setGamePhase' | 'setCombat' |
    'unlockLocation' | 'addInventoryItem' | 'storyFlags' | 'activePartyIds' |
    'characters' | 'inventory'
  >
): void {
  switch (action.type) {
    case 'goto_scene':
      store.gotoScene(action.sceneId);
      break;
    case 'set_flag':
      store.setStoryFlag(action.flag, action.value);
      break;
    case 'unlock_location':
      store.unlockLocation(action.locationId);
      break;
    case 'add_item':
      store.addInventoryItem(action.itemId);
      break;
    case 'goto_world_map':
      store.setGamePhase('world_map');
      break;
    case 'start_combat': {
      const combat = initCombat(
        action.encounterId,
        action.victoryScene,
        action.defeatScene,
        store.activePartyIds,
        store.characters
      );
      store.setCombat(combat);
      store.setGamePhase('combat');
      break;
    }
  }
}
