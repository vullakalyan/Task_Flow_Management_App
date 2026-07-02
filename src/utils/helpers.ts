import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!date) return '';

  const d = new Date(date);
  const now = new Date();

  if (format === 'relative') {
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString();
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function isOverdue(dueDate: string | Date | null, status: string): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[priority] || colors.medium;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-800 border-slate-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    review: 'bg-purple-100 text-purple-800 border-purple-200',
    done: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[status] || colors.todo;
}

export function getColumnStatus(columnTitle: string): string {
  const normalized = columnTitle.toLowerCase().replace(/\s+/g, '_');
  if (normalized.includes('progress') || normalized.includes('doing')) return 'in_progress';
  if (normalized.includes('review')) return 'review';
  if (normalized.includes('done') || normalized.includes('complete')) return 'done';
  return 'todo';
}

export function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback if crypto.randomUUID() throws in insecure context
  }
  return 'id-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}
