import { Routes, Route, Navigate } from 'react-router-dom';
import { SideMenu } from './components/SideMenu';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { AllTasks } from './pages/AllTasks';
import { UserManagement } from './pages/UserManagement';
import { RoleManagement } from './pages/RoleManagement';
import { CompletedTasks } from './pages/CompletedTasks';
import { HoldTasks } from './pages/HoldTasks';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { SideMenuProvider, useSideMenu } from './contexts/SideMenuContext';
import { Loader2 } from 'lucide-react';

/**
 * Main App Component
 * TaskMaster Pro - High-quality Task Management Dashboard with Dark Mode
 * Now integrated with backend API, authentication, and routing
 */
function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Main app layout with side menu and routes
  return (
    <SideMenuProvider>
      <AppContent />
    </SideMenuProvider>
  );
}

/**
 * App Content Component
 * Contains the side menu and routes with responsive layout
 */
function AppContent() {
  const sideMenuContext = useSideMenu();
  const isExpanded = sideMenuContext?.isExpanded ?? false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <SideMenu />
      <div
        className={`transition-all duration-300 ${
          isExpanded ? 'sm:ml-64' : 'sm:ml-16'
        }`}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredPermission="dashboard:view">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-tasks"
            element={
              <ProtectedRoute requiredPermission="tasks:read">
                <AllTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredPermission="users:read">
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute requiredPermission="roles:read">
                <RoleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/completed"
            element={
              <ProtectedRoute requiredPermission="tasks:read">
                <CompletedTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hold"
            element={
              <ProtectedRoute requiredPermission="tasks:read">
                <HoldTasks />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
