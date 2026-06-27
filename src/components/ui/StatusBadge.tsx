import Badge from './Badge';
import type { TaskStatus } from '../../types';

export const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const statusVariants: Record<TaskStatus, 'secondary' | 'primary' | 'info' | 'success'> = {
  todo: 'secondary',
  in_progress: 'primary',
  review: 'info',
  done: 'success',
};

export interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant={statusVariants[status]}
      size={size}
      dot={showDot}
      className={className}
    >
      {statusLabels[status]}
    </Badge>
  );
}

export default StatusBadge;
