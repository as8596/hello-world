import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { WorldLocation } from '../../types/world';
import { useUIStore } from '../../store/uiStore';

const ICON_MAP: Record<string, string> = {
  town: '🏘️',
  dungeon: '⚔️',
  wilderness: '🌲',
  ruins: '🏚️',
};

const ICON_COLOR: Record<string, string> = {
  town: '#c9a84c',
  dungeon: '#cc4444',
  wilderness: '#40a840',
  ruins: '#8060a0',
};

interface LocationPinProps {
  location: WorldLocation;
  isHovered: boolean;
  isCurrent: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

function LocationPin({ location, isHovered, isCurrent, onHover, onClick }: LocationPinProps) {
  const isLocked = location.status === 'locked';
  const color = ICON_COLOR[location.iconType] ?? '#c9a84c';

  return (
    <g
      transform={`translate(${location.mapCoords.x}%, ${location.mapCoords.y}%)`}
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
      onMouseEnter={() => onHover(location.id)}
      onMouseLeave={() => onHover(null)}
      onClick={isLocked ? undefined : onClick}
    >
      {/* Pulse ring when hovered */}
      {isHovered && !isLocked && (
        <circle
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.5"
          className="anim-glow-pulse"
        />
      )}
      {/* Pin circle */}
      <circle
        r="14"
        fill={isLocked ? 'rgba(40,40,60,0.8)' : `rgba(${hexToRgb(color)},0.2)`}
        stroke={isLocked ? '#404060' : color}
        strokeWidth="2"
        opacity={isLocked ? 0.5 : 1}
      />
      {/* Icon text */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        opacity={isLocked ? 0.4 : 1}
      >
        {isLocked ? '🔒' : ICON_MAP[location.iconType]}
      </text>
      {/* Current location indicator */}
      {isCurrent && (
        <circle r="18" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" className="anim-glow-pulse" />
      )}
    </g>
  );
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export function WorldMapScreen() {
  const store = useGameStore();
  const { setShowPauseMenu } = useUIStore();
  const { locations, currentLocationId } = store;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hoveredLocation = hoveredId ? locations[hoveredId] : null;
  const locationList = Object.values(locations);

  const handleLocationClick = (location: WorldLocation) => {
    if (location.status === 'locked') return;
    if (location.entryScene) {
      store.gotoScene(location.entryScene);
      store.setGamePhase('story');
      store.unlockLocation(location.id);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at 50% 40%, #0e1428 0%, #060c1a 50%, #04080e 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--c-border-dim)',
        background: 'rgba(8,6,20,0.8)',
        zIndex: 2,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--c-gold)', letterSpacing: '2px' }}>
            World Map
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '13px', color: 'var(--c-text-dim)' }}>
            The Realm of Thornhaven
          </div>
        </div>
        <button
          className="btn"
          style={{ fontSize: '12px' }}
          onClick={() => setShowPauseMenu(true)}
        >
          ☰ Menu
        </button>
      </div>

      {/* Map area */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Map background — stylized parchment-look grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Map title text overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: '13px',
          color: 'rgba(200,168,76,0.25)',
          letterSpacing: '3px',
          pointerEvents: 'none',
        }}>
          HERE BE LEGEND
        </div>

        {/* SVG map pins overlay */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Road lines between locations */}
          <line x1="28%" y1="62%" x2="48%" y2="45%" stroke="rgba(201,168,76,0.15)" strokeWidth="0.4" strokeDasharray="1 2" />
          <line x1="48%" y1="45%" x2="68%" y2="30%" stroke="rgba(201,168,76,0.1)" strokeWidth="0.4" strokeDasharray="1 2" />

          {locationList.map(location => (
            <LocationPin
              key={location.id}
              location={location}
              isHovered={hoveredId === location.id}
              isCurrent={currentLocationId === location.id}
              onHover={setHoveredId}
              onClick={() => handleLocationClick(location)}
            />
          ))}
        </svg>

        {/* Location tooltip */}
        {hoveredLocation && (
          <div
            className="panel anim-fade-in"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '320px',
              padding: '16px 20px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '20px' }}>{ICON_MAP[hoveredLocation.iconType]}</span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '15px',
                  color: hoveredLocation.status === 'locked' ? 'var(--c-text-dim)' : 'var(--c-gold)',
                }}>
                  {hoveredLocation.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  color: hoveredLocation.status === 'locked' ? '#404060' : ICON_COLOR[hoveredLocation.iconType],
                }}>
                  {hoveredLocation.status === 'locked' ? '🔒 LOCKED' :
                   hoveredLocation.status === 'visited' ? '✓ VISITED' :
                   hoveredLocation.status === 'completed' ? '✓ COMPLETED' : '◆ AVAILABLE'}
                </div>
              </div>
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--c-text-dim)',
              lineHeight: '1.5',
            }}>
              {hoveredLocation.description}
            </p>
            {hoveredLocation.status !== 'locked' && (
              <div style={{
                marginTop: '8px',
                fontFamily: 'var(--font-title)',
                fontSize: '11px',
                color: 'var(--c-border)',
                letterSpacing: '1px',
              }}>
                CLICK TO TRAVEL →
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location list sidebar hint */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 24px',
        borderTop: '1px solid var(--c-border-dim)',
        background: 'rgba(8,6,20,0.8)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {locationList.map(loc => (
          <div
            key={loc.id}
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '11px',
              letterSpacing: '1px',
              color: loc.status === 'locked' ? '#404060' :
                     currentLocationId === loc.id ? 'var(--c-gold)' : 'var(--c-text-dim)',
              cursor: loc.status !== 'locked' ? 'pointer' : 'default',
              padding: '4px 8px',
              border: `1px solid ${loc.status === 'locked' ? '#303050' : 'var(--c-border-dim)'}`,
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={() => loc.status !== 'locked' && handleLocationClick(loc)}
          >
            {ICON_MAP[loc.iconType]} {loc.name}
          </div>
        ))}
      </div>
    </div>
  );
}
