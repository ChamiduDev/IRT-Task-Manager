import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Task } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { UserSearch } from './UserSearch';
import { X } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'CreatedAt' | 'UpdatedAt'>) => void;
}

/**
 * AddTaskModal Component
 * Provides a form to create new tasks with validation
 * Supports both light and dark modes
 */
// Character limits for form fields
const TITLE_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 5000;

export const AddTaskModal = ({ isOpen, onClose, onAddTask }: AddTaskModalProps) => {
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

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.Title.trim()) {
      newErrors.Title = 'Title is required';
    } else if (formData.Title.length > TITLE_MAX_LENGTH) {
      newErrors.Title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
    }

    if (!formData.Description.trim()) {
      newErrors.Description = 'Description is required';
    } else if (formData.Description.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.Description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`;
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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      onAddTask(formData);
      // Reset form
      setFormData({
        Title: '',
        Description: '',
        Status: TaskStatus.Pending,
        Priority: TaskPriority.Medium,
        EstimatedHours: 0,
        AssignedTo: [],
        ScheduledStartDate: '',
        ScheduledStartTime: '',
      });
      setErrors({});
      onClose();
    }
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Enforce character limits
    let processedValue = value;
    if (name === 'Title' && value.length > TITLE_MAX_LENGTH) {
      processedValue = value.slice(0, TITLE_MAX_LENGTH);
    } else if (name === 'Description' && value.length > DESCRIPTION_MAX_LENGTH) {
      processedValue = value.slice(0, DESCRIPTION_MAX_LENGTH);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'EstimatedHours' ? parseFloat(processedValue) || 0 : processedValue,
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

  // Handle user selection change
  const handleUserSelectionChange = (userIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      AssignedTo: userIds,
    }));

    // Clear error when users are selected
    if (errors.AssignedTo) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.AssignedTo;
        return newErrors;
      });
    }
  };

  // Handle modal close and reset
  const handleClose = () => {
    setFormData({
      Title: '',
      Description: '',
      Status: TaskStatus.Pending,
      Priority: TaskPriority.Medium,
      EstimatedHours: 0,
      AssignedTo: [],
      ScheduledStartDate: '',
      ScheduledStartTime: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

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
            Add New Task
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
                htmlFor="Title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
              >
                Title <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                id="Title"
                name="Title"
                value={formData.Title}
                onChange={handleChange}
                maxLength={TITLE_MAX_LENGTH}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors ${
                  errors.Title
                    ? 'border-red-500 dark:border-red-400'
                    : formData.Title.length > TITLE_MAX_LENGTH * 0.9
                    ? 'border-orange-500 dark:border-orange-400'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                placeholder="Enter task title"
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.Title && (
                  <p className="text-sm text-red-500 dark:text-red-400">{errors.Title}</p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.Title.length > TITLE_MAX_LENGTH
                      ? 'text-red-500 dark:text-red-400 font-semibold'
                      : formData.Title.length > TITLE_MAX_LENGTH * 0.9
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formData.Title.length > TITLE_MAX_LENGTH
                    ? `${formData.Title.length - TITLE_MAX_LENGTH} characters over limit`
                    : `${TITLE_MAX_LENGTH - formData.Title.length} characters remaining`}
                </p>
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="Description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
              >
                Description <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                id="Description"
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                rows={4}
                maxLength={DESCRIPTION_MAX_LENGTH}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors ${
                  errors.Description
                    ? 'border-red-500 dark:border-red-400'
                    : formData.Description.length > DESCRIPTION_MAX_LENGTH * 0.9
                    ? 'border-orange-500 dark:border-orange-400'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                placeholder="Enter task description"
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.Description && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {errors.Description}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.Description.length > DESCRIPTION_MAX_LENGTH
                      ? 'text-red-500 dark:text-red-400 font-semibold'
                      : formData.Description.length > DESCRIPTION_MAX_LENGTH * 0.9
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formData.Description.length > DESCRIPTION_MAX_LENGTH
                    ? `${formData.Description.length - DESCRIPTION_MAX_LENGTH} characters over limit`
                    : `${DESCRIPTION_MAX_LENGTH - formData.Description.length} characters remaining`}
                </p>
              </div>
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Field */}
              <div>
                <label
                  htmlFor="Status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Status
                </label>
                <select
                  id="Status"
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
                  htmlFor="Priority"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Priority
                </label>
                <select
                  id="Priority"
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
                  htmlFor="EstimatedHours"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Estimated Hours <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="EstimatedHours"
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
                  htmlFor="AssignedTo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Assigned To <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <UserSearch
                  selectedUserIds={formData.AssignedTo}
                  onSelectionChange={handleUserSelectionChange}
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
                  htmlFor="ScheduledStartDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Scheduled Start Date
                </label>
                <input
                  type="date"
                  id="ScheduledStartDate"
                  name="ScheduledStartDate"
                  value={formData.ScheduledStartDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Task will auto-start at scheduled time
                </p>
              </div>

              {/* Scheduled Start Time */}
              <div>
                <label
                  htmlFor="ScheduledStartTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors"
                >
                  Scheduled Start Time
                </label>
                <input
                  type="time"
                  id="ScheduledStartTime"
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
