import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-white text-black font-bold hover:bg-zinc-200 focus:ring-zinc-400 active:bg-zinc-300',
  secondary: 'bg-white/5 text-white/90 hover:bg-white/10 focus:ring-white/20 border border-white/5 active:bg-white/20',
  ghost: 'bg-transparent text-white/60 hover:bg-white/[0.02] hover:text-white focus:ring-white/20 active:bg-white/5',
  danger: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 focus:ring-orange-500',
  success: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 focus:ring-emerald-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-xs font-bold rounded-lg gap-1.5',
  md: 'h-10 px-6 text-sm font-bold rounded-xl gap-2',
  lg: 'h-12 px-8 text-base font-bold rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
