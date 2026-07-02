/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// High-robustness iframe-safe storage engine to completely prevent security policy crashes
const getSafeStorage = (): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} => {
  try {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage;
      if (storage) {
        const testKey = '__storage_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return {
          getItem: (key) => storage.getItem(key),
          setItem: (key, value) => storage.setItem(key, value),
          removeItem: (key) => storage.removeItem(key),
        };
      }
    }
  } catch (e) {
    // blocked or unavailable due to iframe security settings
  }

  // Fallback memory store if localStorage is blocked by user browser settings/iframes
  const memoryStore: Record<string, string> = {};
  return {
    getItem: (key) => memoryStore[key] || null,
    setItem: (key, value) => { memoryStore[key] = value; },
    removeItem: (key) => { delete memoryStore[key]; },
  };
};

const safeStorage = getSafeStorage();

const safeGenerateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Ignore
  }
  return 'id-' + Math.random().toString(36).substring(2);
};

// Create a robust mock client backed by safeStorage to make the app fully functional when Supabase is not configured
const createMockClient = () => {
  // Initialize storage if needed
  if (!safeStorage.getItem('mock_db_initialized')) {
    const defaultUser = {
      id: 'mock-user-1',
      email: 'user@example.com',
      name: 'Alex Rivera',
      role: 'admin',
      avatar: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const defaultBoards = [
      {
        id: 'mock-board-1',
        title: '🚀 Q3 Product Launch',
        description: 'Roadmap and Kanban board for launch marketing, sales alignment, and final feature stabilization.',
        owner_id: 'mock-user-1',
        members: ['mock-user-1'],
        columns: [
          { id: 'col-todo', title: 'To Do', order: 0, color: '#64748b' },
          { id: 'col-progress', title: 'In Progress', order: 1, color: '#3b82f6' },
          { id: 'col-review', title: 'In Review', order: 2, color: '#8b5cf6' },
          { id: 'col-done', title: 'Done', order: 3, color: '#22c55e' }
        ],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const defaultTasks = [
      {
        id: 'mock-task-1',
        title: 'Analyze competitor pricing structures',
        description: 'Formulate Q3 marketing package plans by studying high/low pricing tiers of competitor offerings.',
        priority: 'high',
        status: 'todo',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        board_id: 'mock-board-1',
        column_id: 'col-todo',
        assignee_id: 'mock-user-1',
        created_by: 'mock-user-1',
        order: 0,
        tags: ['Research', 'Marketing'],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-task-2',
        title: 'Draft final landing page wireframes',
        description: 'Design sleek, conversion-oriented mobile and desktop wireframes in Figma.',
        priority: 'medium',
        status: 'in_progress',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        board_id: 'mock-board-1',
        column_id: 'col-progress',
        assignee_id: 'mock-user-1',
        created_by: 'mock-user-1',
        order: 0,
        tags: ['Design', 'Figma'],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-task-3',
        title: 'Setup continuous integration workflows',
        description: 'Establish automated unit testing, formatting checks, and preview deployment on pull requests.',
        priority: 'critical',
        status: 'review',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
        board_id: 'mock-board-1',
        column_id: 'col-review',
        assignee_id: 'mock-user-1',
        created_by: 'mock-user-1',
        order: 0,
        tags: ['DevOps', 'CI/CD'],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-task-4',
        title: 'Incorporate feedback from security audit',
        description: 'Verify proper JWT signature checking on API endpoints and secure password hashing workflows.',
        priority: 'critical',
        status: 'done',
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        board_id: 'mock-board-1',
        column_id: 'col-done',
        assignee_id: 'mock-user-1',
        created_by: 'mock-user-1',
        order: 0,
        tags: ['Security', 'Audit'],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    safeStorage.setItem('mock_users', JSON.stringify([defaultUser]));
    safeStorage.setItem('mock_boards', JSON.stringify(defaultBoards));
    safeStorage.setItem('mock_tasks', JSON.stringify(defaultTasks));
    
    // Auto login by default so preview works out-of-the-box
    const defaultSession = {
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh',
      user: {
        id: 'mock-user-1',
        email: 'user@example.com',
        app_metadata: {},
        user_metadata: { name: 'Alex Rivera' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
    };
    safeStorage.setItem('mock_session', JSON.stringify(defaultSession));
    safeStorage.setItem('mock_db_initialized', 'true');
  }

  // Auth callback list
  const authListeners: Array<(event: string, session: any) => void> = [];

  const getSession = () => {
    try {
      const sessionStr = safeStorage.getItem('mock_session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (e) {
      console.error('[MockSupabase] Error parsing mock_session from storage:', e);
      try {
        safeStorage.removeItem('mock_session');
      } catch (rmError) {
        // ignore
      }
      return null;
    }
  };

  const getItems = (table: string): any[] => {
    try {
      const str = safeStorage.getItem(`mock_${table}`);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      console.error(`[MockSupabase] Error parsing mock_${table} from storage:`, e);
      return [];
    }
  };

  const saveItems = (table: string, items: any[]) => {
    safeStorage.setItem(`mock_${table}`, JSON.stringify(items));
  };

  // Helper to create chainable query interface
  const createQueryBuilder = (tableName: string) => {
    const filters: Array<(item: any) => boolean> = [];
    let isSingleVal = false;
    let isMaybeSingleVal = false;
    let sortField = 'created_at';
    let sortAscending = false;
    let limitVal = 0;

    const queryBuilder: any = {
      select: (_selectStr?: string) => {
        return queryBuilder;
      },
      eq: (field: string, val: any) => {
        filters.push((item) => item[field] === val);
        return queryBuilder;
      },
      neq: (field: string, val: any) => {
        filters.push((item) => item[field] !== val);
        return queryBuilder;
      },
      lt: (field: string, val: any) => {
        filters.push((item) => item[field] < val);
        return queryBuilder;
      },
      in: (field: string, arr: any[]) => {
        filters.push((item) => arr.includes(item[field]));
        return queryBuilder;
      },
      or: (orStr: string) => {
        // Mock simple OR parser like: `owner_id.eq.XXX,members.cs.{XXX}`
        if (orStr.includes('owner_id.eq.') && orStr.includes('members.cs.')) {
          const userIdMatch = orStr.match(/owner_id\.eq\.([^,]+)/);
          const userId = userIdMatch ? userIdMatch[1] : '';
          filters.push((item) => {
            return item.owner_id === userId || (item.members && item.members.includes(userId));
          });
        }
        return queryBuilder;
      },
      order: (field: string, options?: { ascending?: boolean }) => {
        sortField = field;
        sortAscending = options?.ascending ?? true;
        return queryBuilder;
      },
      limit: (num: number) => {
        limitVal = num;
        return queryBuilder;
      },
      single: () => {
        isSingleVal = true;
        return queryBuilder;
      },
      maybeSingle: () => {
        isMaybeSingleVal = true;
        return queryBuilder;
      },
      insert: (newItems: any) => {
        const items = getItems(tableName);
        const itemArray = Array.isArray(newItems) ? newItems : [newItems];
        const processedItems = itemArray.map(item => ({
          id: item.id || safeGenerateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item
        }));
        saveItems(tableName, [...items, ...processedItems]);

        const resolveResult = () => {
          const resData = Array.isArray(newItems) ? processedItems : processedItems[0];
          return { data: resData, error: null };
        };

        const insertQuery: any = {
          select: () => insertQuery,
          single: () => ({
            then: (resolve: any) => resolve({ data: processedItems[0], error: null })
          }),
          maybeSingle: () => ({
            then: (resolve: any) => resolve({ data: processedItems[0], error: null })
          }),
          then: (resolve: any) => resolve(resolveResult())
        };
        return insertQuery;
      },
      update: (updates: any) => {
        const resolveResult = () => {
          const items = getItems(tableName);
          let firstUpdatedItem: any = null;
          const updatedItems = items.map((item) => {
            const matches = filters.every((filterFn) => filterFn(item));
            if (matches) {
              const updated = {
                ...item,
                ...updates,
                updated_at: new Date().toISOString()
              };
              if (!firstUpdatedItem) firstUpdatedItem = updated;
              return updated;
            }
            return item;
          });

          saveItems(tableName, updatedItems);
          const resData = isSingleVal ? firstUpdatedItem : updatedItems.filter(item => {
            return filters.every((filterFn) => filterFn(item));
          });
          return { data: resData, error: null };
        };

        const updateQuery: any = {
          eq: (field: string, val: any) => {
            filters.push((item) => item[field] === val);
            return updateQuery;
          },
          select: () => updateQuery,
          single: () => {
            isSingleVal = true;
            return {
              then: (resolve: any) => {
                const res = resolveResult();
                resolve({ data: Array.isArray(res.data) ? res.data[0] : res.data, error: null });
              }
            };
          },
          then: (resolve: any) => resolve(resolveResult())
        };
        return updateQuery;
      },
      delete: () => {
        const resolveResult = () => {
          const items = getItems(tableName);
          const remainingItems = items.filter((item) => {
            const matches = filters.every((filterFn) => filterFn(item));
            return !matches;
          });
          saveItems(tableName, remainingItems);
          return { data: null, error: null };
        };

        const deleteQuery: any = {
          eq: (field: string, val: any) => {
            filters.push((item) => item[field] === val);
            return deleteQuery;
          },
          then: (resolve: any) => resolve(resolveResult())
        };
        return deleteQuery;
      },
      then: (resolve: any) => {
        let items = getItems(tableName);
        
        if (filters.length > 0) {
          items = items.filter(item => filters.every(filterFn => filterFn(item)));
        }

        items.sort((a, b) => {
          let valA = a[sortField];
          let valB = b[sortField];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          
          if (valA < valB) return sortAscending ? -1 : 1;
          if (valA > valB) return sortAscending ? 1 : -1;
          return 0;
        });

        if (limitVal > 0) {
          items = items.slice(0, limitVal);
        }

        const users = getItems('users');
        items = items.map(item => {
          const itemCopy = { ...item };
          
          if (tableName === 'tasks') {
            if (itemCopy.assignee_id) {
              itemCopy.assignee = users.find(u => u.id === itemCopy.assignee_id) || null;
            } else {
              itemCopy.assignee = null;
            }
            if (itemCopy.created_by) {
              itemCopy.creator = users.find(u => u.id === itemCopy.created_by) || null;
            }
          }

          if (tableName === 'boards') {
            if (itemCopy.owner_id) {
              itemCopy.owner = users.find(u => u.id === itemCopy.owner_id) || null;
            }
          }

          return itemCopy;
        });

        let data: any = items;
        if (isSingleVal) {
          data = items[0] || null;
        } else if (isMaybeSingleVal) {
          data = items[0] || null;
        }

        resolve({ data, error: null });
      }
    };

    return queryBuilder;
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: getSession() }, error: null }),
      getUser: async () => {
        const session = getSession();
        return { data: { user: session ? session.user : null }, error: null };
      },
      onAuthStateChange: (callback: any) => {
        authListeners.push(callback);
        const session = getSession();
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = authListeners.indexOf(callback);
                if (idx !== -1) authListeners.splice(idx, 1);
              }
            }
          },
          error: null
        };
      },
      signUp: async ({ email, password, options }: any) => {
        const users = getItems('users');
        
        // Mock user created in auth schema
        const mockUserId = safeGenerateId();
        
        const newSession = {
          access_token: 'mock-token-' + mockUserId,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-' + mockUserId,
          user: {
            id: mockUserId,
            email: email,
            app_metadata: {},
            user_metadata: { name: options?.data?.name || email.split('@')[0] },
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        };

        safeStorage.setItem('mock_session', JSON.stringify(newSession));
        authListeners.forEach(listener => listener('SIGNED_IN', newSession));

        return { data: { user: newSession.user, session: newSession }, error: null };
      },
      signInWithPassword: async ({ email }: any) => {
        const users = getItems('users');
        const foundUser = users.find(u => u.email === email);
        
        const mockUserId = foundUser ? foundUser.id : safeGenerateId();
        
        const newSession = {
          access_token: 'mock-token-' + mockUserId,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-' + mockUserId,
          user: {
            id: mockUserId,
            email: email,
            app_metadata: {},
            user_metadata: { name: foundUser ? foundUser.name : email.split('@')[0] },
            aud: 'authenticated',
            created_at: foundUser ? foundUser.created_at : new Date().toISOString()
          }
        };

        safeStorage.setItem('mock_session', JSON.stringify(newSession));
        authListeners.forEach(listener => listener('SIGNED_IN', newSession));

        return { data: { user: newSession.user, session: newSession }, error: null };
      },
      signOut: async () => {
        safeStorage.removeItem('mock_session');
        authListeners.forEach(listener => listener('SIGNED_OUT', null));
        return { error: null };
      },
    },
    from: (tableName: string) => createQueryBuilder(tableName)
  };
};

const isPlaceholder = (val: string | undefined) => {
  if (!val) return true;
  const v = val.toLowerCase().trim();
  return (
    v === '' ||
    v.includes('your-') ||
    v.includes('your_') ||
    v.includes('placeholder') ||
    v.includes('example') ||
    v.includes('insert-') ||
    v.includes('insert_') ||
    v.includes('supabase-url') ||
    v.includes('supabase_url') ||
    v.includes('anon-key') ||
    v.includes('anon_key') ||
    v.includes('yourproject') ||
    v.includes('your-project')
  );
};

export const toggleSandboxMode = (enable: boolean) => {
  try {
    if (enable) {
      safeStorage.setItem('use_mock_sandbox', 'true');
    } else {
      safeStorage.removeItem('use_mock_sandbox');
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (e) {
    console.error('Failed to toggle sandbox mode:', e);
  }
};

const getIsUsingMock = () => {
  try {
    const forceSandbox = safeStorage.getItem('use_mock_sandbox') === 'true';
    if (forceSandbox) return true;
  } catch (e) {
    // ignore
  }
  return (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey) || !supabaseUrl?.startsWith('https://'));
};

export const hasRealCredentials = () => {
  return !(isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey) || !supabaseUrl?.startsWith('https://'));
};

export let isUsingMock = getIsUsingMock();

let client: ReturnType<typeof createClient>;

try {
  client = isUsingMock
    ? (createMockClient() as unknown as ReturnType<typeof createClient>)
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: safeStorage,
        },
      });
} catch (e) {
  console.error('[Supabase] Failed to initialize live Supabase client. Falling back to Mock Sandbox client.', e);
  isUsingMock = true;
  client = createMockClient() as unknown as ReturnType<typeof createClient>;
}

export const supabase = client;

export default supabase;

