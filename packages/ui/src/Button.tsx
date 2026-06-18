import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: '1px solid #4F46E5',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    color: '#4F46E5',
    border: '1px solid #4F46E5',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#475569',
    border: '1px solid transparent',
  },
};

const BASE_STYLE: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export function Button({
  variant = 'primary',
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{ ...BASE_STYLE, ...VARIANT_STYLES[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
