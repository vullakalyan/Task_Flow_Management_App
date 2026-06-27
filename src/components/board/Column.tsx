import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Settings2 } from 'lucide-react';
import { cn } from '../../utils/helpers';
import type { Task, Column as ColumnType } from '../../types';
import TaskCard from '../task/TaskCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Dropdown from '../ui/Dropdown';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onEditColumn?: (column: ColumnType) => void;
  onDeleteColumn?: (column: ColumnType) => void;
  isDragging?: boolean;
}

export function Column({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  isDragging,
}: Omit<ColumnProps, 'board'>) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const taskIds = tasks.map((t) => t.id);

  const columnMenuItems = [
    { label: 'Edit column', value: 'edit', icon: <Settings2 className="h-4 w-4" /> },
    { label: 'Delete column', value: 'delete', icon: <Settings2 className="h-4 w-4" />, danger: true },
  ];

  const handleColumnMenu = (value: string) => {
    if (value === 'edit' && onEditColumn) onEditColumn(column);
    if (value === 'delete' && onDeleteColumn) onDeleteColumn(column);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col bg-[#111111] rounded-[2rem] min-w-[280px] max-w-[340px] flex-shrink-0',
        'border border-white/5 overflow-hidden',
        isOver && 'ring-2 ring-indigo-500 bg-white/5'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#080808]">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shadow-inner"
            style={{ backgroundColor: column.color || '#64748b' }}
          />
          <h3 className="font-bold text-white/90">{column.title}</h3>
          <Badge variant="secondary" size="sm">
            {tasks.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="text-white/60"
          >
            Add
          </Button>
          {onDeleteColumn && (
            <Dropdown
              trigger={
                <button className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
              items={columnMenuItems}
              onSelect={handleColumnMenu}
              showChevron={false}
              align="right"
            />
          )}
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && !isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-white/40"
          >
            <div className="w-12 h-12 rounded-[1rem] bg-white/5 flex items-center justify-center mb-2 border border-white/10">
              <Plus className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold">No tasks</p>
            <button
              onClick={() => onAddTask(column.id)}
              className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Add a task
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Column;
