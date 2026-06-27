import { ReactNode } from 'react';
import { cn } from '../../utils/helpers';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageWrapper({
  children,
  title,
  subtitle,
  actions,
  className,
  contentClassName,
}: PageWrapperProps) {
  return (
    <main className={cn('flex-grow flex flex-col p-8 overflow-hidden', className)}>
      <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
        {(title || actions) && (
          <header className="flex justify-between items-end mb-8 shrink-0">
            <div className="space-y-1">
              {subtitle && (
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{subtitle}</span>
              )}
              {title && (
                <h2 className="text-3xl font-bold tracking-tight text-white/95">{title}</h2>
              )}
            </div>
            {actions && <div className="flex items-center gap-4">{actions}</div>}
          </header>
        )}
        <div className={cn("flex-grow overflow-y-auto", contentClassName)}>{children}</div>
      </div>
    </main>
  );
}

export default PageWrapper;
