import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { useAuth } from './AuthContext';
import type { User } from '../types/auth';

/**
 * Users context interface
 */
interface UsersContextType {
  users: User[];
  loading: boolean;
  getUserById: (id: string) => User | undefined;
  getUserName: (id: string) => string;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

/**
 * UsersProvider component
 * Manages user data and provides user lookup methods
 */
export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const { hasPermission, isAuthenticated, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch all users (only if user has permission)
   */
  const fetchUsers = async () => {
    // Only fetch if user has users:read permission
    if (!isAuthenticated || !hasPermission('users:read')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers);
    } catch (error: any) {
      // Silently handle permission errors - user just won't see names
      if (error.response?.status === 403 || error.response?.status === 401) {
        // User doesn't have permission, that's okay - they'll just see user IDs
        console.log('User does not have permission to view all users. User names will not be displayed.');
      } else {
        console.error('Error fetching users:', error);
      }
      // Continue with empty array - user names will show as "Unknown User"
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh users list
   */
  const refreshUsers = async () => {
    await fetchUsers();
  };

  // Fetch users on mount and when authentication changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /**
   * Get user by ID
   */
  const getUserById = (id: string): User | undefined => {
    return users.find((user) => user.id === id);
  };

  /**
   * Get user display name by ID
   * If the ID matches the current user, return their name even without users:read permission
   */
  const getUserName = (id: string): string => {
    // First check if it's the current user (available even without users:read permission)
    if (currentUser && currentUser.id === id) {
      return currentUser.fullName || currentUser.username;
    }
    
    // Otherwise, try to find in the users list
    const user = getUserById(id);
    if (user) {
      return user.fullName || user.username;
    }
    
    return 'Unknown User';
  };

  const value: UsersContextType = {
    users,
    loading,
    getUserById,
    getUserName,
    refreshUsers,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

/**
 * Hook to use users context
 */
export const useUsers = (): UsersContextType => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
