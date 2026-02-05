'use client';

/**
 * AuthContext - Supabase Authentication Provider
 * 
 * Q: Mevcut Supabase ve RLS yapımız, Email/Password login için ek bir
 *    veritabanı değişikliği gerektiriyor mu?
 * 
 * A: HAYIR. Supabase Auth, email/password dahil tüm authentication
 *    yöntemlerini aynı `auth.users` tablosunda yönetir. RLS politikalarımız
 *    `auth.uid()` fonksiyonunu kullanır ki bu fonksiyon kullanıcının
 *    nasıl giriş yaptığından (Google, Email, vb.) bağımsız olarak
 *    authenticated user'ın UUID'sini döndürür.
 * 
 *    Dolayısıyla:
 *    - Mevcut RLS politikaları (user_id = auth.uid()) aynen çalışır
 *    - Trigger'lar (on_auth_user_created) email ile kayıt olanlara da uygulanır
 *    - Ekstra migration veya schema değişikliği gerekmez
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// =============================================================================
// Types
// =============================================================================

interface AuthResult {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/` 
            : undefined,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }, []);

  // Sign in with Email/Password
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // User-friendly error messages
        let message = error.message;
        if (error.message.includes('Invalid login credentials')) {
          message = 'E-posta veya şifre hatalı.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'E-posta adresiniz henüz onaylanmamış. Lütfen gelen kutunuzu kontrol edin.';
        }
        return { success: false, error: message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error signing in with email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Giriş yapılırken bir hata oluştu.' 
      };
    }
  }, []);

  // Sign up with Email/Password
  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/` 
            : undefined,
        },
      });
      
      if (error) {
        // User-friendly error messages
        let message = error.message;
        if (error.message.includes('already registered')) {
          message = 'Bu e-posta adresi zaten kayıtlı.';
        } else if (error.message.includes('Password')) {
          message = 'Şifre en az 6 karakter olmalıdır.';
        }
        return { success: false, error: message };
      }
      
      // Check if email confirmation is required
      // Supabase returns user without session if email confirmation is pending
      const needsEmailConfirmation = data.user && !data.session ? true : false;
      
      return { 
        success: true, 
        needsEmailConfirmation 
      };
    } catch (error) {
      console.error('Error signing up with email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Kayıt olurken bir hata oluştu.' 
      };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// =============================================================================
// Export
// =============================================================================

export { AuthContext };
