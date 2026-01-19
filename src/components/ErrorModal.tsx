import { AlertCircle, X } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

/**
 * ErrorModal Component
 * A styled error modal for displaying error messages
 * Supports both light and dark modes with blurred backdrop
 */
export const ErrorModal = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
}: ErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20 dark:bg-black/30 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{message}</span>
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0 border-t border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
