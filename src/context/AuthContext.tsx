import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface Session {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
  };
}

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const profile = await api.getCurrentUser();
          if (active && profile) {
            setUser(profile);
            setSession({
              access_token: token,
              token_type: 'bearer',
              user: {
                id: profile.id,
                email: profile.email,
              }
            });
          } else if (active) {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }

      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      
      setUser(data.user);
      setSession({
        access_token: data.token,
        token_type: 'bearer',
        user: {
          id: data.user.id,
          email: data.user.email,
        }
      });

      return { error: null, needsEmailVerification: false };
    } catch (error) {
      console.error('[AuthContext] signUp error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('auth_token', data.token);

      setUser(data.user);
      setSession({
        access_token: data.token,
        token_type: 'bearer',
        user: {
          id: data.user.id,
          email: data.user.email,
        }
      });

      return { error: null };
    } catch (error) {
      console.error('[AuthContext] signIn error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      const updatedProfile = await api.updateUser(user.id, updates);
      setUser(updatedProfile);
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] updateProfile error:', error);
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
