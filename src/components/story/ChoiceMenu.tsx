import type { Choice } from '../../types/story';
import { Button } from '../ui/Button';

interface ChoiceMenuProps {
  choices: Choice[];
  onSelect: (index: number) => void;
}

export function ChoiceMenu({ choices, onSelect }: ChoiceMenuProps) {
  return (
    <div className="panel anim-slide-up" style={{
      padding: '16px 24px',
      background: 'rgba(8,6,20,0.96)',
      borderColor: 'var(--c-border)',
    }}>
      <div style={{
        fontFamily: 'var(--font-title)',
        fontSize: '12px',
        color: 'var(--c-text-dim)',
        letterSpacing: '2px',
        marginBottom: '12px',
        textAlign: 'center',
      }}>
        — YOUR CHOICE —
      </div>
      <div className="flex flex-col gap-2">
        {choices.map((choice, i) => (
          <Button
            key={i}
            fullWidth
            onClick={() => onSelect(i)}
            style={{
              textAlign: 'left',
              padding: '10px 16px',
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              lineHeight: '1.4',
            } as React.CSSProperties}
          >
            <span style={{ color: 'var(--c-gold)', marginRight: '8px', fontFamily: 'var(--font-title)', fontSize: '12px' }}>
              {String.fromCharCode(0x2460 + i)}
            </span>
            {choice.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
