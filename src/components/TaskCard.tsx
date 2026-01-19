import type { Task } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { Clock, Trash2, ChevronDown, Calendar, Edit, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ResumeTaskModal } from './ResumeTaskModal';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus, scheduledDate?: string, scheduledTime?: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

/**
 * TaskCard Component
 * Displays individual task information with high-contrast badges, status workflow, and creation timestamp
 * Supports both light and dark modes
 */
export const TaskCard = ({ task, onStatusChange, onDelete, onEdit }: TaskCardProps) => {
  const { hasPermission, user } = useAuth();
  const { getUserName } = useUsers();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isDeadlineApproaching, setIsDeadlineApproaching] = useState(false);
  
  // Check if user is assigned to this task
  const isAssigned = user && (
    Array.isArray(task.AssignedTo)
      ? task.AssignedTo.includes(user.id)
      : task.AssignedTo === user.id
  );
  
  // Check permissions
  const canEdit = hasPermission('tasks:update');
  const canDelete = hasPermission('tasks:delete');
  const canHold = hasPermission('tasks:hold'); // Permission to put tasks on hold
  // Users can update status if they have tasks:update permission OR if they're assigned to the task
  const canUpdateStatus = hasPermission('tasks:update') || isAssigned;

  // Calculate deadline and countdown timer
  useEffect(() => {
    const calculateDeadline = () => {
      if (!task.ScheduledStartDate || !task.ScheduledStartTime || !task.EstimatedHours) {
        setTimeRemaining('');
        setIsDeadlineApproaching(false);
        return;
      }

      // Parse date string (YYYY-MM-DD) using local timezone to avoid timezone shifts
      const dateStr = typeof task.ScheduledStartDate === 'string' 
        ? task.ScheduledStartDate 
        : task.ScheduledStartDate.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const scheduledDate = new Date(year, month - 1, day); // Use local timezone
      const [scheduledHours, scheduledMinutes] = task.ScheduledStartTime.split(':');
      scheduledDate.setHours(parseInt(scheduledHours, 10), parseInt(scheduledMinutes, 10), 0, 0);

      // Calculate deadline: scheduled start + estimated hours
      const deadline = new Date(scheduledDate.getTime() + task.EstimatedHours * 60 * 60 * 1000);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Overdue');
        setIsDeadlineApproaching(true);
        return;
      }

      // Check if deadline is approaching (within 2 hours)
      const hoursUntilDeadline = diff / (1000 * 60 * 60);
      setIsDeadlineApproaching(hoursUntilDeadline <= 2);

      // Format time remaining
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hoursRemaining}h remaining`);
      } else if (hoursRemaining > 0) {
        setTimeRemaining(`${hoursRemaining}h ${mins}m remaining`);
      } else {
        setTimeRemaining(`${mins}m remaining`);
      }
    };

    calculateDeadline();
    // Update every minute
    const interval = setInterval(calculateDeadline, 60000);

    return () => clearInterval(interval);
  }, [task.ScheduledStartDate, task.ScheduledStartTime, task.EstimatedHours]);

  // Get the next available status options based on current status
  const getNextStatusOptions = (currentStatus: TaskStatus): TaskStatus[] => {
    switch (currentStatus) {
      case TaskStatus.Pending:
        return [TaskStatus.InProgress];
      case TaskStatus.InProgress:
        return [TaskStatus.Completed];
      case TaskStatus.Completed:
        return []; // No transitions from completed
      case TaskStatus.Hold:
        return [TaskStatus.Pending, TaskStatus.InProgress]; // Can resume from hold
      default:
        return [];
    }
  };

  // Get high-contrast priority badge styling (works in both themes)
  const getPriorityBadgeClass = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.Critical:
        return 'bg-red-500 text-white border-red-600 dark:bg-red-600 dark:border-red-700';
      case TaskPriority.High:
        return 'bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-700';
      case TaskPriority.Medium:
        return 'bg-yellow-500 text-white border-yellow-600 dark:bg-yellow-600 dark:border-yellow-700';
      case TaskPriority.Low:
        return 'bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-700';
      default:
        return 'bg-gray-500 text-white border-gray-600 dark:bg-gray-600 dark:border-gray-700';
    }
  };

  // Get status badge styling with dark mode support
  const getStatusBadgeClass = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.Pending:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      case TaskStatus.InProgress:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
      case TaskStatus.Completed:
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  // Format creation timestamp to readable format
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Format scheduled start date and time
  const formatScheduledDateTime = (): string | null => {
    if (!task.ScheduledStartDate || !task.ScheduledStartTime) return null;

    // Parse date string (YYYY-MM-DD) and time string (HH:MM) using local timezone
    const dateString = typeof task.ScheduledStartDate === 'string' 
      ? task.ScheduledStartDate 
      : task.ScheduledStartDate.toISOString().split('T')[0];
    const [year, month, day] = dateString.split('-').map(Number);
    const scheduledDate = new Date(year, month - 1, day); // Use local timezone
    const [hours, minutes] = task.ScheduledStartTime.split(':');
    scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const now = new Date();
    const isToday = scheduledDate.toDateString() === now.toDateString();
    const isTomorrow = scheduledDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    let dateStr: string;
    if (isToday) {
      dateStr = 'Today';
    } else if (isTomorrow) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = scheduledDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: scheduledDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }

    // Format time in 12-hour format
    const timeStr = scheduledDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateStr} at ${timeStr}`;
  };

  const nextStatusOptions = getNextStatusOptions(task.Status);
  const hasNextStatus = nextStatusOptions.length > 0;

  const handleStatusChange = (newStatus: TaskStatus, scheduledDate?: string, scheduledTime?: string) => {
    if (task.id) {
      onStatusChange(task.id, newStatus, scheduledDate, scheduledTime);
    }
    setIsDropdownOpen(false);
  };

  const handleResumeFromHold = (taskId: string, newStatus: TaskStatus, scheduledDate?: string, scheduledTime?: string) => {
    // Call onStatusChange directly with the correct parameters
    // Use taskId from the parameter (provided by ResumeTaskModal) to ensure consistency
    if (taskId) {
      onStatusChange(taskId, newStatus, scheduledDate, scheduledTime);
    }
    setIsResumeModalOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (task.id) {
      onDelete(task.id);
    }
  };

  // Get card border color based on deadline and hold status
  const getCardBorderClass = (): string => {
    // Hold tasks get distinct orange border
    if (task.Status === TaskStatus.Hold) {
      return 'border-orange-400 dark:border-orange-600 border-2';
    }
    if (isDeadlineApproaching && task.Status !== TaskStatus.Completed) {
      return 'border-red-500 dark:border-red-600 border-2';
    }
    return 'border-gray-200 dark:border-slate-700';
  };

  // Get card background color based on deadline and hold status
  const getCardBgClass = (): string => {
    // Hold tasks get distinct orange background tint
    if (task.Status === TaskStatus.Hold) {
      return 'bg-orange-50 dark:bg-orange-900/20';
    }
    if (isDeadlineApproaching && task.Status !== TaskStatus.Completed) {
      return 'bg-red-50 dark:bg-red-900/10';
    }
    return 'bg-white dark:bg-slate-800';
  };

  return (
    <div
      className={`${getCardBgClass()} rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 ${getCardBorderClass()} flex flex-col h-full`}
    >
      {/* Header with Title and Priority Badge */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-1 leading-tight transition-colors">
          {task.Title}
        </h3>
        <span
          className={`px-3 py-1 rounded-md text-xs font-bold border-2 whitespace-nowrap ${getPriorityBadgeClass(
            task.Priority
          )}`}
        >
          {task.Priority}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow min-h-[3.5rem] transition-colors">
        {task.Description}
      </p>

      {/* Task Details Section */}
      <div className="space-y-3 mb-4">
        {/* Estimated Hours */}
        <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm transition-colors">
          <Clock className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="font-medium">{task.EstimatedHours}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">hours estimated</span>
        </div>

        {/* Assigned To */}
        <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
          <span className="font-medium text-gray-900 dark:text-white">Assigned to:</span>{' '}
          <span className="text-gray-600 dark:text-gray-400">
            {Array.isArray(task.AssignedTo) 
              ? task.AssignedTo.length > 0 
                ? (
                    <span className="flex flex-wrap gap-1 items-center">
                      {task.AssignedTo.map((userId, index) => (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                        >
                          <UserIcon className="w-3 h-3" />
                          {getUserName(userId)}
                          {index < task.AssignedTo.length - 1 && ','}
                        </span>
                      ))}
                    </span>
                  )
                : 'No one assigned'
              : task.AssignedTo || 'No one assigned'}
          </span>
        </div>

        {/* Put On Hold By - Only show if task is on hold */}
        {task.Status === TaskStatus.Hold && task.PutOnHoldBy && (
          <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
            <span className="font-medium text-gray-900 dark:text-white">Put on hold by:</span>{' '}
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {task.PutOnHoldByName || getUserName(task.PutOnHoldBy)}
            </span>
          </div>
        )}

        {/* Creation Timestamp */}
        <div className="flex items-center text-gray-600 dark:text-gray-400 text-xs transition-colors">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          <span>Created {formatDate(task.CreatedAt)}</span>
        </div>

        {/* Scheduled Start Date/Time - Only show if scheduled date/time exists */}
        {formatScheduledDateTime() && (
          <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            <span>Starts: {formatScheduledDateTime()}</span>
          </div>
        )}

        {/* Countdown Timer - Only show if scheduled date/time exists */}
        {timeRemaining && (
          <div
            className={`flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-md ${
              isDeadlineApproaching
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            <span>{timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-100 dark:border-slate-700 transition-colors">
        <span
          className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${getStatusBadgeClass(
            task.Status
          )}`}
        >
          {task.Status}
        </span>

        <div className="flex items-center gap-2">
          {/* Put on Hold button - only show if task is not already on hold and user has permission */}
          {canHold && task.Status !== TaskStatus.Hold && (
            <button
              onClick={() => handleStatusChange(TaskStatus.Hold)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-md transition-colors border border-orange-200 dark:border-orange-800"
              type="button"
            >
              Put on Hold
            </button>
          )}

          {/* Status Update Dropdown - only show if task is not on hold and user can update status */}
          {canUpdateStatus && hasNextStatus && task.Status !== TaskStatus.Hold && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
                type="button"
              >
                Update
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-20">
                    <div className="py-1">
                      {nextStatusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          type="button"
                        >
                          Move to {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Resume from Hold button - show if task is on hold and user has Hold Task permission
              This works independently of Edit permission - users with only Hold permission can resume tasks */}
          {canHold && task.Status === TaskStatus.Hold && hasNextStatus && (
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
              type="button"
              title="Resume task from hold"
            >
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {(canEdit || canDelete) && (
        <div className="mt-auto flex gap-2">
          {/* Edit Button */}
          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-all duration-200 border border-gray-200 dark:border-slate-600"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              onClick={handleDeleteClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-all duration-200 border border-gray-200 dark:border-slate-600"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        taskTitle={task.Title}
      />

      {/* Resume Task Modal */}
      <ResumeTaskModal
        isOpen={isResumeModalOpen}
        task={task}
        onClose={() => setIsResumeModalOpen(false)}
        onResume={handleResumeFromHold}
      />
    </div>
  );
};
