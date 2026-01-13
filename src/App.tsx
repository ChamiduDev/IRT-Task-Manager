import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Task } from './types';
import { TaskStatus, TaskPriority } from './types';
import { TaskCard } from './components/TaskCard';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { Header } from './components/Header';
import { useTasks } from './hooks/useTasks';
import { Filter, CheckCircle2, Clock, AlertCircle, ListTodo, Search, X, Loader2, AlertCircle as AlertCircleIcon } from 'lucide-react';

/**
 * Main App Component
 * TaskMaster Pro - High-quality Task Management Dashboard with Dark Mode
 * Now integrated with backend API
 */
function App() {
  // Use the tasks hook for API integration
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateFilters,
    refreshTasks,
  } = useTasks();

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // State for filters (local UI state, synced with API via useEffect)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update API filters when local filter state changes
  useEffect(() => {
    updateFilters({
      status: statusFilter !== 'All' ? statusFilter : undefined,
      priority: priorityFilter !== 'All' ? priorityFilter : undefined,
      search: searchQuery.trim() || undefined,
    });
  }, [statusFilter, priorityFilter, searchQuery, updateFilters]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.Status === TaskStatus.Pending).length,
      inProgress: tasks.filter((task) => task.Status === TaskStatus.InProgress).length,
      completed: tasks.filter((task) => task.Status === TaskStatus.Completed).length,
    };
  }, [tasks]);

  // Filter and sort tasks (filtering is now done by the API, but we still sort locally)
  const filteredTasks = useMemo(() => {
    // Tasks are already filtered by the API, we just need to sort them
    const filtered = [...tasks];

    const now = new Date();

    // Helper function to calculate remaining time until deadline (in milliseconds)
    // Only for tasks with scheduled date/time
    const getRemainingTime = (task: Task): number | null => {
      if (!task.ScheduledStartDate || !task.ScheduledStartTime) {
        return null;
      }

      // Parse date string (YYYY-MM-DD) using local timezone to avoid timezone shifts
      const dateStr = typeof task.ScheduledStartDate === 'string' 
        ? task.ScheduledStartDate 
        : task.ScheduledStartDate.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const scheduledDate = new Date(year, month - 1, day); // Use local timezone
      const [hours, minutes] = task.ScheduledStartTime.split(':');
      scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      const deadline = new Date(scheduledDate.getTime() + task.EstimatedHours * 60 * 60 * 1000);

      return deadline.getTime() - now.getTime();
    };

    // Sort tasks with priority:
    // 1. Tasks with scheduled date/time (not completed) - sorted by remaining time (least first)
    // 2. Tasks without scheduled date/time (not completed) - at the bottom
    // 3. Completed tasks - at the very bottom
    return filtered.sort((a, b) => {
      const aIsCompleted = a.Status === TaskStatus.Completed;
      const bIsCompleted = b.Status === TaskStatus.Completed;

      // Both completed - maintain order (completed tasks at bottom)
      if (aIsCompleted && bIsCompleted) {
        return 0;
      }

      // Only one completed - completed task goes to bottom
      if (aIsCompleted && !bIsCompleted) return 1;
      if (!aIsCompleted && bIsCompleted) return -1;

      // Neither is completed - check for scheduled date/time
      const aHasSchedule = a.ScheduledStartDate && a.ScheduledStartTime;
      const bHasSchedule = b.ScheduledStartDate && b.ScheduledStartTime;

      // Both have scheduled date/time - sort by remaining time (least first)
      if (aHasSchedule && bHasSchedule) {
        const aRemaining = getRemainingTime(a) ?? Infinity;
        const bRemaining = getRemainingTime(b) ?? Infinity;

        // If remaining times are equal (within 1 minute), maintain previous order
        if (Math.abs(aRemaining - bRemaining) < 60000) {
          return 0;
        }

        return aRemaining - bRemaining;
      }

      // Only one has schedule - scheduled task goes to top
      if (aHasSchedule && !bHasSchedule) return -1;
      if (!aHasSchedule && bHasSchedule) return 1;

      // Neither has schedule - maintain order (unscheduled tasks at bottom)
      return 0;
    });
  }, [tasks]);

  // Handle adding a new task
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
        ScheduledStartDate: taskData.ScheduledStartDate
          ? (typeof taskData.ScheduledStartDate === 'string' 
              ? (taskData.ScheduledStartDate.trim() !== '' ? taskData.ScheduledStartDate : null)
              : null)
          : null,
        ScheduledStartTime: taskData.ScheduledStartTime || null,
      });
      setIsModalOpen(false);
    } catch (err) {
      // Error is handled by the useTasks hook
      console.error('Failed to create task:', err);
    }
  }, [createTask]);

  // Handle status change
  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, {
        Status: newStatus,
      });
    } catch (err) {
      // Error is handled by the useTasks hook
      console.error('Failed to update task status:', err);
    }
  }, [updateTask]);

  // Handle task deletion
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      // Error is handled by the useTasks hook
      console.error('Failed to delete task:', err);
    }
  }, [deleteTask]);

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
        // Close modal only on success
        setIsEditModalOpen(false);
        setEditingTask(null);
        return result;
      } catch (err: any) {
        // Error is handled by the useTasks hook, but also show it here
        console.error('handleUpdateTask: Failed to update task:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        console.error('Error message:', err.message);
        // Don't close modal on error so user can see what went wrong
        // Re-throw so EditTaskModal can handle it
        throw err;
      }
  }, [updateTask]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header Component */}
      <Header onAddTaskClick={() => setIsModalOpen(true)} />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error: {error}
              </p>
            </div>
            <button
              onClick={() => refreshTasks()}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && tasks.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
            </div>
          </div>
        )}

        {/* Task Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Tasks Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Tasks
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {taskStats.total}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <ListTodo className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </div>

          {/* Pending Tasks Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Pending
                </p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                  {taskStats.pending}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
          </div>

          {/* In Progress Tasks Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  In Progress
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {taskStats.inProgress}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Completed Tasks Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {taskStats.completed}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtering Row */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 sm:p-6 mb-6 border border-gray-200 dark:border-slate-700 transition-colors duration-200">
          {/* Filter Header */}
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filter Tasks
            </h2>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="w-full sm:col-span-2 lg:col-span-1">
              <label
                htmlFor="searchInput"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Search by Title or Assigned To
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  id="searchInput"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or assignee..."
                  className="w-full pl-10 pr-10 px-3.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all hover:border-gray-400 dark:hover:border-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    type="button"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <label
                htmlFor="statusFilter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'All')}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all hover:border-gray-400 dark:hover:border-slate-500"
              >
                <option value="All">All Statuses</option>
                <option value={TaskStatus.Pending}>{TaskStatus.Pending}</option>
                <option value={TaskStatus.InProgress}>{TaskStatus.InProgress}</option>
                <option value={TaskStatus.Completed}>{TaskStatus.Completed}</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="w-full">
              <label
                htmlFor="priorityFilter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Priority
              </label>
              <select
                id="priorityFilter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'All')}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all hover:border-gray-400 dark:hover:border-slate-500"
              >
                <option value="All">All Priorities</option>
                <option value={TaskPriority.Low}>{TaskPriority.Low}</option>
                <option value={TaskPriority.Medium}>{TaskPriority.Medium}</option>
                <option value={TaskPriority.High}>{TaskPriority.High}</option>
                <option value={TaskPriority.Critical}>{TaskPriority.Critical}</option>
              </select>
            </div>

            {/* Clear Filters Button - Only show if filters are active */}
            {(statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery.trim() !== '') && (
              <div className="w-full flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setPriorityFilter('All');
                    setSearchQuery('');
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

        {/* Task Grid */}
        {!loading && filteredTasks.length > 0 && (
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
    </div>
  );
}

export default App;
