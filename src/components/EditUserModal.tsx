import { useState, FormEvent, useEffect } from 'react';
import type { User } from '../types/auth';
import { roleService } from '../services/role';
import type { Role } from '../types/role';
import { X, Loader2, AlertCircle } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onUpdate: (id: string, userData: { username?: string; email?: string; fullName?: string; roleId?: string }) => Promise<void>;
}

/**
 * Edit User Modal Component
 * Allows admin to edit user details
 */
export const EditUserModal = ({ isOpen, user, onClose, onUpdate }: EditUserModalProps) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    roleId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch roles when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchRoles = async () => {
        try {
          setLoadingRoles(true);
          const fetchedRoles = await roleService.getAllRoles();
          setRoles(fetchedRoles);
        } catch (err) {
          console.error('Failed to fetch roles:', err);
        } finally {
          setLoadingRoles(false);
        }
      };
      fetchRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      // Find role by name (matching user.role to role.name)
      // For now, we'll try to match by name, but ideally user should have roleId
      const matchingRole = roles.find((r) => r.name.toLowerCase() === user.role.toLowerCase());
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roleId: matchingRole?.id || roles[0]?.id || '',
      });
      setErrors({});
      setError('');
    }
  }, [user, isOpen, roles]);

  if (!isOpen || !user) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onUpdate(user.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit User
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label
              htmlFor="edit-username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Username *
            </label>
            <input
              id="edit-username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.username
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email *
            </label>
            <input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.email
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="edit-fullName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Full Name *
            </label>
            <input
              id="edit-fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.fullName
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter full name"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="edit-role"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Role *
            </label>
            {loadingRoles ? (
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Loading roles...</span>
              </div>
            ) : (
              <select
                id="edit-role"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                disabled={loading || roles.length === 0}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                {roles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
