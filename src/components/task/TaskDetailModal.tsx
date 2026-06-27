import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Edit2, Tag, Trash2, User, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { cn, formatDate, isOverdue } from '../../utils/helpers';
import type { TaskWithDetails, Board } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import PriorityBadge from '../ui/PriorityBadge';
import StatusBadge from '../ui/StatusBadge';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { TaskForm } from './TaskForm';
import ConfirmDialog from '../ui/ConfirmDialog';

interface TaskDetailModalProps {
  taskId: string | null;
  board: Board | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function TaskDetailModal({
  taskId,
  board,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTask(taskId);
      setTask(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId && isOpen) {
      loadTask();
    }
  }, [taskId, isOpen, loadTask]);

  useEffect(() => {
    if (!isOpen) {
      setTask(null);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  const handleUpdate = async (updates: Partial<TaskWithDetails>) => {
    if (!task) return;
    try {
      setIsSaving(true);
      await api.updateTask(task.id, updates);
      setIsEditing(false);
      onUpdated();
      loadTask();
    } catch {
      setError('Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await api.deleteTask(task.id);
      onDeleted();
      onClose();
    } catch {
      setError('Failed to delete task');
    }
  };

  const taskOverdue = task ? isOverdue(task.due_date, task.status) : false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={isEditing ? 'Edit Task' : 'Task Details'}>
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && !loading && (
        <EmptyState
          title="Something went wrong"
          description={error}
          action={<Button onClick={loadTask}>Try again</Button>}
        />
      )}

      {!loading && !error && task && !isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">{task.title}</h2>
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                {taskOverdue && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-error-100 text-error-700 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit2 className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                leftIcon={<Trash2 className="h-4 w-4 text-error-500" />}
              >
                Delete
              </Button>
            </div>
          </div>

          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2">Description</h3>
              <p className="text-secondary-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </h3>
              <p className={cn(taskOverdue ? 'text-error-600' : 'text-secondary-600')}>
                {task.due_date ? formatDate(task.due_date, 'long') : 'No due date set'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assignee
              </h3>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignee.name} src={task.assignee.avatar} size="sm" />
                  <span className="text-secondary-600">{task.assignee.name}</span>
                </div>
              ) : (
                <p className="text-secondary-500">Unassigned</p>
              )}
            </div>
          </div>

          {task.created_by && (
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Created
              </h3>
              <p className="text-secondary-500 text-sm">
                by {task.creator?.name || 'Unknown'} on {formatDate(task.created_at, 'long')}
              </p>
            </div>
          )}

          {task.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-sm rounded-full bg-secondary-100 text-secondary-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inline confirmation block removed */}
        </motion.div>
      )}

      {!loading && !error && task && isEditing && board && (
        <TaskForm
          task={task}
          columns={board.columns}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isLoading={isSaving}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={task ? `Are you sure you want to delete the task "${task.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={isSaving}
      />
    </Modal>
  );
}

export default TaskDetailModal;
