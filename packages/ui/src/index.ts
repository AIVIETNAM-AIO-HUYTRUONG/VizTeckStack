// Legacy exports (backward compat)
export { Button, buttonVariants } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { NodeBadge } from './NodeBadge';
export type { NodeBadgeProps, NodeType } from './NodeBadge';

// shadcn/ui components
export { Button as ShadButton, buttonVariants as shadButtonVariants } from './ui/button';
export type { ButtonProps as ShadButtonProps } from './ui/button';
export { Input } from './ui/input';
export type { InputProps } from './ui/input';
export { Label } from './ui/label';
export { Badge, badgeVariants } from './ui/badge';
export type { BadgeProps } from './ui/badge';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
} from './ui/dropdown-menu';

// Icons
export { LESSON_ICONS, renderLessonIcon } from './icons';
export type { LucideProps } from './icons';

// Utility
export { cn } from './lib/utils';
