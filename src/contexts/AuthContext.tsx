import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, LoginCredentials, CreateUserDTO } from '../types/auth';
import { authService } from '../services/auth';

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  createUser: (userData: CreateUserDTO) => Promise<User>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component
 * Manages authentication state and provides auth methods
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Set token in auth service
        authService.setToken(storedToken);
        // Verify token is still valid by fetching current user
        authService.getCurrentUser()
          .then((currentUser) => {
            setUser(currentUser);
          })
          .catch(() => {
            // Token invalid, clear storage
            logout();
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        console.error('Error loading auth data:', error);
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Login function
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      authService.setToken(response.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Logout function
   */
  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    authService.setToken(null);
  };

  /**
   * Create user function (admin only)
   */
  const createUser = async (userData: CreateUserDTO): Promise<User> => {
    try {
      const newUser = await authService.createUser(userData);
      return newUser;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  };

  /**
   * Check if user has a specific permission
   * Automatically grants tasks:read if tasks:view-all is enabled
   */
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    
    // If checking for tasks:read, automatically grant it if tasks:view-all is enabled
    if (permission === 'tasks:read') {
      return user.permissions.includes(permission) || user.permissions.includes('tasks:view-all');
    }
    
    return user.permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions (OR logic)
   * Automatically grants tasks:read if tasks:view-all is enabled
   */
  const hasAnyPermission = (...permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    
    // Check if user has tasks:view-all, which grants tasks:read automatically
    const hasViewAll = user.permissions.includes('tasks:view-all');
    
    return permissions.some(permission => {
      // If checking for tasks:read, automatically grant it if tasks:view-all is enabled
      if (permission === 'tasks:read' && hasViewAll) {
        return true;
      }
      return user.permissions!.includes(permission);
    });
  };

  /**
   * Check if user has all of the specified permissions (AND logic)
   * Automatically grants tasks:read if tasks:view-all is enabled
   */
  const hasAllPermissions = (...permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    
    // Check if user has tasks:view-all, which grants tasks:read automatically
    const hasViewAll = user.permissions.includes('tasks:view-all');
    
    return permissions.every(permission => {
      // If checking for tasks:read, automatically grant it if tasks:view-all is enabled
      if (permission === 'tasks:read' && hasViewAll) {
        return true;
      }
      return user.permissions!.includes(permission);
    });
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    createUser,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
