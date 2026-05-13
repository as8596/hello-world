import { useEffect, useRef } from 'react';

interface BattleLogProps {
  entries: string[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="panel" style={{
      height: '120px',
      overflowY: 'auto',
      padding: '8px 12px',
      background: 'rgba(4,4,12,0.9)',
      borderColor: 'var(--c-border-dim)',
    }}>
      {entries.slice(-20).map((entry, i) => (
        <div
          key={i}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            lineHeight: '1.5',
            color: i === entries.length - 1 ? 'var(--c-text-bright)' : 'var(--c-text-dim)',
            padding: '1px 0',
            animation: i === entries.length - 1 ? 'fadeIn 0.3s ease' : 'none',
          }}
        >
          {entry}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
