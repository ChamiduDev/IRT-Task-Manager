import { AlertTriangle, X } from 'lucide-react';

interface DeleteUserConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  userEmail?: string;
}

/**
 * DeleteUserConfirmationModal Component
 * A confirmation modal for deleting users
 * Supports both light and dark modes with blurred backdrop
 */
export const DeleteUserConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  userName,
  userEmail,
}: DeleteUserConfirmationModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Use user object if provided, otherwise use individual props
  const displayName = user?.fullName || userName;
  const displayEmail = user?.email || userEmail;

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
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Delete User
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
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Are you sure you want to delete this user?
          </p>
          {(displayName || displayEmail) && (
            <div className="text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-200 dark:border-slate-600 mt-3">
              {displayName && (
                <p className="font-semibold">{displayName}</p>
              )}
              {displayEmail && (
                <p className="text-gray-600 dark:text-gray-400">{displayEmail}</p>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            This action cannot be undone. All user data will be permanently deleted.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0 border-t border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};
