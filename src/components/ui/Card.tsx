import { ReactNode } from 'react';
import { cn } from '../../utils/helpers';

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className,
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#111111] rounded-[2rem] border border-white/5 shadow-xl',
        paddingStyles[padding],
        hoverable && 'hover:bg-white/[0.02] hover:border-indigo-500/50 transition-colors duration-200',
        clickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export default Card;
