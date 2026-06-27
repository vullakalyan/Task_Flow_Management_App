import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a robust mock client to prevent any crashes when Supabase is not configured
const createMockClient = () => {
  const dummyResult = { data: null, error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment/secrets.') };
  
  const chainable: Record<string, unknown> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte',
    'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte',
    'rangeLt', 'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'match',
    'not', 'or', 'and', 'filter', 'order', 'limit', 'range', 'single', 'maybeSingle', 'csv'
  ];
  
  methods.forEach(method => {
    chainable[method] = () => new Proxy(chainable, {
      get: (target, prop) => {
        if (prop === 'then') {
          return (resolve: (val: unknown) => void) => resolve(dummyResult);
        }
        const val = chainable[prop as string];
        return val || (() => chainable);
      }
    });
  });

  chainable.then = (resolve: (val: unknown) => void) => resolve(dummyResult);

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      signUp: async () => ({ data: { user: null }, error: new Error('Supabase is not configured') }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase is not configured') }),
      signOut: async () => ({ error: null }),
    },
    from: () => chainable,
  };
};

const client = (!supabaseUrl || !supabaseAnonKey)
  ? (createMockClient() as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

export const supabase = client;

export default supabase;
