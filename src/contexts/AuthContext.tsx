import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'master' | 'user' | 'partner' | 'master_partner' | 'cs_geral' | 'cs_exclusiva' | 'clinic_owner' | 'attendant' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMaster: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  createUser: (email: string, password: string) => Promise<{ error: string | null }>;
  deleteUser: (userId: string) => Promise<{ error: string | null }>;
  getAllUsers: () => Promise<{ users: any[]; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (data && !error) {
      setRole(data.role as AppRole);
    } else {
      setRole('user');
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const createUser = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (role !== 'master') {
      return { error: 'Apenas usuários master podem criar novos usuários' };
    }

    // Use the edge function to create user with admin privileges
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email, password }
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.error) {
      return { error: data.error };
    }

    return { error: null };
  };

  const deleteUser = async (userId: string): Promise<{ error: string | null }> => {
    if (role !== 'master') {
      return { error: 'Apenas usuários master podem excluir usuários' };
    }

    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.error) {
      return { error: data.error };
    }

    return { error: null };
  };

  const getAllUsers = async (): Promise<{ users: any[]; error: string | null }> => {
    if (role !== 'master') {
      return { users: [], error: 'Apenas usuários master podem ver todos os usuários' };
    }

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      return { users: [], error: profilesError.message };
    }

    // Fetch roles for all users
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      return { users: [], error: rolesError.message };
    }

    // Combine profiles with their roles
    const usersWithRoles = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.user_id);
      return {
        ...profile,
        user_roles: userRole ? [{ role: userRole.role }] : null
      };
    });

    return { users: usersWithRoles, error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAuthenticated: !!user,
        isLoading,
        isMaster: role === 'master',
        login,
        logout,
        createUser,
        deleteUser,
        getAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
