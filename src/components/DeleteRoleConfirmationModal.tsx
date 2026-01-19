import { AlertTriangle, X, Shield } from 'lucide-react';

interface DeleteRoleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roleName?: string;
  roleDescription?: string;
}

/**
 * DeleteRoleConfirmationModal Component
 * A styled confirmation modal for deleting roles
 * Supports both light and dark modes with blurred backdrop
 */
export const DeleteRoleConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  roleName,
  roleDescription,
}: DeleteRoleConfirmationModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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
              Delete Role
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
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete this role? This action cannot be undone.
          </p>
          {roleName && (
            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {roleName}
                  </p>
                  {roleDescription && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {roleDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Warning:</strong> Users assigned to this role may lose access to certain features. 
                Consider reassigning users to a different role before deleting.
              </span>
            </p>
          </div>
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
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            Delete Role
          </button>
        </div>
      </div>
    </div>
  );
};
