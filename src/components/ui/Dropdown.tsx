import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  description?: string;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  direction?: 'up' | 'down';
  className?: string;
  showChevron?: boolean;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'left',
  direction = 'down',
  className,
  showChevron = true,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: DropdownItem) => {
    if (!item.disabled) {
      onSelect(item.value);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
        {showChevron && (
          <ChevronDown
            className={cn(
              'inline-block ml-1 h-4 w-4 text-white/40 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 min-w-[200px] rounded-2xl bg-[#111111] border border-white/10',
              'shadow-xl py-2 focus:outline-none backdrop-blur-xl',
              direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {items.map((item, index) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm text-left',
                  'transition-colors duration-150',
                  item.disabled
                    ? 'text-white/20 cursor-not-allowed'
                    : item.danger
                    ? 'text-orange-500 hover:bg-orange-500/10'
                    : 'text-white/90 hover:bg-white/5',
                  index === 0 && 'rounded-t-2xl',
                  index === items.length - 1 && 'rounded-b-2xl'
                )}
              >
                {item.icon && (
                  <span className="flex-shrink-0">{item.icon}</span>
                )}
                <div className="flex-1">
                  <div className="font-bold">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-white/40">{item.description}</div>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dropdown;
