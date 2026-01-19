import { useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
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
import { ListTodo, Search, X, Loader2, AlertCircle, Grid3x3, Table, Edit, Eye, ChevronLeft, ChevronRight, PauseCircle } from 'lucide-react';

/**
 * All Tasks Page Component
 * Displays all tasks (Pending, In Progress, Hold) with filtering options
 * Completed tasks are excluded and should be viewed on the Completed Tasks page
 */
export const AllTasks = () => {
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

  // Check if user has permission to view all tasks
  const { hasPermission, user } = useAuth();
  const { users, getUserName } = useUsers();
  const canViewAllTasks = hasPermission('tasks:view-all');

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Load view mode from localStorage, default to 'card'
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const savedViewMode = localStorage.getItem('allTasksViewMode');
    return (savedViewMode === 'card' || savedViewMode === 'table') ? savedViewMode : 'card';
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | 'All'>(() => {
    const saved = localStorage.getItem('allTasksRowsPerPage');
    if (saved === 'All') return 'All';
    const num = parseInt(saved || '10', 10);
    return isNaN(num) ? 10 : num;
  });

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('allTasksViewMode', viewMode);
  }, [viewMode]);

  // Save rows per page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('allTasksRowsPerPage', String(rowsPerPage));
  }, [rowsPerPage]);

  // Clear search query if user loses permission to view all tasks
  useEffect(() => {
    if (!canViewAllTasks) {
      if (searchQuery.trim() !== '') {
        setSearchQuery('');
      }
      if (selectedUserId !== null) {
        setSelectedUserId(null);
      }
    }
  }, [canViewAllTasks, searchQuery, selectedUserId]);

  // Set initial filters immediately on mount (before initial fetch)
  // useLayoutEffect runs synchronously before browser paint, ensuring filters are set before useTasks' useEffect runs
  useLayoutEffect(() => {
    const initialFilters: any = {
      status: statusFilter !== 'All' ? statusFilter : undefined,
      priority: priorityFilter !== 'All' ? priorityFilter : undefined,
      search: canViewAllTasks && searchQuery.trim() ? searchQuery.trim() : undefined,
      userId: canViewAllTasks && selectedUserId ? selectedUserId : undefined,
      excludeCompleted: true, // Exclude completed tasks from All Tasks page
    };
    updateFilters(initialFilters);
  }, []); // Run only once on mount

  // Update API filters when local filter state changes (after initial mount)
  useEffect(() => {
    // Skip the first render since useLayoutEffect already handled it
    const filters: any = {
      status: statusFilter !== 'All' ? statusFilter : undefined,
      priority: priorityFilter !== 'All' ? priorityFilter : undefined,
      // Only send search query if user has permission to view all tasks
      search: canViewAllTasks && searchQuery.trim() ? searchQuery.trim() : undefined,
      userId: canViewAllTasks && selectedUserId ? selectedUserId : undefined,
      excludeCompleted: true, // Exclude completed tasks from All Tasks page
    };
    updateFilters(filters);
  }, [statusFilter, priorityFilter, searchQuery, selectedUserId, canViewAllTasks, updateFilters]);

  // Filter tasks based on current filters (frontend filtering for search)
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Explicitly exclude completed tasks (safety check in case backend doesn't filter them)
    filtered = filtered.filter((task) => task.Status !== TaskStatus.Completed);

    // Status filter (already handled by backend, but keep for consistency)
    if (statusFilter !== 'All') {
      filtered = filtered.filter((task) => task.Status === statusFilter);
    }

    // Priority filter (already handled by backend, but keep for consistency)
    if (priorityFilter !== 'All') {
      filtered = filtered.filter((task) => task.Priority === priorityFilter);
    }

    // Title search (frontend filtering)
    if (canViewAllTasks && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task) =>
        task.Title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tasks, statusFilter, priorityFilter, searchQuery, canViewAllTasks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, searchQuery, selectedUserId, filteredTasks.length]);

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

  // Handlers
  const handleAddTask = async (taskData: any) => {
    try {
      await createTask(taskData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    try {
      await updateTask(taskId, taskData);
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

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
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  }, [deleteTask, taskToDelete]);

  // Handle view task click
  const handleViewTask = useCallback((task: Task) => {
    setViewingTask(task);
    setIsViewModalOpen(true);
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, scheduledDate?: string, scheduledTime?: string) => {
    try {
      const updateData: any = { Status: newStatus };
      if (scheduledDate !== undefined) {
        updateData.ScheduledStartDate = scheduledDate || null;
      }
      if (scheduledTime !== undefined) {
        updateData.ScheduledStartTime = scheduledTime || null;
      }
      await updateTask(taskId, updateData);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-lg">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header onAddTaskClick={() => setIsModalOpen(true)} />
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            All Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all tasks across all statuses
          </p>
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

            {/* User Filter Dropdown - Only show if user has permission to view all tasks */}
            {canViewAllTasks && (
              <div>
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

            {/* Title Search */}
            <div>
              <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Title
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="search-filter"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search by title..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 cursor-text"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSearchQuery('');
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                    type="button"
                    tabIndex={-1}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery.trim() !== '' || selectedUserId !== null) && (
              <div className="w-full flex items-end sm:col-span-2 lg:col-span-4">
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setPriorityFilter('All');
                    setSearchQuery('');
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
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 border border-gray-200 dark:border-slate-700 text-center">
            <ListTodo className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</p>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery.trim() !== '' || selectedUserId !== null
                ? 'Try adjusting your filters.'
                : 'Tasks will appear here when created.'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditClick}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
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
                            case TaskStatus.Completed:
                              return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
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
                                    onClick={() => handleEditClick(task)}
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
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
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

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Edit Task Modal */}
      {isEditModalOpen && editingTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          task={editingTask}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onUpdateTask={handleUpdateTask}
        />
      )}

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
