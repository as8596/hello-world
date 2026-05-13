import type { ReactNode, CSSProperties } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Panel({ children, className = '', dark, style, onClick }: PanelProps) {
  const base = dark ? 'panel panel--dark' : 'panel';
  return (
    <div
      className={`${base} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
