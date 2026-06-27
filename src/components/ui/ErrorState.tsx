import { ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  message: string;
  retry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  className?: string;
}

export function ErrorState({
  message,
  retry,
  retryLabel = 'Try again',
  icon,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-error-100 text-error-600 mb-4">
        {icon || <AlertCircle className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-secondary-500 max-w-sm mb-6">{message}</p>
      {retry && (
        <Button
          variant="secondary"
          onClick={retry}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
