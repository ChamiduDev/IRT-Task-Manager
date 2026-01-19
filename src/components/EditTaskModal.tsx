import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Task } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { UserSearch } from './UserSearch';
import { X } from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (taskId: string, task: Partial<Task>) => Promise<any>;
}

/**
 * EditTaskModal Component
 * Provides a form to edit existing tasks with validation
 * Supports both light and dark modes
 */
export const EditTaskModal = ({ isOpen, task, onClose, onUpdateTask }: EditTaskModalProps) => {
  const [formData, setFormData] = useState({
    Title: '',
    Description: '',
    Status: TaskStatus.Pending,
    Priority: TaskPriority.Medium,
    EstimatedHours: 0,
    AssignedTo: [] as string[],
    ScheduledStartDate: '',
    ScheduledStartTime: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      // ScheduledStartDate is now always a string (YYYY-MM-DD) from the backend
      // Use it directly without any conversion
      const scheduledDate = task.ScheduledStartDate && typeof task.ScheduledStartDate === 'string'
        ? task.ScheduledStartDate
        : '';

      // Handle AssignedTo: convert string to array or use array directly
      let assignedTo: string[] = [];
      if (Array.isArray(task.AssignedTo)) {
        assignedTo = task.AssignedTo;
      } else if (typeof task.AssignedTo === 'string' && task.AssignedTo.trim()) {
        // For backward compatibility: if it's a string, try to parse as JSON
        try {
          const parsed = JSON.parse(task.AssignedTo);
          if (Array.isArray(parsed)) {
            assignedTo = parsed;
          } else {
            // Old format: single string, convert to array with single element
            // But we don't have user IDs in old format, so we'll leave it empty
            // and let user re-select
            assignedTo = [];
          }
        } catch {
          // Not JSON, old format - leave empty for user to re-select
          assignedTo = [];
        }
      }

      setFormData({
        Title: task.Title || '',
        Description: task.Description || '',
        Status: task.Status || TaskStatus.Pending,
        Priority: task.Priority || TaskPriority.Medium,
        EstimatedHours: task.EstimatedHours || 0,
        AssignedTo: assignedTo,
        ScheduledStartDate: scheduledDate,
        ScheduledStartTime: task.ScheduledStartTime || '',
      });
      setErrors({});
    }
  }, [task]);

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.Title.trim()) {
      newErrors.Title = 'Title is required';
    }

    if (!formData.Description.trim()) {
      newErrors.Description = 'Description is required';
    }

    if (formData.EstimatedHours <= 0) {
      newErrors.EstimatedHours = 'Estimated hours must be greater than 0';
    }

    if (formData.AssignedTo.length === 0) {
      newErrors.AssignedTo = 'At least one user must be assigned';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('EditTaskModal: Form submitted', { taskId: task?.id, formData });

    if (isSubmitting) {
      console.log('EditTaskModal: Already submitting, ignoring');
      return;
    }

    if (!validateForm()) {
      console.log('EditTaskModal: Validation failed', errors);
      return;
    }

    if (!task?.id) {
      console.error('EditTaskModal: No task ID');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('EditTaskModal: Calling onUpdateTask with:', {
        taskId: task.id,
        data: {
          Title: formData.Title,
          Description: formData.Description,
          Status: formData.Status,
          Priority: formData.Priority,
          EstimatedHours: formData.EstimatedHours,
          AssignedTo: formData.AssignedTo,
          ScheduledStartDate: formData.ScheduledStartDate || null,
          ScheduledStartTime: formData.ScheduledStartTime || null,
        }
      });
      
      // Convert EstimatedHours to number
      const estimatedHours = typeof formData.EstimatedHours === 'number' 
        ? formData.EstimatedHours 
        : parseFloat(String(formData.EstimatedHours)) || 0;
      
      // Format ScheduledStartTime to HH:MM (remove seconds if present)
      let scheduledTime = formData.ScheduledStartTime || null;
      if (scheduledTime && scheduledTime.length > 5) {
        // If time has seconds (HH:MM:SS), remove them
        scheduledTime = scheduledTime.substring(0, 5);
      }
      
      await onUpdateTask(task.id, {
        Title: formData.Title,
        Description: formData.Description,
        Status: formData.Status,
        Priority: formData.Priority,
        EstimatedHours: estimatedHours,
        AssignedTo: formData.AssignedTo,
        ScheduledStartDate: formData.ScheduledStartDate || undefined,
        ScheduledStartTime: scheduledTime || undefined,
      });
      
      console.log('EditTaskModal: Update completed successfully');
      // Modal will be closed by handleUpdateTask on success
    } catch (error: any) {
      // Error is logged in handleUpdateTask, modal stays open
      console.error('EditTaskModal: Update failed', error);
      console.error('EditTaskModal: Error details', error.response?.data || error.message);
      alert(`Failed to update task: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'EstimatedHours' ? parseFloat(value) || 0 : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle modal close
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20 dark:bg-black/30 transition-opacity duration-300"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
            Edit Task
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Title Field */}
            <div>
              <label
                htmlFor="editTitle"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
              >
                Title <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                id="editTitle"
                name="Title"
                value={formData.Title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors ${
                  errors.Title
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                placeholder="Enter task title"
              />
              {errors.Title && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.Title}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="editDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
              >
                Description <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                id="editDescription"
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors ${
                  errors.Description
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                placeholder="Enter task description"
              />
              {errors.Description && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.Description}
                </p>
              )}
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Field */}
              <div>
                <label
                  htmlFor="editStatus"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Status
                </label>
                <select
                  id="editStatus"
                  name="Status"
                  value={formData.Status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                >
                  <option value={TaskStatus.Pending}>{TaskStatus.Pending}</option>
                  <option value={TaskStatus.InProgress}>{TaskStatus.InProgress}</option>
                  <option value={TaskStatus.Completed}>{TaskStatus.Completed}</option>
                </select>
              </div>

              {/* Priority Field */}
              <div>
                <label
                  htmlFor="editPriority"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Priority
                </label>
                <select
                  id="editPriority"
                  name="Priority"
                  value={formData.Priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                >
                  <option value={TaskPriority.Low}>{TaskPriority.Low}</option>
                  <option value={TaskPriority.Medium}>{TaskPriority.Medium}</option>
                  <option value={TaskPriority.High}>{TaskPriority.High}</option>
                  <option value={TaskPriority.Critical}>{TaskPriority.Critical}</option>
                </select>
              </div>
            </div>

            {/* Estimated Hours and Assigned To Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estimated Hours Field */}
              <div>
                <label
                  htmlFor="editEstimatedHours"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Estimated Hours <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="editEstimatedHours"
                  name="EstimatedHours"
                  value={formData.EstimatedHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors ${
                    errors.EstimatedHours
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                  placeholder="0"
                />
                {errors.EstimatedHours && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                    {errors.EstimatedHours}
                  </p>
                )}
              </div>

              {/* Assigned To Field */}
              <div className="md:col-span-2">
                <label
                  htmlFor="editAssignedTo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Assigned To <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <UserSearch
                  selectedUserIds={formData.AssignedTo}
                  onSelectionChange={(userIds) => {
                    setFormData((prev) => ({ ...prev, AssignedTo: userIds }));
                    if (errors.AssignedTo) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.AssignedTo;
                        return newErrors;
                      });
                    }
                  }}
                  error={errors.AssignedTo}
                  placeholder="Search users by username or name..."
                />
              </div>
            </div>

            {/* Scheduled Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Start Date */}
              <div>
                <label
                  htmlFor="editScheduledStartDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Scheduled Start Date
                </label>
                <input
                  type="date"
                  id="editScheduledStartDate"
                  name="ScheduledStartDate"
                  value={formData.ScheduledStartDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Task will auto-start at scheduled time
                </p>
              </div>

              {/* Scheduled Start Time */}
              <div>
                <label
                  htmlFor="editScheduledStartTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Scheduled Start Time
                </label>
                <input
                  type="time"
                  id="editScheduledStartTime"
                  name="ScheduledStartTime"
                  value={formData.ScheduledStartTime}
                  onChange={handleChange}
                  disabled={!formData.ScheduledStartDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Required if date is set
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
