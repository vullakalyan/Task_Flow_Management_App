import { cn } from '../../utils/helpers';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
  animated?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-white/10 text-white border-white/20',
  secondary: 'bg-white/5 text-white/60 border-white/10',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const dotVariantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-white',
  secondary: 'bg-white/40',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-orange-400',
  info: 'bg-blue-400',
};

export function Badge({
  variant = 'primary',
  children,
  size = 'md',
  className,
  dot = false,
  animated = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        animated && 'animate-pulse-soft',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotVariantStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
