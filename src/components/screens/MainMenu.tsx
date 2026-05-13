import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { listSaves, loadFromSlot, applyLoadedSave } from '../../engine/saveEngine';

export function MainMenu() {
  const { startNewGame } = useGameStore();
  const store = useGameStore();
  const [showLoad, setShowLoad] = useState(false);
  const saves = listSaves();
  const hasSaves = saves.some(s => !s.isEmpty);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a0e2e 0%, #080814 70%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background stars */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              borderRadius: '50%',
              background: 'white',
              opacity: Math.random() * 0.7 + 0.1,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `blink ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + 's',
            }}
          />
        ))}
      </div>

      {/* Decorative border lines */}
      <div style={{
        position: 'absolute',
        top: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--c-border), transparent)',
        opacity: 0.6,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--c-border), transparent)',
        opacity: 0.6,
      }} />

      {/* Title block */}
      <div className="anim-fade-in text-center" style={{ marginBottom: '60px', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '14px',
          letterSpacing: '6px',
          color: 'var(--c-text-dim)',
          marginBottom: '16px',
          textTransform: 'uppercase',
        }}>
          ✦ A Tale of High Adventure ✦
        </div>
        <h1 className="anim-title-glow" style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(36px, 6vw, 72px)',
          color: 'var(--c-gold)',
          lineHeight: 1.1,
          textShadow: '0 0 30px rgba(240,192,64,0.5), 0 2px 8px rgba(0,0,0,0.9)',
          marginBottom: '8px',
        }}>
          Echoes of
        </h1>
        <h1 className="anim-title-glow" style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(40px, 7vw, 84px)',
          color: 'var(--c-gold-light)',
          lineHeight: 1.1,
          textShadow: '0 0 40px rgba(240,192,64,0.6), 0 2px 8px rgba(0,0,0,0.9)',
        }}>
          Vel'shan
        </h1>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: '16px',
          color: 'var(--c-text-dim)',
          marginTop: '12px',
          letterSpacing: '1px',
        }}>
          "Some evils are sealed, not destroyed — until someone breaks the seal."
        </div>
      </div>

      {/* Menu buttons */}
      <div className="anim-slide-up flex flex-col gap-3" style={{ width: '280px', zIndex: 1, animationDelay: '0.2s' }}>
        {!showLoad ? (
          <>
            <Button variant="primary" fullWidth onClick={startNewGame}>
              ⚔️ Begin New Journey
            </Button>
            {hasSaves && (
              <Button fullWidth onClick={() => setShowLoad(true)}>
                📖 Continue Journey
              </Button>
            )}
            <Button fullWidth onClick={() => setShowLoad(true)}>
              💾 Load Game
            </Button>
          </>
        ) : (
          <div className="panel p-4" style={{ width: '100%' }}>
            <div className="text-title text-center text-gold mb-3" style={{ fontSize: '16px', letterSpacing: '2px' }}>
              — Load Game —
            </div>
            {saves.filter(s => s.slot !== 0).map(save => (
              <div
                key={save.slot}
                className="btn w-full mb-2"
                style={{ textAlign: 'left', cursor: save.isEmpty ? 'not-allowed' : 'pointer', opacity: save.isEmpty ? 0.4 : 1 }}
                onClick={() => {
                  if (!save.isEmpty) {
                    const data = loadFromSlot(save.slot as 0 | 1 | 2 | 3);
                    if (data) applyLoadedSave(data, store);
                  }
                }}
              >
                {save.isEmpty ? (
                  <span className="text-dim">Slot {save.slot} — Empty</span>
                ) : (
                  <div>
                    <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--c-gold)' }}>
                      Slot {save.slot} — {save.locationName}
                    </div>
                    <div className="text-xs text-dim">
                      Lv.{save.characterLevel} · {Math.floor((save.playTime ?? 0) / 60)}m played ·{' '}
                      {save.timestamp ? new Date(save.timestamp).toLocaleDateString() : ''}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Button fullWidth onClick={() => setShowLoad(false)}>← Back</Button>
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        color: 'var(--c-text-dim)',
        letterSpacing: '1px',
        zIndex: 1,
      }}>
        Press any key to begin · Click to interact
      </div>
    </div>
  );
}
