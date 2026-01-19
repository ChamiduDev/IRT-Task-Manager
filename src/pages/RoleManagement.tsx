import { useState, useEffect, useCallback } from 'react';
import { roleService } from '../services/role';
import { taskApi } from '../services/api';
import type { Role, CreateRoleDTO, UpdateRoleDTO } from '../types/role';
import type { Task } from '../types';
import { Header } from '../components/Header';
import { AddTaskModal } from '../components/AddTaskModal';
import { DeleteRoleConfirmationModal } from '../components/DeleteRoleConfirmationModal';
import { ErrorModal } from '../components/ErrorModal';
import { IMPLEMENTED_PERMISSIONS, getAllPermissionValues } from '../constants/permissions';
import { Shield, Plus, Edit, Trash2, Loader2, AlertCircle, ChevronDown, ChevronRight, Eye, X } from 'lucide-react';

/**
 * Role Management Page
 * Allows admins to manage roles: create, view, edit, and assign permissions
 */
export const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewPermissionsModalOpen, setIsViewPermissionsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleDTO>({
    name: '',
    description: '',
    permissions: [],
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(IMPLEMENTED_PERMISSIONS.map(c => c.category)));
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  // Use implemented permissions from constants
  const availablePermissions = getAllPermissionValues();

  // Fetch roles
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const fetchedRoles = await roleService.getAllRoles();
      setRoles(fetchedRoles);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Handle create role
  const handleCreateRole = useCallback(async (roleData: CreateRoleDTO) => {
    try {
      await roleService.createRole(roleData);
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', permissions: [] });
      setSelectedPermissions([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    }
  }, [fetchData]);

  // Handle edit role
  const handleEditRole = useCallback(async (id: string, roleData: UpdateRoleDTO) => {
    try {
      await roleService.updateRole(id, roleData);
      setIsEditModalOpen(false);
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
      setSelectedPermissions([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  }, [fetchData]);

  // Handle delete role click - show confirmation modal
  const handleDeleteRole = useCallback((role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (roleToDelete) {
      try {
        await roleService.deleteRole(roleToDelete.id);
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
        fetchData();
      } catch (err: any) {
        setIsDeleteModalOpen(false);
        setErrorMessage(err.message || 'Failed to delete role');
        setIsErrorModalOpen(true);
      }
    }
  }, [roleToDelete, fetchData]);

  // Open create modal
  const openCreateModal = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setSelectedPermissions([]);
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setSelectedPermissions(role.permissions || []);
    setIsEditModalOpen(true);
  };

  // Toggle permission selection
  // Automatically adds tasks:read when tasks:view-all is selected
  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) => {
      const isCurrentlySelected = prev.includes(permission);
      
      if (isCurrentlySelected) {
        // If unchecking tasks:view-all, also remove tasks:read if it was auto-added
        if (permission === 'tasks:view-all') {
          return prev.filter((p) => p !== permission && p !== 'tasks:read');
        }
        return prev.filter((p) => p !== permission);
      } else {
        // If checking tasks:view-all, automatically add tasks:read
        if (permission === 'tasks:view-all') {
          const newPermissions = [...prev, permission];
          if (!newPermissions.includes('tasks:read')) {
            newPermissions.push('tasks:read');
          }
          return newPermissions;
        }
        return [...prev, permission];
      }
    });
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Open view permissions modal
  const openViewPermissionsModal = (role: Role) => {
    setViewingRole(role);
    setIsViewPermissionsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Header onAddTaskClick={() => setIsAddTaskModalOpen(true)} />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header onAddTaskClick={() => setIsAddTaskModalOpen(true)} />
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Role Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage roles with custom permissions
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Role</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Roles Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No roles found. Create your first role to get started.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {role.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {role.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1 flex-1">
                            {role.permissions && role.permissions.length > 0 ? (
                              role.permissions.slice(0, 3).map((permission) => (
                                <span
                                  key={permission}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300"
                                >
                                  {permission}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">No permissions</span>
                            )}
                            {role.permissions && role.permissions.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{role.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => openViewPermissionsModal(role)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
                            title="View all permissions"
                            type="button"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(role)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Edit role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete role"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Role Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Create New Role
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Ensure tasks:read is included if tasks:view-all is selected
                    const finalPermissions = selectedPermissions.includes('tasks:view-all') && !selectedPermissions.includes('tasks:read')
                      ? [...selectedPermissions, 'tasks:read']
                      : selectedPermissions;
                    handleCreateRole({
                      ...formData,
                      permissions: finalPermissions,
                    });
                  }}
                  className="space-y-4"
                >
                  {/* Role Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      placeholder="e.g., Manager, Editor, Viewer"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Describe what this role is for..."
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permissions
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        (Select permissions to enable for this role)
                      </span>
                    </label>
                    <div className="border border-gray-300 dark:border-slate-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {IMPLEMENTED_PERMISSIONS.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          {/* Category Header */}
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.category)}
                            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {expandedCategories.has(category.category) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                {category.category}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {category.permissions.filter(p => selectedPermissions.includes(p.value)).length} / {category.permissions.length}
                            </span>
                          </button>
                          
                          {/* Category Description */}
                          {expandedCategories.has(category.category) && (
                            <div className="ml-6 mt-1 mb-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {category.description}
                              </p>
                              
                              {/* Permissions List */}
                              <div className="space-y-2">
                                {category.permissions.map((permission) => (
                                  <label
                                    key={permission.value}
                                    className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissions.includes(permission.value)}
                                      onChange={() => togglePermission(permission.value)}
                                      className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {permission.label}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {permission.description}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setFormData({ name: '', description: '', permissions: [] });
                        setSelectedPermissions([]);
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Create Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {isEditModalOpen && editingRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Edit Role
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Ensure tasks:read is included if tasks:view-all is selected
                    const finalPermissions = selectedPermissions.includes('tasks:view-all') && !selectedPermissions.includes('tasks:read')
                      ? [...selectedPermissions, 'tasks:read']
                      : selectedPermissions;
                    handleEditRole(editingRole.id, {
                      ...formData,
                      permissions: finalPermissions,
                    });
                  }}
                  className="space-y-4"
                >
                  {/* Role Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permissions
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        (Select permissions to enable for this role)
                      </span>
                    </label>
                    <div className="border border-gray-300 dark:border-slate-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {IMPLEMENTED_PERMISSIONS.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          {/* Category Header */}
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.category)}
                            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {expandedCategories.has(category.category) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                {category.category}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {category.permissions.filter(p => selectedPermissions.includes(p.value)).length} / {category.permissions.length}
                            </span>
                          </button>
                          
                          {/* Category Description */}
                          {expandedCategories.has(category.category) && (
                            <div className="ml-6 mt-1 mb-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {category.description}
                              </p>
                              
                              {/* Permissions List */}
                              <div className="space-y-2">
                                {category.permissions.map((permission) => (
                                  <label
                                    key={permission.value}
                                    className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissions.includes(permission.value)}
                                      onChange={() => togglePermission(permission.value)}
                                      className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {permission.label}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {permission.description}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingRole(null);
                        setFormData({ name: '', description: '', permissions: [] });
                        setSelectedPermissions([]);
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Update Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Permissions Modal */}
        {isViewPermissionsModalOpen && viewingRole && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Permissions for {viewingRole.name}
                  </h2>
                  {viewingRole.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {viewingRole.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsViewPermissionsModalOpen(false);
                    setViewingRole(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  type="button"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {viewingRole.permissions && viewingRole.permissions.length > 0 ? (
                  <div className="space-y-4">
                    {IMPLEMENTED_PERMISSIONS.map((category) => {
                      const categoryPermissions = category.permissions.filter((p) =>
                        viewingRole.permissions?.includes(p.value)
                      );

                      if (categoryPermissions.length === 0) return null;

                      return (
                        <div key={category.category} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {category.category}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {categoryPermissions.length} permission{categoryPermissions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            {category.description}
                          </p>
                          <div className="space-y-2">
                            {categoryPermissions.map((permission) => (
                              <div
                                key={permission.value}
                                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {permission.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {permission.description}
                                  </div>
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                                      {permission.value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Permissions Assigned
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This role does not have any permissions enabled.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 pt-0 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setIsViewPermissionsModalOpen(false);
                    setViewingRole(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Role Confirmation Modal */}
        <DeleteRoleConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setRoleToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          roleName={roleToDelete?.name}
          roleDescription={roleToDelete?.description || undefined}
        />

        {/* Error Modal */}
        <ErrorModal
          isOpen={isErrorModalOpen}
          onClose={() => {
            setIsErrorModalOpen(false);
            setErrorMessage('');
          }}
          title="Cannot Delete Role"
          message={errorMessage}
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
