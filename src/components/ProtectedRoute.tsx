import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredAnyPermission?: string[];
  fallbackPath?: string;
}

/**
 * Protected Route Component
 * Guards routes based on authentication and permissions
 */
export const ProtectedRoute = ({
  children,
  requiredPermission,
  requiredAnyPermission,
  fallbackPath = '/',
}: ProtectedRouteProps) => {
  const { isAuthenticated, loading, hasPermission, hasAnyPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check any of the permissions
  if (requiredAnyPermission && requiredAnyPermission.length > 0 && !hasAnyPermission(...requiredAnyPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
