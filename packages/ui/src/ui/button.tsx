import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-body text-sm font-semibold rounded-sm',
    'transition-colors duration-150 motion-reduce:transition-none cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    'whitespace-nowrap overflow-hidden text-ellipsis',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:     'bg-indigo text-white border border-indigo hover:bg-indigo-mid focus:ring-indigo',
        secondary:   'bg-bg-1 text-indigo border border-indigo hover:bg-indigo-lt focus:ring-indigo',
        ghost:       'bg-transparent text-text-2 border border-transparent hover:bg-bg-2 hover:text-text-1 focus:ring-indigo',
        destructive: 'bg-red-500 text-white border border-red-500 hover:bg-red-600 focus:ring-red-500',
        outline:     'bg-transparent text-text-1 border border-border hover:bg-bg-2 focus:ring-indigo',
        link:        'bg-transparent border-transparent text-indigo underline-offset-4 hover:underline focus:ring-indigo',
      },
      size: {
        default: 'px-4 py-2',
        sm:      'px-3 py-1.5 text-xs',
        lg:      'px-6 py-3 text-base',
        icon:    'h-9 w-9 p-0 flex-shrink-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
