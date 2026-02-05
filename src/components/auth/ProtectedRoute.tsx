'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Client-side route protection wrapper
 * 
 * ⚠️ RED LINE: We use client-side protection because GitHub Pages
 * requires `output: export` which doesn't support Next.js Middleware.
 * 
 * This component:
 * 1. Checks authentication state
 * 2. Redirects to /login if not authenticated
 * 3. Shows loading state while checking
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    // If no user and not on login page, redirect to login
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-marble-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marble-800 mx-auto mb-4"></div>
          <p className="text-marble-600">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on login page, show nothing (will redirect)
  if (!user && pathname !== '/login') {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
