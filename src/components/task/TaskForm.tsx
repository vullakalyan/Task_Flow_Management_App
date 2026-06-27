import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Tag, AlertTriangle } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus, Column, User as UserType } from '../../types';
import { Button, Input, Textarea, Select } from '../ui';
import { priorityLabels } from '../ui/PriorityBadge';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  due_date: z.string().optional().nullable(),
  column_id: z.string().min(1, 'Column is required'),
  assignee_id: z.string().optional().nullable(),
  tags: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  columns: Column[];
  users?: UserType[];
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({ task, columns, users = [], onSubmit, onCancel, isLoading }: TaskFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'todo',
      due_date: task?.due_date ? task.due_date.split('T')[0] : '',
      column_id: task?.column_id || columns[0]?.id || '',
      assignee_id: task?.assignee_id || '',
      tags: task?.tags?.join(', ') || '',
    },
  });

  const prioritySelectOptions = Object.entries(priorityLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const columnSelectOptions = columns.map((col) => ({
    value: col.id,
    label: col.title,
  }));

  const userSelectOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map((user) => ({
      value: user.id,
      label: user.name,
    })),
  ];

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      setError(null);
      const taskData: Partial<Task> = {
        title: data.title,
        description: data.description || '',
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        column_id: data.column_id,
        assignee_id: data.assignee_id || null,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      await onSubmit(taskData);
    } catch (err) {
      console.error(err);
      setError('Failed to save task. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm flex items-center gap-2 font-bold">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Input
        label="Title"
        placeholder="Enter task title"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="Description (optional)"
        placeholder="Add more details about this task..."
        showCount
        maxLength={2000}
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Priority"
          options={prioritySelectOptions}
          error={errors.priority?.message}
          {...register('priority')}
        />

        <Select
          label="Column"
          options={columnSelectOptions}
          error={errors.column_id?.message}
          {...register('column_id')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Due date (optional)"
          type="date"
          error={errors.due_date?.message}
          {...register('due_date')}
        />

        <Select
          label="Assignee"
          options={userSelectOptions}
          error={errors.assignee_id?.message}
          {...register('assignee_id')}
        />
      </div>

      <Input
        label="Tags (optional)"
        placeholder="Enter tags separated by commas"
        helperText="Example: frontend, bug, urgent"
        leftIcon={<Tag className="h-4 w-4" />}
        error={errors.tags?.message}
        {...register('tags')}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}

export default TaskForm;
