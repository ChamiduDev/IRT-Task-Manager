import axios from 'axios';
import type { Task } from '../types';
import { TaskStatus, TaskPriority } from '../types';

/**
 * API Configuration
 * Base URL for the backend API
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
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
  count?: number;
}

/**
 * Task creation DTO (matches backend)
 */
export interface CreateTaskDTO {
  Title: string;
  Description: string;
  Status: TaskStatus;
  Priority: TaskPriority;
  EstimatedHours: number;
  AssignedTo: string;
  ScheduledStartDate?: string | null;
  ScheduledStartTime?: string | null;
}

/**
 * Task update DTO (matches backend)
 */
export interface UpdateTaskDTO {
  Title?: string;
  Description?: string;
  Status?: TaskStatus;
  Priority?: TaskPriority;
  EstimatedHours?: number;
  AssignedTo?: string;
  ScheduledStartDate?: string | null;
  ScheduledStartTime?: string | null;
}

/**
 * Task query parameters for filtering
 */
export interface TaskQueryParams {
  status?: TaskStatus | 'All';
  priority?: TaskPriority | 'All';
  search?: string;
}

/**
 * Convert API date strings to Date objects
 * Handles both Date objects and ISO strings from the backend
 * Note: ScheduledStartDate is kept as string (YYYY-MM-DD) to avoid timezone issues
 * The backend now returns ScheduledStartDate as a formatted string directly
 */
const parseTaskDates = (task: any): Task => {
  return {
    ...task,
    CreatedAt: task.CreatedAt ? new Date(task.CreatedAt) : new Date(),
    UpdatedAt: task.UpdatedAt ? new Date(task.UpdatedAt) : new Date(),
    CompletedAt: task.CompletedAt ? new Date(task.CompletedAt) : undefined,
    // ScheduledStartDate is returned as string (YYYY-MM-DD) from backend - use as-is
    ScheduledStartDate: task.ScheduledStartDate || undefined,
  };
};

/**
 * Task API Service
 * Handles all API calls related to tasks
 */
export const taskApi = {
  /**
   * Get all tasks with optional filtering
   */
  async getAllTasks(params?: TaskQueryParams): Promise<Task[]> {
    try {
      // Build query string
      const queryParams: Record<string, string> = {};
      
      if (params?.status && params.status !== 'All') {
        queryParams.status = params.status;
      }
      if (params?.priority && params.priority !== 'All') {
        queryParams.priority = params.priority;
      }
      if (params?.search && params.search.trim() !== '') {
        queryParams.search = params.search.trim();
      }

      const response = await apiClient.get<ApiResponse<Task[]>>('/tasks', {
        params: queryParams,
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        // Parse dates for all tasks
        return response.data.data.map(parseTaskDates);
      }
      return [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
      
      if (response.data.success && response.data.data) {
        return parseTaskDates(response.data.data);
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching task:', error);
      throw error;
    }
  },

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    try {
      // Use date string as-is (date inputs always provide YYYY-MM-DD format)
      // No conversion needed to avoid timezone shifts
      const payload: CreateTaskDTO = {
        ...taskData,
        ScheduledStartDate: taskData.ScheduledStartDate && taskData.ScheduledStartDate.trim() !== ''
          ? taskData.ScheduledStartDate
          : null,
        ScheduledStartTime: taskData.ScheduledStartTime || null,
      };

      const response = await apiClient.post<ApiResponse<Task>>('/tasks', payload);

      if (response.data.success && response.data.data) {
        return parseTaskDates(response.data.data);
      }
      throw new Error('Failed to create task');
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, taskData: UpdateTaskDTO): Promise<Task> {
    try {
      // Build payload - use date string as-is (date inputs always provide YYYY-MM-DD format)
      // No conversion needed to avoid timezone shifts
      const payload: UpdateTaskDTO = { ...taskData };
      
      // Handle ScheduledStartDate - use as-is if it's a string, otherwise null
      if ('ScheduledStartDate' in taskData && taskData.ScheduledStartDate !== undefined) {
        if (taskData.ScheduledStartDate === null || taskData.ScheduledStartDate === '') {
          payload.ScheduledStartDate = null;
        } else if (typeof taskData.ScheduledStartDate === 'string') {
          // Use date string as-is (should be in YYYY-MM-DD format)
          payload.ScheduledStartDate = taskData.ScheduledStartDate;
        } else {
          // If it's not a string, set to null (shouldn't happen with date inputs)
          payload.ScheduledStartDate = null;
        }
      }
      
      // Handle ScheduledStartTime - ensure empty strings become null
      if ('ScheduledStartTime' in taskData && taskData.ScheduledStartTime !== undefined) {
        payload.ScheduledStartTime = taskData.ScheduledStartTime === '' ? null : taskData.ScheduledStartTime;
      }

      console.log('API: Updating task:', id, 'with payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, payload);
      
      console.log('API: Response received:', response.status, response.data);

      if (response.data.success && response.data.data) {
        const parsedTask = parseTaskDates(response.data.data);
        console.log('API: Task updated successfully:', parsedTask);
        return parsedTask;
      }
      console.error('API: Update failed - invalid response:', response.data);
      throw new Error('Failed to update task');
    } catch (error: any) {
      console.error('API: Error updating task:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Delete a task by ID
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
};

export default apiClient;
