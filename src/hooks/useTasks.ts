import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task } from '../types';
import { taskApi, type TaskQueryParams } from '../services/api';
import { socketService } from '../services/socket';

/**
 * Custom hook for managing tasks with API integration
 * Handles loading states, errors, and CRUD operations
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskQueryParams>({});
  const filtersRef = useRef<TaskQueryParams>({});
  
  // Keep filters ref in sync
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * Fetch tasks from the API
   */
  const fetchTasks = useCallback(async (queryParams?: TaskQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await taskApi.getAllTasks(queryParams || filters);
      setTasks(fetchedTasks);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Create a new task
   */
  const createTask = useCallback(async (taskData: Parameters<typeof taskApi.createTask>[0]) => {
    try {
      setError(null);
      const newTask = await taskApi.createTask(taskData);
      // Refresh tasks list
      await fetchTasks(filters);
      return newTask;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create task';
      setError(errorMessage);
      throw err;
    }
  }, [fetchTasks, filters]);

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (id: string, taskData: Parameters<typeof taskApi.updateTask>[1]) => {
    try {
      setError(null);
      console.log('useTasks: Updating task', id, 'with data:', taskData);
      const updatedTask = await taskApi.updateTask(id, taskData);
      console.log('useTasks: Task updated successfully:', updatedTask);
      // Update local state optimistically
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err: any) {
      console.error('useTasks: Error updating task:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update task';
      setError(errorMessage);
      // Refresh tasks on error to get correct state
      await fetchTasks(filters);
      throw err;
    }
  }, [fetchTasks, filters]);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (id: string) => {
    try {
      setError(null);
      await taskApi.deleteTask(id);
      // Remove from local state optimistically
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete task';
      setError(errorMessage);
      // Refresh tasks on error to get correct state
      await fetchTasks(filters);
      throw err;
    }
  }, [fetchTasks, filters]);

  /**
   * Update filters and refetch
   */
  const updateFilters = useCallback((newFilters: TaskQueryParams) => {
    setFilters(newFilters);
  }, []);

  /**
   * Refresh tasks (useful for polling or manual refresh)
   */
  const refreshTasks = useCallback(() => {
    return fetchTasks(filters);
  }, [fetchTasks, filters]);

  // Fetch tasks on mount and when filters change
  useEffect(() => {
    fetchTasks(filters);
  }, [fetchTasks]);

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    const socket = socketService.connect();

    // Listen for task created event
    const handleTaskCreated = (newTask: Task) => {
      console.log('📥 Received task:created event', newTask);
      // Parse dates (ScheduledStartDate is now always a string from backend)
      const task: Task = {
        ...newTask,
        CreatedAt: newTask.CreatedAt ? new Date(newTask.CreatedAt) : new Date(),
        UpdatedAt: newTask.UpdatedAt ? new Date(newTask.UpdatedAt) : new Date(),
        CompletedAt: newTask.CompletedAt ? new Date(newTask.CompletedAt) : undefined,
        // ScheduledStartDate is returned as string (YYYY-MM-DD) from backend - use as-is
        ScheduledStartDate: newTask.ScheduledStartDate || undefined,
      };

      // Check if task matches current filters
      const matchesFilters = (task: Task): boolean => {
        const currentFilters = filtersRef.current;
        
        if (currentFilters.status && currentFilters.status !== 'All' && task.Status !== currentFilters.status) {
          return false;
        }
        if (currentFilters.priority && currentFilters.priority !== 'All' && task.Priority !== currentFilters.priority) {
          return false;
        }
        if (currentFilters.search && currentFilters.search.trim() !== '') {
          const searchLower = currentFilters.search.toLowerCase();
          const titleMatch = task.Title.toLowerCase().includes(searchLower);
          const assignedToMatch = task.AssignedTo.toLowerCase().includes(searchLower);
          if (!titleMatch && !assignedToMatch) {
            return false;
          }
        }
        return true;
      };

      // Only add if it matches current filters
      if (matchesFilters(task)) {
        setTasks((prevTasks) => {
          // Check if task already exists (avoid duplicates)
          if (prevTasks.some((t) => t.id === task.id)) {
            return prevTasks;
          }
          return [...prevTasks, task];
        });
      }
    };

    // Listen for task updated event
    const handleTaskUpdated = (updatedTask: Task) => {
      console.log('📥 Received task:updated event', updatedTask);
      // Parse dates (ScheduledStartDate is now always a string from backend)
      const task: Task = {
        ...updatedTask,
        CreatedAt: updatedTask.CreatedAt ? new Date(updatedTask.CreatedAt) : new Date(),
        UpdatedAt: updatedTask.UpdatedAt ? new Date(updatedTask.UpdatedAt) : new Date(),
        CompletedAt: updatedTask.CompletedAt ? new Date(updatedTask.CompletedAt) : undefined,
        // ScheduledStartDate is returned as string (YYYY-MM-DD) from backend - use as-is
        ScheduledStartDate: updatedTask.ScheduledStartDate || undefined,
      };

      setTasks((prevTasks) => {
        const taskIndex = prevTasks.findIndex((t) => t.id === task.id);
        
        // Check if task matches current filters
        const matchesFilters = (task: Task): boolean => {
          const currentFilters = filtersRef.current;
          
          if (currentFilters.status && currentFilters.status !== 'All' && task.Status !== currentFilters.status) {
            return false;
          }
          if (currentFilters.priority && currentFilters.priority !== 'All' && task.Priority !== currentFilters.priority) {
            return false;
          }
          if (currentFilters.search && currentFilters.search.trim() !== '') {
            const searchLower = currentFilters.search.toLowerCase();
            if (!task.Title.toLowerCase().includes(searchLower)) {
              return false;
            }
          }
          return true;
        };

        if (taskIndex >= 0) {
          // Task exists - update it if it still matches filters, otherwise remove it
          if (matchesFilters(task)) {
            const updated = [...prevTasks];
            updated[taskIndex] = task;
            return updated;
          } else {
            // Task no longer matches filters, remove it
            return prevTasks.filter((t) => t.id !== task.id);
          }
        } else {
          // Task doesn't exist - add it if it matches filters
          if (matchesFilters(task)) {
            return [...prevTasks, task];
          }
          return prevTasks;
        }
      });
    };

    // Listen for task deleted event
    const handleTaskDeleted = (data: { id: string }) => {
      console.log('📥 Received task:deleted event', data.id);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== data.id));
    };

    // Listen for tasks refreshed event (for auto-start or bulk updates)
    const handleTasksRefreshed = () => {
      console.log('📥 Received tasks:refreshed event - refreshing task list');
      fetchTasks(filtersRef.current);
    };

    // Register event listeners
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('tasks:refreshed', handleTasksRefreshed);

    // Cleanup on unmount
    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('tasks:refreshed', handleTasksRefreshed);
    };
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    filters,
    createTask,
    updateTask,
    deleteTask,
    updateFilters,
    refreshTasks,
  };
};
