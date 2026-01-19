import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { TaskPriority } from '../types';
import { Header } from '../components/Header';
import { UserFilterDropdown } from '../components/UserFilterDropdown';
import { ViewTaskModal } from '../components/ViewTaskModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { ResumeTaskModal } from '../components/ResumeTaskModal';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { PauseCircle, Search, X, Loader2, AlertCircle, Calendar, Grid3x3, Table, Eye, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { taskApi } from '../services/api';
import { TaskStatus } from '../types';

/**
 * Hold Tasks Page Component
 * Displays all tasks that are on hold with filtering options
 */
export const HoldTasks = () => {
  const { hasPermission } = useAuth();
  const { users, loading: usersLoading, getUserName } = useUsers();
  const canViewAllTasks = hasPermission('tasks:view-all');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [titleSearchQuery, setTitleSearchQuery] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Load view mode from localStorage, default to 'card'
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const savedViewMode = localStorage.getItem('holdTasksViewMode');
    return (savedViewMode === 'card' || savedViewMode === 'table') ? savedViewMode : 'card';
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | 'All'>(() => {
    const saved = localStorage.getItem('holdTasksRowsPerPage');
    if (saved === 'All') return 'All';
    const num = parseInt(saved || '10', 10);
    return isNaN(num) ? 10 : num;
  });

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('holdTasksViewMode', viewMode);
  }, [viewMode]);

  // Save rows per page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('holdTasksRowsPerPage', String(rowsPerPage));
  }, [rowsPerPage]);

  // State for view modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // State for resume dropdown (track which task's dropdown is open)
  const [openResumeDropdown, setOpenResumeDropdown] = useState<string | null>(null);
  const [resumingTask, setResumingTask] = useState<Task | null>(null);

  // State for add task modal
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  /**
   * Fetch hold tasks
   */
  const fetchHoldTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskApi.getHoldTasks({
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        search: canViewAllTasks && titleSearchQuery.trim() ? titleSearchQuery.trim() : undefined, // Only send title search if has permission
        userId: canViewAllTasks && selectedUserId ? selectedUserId : undefined, // Only send userId if has permission
      });
      setTasks(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load hold tasks');
      console.error('Error fetching hold tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, titleSearchQuery, selectedUserId, canViewAllTasks]);

  useEffect(() => {
    fetchHoldTasks();
  }, [fetchHoldTasks]);

  /**
   * Filter tasks based on search query (frontend filtering for non-view-all users)
   */
  const filteredTasks = useMemo(() => {
    if (canViewAllTasks) {
      // Backend already filtered, but apply frontend filtering for title search
      let filtered = tasks;
      
      // Title search (frontend filtering)
      if (titleSearchQuery.trim()) {
        const query = titleSearchQuery.toLowerCase();
        filtered = filtered.filter(task => task.Title.toLowerCase().includes(query));
      }
      
      // User filter (frontend filtering)
      if (selectedUserId) {
        filtered = filtered.filter(task => {
          const isAssigned = Array.isArray(task.AssignedTo)
            ? task.AssignedTo.includes(selectedUserId)
            : task.AssignedTo === selectedUserId;
          return isAssigned;
        });
      }
      
      return filtered;
    }

    // For users without 'tasks:view-all', filter locally by title only
    if (titleSearchQuery.trim()) {
      const query = titleSearchQuery.toLowerCase();
      return tasks.filter(task => task.Title.toLowerCase().includes(query));
    }
    return tasks;
  }, [tasks, titleSearchQuery, selectedUserId, canViewAllTasks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, titleSearchQuery, selectedUserId, filteredTasks.length]);

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

  // Handle status change (resume from hold)
  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus, scheduledDate?: string, scheduledTime?: string) => {
    try {
      const updateData: any = { Status: newStatus };
      if (scheduledDate !== undefined) {
        updateData.ScheduledStartDate = scheduledDate || null;
      }
      if (scheduledTime !== undefined) {
        updateData.ScheduledStartTime = scheduledTime || null;
      }
      await taskApi.updateTask(taskId, updateData);
      // Refresh tasks after status change
      await fetchHoldTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  }, [fetchHoldTasks]);

  // Handle add task
  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'CreatedAt' | 'UpdatedAt'>) => {
    try {
      await taskApi.createTask(taskData);
      setIsAddTaskModalOpen(false);
      // Refresh tasks after adding
      await fetchHoldTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  }, [fetchHoldTasks]);

  if (loading || usersLoading) {
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
      <Header onAddTaskClick={() => setIsAddTaskModalOpen(true)} />
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Hold Tasks
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Overview of all tasks currently on hold
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hold Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{tasks.length}</p>
            </div>
            <PauseCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
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

            {/* Search Filters - Only visible if user has tasks:view-all permission */}
            {canViewAllTasks && (
              <>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="title-search-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search by Title
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="title-search-filter"
                      type="text"
                      value={titleSearchQuery}
                      onChange={(e) => {
                        e.stopPropagation();
                        setTitleSearchQuery(e.target.value);
                      }}
                      placeholder="Search by title..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 cursor-text"
                      autoComplete="off"
                    />
                    {titleSearchQuery && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setTitleSearchQuery('');
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
            {(priorityFilter !== 'All' || titleSearchQuery.trim() !== '' || selectedUserId !== null) && (
              <div className="w-full flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  onClick={() => {
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
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 border border-gray-200 dark:border-slate-700 text-center">
            <PauseCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hold tasks found</p>
            <p className="text-gray-600 dark:text-gray-400">
              {priorityFilter !== 'All' || titleSearchQuery.trim() !== '' || selectedUserId !== null
                ? 'Try adjusting your filters.'
                : 'Tasks put on hold will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(viewMode === 'card' ? filteredTasks : paginatedTasks).map((task) => {
              const createdDate = task.CreatedAt
                ? (typeof task.CreatedAt === 'string' ? new Date(task.CreatedAt) : task.CreatedAt)
                : null;
              const updatedDate = task.UpdatedAt
                ? (typeof task.UpdatedAt === 'string' ? new Date(task.UpdatedAt) : task.UpdatedAt)
                : null;

              // Determine resume options for hold tasks
              const canHold = hasPermission('tasks:hold');
              const getNextStatusOptions = () => {
                const options: TaskStatus[] = [];
                if (task.Status === TaskStatus.Hold && canHold) {
                  options.push(TaskStatus.Pending, TaskStatus.InProgress);
                }
                return options;
              };
              const nextStatusOptions = getNextStatusOptions();
              const hasNextStatus = nextStatusOptions.length > 0;

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

                    {/* Put On Hold By */}
                    {task.PutOnHoldBy && (
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Put on hold by:</span>{' '}
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          {task.PutOnHoldByName || (() => {
                            const user = users.find((u) => u.id === task.PutOnHoldBy);
                            return user ? user.fullName || user.username : 'Unknown';
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Created Date */}
                    {createdDate && (
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Created:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Updated Date */}
                    {updatedDate && (
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Last Updated:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          {updatedDate.toLocaleDateString()} {updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {task.UpdatedByName && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              by {task.UpdatedByName}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    {/* View Button */}
                    <button
                      onClick={() => handleViewTask(task)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                      type="button"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>

                    {/* Resume from Hold Button - only show if user has permission */}
                    {canHold && hasNextStatus && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenResumeDropdown(openResumeDropdown === task.id ? null : task.id || null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
                          type="button"
                        >
                          Resume
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {openResumeDropdown === task.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenResumeDropdown(null)}
                            />
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-20">
                              <div className="py-1">
                                {nextStatusOptions.map((status) => (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResumingTask(task);
                                      setOpenResumeDropdown(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                    type="button"
                                  >
                                    Resume to {status}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
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
                          Put On Hold By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {paginatedTasks.map((task) => {
                        const createdDate = task.CreatedAt
                          ? (typeof task.CreatedAt === 'string' ? new Date(task.CreatedAt) : task.CreatedAt)
                          : null;
                        const updatedDate = task.UpdatedAt
                          ? (typeof task.UpdatedAt === 'string' ? new Date(task.UpdatedAt) : task.UpdatedAt)
                          : null;

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

                        // Determine resume options for hold tasks
                        const canHold = hasPermission('tasks:hold');
                        const getNextStatusOptions = () => {
                          const options: TaskStatus[] = [];
                          if (task.Status === TaskStatus.Hold && canHold) {
                            options.push(TaskStatus.Pending, TaskStatus.InProgress);
                          }
                          return options;
                        };
                        
                        const nextStatusOptions = getNextStatusOptions();
                        const hasNextStatus = nextStatusOptions.length > 0;

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
                            <td className="px-6 py-4">
                              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                {task.PutOnHoldBy
                                  ? task.PutOnHoldByName || getUserName(task.PutOnHoldBy)
                                  : 'Unknown'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {createdDate ? (
                                <div>
                                  <div>{createdDate.toLocaleDateString()}</div>
                                  <div className="text-xs">{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {updatedDate ? (
                                <div>
                                  <div>{updatedDate.toLocaleDateString()}</div>
                                  <div className="text-xs">{updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                {/* Resume from Hold Button - only show if user has permission */}
                                {canHold && hasNextStatus && (
                                  <button
                                    onClick={() => setResumingTask(task)}
                                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    title="Resume task"
                                    type="button"
                                  >
                                    Resume...
                                  </button>
                                )}
                                <button
                                  onClick={() => handleViewTask(task)}
                                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="View task details"
                                  type="button"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
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
