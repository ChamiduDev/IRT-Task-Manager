import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { TaskPriority } from '../types';
import { Header } from '../components/Header';
import { UserFilterDropdown } from '../components/UserFilterDropdown';
import { ViewTaskModal } from '../components/ViewTaskModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { CheckCircle2, Loader2, AlertCircle, Clock, Calendar, Grid3x3, Table, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { taskApi } from '../services/api';

/**
 * Completed Tasks Page Component
 * Displays all completed tasks with duration calculations and filtering
 */
export const CompletedTasks = () => {
  const { hasPermission } = useAuth();
  const { users, getUserName } = useUsers();
  const canViewAllTasks = hasPermission('tasks:view-all');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for view modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // State for add task modal
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Load view mode from localStorage, default to 'card'
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const savedViewMode = localStorage.getItem('completedTasksViewMode');
    return (savedViewMode === 'card' || savedViewMode === 'table') ? savedViewMode : 'card';
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | 'All'>(() => {
    const saved = localStorage.getItem('completedTasksRowsPerPage');
    if (saved === 'All') return 'All';
    const num = parseInt(saved || '10', 10);
    return isNaN(num) ? 10 : num;
  });

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('completedTasksViewMode', viewMode);
  }, [viewMode]);

  // Save rows per page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('completedTasksRowsPerPage', String(rowsPerPage));
  }, [rowsPerPage]);

  /**
   * Calculate duration between StartedAt and CompletedAt in hours
   * Returns the time difference in hours, or null if either timestamp is missing
   */
  const calculateDuration = (startedAt: Date | string | null | undefined, completedAt: Date | string | null | undefined): number | null => {
    // Both timestamps are required
    if (!startedAt || !completedAt) {
      return null;
    }

    // Parse dates if they're strings
    const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
    const end = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid date in duration calculation:', { startedAt, completedAt });
      return null;
    }

    // Calculate difference in milliseconds, then convert to hours
    const diffMs = end.getTime() - start.getTime();
    
    // Ensure positive duration (completed should be after started)
    if (diffMs < 0) {
      console.warn('Completed date is before started date:', { startedAt, completedAt });
      return null;
    }

    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  /**
   * Format duration for display
   */
  const formatDuration = (hours: number | null): string => {
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
  };

  /**
   * Calculate accuracy percentage for a task
   * Returns accuracy as a percentage, where 100% means perfect match
   * If completed in less time than estimated, accuracy exceeds 100% (better than expected)
   * If completed in more time than estimated, accuracy is less than 100%
   * Formula:
   *   - If actual <= estimated: 100 + (estimated - actual) / estimated * 100
   *   - If actual > estimated: (1 - (actual - estimated) / estimated) * 100
   */
  const calculateAccuracy = (actualHours: number | null, estimatedHours: number | null): number | null => {
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
    
    return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
  };

  /**
   * Fetch completed tasks
   */
  const fetchCompletedTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskApi.getCompletedTasks({
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        userId: selectedUserId ? selectedUserId : undefined,
      });
      setTasks(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load completed tasks');
      console.error('Error fetching completed tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, selectedUserId]);

  useEffect(() => {
    fetchCompletedTasks();
  }, [fetchCompletedTasks]);

  // Handle add task
  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'CreatedAt' | 'UpdatedAt'>) => {
    try {
      // Convert taskData to CreateTaskDTO format
      const createTaskData = {
        ...taskData,
        ScheduledStartDate: taskData.ScheduledStartDate 
          ? (typeof taskData.ScheduledStartDate === 'string' 
              ? taskData.ScheduledStartDate 
              : taskData.ScheduledStartDate instanceof Date
              ? taskData.ScheduledStartDate.toISOString().split('T')[0]
              : null)
          : null,
      };
      await taskApi.createTask(createTaskData);
      setIsAddTaskModalOpen(false);
      // Refresh tasks after adding
      await fetchCompletedTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  }, [fetchCompletedTasks]);

  /**
   * Calculate total duration for all tasks
   */
  const totalDuration = useMemo(() => {
    return tasks.reduce((total, task) => {
      const duration = calculateDuration(task.StartedAt, task.CompletedAt);
      return total + (duration || 0);
    }, 0);
  }, [tasks]);

  // No frontend filtering needed - backend handles filtering by userId
  const filteredTasks = useMemo(() => {
    return tasks;
  }, [tasks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, selectedUserId, filteredTasks.length]);

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

  // Handle view task click
  const handleViewTask = useCallback((task: Task) => {
    setViewingTask(task);
    setIsViewModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Header onAddTaskClick={() => setIsAddTaskModalOpen(true)} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header onAddTaskClick={() => setIsAddTaskModalOpen(true)} />
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Completed Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all completed tasks and their completion durations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Tasks Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Completed Tasks</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{filteredTasks.length}</p>
          </div>

          {/* Total Duration Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Duration</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatDuration(totalDuration)}
            </p>
          </div>

          {/* Overall Accuracy Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Accuracy</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {(() => {
                const allAccuracies = filteredTasks
                  .map((task) => {
                    const actualDuration = calculateDuration(task.StartedAt, task.CompletedAt);
                    return calculateAccuracy(actualDuration, task.EstimatedHours || null);
                  })
                  .filter((acc): acc is number => acc !== null);
                
                if (allAccuracies.length === 0) return 'N/A';
                const avg = allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length;
                return `${Math.round(avg * 100) / 100}%`;
              })()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* User Filter Dropdown - Only show if user has permission to view all tasks */}
            {canViewAllTasks && (
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
            )}

            {/* Clear Filters Button */}
            {(priorityFilter !== 'All' || selectedUserId !== null) && (
              <div className="w-full flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  onClick={() => {
                    setPriorityFilter('All');
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

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 border border-gray-200 dark:border-slate-700 text-center">
            <CheckCircle2 className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No completed tasks found</p>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedUserId !== null || priorityFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Completed tasks will appear here'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => {
              // Calculate duration from StartedAt to CompletedAt
              const duration = calculateDuration(task.StartedAt, task.CompletedAt);
              const completedDate = task.CompletedAt
                ? (typeof task.CompletedAt === 'string' ? new Date(task.CompletedAt) : task.CompletedAt)
                : null;
              const startedDate = task.StartedAt
                ? (typeof task.StartedAt === 'string' ? new Date(task.StartedAt) : task.StartedAt)
                : null;

              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  {/* Task Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {task.Title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {task.Description}
                  </p>

                  {/* Task Details */}
                  <div className="space-y-2 mb-4">
                    {/* Priority */}
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">Priority:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          task.Priority === TaskPriority.Critical
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : task.Priority === TaskPriority.High
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : task.Priority === TaskPriority.Medium
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                      >
                        {task.Priority}
                      </span>
                    </div>

                    {/* Assigned To */}
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Assigned to:</span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {Array.isArray(task.AssignedTo)
                          ? task.AssignedTo.length > 0
                            ? task.AssignedTo
                                .map((userId) => getUserName(userId))
                                .join(', ')
                            : 'No one assigned'
                          : task.AssignedTo ? getUserName(task.AssignedTo) : 'No one assigned'}
                      </span>
                    </div>

                    {/* Estimated Hours */}
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Estimated:</span>{' '}
                      <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1">
                        {task.EstimatedHours}h
                      </span>
                    </div>

                    {/* Scheduled Start Date/Time */}
                    {task.ScheduledStartDate && (
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium">Scheduled:</span>{' '}
                        <span className="text-purple-600 dark:text-purple-400 ml-1">
                          {(() => {
                            const scheduledDate = typeof task.ScheduledStartDate === 'string' 
                              ? new Date(task.ScheduledStartDate + 'T00:00:00')
                              : task.ScheduledStartDate;
                            const dateStr = scheduledDate.toLocaleDateString();
                            return task.ScheduledStartTime 
                              ? `${dateStr} at ${task.ScheduledStartTime}`
                              : dateStr;
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Started Date - Show if available with comparison to scheduled time */}
                    {startedDate && (
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Started:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          {startedDate.toLocaleDateString()} {startedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {task.ScheduledStartDate && (() => {
                          const scheduledDate = typeof task.ScheduledStartDate === 'string' 
                            ? new Date(task.ScheduledStartDate + (task.ScheduledStartTime ? `T${task.ScheduledStartTime}` : 'T00:00:00'))
                            : new Date(task.ScheduledStartDate);
                          
                          // Parse scheduled time if available
                          if (task.ScheduledStartTime) {
                            const [hours, minutes] = task.ScheduledStartTime.split(':').map(Number);
                            scheduledDate.setHours(hours, minutes, 0, 0);
                          }
                          
                          const isStartedBeforeScheduled = startedDate < scheduledDate;
                          const isStartedAfterScheduled = startedDate > scheduledDate;
                          
                          return (
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                              isStartedBeforeScheduled
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : isStartedAfterScheduled
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {isStartedBeforeScheduled
                                ? '✓ Started early'
                                : isStartedAfterScheduled
                                ? '⚠ Started late'
                                : '✓ Started on time'}
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    {/* Completed Date */}
                    {completedDate && (
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Completed:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          {completedDate.toLocaleDateString()} {completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium">Actual Duration:</span>{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold ml-1">
                        {duration !== null ? formatDuration(duration) : 'N/A (No start time recorded)'}
                      </span>
                      {duration !== null && task.EstimatedHours && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          duration <= task.EstimatedHours
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {duration <= task.EstimatedHours
                            ? `✓ Under estimate (${task.EstimatedHours}h)`
                            : `⚠ Over estimate (${task.EstimatedHours}h)`}
                        </span>
                      )}
                    </div>

                    {/* Accuracy */}
                    {(() => {
                      const accuracy = calculateAccuracy(duration, task.EstimatedHours || null);
                      if (accuracy === null) return null;
                      
                      return (
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium">Accuracy:</span>{' '}
                          <span
                            className={`ml-1 font-semibold ${
                              accuracy >= 150
                                ? 'text-blue-600 dark:text-blue-400'
                                : accuracy >= 100
                                ? 'text-green-600 dark:text-green-400'
                                : accuracy >= 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {accuracy}%
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({duration !== null && task.EstimatedHours
                              ? duration < task.EstimatedHours
                                ? `${formatDuration(task.EstimatedHours - duration)} under`
                                : duration > task.EstimatedHours
                                ? `${formatDuration(duration - task.EstimatedHours)} over`
                                : 'exact match'
                              : 'N/A'})
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status Badge */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Completed
                    </span>
                  </div>
                </div>
              );
            })}
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
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Estimated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Scheduled
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Started
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Completed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actual Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Accuracy
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {paginatedTasks.map((task) => {
                        const duration = calculateDuration(task.StartedAt, task.CompletedAt);
                        const completedDate = task.CompletedAt
                          ? (typeof task.CompletedAt === 'string' ? new Date(task.CompletedAt) : task.CompletedAt)
                          : null;
                        const startedDate = task.StartedAt
                          ? (typeof task.StartedAt === 'string' ? new Date(task.StartedAt) : task.StartedAt)
                          : null;
                        const accuracy = calculateAccuracy(duration, task.EstimatedHours || null);

                        const getPriorityBadgeClass = (priority: TaskPriority) => {
                          switch (priority) {
                            case TaskPriority.Critical:
                              return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                            case TaskPriority.High:
                              return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
                            case TaskPriority.Medium:
                              return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                            case TaskPriority.Low:
                              return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                            default:
                              return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                          }
                        };

                        return (
                          <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
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
                              <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full w-20 ${getPriorityBadgeClass(task.Priority)}`}>
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
                              {task.ScheduledStartDate ? (
                                (() => {
                                  const scheduledDate = typeof task.ScheduledStartDate === 'string' 
                                    ? new Date(task.ScheduledStartDate + 'T00:00:00')
                                    : task.ScheduledStartDate;
                                  const dateStr = scheduledDate.toLocaleDateString();
                                  return task.ScheduledStartTime 
                                    ? `${dateStr} at ${task.ScheduledStartTime}`
                                    : dateStr;
                                })()
                              ) : (
                                'Not scheduled'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {startedDate ? (
                                <div>
                                  <div>{startedDate.toLocaleDateString()}</div>
                                  <div className="text-xs">{startedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  {task.ScheduledStartDate && (() => {
                                    const scheduledDate = typeof task.ScheduledStartDate === 'string' 
                                      ? new Date(task.ScheduledStartDate + (task.ScheduledStartTime ? `T${task.ScheduledStartTime}` : 'T00:00:00'))
                                      : new Date(task.ScheduledStartDate);
                                    if (task.ScheduledStartTime) {
                                      const [hours, minutes] = task.ScheduledStartTime.split(':').map(Number);
                                      scheduledDate.setHours(hours, minutes, 0, 0);
                                    }
                                    const isStartedBeforeScheduled = startedDate < scheduledDate;
                                    const isStartedAfterScheduled = startedDate > scheduledDate;
                                    return (
                                      <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${
                                        isStartedBeforeScheduled
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                          : isStartedAfterScheduled
                                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                      }`}>
                                        {isStartedBeforeScheduled ? 'Early' : isStartedAfterScheduled ? 'Late' : 'On time'}
                                      </span>
                                    );
                                  })()}
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {completedDate ? (
                                <div>
                                  <div>{completedDate.toLocaleDateString()}</div>
                                  <div className="text-xs">{completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                {duration !== null ? formatDuration(duration) : 'N/A'}
                              </div>
                              {duration !== null && task.EstimatedHours && (
                                <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${
                                  duration <= task.EstimatedHours
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                }`}>
                                  {duration <= task.EstimatedHours ? 'Under' : 'Over'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {accuracy !== null ? (
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    accuracy >= 150
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                      : accuracy >= 100
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : accuracy >= 70
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  }`}
                                >
                                  {accuracy}%
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="View task details"
                                type="button"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
      </div>

      {/* View Task Modal */}
      <ViewTaskModal
        isOpen={isViewModalOpen}
        task={viewingTask}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingTask(null);
        }}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
};
