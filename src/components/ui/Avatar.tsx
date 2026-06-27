import { cn } from '../../utils/helpers';
import { User } from 'lucide-react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; icon: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-xs', icon: 'h-3 w-3' },
  sm: { container: 'h-8 w-8', text: 'text-xs', icon: 'h-4 w-4' },
  md: { container: 'h-10 w-10', text: 'text-sm', icon: 'h-5 w-5' },
  lg: { container: 'h-12 w-12', text: 'text-base', icon: 'h-6 w-6' },
  xl: { container: 'h-16 w-16', text: 'text-lg', icon: 'h-8 w-8' },
};

const statusStyles = {
  online: 'bg-success-500',
  offline: 'bg-secondary-400',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
  showStatus = false,
  status = 'offline',
}: AvatarProps) {
  const styles = sizeStyles[size];

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full overflow-hidden',
          'bg-gradient-to-br from-primary-400 to-primary-600',
          styles.container
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : name ? (
          <span className={cn('font-medium text-white', styles.text)}>
            {getInitials(name)}
          </span>
        ) : (
          <User className={cn('text-white/80', styles.icon)} />
        )}
      </div>
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
            statusStyles[status]
          )}
        />
      )}
    </div>
  );
}

export default Avatar;
