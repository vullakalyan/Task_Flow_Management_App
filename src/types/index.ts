export type UserRole = 'admin' | 'member';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  color: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  members: string[];
  columns: Column[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  board_id: string;
  column_id: string;
  assignee_id: string | null;
  created_by: string;
  order: number;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDetails extends Task {
  assignee?: User | null;
  creator?: User;
  board?: Board;
}

export interface BoardWithDetails extends Board {
  owner?: User;
  memberDetails?: User[];
  tasks?: Task[];
}

export interface DashboardStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  doneTasks: number;
  overdueTasks: number;
  myTasks: number;
}

export interface Activity {
  id: string;
  task_id: string;
  task_title: string;
  action: string;
  user_id: string;
  user_name: string;
  created_at: string;
}
