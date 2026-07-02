import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase, { isUsingMock } from '../utils/supabase';
import type { User } from '../types';

console.log('[AuthContext] Script loaded. isUsingMock:', isUsingMock);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null, needsEmailVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_USER_SELECT = 'id, email, name, role, avatar, created_at, updated_at';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Safety fallback: if initialization hangs (due to sleeping db, iframe, network, or cookies), unblock loading after 2.5s
    const timeoutId = setTimeout(() => {
      if (active) {
        console.warn('[AuthContext] Auth initialization took too long (> 2.5s). Unblocking spinner safety fallback...');
        setLoading(false);
      }
    }, 2500);

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing auth. isUsingMock =', isUsingMock);
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthContext] Error getting initial session:', sessionError);
        } else {
          console.log('[AuthContext] Initial session check complete:', initialSession ? `Active session for ${initialSession.user?.email}` : 'No active session found', initialSession);
        }

        if (active && initialSession) {
          console.log('[AuthContext] Active session detected. Setting session state & fetching user profile...');
          setSession(initialSession);
          await fetchUserProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
      } finally {
        if (active) {
          clearTimeout(timeoutId);
          console.log('[AuthContext] Auth initialization completed. Setting loading to false.');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!active) {
        console.log('[AuthContext] onAuthStateChange event fired but AuthProvider has already unmounted.');
        return;
      }
      
      console.log(`[AuthContext] onAuthStateChange triggered - Event: "${event}". Session active: ${!!newSession}`, {
        userId: newSession?.user?.id,
        email: newSession?.user?.email,
        session: newSession
      });

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log(`[AuthContext] Event "${event}": updating session state and loading user profile.`);
        setSession(newSession);
        if (newSession?.user) {
          setLoading(true);
          await fetchUserProfile(newSession.user.id);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] Event "SIGNED_OUT": clearing local user and session states.');
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      console.log('[AuthContext] AuthProvider unmounted. Cleaning up subscribers.');
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    console.log('[AuthContext] fetchUserProfile called for userId:', userId);
    try {
      console.log('[AuthContext] Querying public.users table in Database...');
      const { data, error } = await supabase
        .from('users')
        .select(SUPABASE_USER_SELECT)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error querying public.users table from Supabase:', error);
        if (error.message?.includes('schema cache') || error.message?.includes('relation "public.users" does not exist')) {
          console.error('[AuthContext] Database tables are missing! Please run the SQL migration scripts in your Supabase SQL Editor.');
        } else {
          throw error;
        }
      }

      if (data) {
        console.log('[AuthContext] Successfully fetched user profile from db row:', data);
        setUser(data);
      } else {
        console.warn('[AuthContext] No profile row found in public.users table for this user ID. Attempting self-healing/fallback profile creation...');
        const authUserResponse = await supabase.auth.getUser();
        const authUser = authUserResponse.data?.user;
        console.log('[AuthContext] Current user in Supabase auth system is:', authUser);
        
        const fallbackUser: User = {
          id: userId,
          email: authUser?.email || 'user@example.com',
          name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
          role: 'member',
          avatar: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (authUser) {
          console.log('[AuthContext] Auth user exists. Inserting self-healing user row in "users" table...', fallbackUser);
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: fallbackUser.email,
              name: fallbackUser.name,
              role: 'member'
            })
            .select(SUPABASE_USER_SELECT)
            .maybeSingle();

          if (insertError) {
            console.error('[AuthContext] Failed to insert self-healing profile row:', insertError);
          } else if (newProfile) {
            console.log('[AuthContext] Self-healing profile successfully created & selected:', newProfile);
            setUser(newProfile as User);
            return;
          }
        }
        
        console.warn('[AuthContext] Proceeding with client-side fallback user state:', fallbackUser);
        setUser(fallbackUser);
      }
    } catch (error) {
      console.error('[AuthContext] Error in fetchUserProfile:', error);
      // Fallback user profile on error (e.g. database table missing completely)
      const fallbackUser: User = {
        id: userId,
        email: 'user@example.com',
        name: 'User',
        role: 'member',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.warn('[AuthContext] Falling back to generic user profile due to fetchUserProfile exception:', fallbackUser);
      setUser(fallbackUser);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('[AuthContext] signUp requested for email:', email, 'name:', name);
    try {
      console.log('[AuthContext] Calling supabase.auth.signUp...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (authError) {
        console.error('[AuthContext] Supabase auth.signUp returned error:', authError);
        throw authError;
      }

      console.log('[AuthContext] Supabase auth.signUp completed successfully. User ID:', authData.user?.id, 'Session exists:', !!authData.session);

      if (authData.user) {
        if (authData.session) {
          console.log('[AuthContext] Session returned directly from signUp. Setting local session and fetching profile...');
          setSession(authData.session);
          await fetchUserProfile(authData.user.id);
        } else {
          console.log('[AuthContext] No session returned from signUp. Email confirmation might be required.');
        }
      }

      const needsEmailVerification = !authData.session;
      console.log('[AuthContext] signUp operation successful. needsEmailVerification =', needsEmailVerification);
      return { error: null, needsEmailVerification };
    } catch (error) {
      console.error('[AuthContext] Error in signUp flow:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn requested for email:', email);
    try {
      console.log('[AuthContext] Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Supabase auth.signInWithPassword returned error:', error);
        throw error;
      }
      
      console.log('[AuthContext] Supabase auth.signInWithPassword completed successfully. User ID:', data?.user?.id, 'Session exists:', !!data?.session);

      if (data?.user) {
        if (data.session) {
          console.log('[AuthContext] Setting session state first...');
          setSession(data.session);
        }
        console.log('[AuthContext] Fetching user profile for signed in user...');
        await fetchUserProfile(data.user.id);
      }
      
      console.log('[AuthContext] signIn operation successful.');
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Error in signIn flow:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut requested...');
    try {
      await supabase.auth.signOut();
      console.log('[AuthContext] Supabase auth.signOut completed.');
    } catch (error) {
      console.error('[AuthContext] Error during Supabase auth.signOut:', error);
    } finally {
      setUser(null);
      setSession(null);
      console.log('[AuthContext] Local auth states cleared.');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    console.log('[AuthContext] updateProfile requested with:', updates);
    try {
      if (!user) throw new Error('No user logged in');

      console.log('[AuthContext] Updating users table in db for user ID:', user.id);
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('[AuthContext] Error updating profile row:', error);
        if (error.message?.includes('schema cache') || error.message?.includes('relation "public.users" does not exist')) {
          throw new Error('Database tables are missing. Please run the SQL migration scripts located in the `supabase/migrations` folder in your Supabase SQL Editor.');
        }
        throw error;
      }

      console.log('[AuthContext] Profile row updated successfully in database. Updating local state.');
      setUser({ ...user, ...updates });
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Error in updateProfile flow:', error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
