import Badge from './Badge';
import type { TaskPriority } from '../../types';

export const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const priorityVariants: Record<TaskPriority, 'primary' | 'secondary' | 'warning' | 'error'> = {
  low: 'secondary',
  medium: 'primary',
  high: 'warning',
  critical: 'error',
};

export interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  size = 'md',
  showDot = true,
  className,
}: PriorityBadgeProps) {
  return (
    <Badge
      variant={priorityVariants[priority]}
      size={size}
      dot={showDot}
      className={className}
    >
      {priorityLabels[priority]}
    </Badge>
  );
}

export default PriorityBadge;
