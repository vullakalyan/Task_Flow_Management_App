import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn, formatDate, isOverdue } from '../../utils/helpers';
import type { Task } from '../../types';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import PriorityBadge from '../ui/PriorityBadge';
import Tooltip from '../ui/Tooltip';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isDragging?: boolean;
}

export const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onEdit, onDelete, isDragging }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isSortableDragging,
    } = useSortable({
      id: task.id,
      data: {
        type: 'task',
        task,
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const taskOverdue = isOverdue(task.due_date, task.status);
    const isCardDragging = isDragging || isSortableDragging;

    const menuItems = [
      { label: 'Edit task', value: 'edit', icon: <Pencil className="h-4 w-4" /> },
      { label: 'Delete task', value: 'delete', icon: <Trash2 className="h-4 w-4" />, danger: true },
    ];

    const handleMenu = (value: string) => {
      if (value === 'edit' && onEdit) onEdit(task);
      if (value === 'delete' && onDelete) onDelete(task);
    };

    return (
      <motion.div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        style={style}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'group bg-[#080808] rounded-xl border border-white/5 shadow-md',
          'hover:bg-white/[0.02] hover:border-white/10 transition-colors duration-200',
          isCardDragging && 'shadow-2xl ring-2 ring-indigo-500 opacity-90',
          taskOverdue && 'border-l-4 border-l-orange-500'
        )}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white/90 truncate group-hover:text-indigo-400 transition-colors">
                {task.title}
              </h4>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip content="Drag to reorder">
                <button
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </Tooltip>
              <Dropdown
                trigger={
                  <button className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                }
                items={menuItems}
                onSelect={handleMenu}
                showChevron={false}
                align="right"
              />
            </div>
          </div>

          {/* Description preview */}
          {task.description && (
            <p className="text-sm text-white/40 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs font-bold rounded-md bg-white/5 text-white/40 border border-white/5"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-white/5 text-white/40 border border-white/5">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              {task.due_date && (
                <Tooltip content={formatDate(task.due_date, 'long') || ''}>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-bold',
                      taskOverdue ? 'text-orange-500' : 'text-white/40'
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.due_date)}
                  </div>
                </Tooltip>
              )}
              {task.assignee_id && (
                <Tooltip content="Assigned user">
                  <Avatar size="xs" />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

TaskCard.displayName = 'TaskCard';

export default TaskCard;
