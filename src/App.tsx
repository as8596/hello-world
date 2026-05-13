import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useUIStore } from './store/uiStore';
import { MainMenu } from './components/screens/MainMenu';
import { StoryScreen } from './components/screens/StoryScreen';
import { CombatScreen } from './components/screens/CombatScreen';
import { WorldMapScreen } from './components/screens/WorldMapScreen';
import { PauseMenu } from './components/hud/PauseMenu';

function App() {
  const { gamePhase, incrementPlayTime } = useGameStore();
  const { showPauseMenu } = useUIStore();

  // Track play time every second
  useEffect(() => {
    if (gamePhase === 'main_menu') return;
    const interval = setInterval(() => incrementPlayTime(1), 1000);
    return () => clearInterval(interval);
  }, [gamePhase, incrementPlayTime]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {gamePhase === 'main_menu' && <MainMenu />}
      {gamePhase === 'story' && <StoryScreen />}
      {gamePhase === 'combat' && <CombatScreen />}
      {gamePhase === 'world_map' && <WorldMapScreen />}

      {/* Pause menu overlay — available from story and world map */}
      {showPauseMenu && gamePhase !== 'main_menu' && gamePhase !== 'combat' && (
        <PauseMenu />
      )}
    </div>
  );
}

export default App;
