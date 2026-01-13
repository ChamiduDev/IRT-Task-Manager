import type { Task } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { Clock, Trash2, ChevronDown, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

/**
 * TaskCard Component
 * Displays individual task information with high-contrast badges, status workflow, and creation timestamp
 * Supports both light and dark modes
 */
export const TaskCard = ({ task, onStatusChange, onDelete }: TaskCardProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isDeadlineApproaching, setIsDeadlineApproaching] = useState(false);

  // Calculate deadline and countdown timer
  useEffect(() => {
    const calculateDeadline = () => {
      if (!task.ScheduledStartDate || !task.ScheduledStartTime || !task.EstimatedHours) {
        setTimeRemaining('');
        setIsDeadlineApproaching(false);
        return;
      }

      const scheduledDate = new Date(task.ScheduledStartDate);
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

    const scheduledDate = new Date(task.ScheduledStartDate);
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
  const canUpdateStatus = nextStatusOptions.length > 0;

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (task.id) {
      onStatusChange(task.id, newStatus);
    }
    setIsDropdownOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (task.id) {
      onDelete(task.id);
    }
  };

  // Get card border color based on deadline
  const getCardBorderClass = (): string => {
    if (isDeadlineApproaching && task.Status !== TaskStatus.Completed) {
      return 'border-red-500 dark:border-red-600 border-2';
    }
    return 'border-gray-200 dark:border-slate-700';
  };

  // Get card background color based on deadline
  const getCardBgClass = (): string => {
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
          <span className="text-gray-600 dark:text-gray-400">{task.AssignedTo}</span>
        </div>

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

        {canUpdateStatus && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
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
      </div>

      {/* Subtle Delete Button */}
      <button
        onClick={handleDeleteClick}
        className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-all duration-200 border border-gray-200 dark:border-slate-600"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        taskTitle={task.Title}
      />
    </div>
  );
};
