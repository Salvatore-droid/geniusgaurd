// src/components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { Route } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export default function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Route {...rest}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Route>
    );
  }

  return (
    <Route {...rest}>
      {user ? <Component /> : <RedirectToSignIn />}
    </Route>
  );
}

function RedirectToSignIn() {
  useEffect(() => {
    window.location.href = '/signin';
  }, []);
  return null;
}