import { useCallback, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { SceneBackground } from '../story/SceneBackground';
import { CharacterPortrait } from '../story/CharacterPortrait';
import { DialogueBox } from '../story/DialogueBox';
import { ChoiceMenu } from '../story/ChoiceMenu';
import { getScene, isSceneComplete, filterVisibleChoices, processSceneAction } from '../../engine/storyEngine';
import type { Emotion } from '../../types/story';

export function StoryScreen() {
  const store = useGameStore();
  const { currentSceneId, currentLineIndex, storyFlags, isAwaitingChoice } = store;
  const { dialogueRevealed } = useUIStore();

  const scene = currentSceneId ? getScene(currentSceneId) : null;
  if (!scene) return <div style={{ color: 'white', padding: 20 }}>Scene not found: {currentSceneId}</div>;

  const currentLine = scene.lines[currentLineIndex] ?? null;
  const sceneComplete = isSceneComplete(scene, currentLineIndex);

  // Fire onEnter mutations once when scene loads
  useEffect(() => {
    if (scene.onEnter) {
      scene.onEnter.forEach(action => processSceneAction(action, store));
    }
  }, [scene.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance when scene is complete (no choices, has autoTransition)
  useEffect(() => {
    if (sceneComplete && !isAwaitingChoice) {
      if (scene.autoTransition) {
        const timeout = setTimeout(() => {
          processSceneAction(scene.autoTransition!, store);
        }, 400);
        return () => clearTimeout(timeout);
      } else if (scene.choices) {
        store.setAwaitingChoice(true);
      }
    }
  }, [sceneComplete, isAwaitingChoice, scene]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdvance = useCallback(() => {
    if (!dialogueRevealed) return; // TypewriterText handles skip
    if (isAwaitingChoice) return; // Wait for choice

    if (!sceneComplete) {
      const nextLine = scene.lines[currentLineIndex];
      // If this line has an action, fire it after advancing
      if (nextLine?.action) {
        processSceneAction(nextLine.action, store);
        return;
      }
      store.advanceStoryLine();
    }
  }, [dialogueRevealed, isAwaitingChoice, sceneComplete, currentLineIndex, scene, store]);

  const handleChoice = useCallback((index: number) => {
    const visible = filterVisibleChoices(scene.choices ?? [], storyFlags);
    const choice = visible[index];
    if (!choice) return;
    choice.effects?.forEach(action => processSceneAction(action, store));
    store.setAwaitingChoice(false);
    store.gotoScene(choice.nextScene);
  }, [scene, storyFlags, store]);

  // Collect which characters are in the current line
  const speakerPortrait = currentLine?.portrait;
  const speakerEmotion = (currentLine?.emotion as Emotion) ?? 'neutral';
  const isNarrator = !currentLine?.speaker;

  // Build unique portrait set for the scene
  const activePortraits = new Set<string>();
  scene.lines.slice(0, currentLineIndex + 1).forEach(l => {
    if (l.portrait) activePortraits.add(l.portrait);
  });

  const allPortraitsInScene = new Set<string>();
  scene.lines.forEach(l => { if (l.portrait) allPortraitsInScene.add(l.portrait); });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleAdvance(); }}
      tabIndex={0}
    >
      {/* Background */}
      <SceneBackground backgroundId={scene.background} />

      {/* Character portraits — middle section */}
      <div style={{
        flex: 1,
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '20px',
        gap: '20px',
      }}>
        {Array.from(allPortraitsInScene).map(portraitId => {
          const isVisible = activePortraits.has(portraitId);
          const isHighlighted = portraitId === speakerPortrait;
          const emotion = isHighlighted ? speakerEmotion : 'neutral';
          return (
            <div
              key={portraitId}
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.5s ease',
                filter: isHighlighted ? 'drop-shadow(0 0 20px rgba(201,168,76,0.4))' : 'none',
              }}
            >
              <CharacterPortrait
                characterId={portraitId}
                emotion={emotion}
                highlighted={isHighlighted || activePortraits.size === 1}
                size={180}
              />
            </div>
          );
        })}

        {/* Narrator: no portrait, just atmospheric center */}
        {isNarrator && allPortraitsInScene.size === 0 && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'rgba(200,180,140,0.4)',
            textAlign: 'center',
          }}>
            ✦
          </div>
        )}
      </div>

      {/* Dialogue / choice area */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '0 32px 24px',
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
      }}>
        {isAwaitingChoice && scene.choices ? (
          <ChoiceMenu
            choices={filterVisibleChoices(scene.choices, storyFlags)}
            onSelect={handleChoice}
          />
        ) : currentLine ? (
          <DialogueBox
            speaker={currentLine.speaker}
            text={currentLine.text}
            isNarrator={isNarrator}
            onClick={handleAdvance}
          />
        ) : null}
      </div>

      {/* Menu hint */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '16px',
        zIndex: 5,
      }}>
        <button
          className="btn"
          style={{ fontSize: '12px', padding: '4px 12px' }}
          onClick={() => useUIStore.getState().setShowPauseMenu(true)}
        >
          ☰ Menu
        </button>
      </div>
    </div>
  );
}
