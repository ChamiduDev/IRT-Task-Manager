import axios from 'axios';
import type { User, LoginCredentials, CreateUserDTO, LoginResponse } from '../types/auth';

/**
 * Update user DTO
 */
export interface UpdateUserDTO {
  username?: string;
  email?: string;
  fullName?: string;
  role?: 'admin' | 'user'; // Old system - for backward compatibility
  roleId?: string; // New system - preferred
}

/**
 * Change password DTO
 */
export interface ChangePasswordDTO {
  newPassword: string;
}

/**
 * API Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Create axios instance for auth requests
 */
const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Auth Service
 * Handles all authentication-related API calls
 */
class AuthService {
  private token: string | null = null;

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete authClient.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await authClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        this.setToken(token);
        return { user, token };
      }
      throw new Error('Login failed');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await authClient.get<ApiResponse<User>>('/auth/me');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to get current user');
    } catch (error: any) {
      console.error('Get current user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get current user');
    }
  }

  /**
   * Create user (admin only)
   */
  async createUser(userData: CreateUserDTO): Promise<User> {
    try {
      const response = await authClient.post<ApiResponse<User>>('/users', userData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to create user');
    } catch (error: any) {
      console.error('Create user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await authClient.get<ApiResponse<User[]>>('/users');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to get users');
    } catch (error: any) {
      console.error('Get all users error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get users');
    }
  }

  /**
   * Get total user count
   */
  async getUserCount(): Promise<number> {
    try {
      const response = await authClient.get<ApiResponse<{ count: number }>>('/users/count');
      
      if (response.data.success && response.data.data) {
        return response.data.data.count;
      }
      throw new Error('Failed to get user count');
    } catch (error: any) {
      console.error('Get user count error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user count');
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(id: string, userData: UpdateUserDTO): Promise<User> {
    try {
      const response = await authClient.patch<ApiResponse<User>>(`/users/${id}`, userData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to update user');
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  }

  /**
   * Change user password (admin only)
   */
  async changePassword(id: string, newPassword: string): Promise<void> {
    try {
      const response = await authClient.patch<ApiResponse<void>>(`/users/${id}/password`, {
        newPassword,
      });
      
      if (!response.data.success) {
        throw new Error('Failed to change password');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await authClient.delete<ApiResponse<void>>(`/users/${id}`);
      
      if (!response.data.success) {
        throw new Error('Failed to delete user');
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }
}

export const authService = new AuthService();
