import axios from 'axios';
import type { Role, CreateRoleDTO, UpdateRoleDTO } from '../types/role';

/**
 * API Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Create axios instance for role requests
 */
const roleClient = axios.create({
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
 * Set up axios interceptor to include JWT token
 */
roleClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Add response interceptor to handle auth errors
 */
roleClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Redirect to login (handled by App component)
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/**
 * Role Service
 * Handles all role-related API calls
 */
class RoleService {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await roleClient.get<ApiResponse<Role[]>>('/roles');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to get roles');
    } catch (error: any) {
      console.error('Get all roles error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get roles');
    }
  }

  /**
   * Get a single role by ID
   */
  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await roleClient.get<ApiResponse<Role>>(`/roles/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to get role');
    } catch (error: any) {
      console.error('Get role error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get role');
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData: CreateRoleDTO): Promise<Role> {
    try {
      const response = await roleClient.post<ApiResponse<Role>>('/roles', roleData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to create role');
    } catch (error: any) {
      console.error('Create role error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create role');
    }
  }

  /**
   * Update a role
   */
  async updateRole(id: string, roleData: UpdateRoleDTO): Promise<Role> {
    try {
      const response = await roleClient.patch<ApiResponse<Role>>(`/roles/${id}`, roleData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to update role');
    } catch (error: any) {
      console.error('Update role error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update role');
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      const response = await roleClient.delete<ApiResponse<void>>(`/roles/${id}`);
      
      if (!response.data.success) {
        throw new Error('Failed to delete role');
      }
    } catch (error: any) {
      console.error('Delete role error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete role');
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<string[]> {
    try {
      const response = await roleClient.get<ApiResponse<string[]>>('/roles/permissions');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to get permissions');
    } catch (error: any) {
      console.error('Get permissions error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get permissions');
    }
  }
}

export const roleService = new RoleService();
