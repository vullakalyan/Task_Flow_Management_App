import supabase from '../utils/supabase';
import type { Board, Task, User, BoardWithDetails, TaskWithDetails, DashboardStats } from '../types';

const BOARD_SELECT = 'id, title, description, owner_id, members, columns, is_archived, created_at, updated_at';
const TASK_SELECT = 'id, title, description, priority, status, due_date, board_id, column_id, assignee_id, created_by, order, tags, is_archived, created_at, updated_at';
const USER_SELECT = 'id, email, name, role, avatar, created_at, updated_at';

export const api = {
  // Users
  async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('relation "public.users" does not exist')) {
        throw new Error('Database tables are missing. Please run the SQL migration scripts located in the `supabase/migrations` folder in your Supabase SQL Editor.');
      }
      throw error;
    }
    return data;
  },

  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(USER_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(USER_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  // Boards
  async getBoards(): Promise<Board[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('boards')
      .select(BOARD_SELECT)
      .or(`owner_id.eq.${user.id},members.cs.{${user.id}}`)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBoard(id: string): Promise<BoardWithDetails | null> {
    const { data, error } = await supabase
      .from('boards')
      .select(`${BOARD_SELECT}, owner:users!boards_owner_id_fkey(${USER_SELECT})`)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const { data: memberDetails, error: membersError } = await supabase
      .from('users')
      .select(USER_SELECT)
      .in('id', data.members || []);

    if (membersError) throw membersError;

    const ownerData = data.owner as unknown as User;
    return { ...data, owner: ownerData, memberDetails: memberDetails || [] };
  },

  async createBoard(title: string, description: string = '', members: string[] = []): Promise<Board> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const defaultColumns = [
      { id: crypto.randomUUID(), title: 'To Do', order: 0, color: '#64748b' },
      { id: crypto.randomUUID(), title: 'In Progress', order: 1, color: '#3b82f6' },
      { id: crypto.randomUUID(), title: 'Review', order: 2, color: '#8b5cf6' },
      { id: crypto.randomUUID(), title: 'Done', order: 3, color: '#22c55e' },
    ];

    const { data, error } = await supabase
      .from('boards')
      .insert({
        title,
        description,
        owner_id: user.id,
        members: [user.id, ...members],
        columns: defaultColumns,
      })
      .select(BOARD_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
    const { data, error } = await supabase
      .from('boards')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(BOARD_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBoard(id: string): Promise<void> {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateBoardColumns(id: string, columns: Board['columns']): Promise<Board> {
    const { data, error } = await supabase
      .from('boards')
      .update({
        columns,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(BOARD_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async addBoardMember(boardId: string, userId: string): Promise<Board> {
    const { data: board, error: fetchError } = await supabase
      .from('boards')
      .select('members')
      .eq('id', boardId)
      .single();

    if (fetchError) throw fetchError;

    const members = board.members || [];
    if (members.includes(userId)) {
      throw new Error('User is already a member');
    }

    const { data, error } = await supabase
      .from('boards')
      .update({
        members: [...members, userId],
        updated_at: new Date().toISOString(),
      })
      .eq('id', boardId)
      .select(BOARD_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async removeBoardMember(boardId: string, userId: string): Promise<Board> {
    const { data: board, error: fetchError } = await supabase
      .from('boards')
      .select('members')
      .eq('id', boardId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('boards')
      .update({
        members: (board.members || []).filter((m: string) => m !== userId),
        updated_at: new Date().toISOString(),
      })
      .eq('id', boardId)
      .select(BOARD_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  // Tasks
  async getTasks(boardId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('board_id', boardId)
      .eq('is_archived', false)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTask(id: string): Promise<TaskWithDetails | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`${TASK_SELECT}, assignee:users!tasks_assignee_id_fkey(${USER_SELECT}), creator:users!tasks_created_by_fkey(${USER_SELECT})`)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const taskData = data as unknown as TaskWithDetails;
    return taskData;
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        due_date: task.due_date || null,
        board_id: task.board_id,
        column_id: task.column_id,
        assignee_id: task.assignee_id || null,
        created_by: user.id,
        order: task.order ?? 0,
        tags: task.tags || [],
      })
      .select(TASK_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async moveTask(id: string, columnId: string, order: number): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        column_id: columnId,
        order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async reorderTasks(_boardId: string, tasks: { id: string; columnId: string; order: number }[]): Promise<void> {
    const promises = tasks.map(({ id, columnId, order }) =>
      supabase
        .from('tasks')
        .update({
          column_id: columnId,
          order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    const errs = results.filter(r => r.error);
    if (errs.length > 0) {
      throw new Error('Failed to reorder tasks');
    }
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id')
      .or(`owner_id.eq.${user.id},members.cs.{${user.id}}`)
      .eq('is_archived', false);

    if (boardsError) throw boardsError;

    const boardIds = boards?.map(b => b.id) || [];
    if (boardIds.length === 0) {
      return {
        totalTasks: 0,
        todoTasks: 0,
        inProgressTasks: 0,
        reviewTasks: 0,
        doneTasks: 0,
        overdueTasks: 0,
        myTasks: 0,
      };
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status, due_date, assignee_id')
      .in('board_id', boardIds)
      .eq('is_archived', false);

    if (tasksError) throw tasksError;

    const now = new Date();

    return {
      totalTasks: tasks?.length || 0,
      todoTasks: tasks?.filter(t => t.status === 'todo').length || 0,
      inProgressTasks: tasks?.filter(t => t.status === 'in_progress').length || 0,
      reviewTasks: tasks?.filter(t => t.status === 'review').length || 0,
      doneTasks: tasks?.filter(t => t.status === 'done').length || 0,
      overdueTasks: tasks?.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length || 0,
      myTasks: tasks?.filter(t => t.assignee_id === user.id).length || 0,
    };
  },

  async getMyTasks(): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('assignee_id', user.id)
      .eq('is_archived', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  },

  async getOverdueTasks(): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id')
      .or(`owner_id.eq.${user.id},members.cs.{${user.id}}`)
      .eq('is_archived', false);

    if (boardsError) throw boardsError;

    const boardIds = boards?.map(b => b.id) || [];
    if (boardIds.length === 0) return [];

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .in('board_id', boardIds)
      .lt('due_date', now)
      .neq('status', 'done')
      .eq('is_archived', false)
      .order('due_date', { ascending: true })
      .limit(5);

    if (error) throw error;
    return data || [];
  },
};
