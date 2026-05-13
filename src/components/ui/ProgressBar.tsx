interface ProgressBarProps {
  current: number;
  max: number;
  variant: 'hp' | 'mp' | 'xp';
  showText?: boolean;
}

export function ProgressBar({ current, max, variant, showText }: ProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div style={{ width: '100%' }}>
      {showText && (
        <div className="flex justify-between text-xs text-dim mb-1" style={{ fontFamily: 'var(--font-title)' }}>
          <span>{variant.toUpperCase()}</span>
          <span style={{ color: 'var(--c-text)' }}>{current} / {max}</span>
        </div>
      )}
      <div className={`progress-bar progress-bar--${variant}`}>
        <div
          className="progress-bar__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
