import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-mono text-[9px] font-bold uppercase tracking-[0.05em] px-2 py-[2px]',
  {
    variants: {
      variant: {
        default:     'bg-indigo-lt text-indigo',
        secondary:   'bg-bg-2 text-text-2 border border-border',
        destructive: 'bg-red-100 text-red-600',
        outline:     'bg-transparent text-text-1 border border-border',
        success:     'bg-emerald-lt text-emerald',
        warning:     'bg-warning/15 text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
