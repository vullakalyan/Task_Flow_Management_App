import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Search, Filter, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn, generateId } from '../../utils/helpers';
import type { Board, Task, Column as ColumnType, User } from '../../types';
import Column from './Column';
import TaskCard from '../task/TaskCard';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { TaskForm } from '../task/TaskForm';
import ConfirmDialog from '../ui/ConfirmDialog';

interface KanbanBoardProps {
  board: Board;
  tasks: Task[];
  columns: ColumnType[];
  onTasksChange: () => void;
  onBoardChange: () => void;
  memberUsers?: User[];
}

export function KanbanBoard({
  board,
  tasks,
  columns,
  onTasksChange,
  onBoardChange,
  memberUsers = [],
}: KanbanBoardProps) {
  const { user } = useAuth();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [addColumnModalOpen, setAddColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false);
  const [deletingColumn, setDeletingColumn] = useState<ColumnType | null>(null);
  const [showColumnDeleteConfirm, setShowColumnDeleteConfirm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const isAdmin = user?.role === 'admin' || board.owner_id === user?.id;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      selectedPriority === 'all' ||
      task.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  const getTasksByColumn = useCallback(
    (columnId: string) => {
      return filteredTasks
        .filter((task) => task.column_id === columnId)
        .sort((a, b) => a.order - b.order);
    },
    [filteredTasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTaskId(active.id as string);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'task') return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    if (overData?.type === 'column') {
      const overColumnId = overData.column.id;
      if (activeTask.column_id !== overColumnId) {
        reorderTasksOptimistically(
          active.id as string,
          overColumnId,
          tasks.filter((t) => t.column_id === overColumnId).length
        );
      }
    } else if (overData?.type === 'task') {
      if (activeTask.column_id !== overData.task.column_id) {
        reorderTasksOptimistically(
          active.id as string,
          overData.task.column_id,
          overData.task.order
        );
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    let newColumnId = activeTask.column_id;
    let newOrder = activeTask.order;

    if (over.data.current?.type === 'column') {
      newColumnId = over.data.current.column.id;
      newOrder = tasks.filter((t) => t.column_id === newColumnId).length;
    } else if (over.data.current?.type === 'task') {
      const overTask = over.data.current.task;
      newColumnId = overTask.column_id;
      newOrder = overTask.order;
    }

    try {
      await api.moveTask(active.id as string, newColumnId, newOrder);
      onTasksChange();
    } catch (error) {
      console.error('Failed to move task:', error);
      onTasksChange();
    }
  };

  const reorderTasksOptimistically = (
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) => {
    tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, column_id: newColumnId, order: newOrder };
      }
      return task;
    });
  };

  const handleAddTask = (columnId: string) => {
    setCreatingColumnId(columnId);
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!creatingColumnId) return;
    setLoading(true);
    try {
      const tasksInColumn = tasks.filter((t) => t.column_id === creatingColumnId);
      await api.createTask({
        ...taskData,
        board_id: board.id,
        column_id: creatingColumnId,
        order: tasksInColumn.length,
      });
      onTasksChange();
      setShowTaskModal(false);
      setCreatingColumnId(null);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editingTask) return;
    setLoading(true);
    try {
      await api.updateTask(editingTask.id, taskData);
      onTasksChange();
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
    setShowTaskDeleteConfirm(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!deletingTask) return;
    setLoading(true);
    try {
      await api.deleteTask(deletingTask.id);
      onTasksChange();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setLoading(false);
      setShowTaskDeleteConfirm(false);
      setDeletingTask(null);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    setLoading(true);
    try {
      const newColumn: ColumnType = {
        id: generateId(),
        title: newColumnTitle.trim(),
        order: columns.length,
        color: '#64748b',
      };
      await api.updateBoardColumns(board.id, [...columns, newColumn]);
      onBoardChange();
      setAddColumnModalOpen(false);
      setNewColumnTitle('');
    } catch (error) {
      console.error('Failed to add column:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColumn = (column: ColumnType) => {
    setDeletingColumn(column);
    setShowColumnDeleteConfirm(true);
  };

  const handleDeleteColumnConfirm = async () => {
    if (!deletingColumn) return;
    setLoading(true);
    try {
      const tasksInColumn = tasks.filter((t) => t.column_id === deletingColumn.id);
      if (tasksInColumn.length > 0) {
        await Promise.all(tasksInColumn.map((t) => api.deleteTask(t.id)));
      }
      const updatedColumns = columns.filter((c) => c.id !== deletingColumn.id);
      await api.updateBoardColumns(board.id, updatedColumns);
      onBoardChange();
      onTasksChange();
    } catch (error) {
      console.error('Failed to delete column:', error);
    } finally {
      setLoading(false);
      setShowColumnDeleteConfirm(false);
      setDeletingColumn(null);
    }
  };

  const activeTask = activeTaskId
    ? tasks.find((t) => t.id === activeTaskId)
    : null;

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111111] rounded-[2rem] border border-white/5 m-4">
        <EmptyState
          title="No columns yet"
          description="Add your first column to start organizing tasks"
          action={
            isAdmin && (
              <Button onClick={() => setAddColumnModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0B0B0B]">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center px-6 py-4 bg-[#0B0B0B] border-b border-white/5 z-20 shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-white/30" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, description or tag..."
            className="w-full rounded-xl border bg-[#111111] border-white/5 text-white placeholder:text-white/20 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/10 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/30 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Priority Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Priority:
          </span>
          {[
            { value: 'all', label: 'All', color: 'bg-white/20' },
            { value: 'low', label: 'Low', color: 'bg-white/40' },
            { value: 'medium', label: 'Medium', color: 'bg-white' },
            { value: 'high', label: 'High', color: 'bg-amber-400' },
            { value: 'critical', label: 'Critical', color: 'bg-orange-400' },
          ].map((item) => {
            const isSelected = selectedPriority === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setSelectedPriority(item.value)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200',
                  isSelected
                    ? 'bg-white/10 text-white border-white/20 shadow-lg shadow-black/20'
                    : 'bg-white/5 text-white/40 border-white/5 hover:text-white/60 hover:bg-white/10 hover:border-white/10'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', item.color)} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Column Area */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-h-full pb-4">
            <SortableContext
              items={columns.map((c) => c.id)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  tasks={getTasksByColumn(column.id)}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteColumn={isAdmin ? handleDeleteColumn : undefined}
                />
              ))}
            </SortableContext>

            {/* Add Column Button */}
            {isAdmin && (
              <button
                onClick={() => setAddColumnModalOpen(true)}
                className={cn(
                  'flex-shrink-0 min-w-[280px] h-[80px]',
                  'flex items-center justify-center gap-2',
                  'bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem]',
                  'text-white/40 hover:text-white/60 hover:bg-white/10 hover:border-white/20',
                  'transition-all duration-200'
                )}
              >
                <Plus className="h-5 w-5" />
                <span className="font-bold">Add Column</span>
              </button>
            )}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask && (
              <div className="rotate-3 opacity-90">
                <TaskCard task={activeTask} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Column Modal */}
      <Modal
        isOpen={addColumnModalOpen}
        onClose={() => setAddColumnModalOpen(false)}
        title="Add New Column"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Column name
            </label>
            <input
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="e.g., In Progress"
              className="w-full rounded-xl border bg-[#111111] border-white/5 text-white placeholder:text-white/20 py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/10"
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddColumnModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColumn} loading={loading}>
              Add Column
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
          setCreatingColumnId(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="lg"
      >
        <TaskForm
          task={editingTask || undefined}
          columns={columns}
          users={memberUsers}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowTaskModal(false);
            setEditingTask(null);
            setCreatingColumnId(null);
          }}
          isLoading={loading}
        />
      </Modal>

      {/* Task Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showTaskDeleteConfirm}
        onClose={() => {
          setShowTaskDeleteConfirm(false);
          setDeletingTask(null);
        }}
        onConfirm={handleDeleteTaskConfirm}
        title="Delete Task"
        message={deletingTask ? `Are you sure you want to delete the task "${deletingTask.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={loading}
      />

      {/* Column Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showColumnDeleteConfirm}
        onClose={() => {
          setShowColumnDeleteConfirm(false);
          setDeletingColumn(null);
        }}
        onConfirm={handleDeleteColumnConfirm}
        title="Delete Column"
        message={
          deletingColumn
            ? `Are you sure you want to delete the column "${deletingColumn.title}"? This will permanently delete the column and all of its ${
                tasks.filter((t) => t.column_id === deletingColumn.id).length
              } tasks. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={loading}
      />
    </div>
  );
}

export default KanbanBoard;
