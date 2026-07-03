import type { Board, Task, User, BoardWithDetails, TaskWithDetails, DashboardStats } from '../types';

// Helper to get headers with JWT token from localStorage
function getHeaders() {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to check DB connection status from Express backend
export async function checkDbStatus(): Promise<{ connected: boolean; type: string }> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { connected: false, type: 'In-Memory Store (Sandbox)' };
  }
}

export const api = {
  // Users
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: getHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('auth_token');
        }
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async getUser(id: string): Promise<User | null> {
    const res = await fetch(`/api/users/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch user');
    }
    return res.json();
  },

  async getAllUsers(): Promise<User[]> {
    const res = await fetch('/api/users', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch users');
    }
    return res.json();
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  // Boards
  async getBoards(): Promise<Board[]> {
    const res = await fetch('/api/boards', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch boards');
    }
    return res.json();
  },

  async getBoard(id: string): Promise<BoardWithDetails | null> {
    const res = await fetch(`/api/boards/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch board');
    }
    return res.json();
  },

  async createBoard(title: string, description: string = '', members: string[] = []): Promise<Board> {
    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, description, members }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create board');
    }
    return res.json();
  },

  async updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
    const res = await fetch(`/api/boards/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update board');
    }
    return res.json();
  },

  async deleteBoard(id: string): Promise<void> {
    const res = await fetch(`/api/boards/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete board');
    }
  },

  async updateBoardColumns(id: string, columns: Board['columns']): Promise<Board> {
    const res = await fetch(`/api/boards/${id}/columns`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ columns }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update board columns');
    }
    return res.json();
  },

  async addBoardMember(boardId: string, userId: string): Promise<Board> {
    const res = await fetch(`/api/boards/${boardId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add member');
    }
    return res.json();
  },

  async removeBoardMember(boardId: string, userId: string): Promise<Board> {
    const res = await fetch(`/api/boards/${boardId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove member');
    }
    return res.json();
  },

  // Tasks
  async getTasks(boardId: string): Promise<Task[]> {
    const res = await fetch(`/api/boards/${boardId}/tasks`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch tasks');
    }
    return res.json();
  },

  async getTask(id: string): Promise<TaskWithDetails | null> {
    const res = await fetch(`/api/tasks/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch task');
    }
    return res.json();
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create task');
    }
    return res.json();
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update task');
    }
    return res.json();
  },

  async moveTask(id: string, columnId: string, order: number): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}/move`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ column_id: columnId, order }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to move task');
    }
    return res.json();
  },

  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update task status');
    }
    return res.json();
  },

  async reorderTasks(_boardId: string, tasks: { id: string; columnId: string; order: number }[]): Promise<void> {
    const res = await fetch('/api/tasks/reorder', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tasks }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reorder tasks');
    }
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete task');
    }
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch dashboard stats');
    }
    return res.json();
  },

  async getMyTasks(): Promise<Task[]> {
    const res = await fetch('/api/dashboard/my-tasks', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch my tasks');
    }
    return res.json();
  },

  async getOverdueTasks(): Promise<Task[]> {
    const res = await fetch('/api/dashboard/overdue', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch overdue tasks');
    }
    return res.json();
  },
};
