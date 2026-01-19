import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';
import { taskApi } from '../services/api';
import type { User } from '../types/auth';
import type { Task } from '../types';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DeleteUserConfirmationModal } from '../components/DeleteUserConfirmationModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Edit, Key, Loader2, AlertCircle, Users, Trash2 } from 'lucide-react';

/**
 * User Management Page
 * Allows admins to manage users: create, view, edit, assign roles, and change passwords
 */
export const UserManagement = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const fetchedUsers = await authService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle add task
  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'CreatedAt' | 'UpdatedAt'>) => {
    try {
      await taskApi.createTask(taskData);
      setIsAddTaskModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  }, []);

  // Handle create user
  const handleCreateUser = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    roleId: string;
  }) => {
    try {
      await authService.createUser(userData);
      await fetchUsers();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      throw err;
    }
  }, [fetchUsers]);

  // Handle update user
  const handleUpdateUser = useCallback(async (id: string, userData: {
    username?: string;
    email?: string;
    fullName?: string;
    roleId?: string;
  }) => {
    try {
      await authService.updateUser(id, userData);
      await fetchUsers();
    } catch (err: any) {
      throw err;
    }
  }, [fetchUsers]);

  // Handle change password
  const handleChangePassword = useCallback(async (id: string, newPassword: string) => {
    try {
      await authService.changePassword(id, newPassword);
      await fetchUsers();
    } catch (err: any) {
      throw err;
    }
  }, [fetchUsers]);

  // Handle edit click
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // Handle change password click
  const handlePasswordClick = (user: User) => {
    setEditingUser(user);
    setIsPasswordModalOpen(true);
  };

  // Handle delete user click
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (userToDelete) {
      try {
        await authService.deleteUser(userToDelete.id!);
        await fetchUsers();
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } catch (err: any) {
        setError(err.message || 'Failed to delete user');
        setIsDeleteModalOpen(false);
      }
    }
  }, [userToDelete, fetchUsers]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header onAddTaskClick={() => setIsAddTaskModalOpen(true)} onCreateUserClick={() => setIsCreateModalOpen(true)} />
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions
          </p>
        </div>
        {hasPermission('users:create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create User</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No users found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Create your first user to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.CreatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('users:update') && (
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('users:change-password') && (
                            <button
                              onClick={() => handlePasswordClick(user)}
                              className="p-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                              title="Change password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('users:delete') && user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        user={editingUser}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onUpdate={handleUpdateUser}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        user={editingUser}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setEditingUser(null);
        }}
        onChangePassword={handleChangePassword}
      />

      <DeleteUserConfirmationModal
        isOpen={isDeleteModalOpen}
        user={userToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />
      </div>
    </div>
  );
};
