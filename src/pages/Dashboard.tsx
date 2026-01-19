import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { ViewTaskModal } from '../components/ViewTaskModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { ResumeTaskModal } from '../components/ResumeTaskModal';
import { Header } from '../components/Header';
import { UserFilterDropdown } from '../components/UserFilterDropdown';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { authService } from '../services/auth';
import { Clock, AlertCircle, ListTodo, Search, X, Loader2, AlertCircle as AlertCircleIcon, CheckCircle2, PauseCircle, Grid3x3, Table, Edit, Eye, Users, Target, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../services/api';

/**
 * Dashboard Page Component
 * Main task management interface
 */
export const Dashboard = () => {
  const navigate = useNavigate();
  
  // Use the tasks hook for API integration
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateFilters,
  } = useTasks();

  // Check if user has permission to view all tasks (enables search)
  const { hasPermission, user } = useAuth();
  const { users, getUserName } = useUsers();
  const canViewAllTasks = hasPermission('tasks:view-all');

  // State for completed tasks count
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);
  const [loadingCompletedCount, setLoadingCompletedCount] = useState(false);
  
  // State for active users count
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [loadingUsersCount, setLoadingUsersCount] = useState(false);
  
  // State for completed tasks (for accuracy and duration calculations)
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loadingCompletedTasks, setLoadingCompletedTasks] = useState(false);

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [resumingTask, setResumingTask] = useState<Task | null>(null);

  // State for filters (local UI state, synced with API via useEffect)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [titleSearchQuery, setTitleSearchQuery] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Load view mode from localStorage, default to 'card'
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const savedViewMode = localStorage.getItem('dashboardViewMode');
    return (savedViewMode === 'card' || savedViewMode === 'table') ? savedViewMode : 'card';
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | 'All'>(() => {
    const saved = localStorage.getItem('dashboardRowsPerPage');
    if (saved === 'All') return 'All';
    const num = parseInt(saved || '10', 10);
    return isNaN(num) ? 10 : num;
  });

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardViewMode', viewMode);
  }, [viewMode]);

  // Save rows per page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardRowsPerPage', String(rowsPerPage));
  }, [rowsPerPage]);

  // Clear search queries if user loses permission to view all tasks
  useEffect(() => {
    if (!canViewAllTasks) {
      if (titleSearchQuery.trim() !== '') {
        setTitleSearchQuery('');
      }
      if (selectedUserId !== null) {
        setSelectedUserId(null);
      }
    }
  }, [canViewAllTasks, titleSearchQuery, selectedUserId]);

  // Update API filters when local filter state changes
  useEffect(() => {
    updateFilters({
      status: statusFilter !== 'All' ? statusFilter : undefined,
      priority: priorityFilter !== 'All' ? priorityFilter : undefined,
      // Only send search query if user has permission to view all tasks
      search: canViewAllTasks && titleSearchQuery.trim() ? titleSearchQuery.trim() : undefined,
      userId: canViewAllTasks && selectedUserId ? selectedUserId : undefined,
    });
  }, [statusFilter, priorityFilter, titleSearchQuery, selectedUserId, canViewAllTasks, updateFilters]);

  // Fetch completed tasks count
  const fetchCompletedCount = useCallback(async () => {
    try {
      setLoadingCompletedCount(true);
      const response = await taskApi.getCompletedTasks();
      setCompletedTasksCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching completed tasks count:', error);
      // Don't show error to user, just set count to 0
      setCompletedTasksCount(0);
    } finally {
      setLoadingCompletedCount(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedCount();
  }, [fetchCompletedCount]); // Fetch on mount

  // Fetch active users count
  const fetchUsersCount = useCallback(async () => {
    if (!hasPermission('dashboard:view-users')) {
      return; // Don't fetch if user doesn't have permission
    }
    
    try {
      setLoadingUsersCount(true);
      const count = await authService.getUserCount();
      setActiveUsersCount(count);
    } catch (error) {
      console.error('Error fetching users count:', error);
    } finally {
      setLoadingUsersCount(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    fetchUsersCount();
  }, [fetchUsersCount]);

  // Fetch completed tasks for accuracy and duration calculations
  const fetchCompletedTasks = useCallback(async () => {
    const needsAccuracy = hasPermission('dashboard:view-accuracy');
    const needsDuration = hasPermission('dashboard:view-duration');
    
    if (!needsAccuracy && !needsDuration) {
      return; // Don't fetch if user doesn't need either
    }
    
    try {
      setLoadingCompletedTasks(true);
      const response = await taskApi.getCompletedTasks();
      setCompletedTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      setCompletedTasks([]);
    } finally {
      setLoadingCompletedTasks(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    fetchCompletedTasks();
  }, [fetchCompletedTasks]);

  // Refresh completed tasks when tasks change
  useEffect(() => {
    if (hasPermission('dashboard:view-accuracy') || hasPermission('dashboard:view-duration')) {
      fetchCompletedTasks();
    }
  }, [tasks.length, hasPermission, fetchCompletedTasks]);

  /**
   * Calculate duration between StartedAt and CompletedAt in hours
   * Returns the time difference in hours, or null if either timestamp is missing
   */
  const calculateDuration = useCallback((startedAt: Date | string | null | undefined, completedAt: Date | string | null | undefined): number | null => {
    if (!startedAt || !completedAt) {
      return null;
    }
    const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
    const end = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) {
      return null;
    }
    return diffMs / (1000 * 60 * 60);
  }, []);

  /**
   * Format duration for display
   */
  const formatDuration = useCallback((hours: number | null): string => {
    if (hours === null) return 'N/A';
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.round((hours % 24 - remainingHours) * 60);
    if (remainingHours === 0 && minutes === 0) {
      return `${days}d`;
    }
    if (minutes === 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${days}d ${remainingHours}h ${minutes}m`;
  }, []);

  /**
   * Calculate accuracy percentage for a task
   * Returns accuracy as a percentage, where 100% means perfect match
   * If completed in less time than estimated, accuracy exceeds 100% (better than expected)
   * If completed in more time than estimated, accuracy is less than 100%
   * Formula:
   *   - If actual <= estimated: 100 + (estimated - actual) / estimated * 100
   *   - If actual > estimated: (1 - (actual - estimated) / estimated) * 100
   */
  const calculateAccuracy = useCallback((actualHours: number | null, estimatedHours: number | null): number | null => {
    if (actualHours === null || estimatedHours === null || estimatedHours === 0) {
      return null;
    }
    
    let accuracy: number;
    if (actualHours <= estimatedHours) {
      // Completed in less or equal time - this is better, so accuracy can exceed 100%
      const timeSaved = estimatedHours - actualHours;
      accuracy = 100 + (timeSaved / estimatedHours) * 100;
    } else {
      // Completed in more time - accuracy decreases below 100%
      const timeOver = actualHours - estimatedHours;
      accuracy = Math.max(0, (1 - timeOver / estimatedHours) * 100);
    }
    
    return Math.round(accuracy * 100) / 100;
  }, []);

  // Calculate overall accuracy from completed tasks
  const overallAccuracy = useMemo(() => {
    if (!hasPermission('dashboard:view-accuracy')) {
      return null;
    }
    const allAccuracies = completedTasks
      .map((task) => {
        const actualDuration = calculateDuration(task.StartedAt, task.CompletedAt);
        return calculateAccuracy(actualDuration, task.EstimatedHours || null);
      })
      .filter((acc): acc is number => acc !== null);
    
    if (allAccuracies.length === 0) return null;
    const avg = allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length;
    return Math.round(avg * 100) / 100;
  }, [completedTasks, hasPermission, calculateDuration, calculateAccuracy]);

  // Calculate total duration from completed tasks
  const totalDuration = useMemo(() => {
    if (!hasPermission('dashboard:view-duration')) {
      return 0;
    }
    return completedTasks.reduce((total, task) => {
      const duration = calculateDuration(task.StartedAt, task.CompletedAt);
      return total + (duration || 0);
    }, 0);
  }, [completedTasks, hasPermission, calculateDuration]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    // Filter out only completed tasks for active task statistics
    // Hold tasks are now included in dashboard display
    const activeTasks = tasks.filter((task) => task.Status !== TaskStatus.Completed);
    // Total includes active (pending, in progress, hold) and completed tasks
    const totalTasks = activeTasks.length + completedTasksCount;
    return {
      total: totalTasks, // Total includes all tasks
      pending: activeTasks.filter((task) => task.Status === TaskStatus.Pending).length,
      inProgress: activeTasks.filter((task) => task.Status === TaskStatus.InProgress).length,
      hold: activeTasks.filter((task) => task.Status === TaskStatus.Hold).length, // Count hold tasks from active tasks
      completed: completedTasksCount, // Use fetched count from completed tasks endpoint
    };
  }, [tasks, completedTasksCount]);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Explicitly exclude completed tasks from dashboard (they're on the Completed Tasks page)
      if (task.Status === TaskStatus.Completed) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'All' && task.Status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'All' && task.Priority !== priorityFilter) {
        return false;
      }

      // Title search filter
      if (titleSearchQuery.trim() && canViewAllTasks) {
        const query = titleSearchQuery.toLowerCase();
        if (!task.Title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // User filter
      if (selectedUserId && canViewAllTasks) {
        const isAssigned = Array.isArray(task.AssignedTo)
          ? task.AssignedTo.includes(selectedUserId)
          : task.AssignedTo === selectedUserId;
        if (!isAssigned) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, priorityFilter, titleSearchQuery, selectedUserId, canViewAllTasks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, titleSearchQuery, selectedUserId, filteredTasks.length]);

  // Calculate pagination
  const totalTasks = filteredTasks.length;
  const totalPages = rowsPerPage === 'All' ? 1 : Math.ceil(totalTasks / rowsPerPage);
  const startIndex = rowsPerPage === 'All' ? 0 : (currentPage - 1) * rowsPerPage;
  const endIndex = rowsPerPage === 'All' ? totalTasks : startIndex + rowsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleRowsPerPageChange = (value: string) => {
    if (value === 'All') {
      setRowsPerPage('All');
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        setRowsPerPage(num);
      }
    }
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Handle add task
  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'CreatedAt' | 'UpdatedAt'>) => {
    try {
      await createTask({
        Title: taskData.Title,
        Description: taskData.Description,
        Status: taskData.Status,
        Priority: taskData.Priority,
        EstimatedHours: taskData.EstimatedHours,
        AssignedTo: taskData.AssignedTo,
        // Use date string as-is (date inputs always provide YYYY-MM-DD format)
        ScheduledStartDate: taskData.ScheduledStartDate && typeof taskData.ScheduledStartDate === 'string' && taskData.ScheduledStartDate.trim() !== ''
          ? taskData.ScheduledStartDate
          : null,
        ScheduledStartTime: taskData.ScheduledStartTime || null,
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [createTask]);

  // Handle status change
  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus, scheduledDate?: string, scheduledTime?: string) => {
    try {
      const updateData: any = { Status: newStatus };
      if (scheduledDate !== undefined) {
        updateData.ScheduledStartDate = scheduledDate || null;
      }
      if (scheduledTime !== undefined) {
        updateData.ScheduledStartTime = scheduledTime || null;
      }
      await updateTask(taskId, updateData);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  }, [updateTask]);

  // Handle delete task click - show confirmation modal
  const handleDeleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTaskToDelete({ id: taskId, title: task.Title });
      setIsDeleteModalOpen(true);
    }
  }, [tasks]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete.id);
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  }, [deleteTask, taskToDelete]);

  // Handle view task click
  const handleViewTask = useCallback((task: Task) => {
    setViewingTask(task);
    setIsViewModalOpen(true);
  }, []);

  // Handle edit task click
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  }, []);

  // Handle task update
  const handleUpdateTask = useCallback(async (taskId: string, taskData: Partial<Task>) => {
    console.log('handleUpdateTask: Called with taskId:', taskId, 'taskData:', taskData);
    
    // Build update data - include all fields from taskData
      const updateData: any = {
        Title: taskData.Title,
        Description: taskData.Description,
        Status: taskData.Status,
        Priority: taskData.Priority,
        // Ensure EstimatedHours is a number
        EstimatedHours: typeof taskData.EstimatedHours === 'number' 
          ? taskData.EstimatedHours 
          : parseFloat(String(taskData.EstimatedHours)) || 0,
        AssignedTo: taskData.AssignedTo,
        // Use date string as-is (date inputs always provide YYYY-MM-DD format)
        ScheduledStartDate: taskData.ScheduledStartDate === '' || taskData.ScheduledStartDate === null || taskData.ScheduledStartDate === undefined
          ? null
          : typeof taskData.ScheduledStartDate === 'string'
          ? taskData.ScheduledStartDate
          : taskData.ScheduledStartDate,
        // Format ScheduledStartTime to HH:MM (remove seconds if present)
        ScheduledStartTime: taskData.ScheduledStartTime === '' || taskData.ScheduledStartTime === null || taskData.ScheduledStartTime === undefined
          ? null
          : taskData.ScheduledStartTime.length > 5
          ? taskData.ScheduledStartTime.substring(0, 5) // Remove seconds (HH:MM:SS -> HH:MM)
          : taskData.ScheduledStartTime,
      };

      console.log('handleUpdateTask: Sending update for task', taskId, 'with data:', updateData);
      
      try {
        const result = await updateTask(taskId, updateData);
        console.log('handleUpdateTask: Update successful, result:', result);
        
          // If task status changed to/from Completed, refresh counts
          const previousTask = tasks.find(t => t.id === taskId);
          if (updateData.Status === TaskStatus.Completed || previousTask?.Status === TaskStatus.Completed) {
            fetchCompletedCount();
          }
        
        // Close modal only on success
        setIsEditModalOpen(false);
        setEditingTask(null);
        return result;
      } catch (err: any) {
        // Error is handled by the useTasks hook, but also show it here
        console.error('handleUpdateTask: Failed to update task:', err);
        // Re-throw so EditTaskModal can handle it
        throw err;
      }
  }, [updateTask, tasks, fetchCompletedCount]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header onAddTaskClick={() => setIsModalOpen(true)} />
      <div className="p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{taskStats.total}</p>
            </div>
            <ListTodo className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{taskStats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{taskStats.inProgress}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

            {/* Completed Tasks Summary Card - Clickable to navigate to Completed Tasks page */}
            <button
              onClick={() => navigate('/completed')}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer text-left"
              type="button"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loadingCompletedCount ? '...' : `${taskStats.completed} / ${taskStats.total}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View all →</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </button>

            {/* Hold Tasks Summary Card - Clickable to navigate to Hold Tasks page */}
            <button
              onClick={() => navigate('/hold')}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer text-left"
              type="button"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Hold</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {taskStats.hold}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View all →</p>
                </div>
                <PauseCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </button>

            {/* Active Users Summary Card - Only visible if user has permission */}
            {hasPermission('dashboard:view-users') && (
              <button
                onClick={() => navigate('/users')}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer text-left"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {loadingUsersCount ? '...' : activeUsersCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View all →</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </button>
            )}

            {/* Overall Accuracy Summary Card - Only visible if user has permission */}
            {hasPermission('dashboard:view-accuracy') && (
              <button
                onClick={() => navigate('/completed')}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer text-left"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {loadingCompletedTasks 
                        ? '...' 
                        : overallAccuracy !== null 
                          ? `${overallAccuracy}%`
                          : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View details →</p>
                  </div>
                  <Target className={`w-8 h-8 ${
                    overallAccuracy !== null && overallAccuracy >= 90
                      ? 'text-green-600 dark:text-green-400'
                      : overallAccuracy !== null && overallAccuracy >= 70
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : overallAccuracy !== null
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </div>
              </button>
            )}

            {/* Total Duration Summary Card - Only visible if user has permission */}
            {hasPermission('dashboard:view-duration') && (
              <button
                onClick={() => navigate('/completed')}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer text-left"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Duration</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {loadingCompletedTasks ? '...' : formatDuration(totalDuration)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View details →</p>
                  </div>
                  <Timer className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </button>
            )}
          </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">View:</span>
            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'card'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                type="button"
                title="Card View"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                type="button"
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'All')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="All">All</option>
              <option value={TaskStatus.Pending}>Pending</option>
              <option value={TaskStatus.InProgress}>In Progress</option>
              <option value={TaskStatus.Hold}>Hold</option>
              {/* Completed tasks are only shown on the Completed Tasks page */}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'All')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="All">All</option>
              <option value={TaskPriority.Low}>Low</option>
              <option value={TaskPriority.Medium}>Medium</option>
              <option value={TaskPriority.High}>High</option>
              <option value={TaskPriority.Critical}>Critical</option>
            </select>
          </div>

          {/* Search Filter - Only show if user has permission to view all tasks */}
          {canViewAllTasks && (
            <>
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="title-search-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search by Title
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="title-search-filter"
                    type="text"
                    value={titleSearchQuery}
                    onChange={(e) => setTitleSearchQuery(e.target.value)}
                    placeholder="Search by title..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {titleSearchQuery && (
                    <button
                      onClick={() => setTitleSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by User
                </label>
                <UserFilterDropdown
                  users={users}
                  selectedUserId={selectedUserId}
                  onUserChange={setSelectedUserId}
                  placeholder="Select user..."
                />
              </div>
            </>
          )}

          {/* Clear Filters Button - Only show if filters are active */}
          {(statusFilter !== 'All' || priorityFilter !== 'All' || titleSearchQuery.trim() !== '' || selectedUserId !== null) && (
            <div className="w-full flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setPriorityFilter('All');
                  setTitleSearchQuery('');
                  setSelectedUserId(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-gray-300 dark:border-slate-600"
                type="button"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Task Grid or Table */}
      {!loading && filteredTasks.length > 0 && (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estimated Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Scheduled
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {paginatedTasks.map((task) => {
                      // Check if task is overdue
                      const isOverdue = () => {
                        // Completed tasks are never overdue
                        if (task.Status === TaskStatus.Completed) {
                          return false;
                        }
                        // Need scheduled date, time, and estimated hours to calculate deadline
                        if (!task.ScheduledStartDate || !task.ScheduledStartTime || !task.EstimatedHours) {
                          return false;
                        }
                        // Parse scheduled date (handle both string and Date formats)
                        const dateStr = typeof task.ScheduledStartDate === 'string' 
                          ? task.ScheduledStartDate 
                          : task.ScheduledStartDate.toISOString().split('T')[0];
                        const [year, month, day] = dateStr.split('-').map(Number);
                        const scheduledDate = new Date(year, month - 1, day);
                        const [scheduledHours, scheduledMinutes] = task.ScheduledStartTime.split(':');
                        scheduledDate.setHours(parseInt(scheduledHours, 10), parseInt(scheduledMinutes, 10), 0, 0);
                        // Calculate deadline: scheduled start + estimated hours
                        const deadline = new Date(scheduledDate.getTime() + task.EstimatedHours * 60 * 60 * 1000);
                        const now = new Date();
                        // Task is overdue if current time is past the deadline
                        return now.getTime() > deadline.getTime();
                      };

                      const getStatusBadgeClass = (status: TaskStatus) => {
                        switch (status) {
                          case TaskStatus.Pending:
                            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
                          case TaskStatus.InProgress:
                            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                          case TaskStatus.Hold:
                            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
                          default:
                            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
                        }
                      };

                      const getPriorityBadgeClass = (priority: TaskPriority) => {
                        switch (priority) {
                          case TaskPriority.Low:
                            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
                          case TaskPriority.Medium:
                            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                          case TaskPriority.High:
                            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
                          case TaskPriority.Critical:
                            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
                          default:
                            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
                        }
                      };

                      const formatScheduledDateTime = () => {
                        if (!task.ScheduledStartDate) return 'Not scheduled';
                        const date = typeof task.ScheduledStartDate === 'string' 
                          ? new Date(task.ScheduledStartDate + 'T00:00:00')
                          : task.ScheduledStartDate;
                        const dateStr = date.toLocaleDateString();
                        return task.ScheduledStartTime 
                          ? `${dateStr} at ${task.ScheduledStartTime}`
                          : dateStr;
                      };

                      // Determine status update options
                      const isAssigned = user && (
                        Array.isArray(task.AssignedTo)
                          ? task.AssignedTo.includes(user.id)
                          : task.AssignedTo === user.id
                      );
                      const canUpdateStatus = hasPermission('tasks:update') || isAssigned;
                      const canHold = hasPermission('tasks:hold');
                      
                      const getNextStatusOptions = () => {
                        const options: TaskStatus[] = [];
                        if (task.Status === TaskStatus.Pending) {
                          options.push(TaskStatus.InProgress);
                          if (canHold) options.push(TaskStatus.Hold);
                        } else if (task.Status === TaskStatus.InProgress) {
                          options.push(TaskStatus.Completed);
                          if (canHold) options.push(TaskStatus.Hold);
                        } else if (task.Status === TaskStatus.Hold) {
                          if (canHold) {
                            options.push(TaskStatus.Pending, TaskStatus.InProgress);
                          }
                        }
                        return options;
                      };
                      
                      const nextStatusOptions = getNextStatusOptions();
                      const hasNextStatus = nextStatusOptions.length > 0;
                      const showStatusUpdate = canUpdateStatus && hasNextStatus && task.Status !== TaskStatus.Hold;

                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                            isOverdue() ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {task.Title}
                            </div>
                            {task.Description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {task.Description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full border w-24 ${getStatusBadgeClass(
                                  task.Status
                                )}`}
                              >
                                {task.Status}
                              </span>
                              {/* Status Update Dropdown */}
                              {showStatusUpdate && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleStatusChange(task.id!, e.target.value as TaskStatus);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  title="Update status"
                                >
                                  <option value="">Update...</option>
                                  {nextStatusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      Move to {status}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {/* Resume from Hold Button - only show if task is on hold and user has permission */}
                              {canHold && task.Status === TaskStatus.Hold && hasNextStatus && (
                                <button
                                  onClick={() => setResumingTask(task)}
                                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  title="Resume task"
                                  type="button"
                                >
                                  Resume...
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full border w-20 ${getPriorityBadgeClass(
                                task.Priority
                              )}`}
                            >
                              {task.Priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {Array.isArray(task.AssignedTo)
                                ? task.AssignedTo.length > 0
                                  ? task.AssignedTo.map((userId) => getUserName(userId)).join(', ')
                                  : 'Unassigned'
                                : task.AssignedTo
                                ? getUserName(task.AssignedTo)
                                : 'Unassigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {task.EstimatedHours}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatScheduledDateTime()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="View task details"
                                type="button"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {hasPermission('tasks:update') && (
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                  title="Edit task"
                                  type="button"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {hasPermission('tasks:hold') && task.Status !== TaskStatus.Hold && task.Status !== TaskStatus.Completed && (
                                <button
                                  onClick={() => handleStatusChange(task.id!, TaskStatus.Hold)}
                                  className="p-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                  title="Put task on hold"
                                  type="button"
                                >
                                  <PauseCircle className="w-4 h-4" />
                                </button>
                              )}
                              {hasPermission('tasks:delete') && (
                                <button
                                  onClick={() => handleDeleteTask(task.id!)}
                                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete task"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {viewMode === 'table' && totalTasks > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 rounded-b-lg">
                  {/* Rows per page selector */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="rows-per-page" className="text-sm text-gray-700 dark:text-gray-300">
                      Rows per page:
                    </label>
                    <select
                      id="rows-per-page"
                      value={rowsPerPage}
                      onChange={(e) => handleRowsPerPageChange(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="All">All</option>
                    </select>
                  </div>

                  {/* Page info and navigation */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {rowsPerPage === 'All' 
                        ? `Showing all ${totalTasks} tasks`
                        : `Showing ${startIndex + 1} to ${Math.min(endIndex, totalTasks)} of ${totalTasks} tasks`
                      }
                    </span>
                    
                    {rowsPerPage !== 'All' && totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-lg border transition-colors ${
                            currentPage === 1
                              ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-slate-700'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
                          }`}
                          type="button"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-lg border transition-colors ${
                            currentPage === totalPages
                              ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-slate-700'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
                          }`}
                          type="button"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && filteredTasks.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-slate-700 transition-colors duration-200">
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {tasks.length === 0
              ? 'No tasks yet. Create your first task to get started!'
              : 'No tasks found matching your filters.'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            {tasks.length === 0
              ? 'Click the "Add Task" button to create a new task.'
              : 'Try adjusting your filters or add a new task.'}
          </p>
        </div>
      )}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        task={editingTask}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onUpdateTask={handleUpdateTask}
      />

      {/* View Task Modal */}
      <ViewTaskModal
        isOpen={isViewModalOpen}
        task={viewingTask}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingTask(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        taskTitle={taskToDelete?.title}
      />

      {/* Resume Task Modal */}
      <ResumeTaskModal
        isOpen={resumingTask !== null}
        task={resumingTask}
        onClose={() => setResumingTask(null)}
        onResume={(taskId, status, scheduledDate, scheduledTime) => {
          handleStatusChange(taskId, status, scheduledDate, scheduledTime);
          setResumingTask(null);
        }}
      />
    </div>
  );
};
