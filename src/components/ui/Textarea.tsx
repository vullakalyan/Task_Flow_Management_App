import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    error,
    helperText,
    showCount = false,
    id,
    maxLength,
    value,
    ...props
  }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-white/60 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={cn(
            'block w-full rounded-xl border bg-[#111111] transition-colors duration-150',
            'text-white placeholder:text-white/20',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/10',
            'disabled:bg-white/5 disabled:text-white/40 disabled:cursor-not-allowed',
            'resize-none',
            error
              ? 'border-orange-500/50 focus:ring-orange-500/20 focus:border-orange-500/50'
              : 'border-white/5 hover:border-white/10',
            'py-2.5 px-4 text-sm min-h-[100px]',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        <div className="flex justify-between mt-1.5">
          {error && (
            <p id={`${textareaId}-error`} className="text-sm text-orange-500" role="alert">
              {error}
            </p>
          )}
          {!error && helperText && (
            <p id={`${textareaId}-helper`} className="text-sm text-white/40">
              {helperText}
            </p>
          )}
          {showCount && maxLength && (
            <p className={cn(
              'text-sm ml-auto',
              currentLength >= maxLength ? 'text-orange-500' : 'text-white/40'
            )}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
