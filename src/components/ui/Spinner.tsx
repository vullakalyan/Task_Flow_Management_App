import { cn } from '../../utils/helpers';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colorStyles = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-500',
  white: 'text-white',
};

export function Spinner({ size = 'md', className, color = 'primary' }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin', sizeStyles[size], colorStyles[color], className)}
    />
  );
}

export default Spinner;
