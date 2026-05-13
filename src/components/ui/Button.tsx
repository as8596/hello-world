import type { ReactNode, MouseEvent, CSSProperties } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function Button({ children, onClick, variant = 'default', disabled, className = '', fullWidth, style }: ButtonProps) {
  const variantClass = variant === 'primary' ? 'btn--primary' : variant === 'danger' ? 'btn--danger' : '';
  return (
    <button
      className={`btn ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
