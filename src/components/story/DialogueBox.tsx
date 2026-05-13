import { useEffect } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';
import { useUIStore } from '../../store/uiStore';

interface DialogueBoxProps {
  speaker?: string;
  text: string;
  isNarrator?: boolean;
  onRevealComplete?: () => void;
  onClick?: () => void;
}

export function DialogueBox({ speaker, text, isNarrator, onRevealComplete, onClick }: DialogueBoxProps) {
  const { setDialogueRevealed } = useUIStore();
  const { displayed, done, revealAll } = useTypewriter(text, 22);

  useEffect(() => {
    setDialogueRevealed(done);
    if (done && onRevealComplete) onRevealComplete();
  }, [done, setDialogueRevealed, onRevealComplete]);

  const handleClick = () => {
    if (!done) {
      revealAll();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Speaker name plate */}
      {speaker && !isNarrator && (
        <div style={{
          position: 'absolute',
          top: '-28px',
          left: '16px',
          background: 'linear-gradient(135deg, #2a1a00, #1a1008)',
          border: 'var(--border-ornate)',
          padding: '4px 16px',
          fontFamily: 'var(--font-title)',
          fontSize: '14px',
          color: 'var(--c-gold)',
          letterSpacing: '1.5px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
        }}>
          {speaker}
        </div>
      )}

      <div className="panel" style={{
        padding: isNarrator ? '20px 32px' : '20px 24px',
        minHeight: '90px',
        background: isNarrator
          ? 'rgba(8,6,20,0.7)'
          : 'rgba(12,10,28,0.92)',
        borderColor: isNarrator ? 'var(--c-border-dim)' : 'var(--c-border)',
      }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '19px',
          lineHeight: '1.7',
          color: isNarrator ? 'var(--c-text-dim)' : 'var(--c-text-bright)',
          fontStyle: isNarrator ? 'italic' : 'normal',
          margin: 0,
          minHeight: '1.7em',
        }}>
          {displayed}
          {!done && (
            <span style={{
              display: 'inline-block',
              width: '2px',
              height: '1.1em',
              background: 'var(--c-gold)',
              verticalAlign: 'middle',
              marginLeft: '2px',
              animation: 'blink 0.8s step-end infinite',
            }} />
          )}
        </p>

        {done && (
          <div style={{
            textAlign: 'right',
            marginTop: '8px',
          }}>
            <span style={{
              fontFamily: 'var(--font-title)',
              fontSize: '11px',
              color: 'var(--c-border)',
              letterSpacing: '1px',
              animation: 'blink 1.2s ease-in-out infinite',
            }}>
              ▼ CONTINUE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
