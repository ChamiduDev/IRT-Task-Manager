import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Users, Shield, ChevronLeft, ChevronRight, X, CheckCircle2, PauseCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSideMenu } from '../contexts/SideMenuContext';

/**
 * SideMenu Component
 * Responsive side menu with icons (default) and expandable to show names
 * Works on both desktop and mobile
 */
export const SideMenu = () => {
  const sideMenuContext = useSideMenu();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  // Safely get context values
  if (!sideMenuContext) {
    return null; // Don't render if context is not available
  }

  const { isExpanded, isMobileOpen, toggleExpanded, closeMobile } = sideMenuContext;

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  // Build menu items based on permissions
  const menuItems = useMemo(() => {
    const items = [];

    // Dashboard - requires dashboard:view permission
    if (hasPermission('dashboard:view')) {
      items.push({
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
      });
    }

    // All Tasks - requires tasks:read permission
    if (hasPermission('tasks:read')) {
      items.push({
        id: 'all-tasks',
        label: 'All Tasks',
        icon: ListTodo,
        path: '/all-tasks',
      });
    }

    // Completed Tasks - requires tasks:read permission
    if (hasPermission('tasks:read')) {
      items.push({
        id: 'completed',
        label: 'Completed Tasks',
        icon: CheckCircle2,
        path: '/completed',
      });
    }

    // Hold Tasks - requires tasks:read permission
    if (hasPermission('tasks:read')) {
      items.push({
        id: 'hold',
        label: 'Hold Tasks',
        icon: PauseCircle,
        path: '/hold',
      });
    }

    // User Management - requires users:read permission
    if (hasPermission('users:read')) {
      items.push({
        id: 'users',
        label: 'User Management',
        icon: Users,
        path: '/users',
      });
    }

    // Role Management - requires roles:read permission
    if (hasPermission('roles:read')) {
      items.push({
        id: 'roles',
        label: 'Role Management',
        icon: Shield,
        path: '/roles',
      });
    }

    return items;
  }, [hasPermission]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMobile();
          }}
          onMouseDown={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}

      {/* Side Menu */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 ${
          // Width: mobile always w-64 when open, desktop based on expanded state
          isMobileOpen ? 'w-64' : isExpanded ? 'w-64' : 'w-16'
        } ${
          // Position: mobile hidden unless open, desktop always visible
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full sm:translate-x-0'
        }`}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Mobile Close Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeMobile();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors sm:hidden"
            aria-label="Close menu"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleExpanded();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors hidden sm:block ml-auto"
            aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
            type="button"
          >
            {isExpanded ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

      {/* Menu Items */}
      <nav className="p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(item.path);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 mb-1 ${
                active
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={!isExpanded && !isMobileOpen ? item.label : undefined}
              type="button"
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(isExpanded || isMobileOpen) && (
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
    </>
  );
};
