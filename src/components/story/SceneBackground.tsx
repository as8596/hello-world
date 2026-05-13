import type { CSSProperties } from 'react';

const BACKGROUNDS: Record<string, CSSProperties['background']> = {
  tavern: 'radial-gradient(ellipse at 30% 70%, #3a1a08 0%, #1a0a04 40%, #0e0804 100%)',
  tavern_night: 'radial-gradient(ellipse at 20% 80%, #1a0e04 0%, #0e0804 50%, #060408 100%)',
  forest_road: 'radial-gradient(ellipse at 50% 30%, #0d2a0d 0%, #061606 40%, #040e04 100%)',
  deep_forest: 'radial-gradient(ellipse at 40% 20%, #0a1a0a 0%, #040e04 50%, #020804 100%)',
  ruins: 'radial-gradient(ellipse at 50% 40%, #1a1428 0%, #0e0c1a 40%, #060408 100%)',
  default: 'radial-gradient(ellipse at 50% 50%, #1a1428 0%, #0e0c1a 60%, #060408 100%)',
};

const OVERLAYS: Record<string, string> = {
  tavern: 'radial-gradient(ellipse at 30% 70%, rgba(200,100,20,0.15) 0%, transparent 60%)',
  tavern_night: 'radial-gradient(ellipse at 20% 80%, rgba(100,60,10,0.1) 0%, transparent 60%)',
  forest_road: 'radial-gradient(ellipse at 50% 30%, rgba(20,80,20,0.2) 0%, transparent 60%)',
  deep_forest: 'radial-gradient(ellipse at 40% 20%, rgba(10,40,10,0.15) 0%, transparent 50%)',
  ruins: 'radial-gradient(ellipse at 50% 40%, rgba(80,40,120,0.2) 0%, transparent 60%)',
  default: 'none',
};

interface SceneBackgroundProps {
  backgroundId: string;
}

export function SceneBackground({ backgroundId }: SceneBackgroundProps) {
  const bg = BACKGROUNDS[backgroundId] ?? BACKGROUNDS.default;
  const overlay = OVERLAYS[backgroundId] ?? 'none';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: bg as string,
      zIndex: 0,
      transition: 'background 1s ease',
    }}>
      {/* Atmospheric overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: overlay,
        pointerEvents: 'none',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />
      {/* Scene label in top-left corner for location context */}
      <BackgroundDetails backgroundId={backgroundId} />
    </div>
  );
}

const LOCATION_LABELS: Record<string, string> = {
  tavern: '🍺 The Hearthfire Tavern · Thornhaven',
  tavern_night: '🌙 The Hearthfire Tavern · Thornhaven (Night)',
  forest_road: '🌲 The Ashwood Road · Forest Outskirts',
  deep_forest: '🌑 The Ashwood · Deep Forest',
  ruins: "🏚️ Ruins of Vel'shan",
};

function BackgroundDetails({ backgroundId }: { backgroundId: string }) {
  const label = LOCATION_LABELS[backgroundId];
  if (!label) return null;
  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      fontFamily: 'var(--font-body)',
      fontStyle: 'italic',
      fontSize: '13px',
      color: 'rgba(200,180,140,0.6)',
      pointerEvents: 'none',
      zIndex: 1,
    }}>
      {label}
    </div>
  );
}
