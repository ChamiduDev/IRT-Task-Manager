import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { TaskStatus } from '../types';
import { X, Clock, Calendar } from 'lucide-react';

interface ResumeTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onResume: (taskId: string, status: TaskStatus, scheduledDate?: string, scheduledTime?: string) => void;
}

/**
 * ResumeTaskModal Component
 * Modal for resuming a task from hold status with scheduling options
 * Supports both light and dark modes
 */
export const ResumeTaskModal = ({ isOpen, task, onClose, onResume }: ResumeTaskModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(TaskStatus.Pending);
  const [scheduleOption, setScheduleOption] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen && task) {
      setSelectedStatus(TaskStatus.Pending);
      setScheduleOption('now');
      // Set default to today's date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      setScheduledDate(dateStr);
      // Set default time to current time rounded to nearest 15 minutes
      const hours = today.getHours();
      const minutes = Math.round(today.getMinutes() / 15) * 15;
      setScheduledTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDate: string | undefined;
    let finalTime: string | undefined;

    if (scheduleOption === 'now') {
      // Schedule for now - use current date and time
      const now = new Date();
      finalDate = now.toISOString().split('T')[0];
      const hours = now.getHours();
      const minutes = now.getMinutes();
      finalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // Schedule for later - use selected date and time
      if (!scheduledDate) {
        alert('Please select a scheduled date');
        return;
      }
      if (!scheduledTime) {
        alert('Please select a scheduled time');
        return;
      }
      finalDate = scheduledDate;
      finalTime = scheduledTime;
    }

    onResume(task.id!, selectedStatus, finalDate, finalTime);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resume Task</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{task.Title}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              New Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedStatus(TaskStatus.Pending)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedStatus === TaskStatus.Pending
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="font-semibold">Pending</div>
                <div className="text-xs mt-1 opacity-75">Task is ready to start</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus(TaskStatus.InProgress)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedStatus === TaskStatus.InProgress
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="font-semibold">In Progress</div>
                <div className="text-xs mt-1 opacity-75">Task is actively being worked on</div>
              </button>
            </div>
          </div>

          {/* Scheduling Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Schedule Time
            </label>
            <div className="space-y-3">
              {/* Schedule Now Option */}
              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                scheduleOption === 'now'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="scheduleOption"
                  value="now"
                  checked={scheduleOption === 'now'}
                  onChange={() => setScheduleOption('now')}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Schedule Now</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Set scheduled time to current date and time
                  </p>
                </div>
              </label>

              {/* Schedule Later Option */}
              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                scheduleOption === 'later'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="scheduleOption"
                  value="later"
                  checked={scheduleOption === 'later'}
                  onChange={() => setScheduleOption('later')}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Schedule Later</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choose a future date and time
                  </p>
                </div>
              </label>
            </div>

            {/* Date and Time Pickers (shown when Schedule Later is selected) */}
            {scheduleOption === 'later' && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="scheduledDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={minDate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                    required={scheduleOption === 'later'}
                  />
                </div>
                <div>
                  <label
                    htmlFor="scheduledTime"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                    required={scheduleOption === 'later'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
            >
              Resume Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
