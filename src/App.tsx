import { useState, useMemo, useEffect } from 'react';
import type { Task } from './types';
import { TaskStatus, TaskPriority } from './types';
import { TaskCard } from './components/TaskCard';
import { AddTaskModal } from './components/AddTaskModal';
import { Header } from './components/Header';
import { Filter, CheckCircle2, Clock, AlertCircle, ListTodo, Search, X } from 'lucide-react';

/**
 * Main App Component
 * TaskMaster Pro - High-quality Task Management Dashboard with Dark Mode
 */
function App() {

  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      Title: 'Setup Project Structure',
      Description: 'Initialize the React project with TypeScript and configure Tailwind CSS',
      Status: TaskStatus.Completed,
      Priority: TaskPriority.High,
      EstimatedHours: 4,
      AssignedTo: 'Peter Perera',
      CreatedAt: new Date('2024-01-15'),
      UpdatedAt: new Date('2024-01-15'),
      CompletedAt: new Date('2024-01-16'),
    },
    {
      id: '2',
      Title: 'Implement Task Dashboard',
      Description: 'Build the main dashboard UI with task cards and filtering capabilities',
      Status: TaskStatus.InProgress,
      Priority: TaskPriority.Critical,
      EstimatedHours: 8,
      AssignedTo: 'Nimal Siriwardena',
      CreatedAt: new Date('2024-01-16'),
      UpdatedAt: new Date('2024-01-17'),
    },
    {
      id: '3',
      Title: 'Add Task Validation',
      Description: 'Implement form validation for task creation and updates',
      Status: TaskStatus.Pending,
      Priority: TaskPriority.Medium,
      EstimatedHours: 3,
      AssignedTo: 'Kasun Jayaweera',
      CreatedAt: new Date('2024-01-17'),
      UpdatedAt: new Date('2024-01-17'),
    },
  ]);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate task statistics
  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.Status === TaskStatus.Pending).length,
      inProgress: tasks.filter((task) => task.Status === TaskStatus.InProgress).length,
      completed: tasks.filter((task) => task.Status === TaskStatus.Completed).length,
    };
  }, [tasks]);

  // Filter and sort tasks based on selected filters and search query
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesStatus = statusFilter === 'All' || task.Status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || task.Priority === priorityFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        task.Title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });

    const now = new Date();

    // Helper function to calculate remaining time until deadline (in milliseconds)
    // Only for tasks with scheduled date/time
    const getRemainingTime = (task: Task): number | null => {
      if (!task.ScheduledStartDate || !task.ScheduledStartTime) {
        return null;
      }

      const scheduledDate = new Date(task.ScheduledStartDate);
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
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  // Generate unique ID for new tasks
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Handle adding a new task
  const handleAddTask = (taskData: Omit<Task, 'id' | 'CreatedAt' | 'UpdatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      // Convert scheduled date/time strings to Date objects if provided
      ScheduledStartDate: taskData.ScheduledStartDate
        ? new Date(taskData.ScheduledStartDate)
        : undefined,
      ScheduledStartTime: taskData.ScheduledStartTime || undefined,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  // Auto-start tasks when scheduled time arrives
  useEffect(() => {
    const checkScheduledTasks = () => {
      const now = new Date();
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          // Only auto-start if task is Pending and has scheduled date/time
          if (
            task.Status === TaskStatus.Pending &&
            task.ScheduledStartDate &&
            task.ScheduledStartTime
          ) {
            const scheduledDate = new Date(task.ScheduledStartDate);
            const [hours, minutes] = task.ScheduledStartTime.split(':');
            scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

            // If scheduled time has passed, auto-start the task
            if (now >= scheduledDate) {
              return {
                ...task,
                Status: TaskStatus.InProgress,
                UpdatedAt: new Date(),
              };
            }
          }
          return task;
        })
      );
    };

    // Check every minute
    const interval = setInterval(checkScheduledTasks, 60000);
    // Also check immediately
    checkScheduledTasks();

    return () => clearInterval(interval);
  }, []);

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            Status: newStatus,
            UpdatedAt: new Date(),
          };

          // Set CompletedAt if status is Completed
          if (newStatus === TaskStatus.Completed && !task.CompletedAt) {
            updatedTask.CompletedAt = new Date();
          }

          return updatedTask;
        }
        return task;
      })
    );
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header Component */}
      <Header onAddTaskClick={() => setIsModalOpen(true)} />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                Search by Title
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
                  placeholder="Search tasks..."
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
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-slate-700 transition-colors duration-200">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              No tasks found matching your filters.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Try adjusting your filters or add a new task to get started.
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
    </div>
  );
}

export default App;
