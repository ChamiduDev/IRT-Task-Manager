import type { Task } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { X, Calendar, Clock, User as UserIcon, AlertCircle, CheckCircle2, PauseCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';

interface ViewTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
}

/**
 * ViewTaskModal Component
 * Displays all task details in a read-only modal based on user permissions
 */
export const ViewTaskModal = ({ isOpen, task, onClose }: ViewTaskModalProps) => {
  const { hasPermission, user } = useAuth();
  const { getUserName } = useUsers();

  if (!isOpen || !task) return null;

  // Check permissions
  const canViewAll = hasPermission('tasks:view-all');
  const canEdit = hasPermission('tasks:update');
  const canDelete = hasPermission('tasks:delete');

  // Check if user is assigned to this task
  const isAssigned = user && (
    Array.isArray(task.AssignedTo)
      ? task.AssignedTo.includes(user.id)
      : task.AssignedTo === user.id
  );

  // Get status badge class
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

  // Get priority badge class
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

  // Format scheduled date and time
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

  // Format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  /**
   * Calculate duration between StartedAt and CompletedAt in hours
   */
  const calculateDuration = (startedAt: Date | string | null | undefined, completedAt: Date | string | null | undefined): number | null => {
    if (!startedAt || !completedAt) return null;
    const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
    const end = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return null;
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

  // Calculate duration and accuracy for completed tasks
  const duration = task.Status === TaskStatus.Completed 
    ? calculateDuration(task.StartedAt, task.CompletedAt)
    : null;
  const accuracy = task.Status === TaskStatus.Completed && duration !== null
    ? calculateAccuracy(duration, task.EstimatedHours || null)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {task.Title}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {task.Description || 'No description provided'}
            </p>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <span
                className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full border ${getStatusBadgeClass(
                  task.Status
                )}`}
              >
                {task.Status === TaskStatus.Pending && <AlertCircle className="w-4 h-4 mr-1.5" />}
                {task.Status === TaskStatus.InProgress && <Clock className="w-4 h-4 mr-1.5" />}
                {task.Status === TaskStatus.Completed && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                {task.Status === TaskStatus.Hold && <PauseCircle className="w-4 h-4 mr-1.5" />}
                {task.Status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <span
                className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full border ${getPriorityBadgeClass(
                  task.Priority
                )}`}
              >
                {task.Priority}
              </span>
            </div>
          </div>

          {/* Assigned To */}
          {(canViewAll || isAssigned) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned To
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(task.AssignedTo)
                  ? task.AssignedTo.length > 0
                    ? task.AssignedTo.map((userId) => (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                        >
                          <UserIcon className="w-4 h-4" />
                          {getUserName(userId)}
                        </span>
                      ))
                    : <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
                  : task.AssignedTo
                  ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                        <UserIcon className="w-4 h-4" />
                        {getUserName(task.AssignedTo)}
                      </span>
                    )
                  : <span className="text-gray-500 dark:text-gray-400">Unassigned</span>}
              </div>
            </div>
          )}

          {/* Put on Hold By */}
          {task.Status === TaskStatus.Hold && task.PutOnHoldBy && (
            <div>
              <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                Put on Hold By
              </label>
              <p className="text-orange-600 dark:text-orange-400">
                {task.PutOnHoldByName || getUserName(task.PutOnHoldBy)}
              </p>
            </div>
          )}

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Hours
            </label>
            <p className="text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              {task.EstimatedHours} hours
            </p>
          </div>

          {/* Scheduled Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scheduled Start
            </label>
            <p className="text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              {formatScheduledDateTime()}
            </p>
          </div>

          {/* Started Date/Time with comparison to scheduled (for completed tasks) */}
          {task.Status === TaskStatus.Completed && task.StartedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Started
              </label>
              <div className="flex items-center gap-2">
                <p className="text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  {formatDate(task.StartedAt)}
                </p>
                {task.ScheduledStartDate && (() => {
                  const startedDate = typeof task.StartedAt === 'string' ? new Date(task.StartedAt) : task.StartedAt;
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
                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
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
            </div>
          )}

          {/* Actual Duration (for completed tasks) */}
          {task.Status === TaskStatus.Completed && duration !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Actual Duration
              </label>
              <div className="flex items-center gap-2">
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDuration(duration)}
                </p>
                {task.EstimatedHours && (
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
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
            </div>
          )}

          {/* Accuracy (for completed tasks) */}
          {task.Status === TaskStatus.Completed && accuracy !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accuracy
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-semibold ${
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({duration !== null && task.EstimatedHours
                    ? duration < task.EstimatedHours
                      ? `${formatDuration(task.EstimatedHours - duration)} under estimate`
                      : duration > task.EstimatedHours
                      ? `${formatDuration(duration - task.EstimatedHours)} over estimate`
                      : 'exact match'
                    : 'N/A'})
                </span>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Created At
              </label>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatDate(task.CreatedAt)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Updated At
              </label>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatDate(task.UpdatedAt)}
                {task.UpdatedByName && (
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    by {task.UpdatedByName}
                  </span>
                )}
              </p>
            </div>
            {task.StartedAt && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Started At
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDate(task.StartedAt)}
                </p>
              </div>
            )}
            {task.CompletedAt && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Completed At
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDate(task.CompletedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Permissions Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {!canViewAll && !isAssigned && 'Limited view: You can only see tasks assigned to you.'}
              {canViewAll && 'Full view: You have access to view all task details.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
