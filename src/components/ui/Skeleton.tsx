import { cn } from '../../utils/helpers';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: SkeletonVariant;
  className?: string;
  animate?: boolean;
}

export function Skeleton({
  width,
  height,
  variant = 'rect',
  className,
  animate = true,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-secondary-200',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded',
        variant === 'rect' && 'rounded-md',
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={14}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-lg border border-secondary-200 bg-white', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={14} width="40%" />
          <Skeleton variant="text" height={12} width="60%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export default Skeleton;
