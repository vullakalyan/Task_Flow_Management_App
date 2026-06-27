import { ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-white/40 mb-4 border border-white/5">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-bold text-white/90 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-white/40 max-w-sm mb-6">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
