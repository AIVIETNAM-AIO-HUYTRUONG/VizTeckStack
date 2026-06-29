import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(
        'w-full px-3 py-2 text-sm text-text-1 bg-bg-1 border rounded-sm',
        'placeholder:text-text-3',
        'focus:outline-none focus:ring-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-2',
        'transition-colors duration-150 motion-reduce:transition-none',
        error
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
          : 'border-border focus:ring-indigo focus:border-indigo',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
