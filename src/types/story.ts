export type SceneId = string;
export type StoryFlag = string;
export type SpeakerPosition = 'left' | 'center' | 'right';
export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'shocked' | 'fearful' | 'determined';

export type SceneAction =
  | { type: 'goto_scene'; sceneId: SceneId }
  | { type: 'start_combat'; encounterId: string; victoryScene: SceneId; defeatScene: SceneId }
  | { type: 'set_flag'; flag: StoryFlag; value: boolean | number | string }
  | { type: 'add_item'; itemId: string }
  | { type: 'unlock_location'; locationId: string }
  | { type: 'goto_world_map' };

export interface FlagCondition {
  flag: StoryFlag;
  operator: 'eq' | 'neq' | 'isset' | 'notset';
  value?: boolean | number | string;
}

export interface Choice {
  text: string;
  condition?: FlagCondition;
  effects?: SceneAction[];
  nextScene: SceneId;
}

export interface DialogueLine {
  speaker?: string;
  portrait?: string;
  position?: SpeakerPosition;
  emotion?: Emotion;
  text: string;
  action?: SceneAction;
}

export interface Scene {
  id: SceneId;
  background: string;
  music?: string;
  lines: DialogueLine[];
  onEnter?: SceneAction[];
  autoTransition?: SceneAction;
  choices?: Choice[];
}
