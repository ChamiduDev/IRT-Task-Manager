/**
 * System Permissions
 * Only includes permissions for features that are currently implemented
 * Future features can be added here as they are built
 */

/**
 * Permission categories with descriptions
 */
export interface PermissionCategory {
  category: string;
  description: string;
  permissions: {
    value: string;
    label: string;
    description: string;
  }[];
}

/**
 * All implemented permissions organized by category
 */
export const IMPLEMENTED_PERMISSIONS: PermissionCategory[] = [
  {
    category: 'Task Management',
    description: 'Manage tasks: create, view, update, and delete tasks',
    permissions: [
      {
        value: 'tasks:create',
        label: 'Create Tasks',
        description: 'Create new tasks in the system',
      },
      {
        value: 'tasks:read',
        label: 'View Assigned Tasks',
        description: 'Allows viewing tasks assigned to you.',
      },
      {
        value: 'tasks:view-all',
        label: 'View All Tasks',
        description: 'Allows viewing all tasks, not just assigned ones.',
      },
      {
        value: 'tasks:update',
        label: 'Edit Tasks',
        description: 'Edit existing tasks',
      },
      {
        value: 'tasks:delete',
        label: 'Delete Tasks',
        description: 'Delete tasks from the system',
      },
      {
        value: 'tasks:hold',
        label: 'Hold Tasks',
        description: 'Put tasks on hold',
      },
    ],
  },
  {
    category: 'User Management',
    description: 'Manage users: create, view, update, delete users and change passwords',
    permissions: [
      {
        value: 'users:create',
        label: 'Create Users',
        description: 'Create new user accounts',
      },
      {
        value: 'users:read',
        label: 'View Users',
        description: 'View user list and details',
      },
      {
        value: 'users:update',
        label: 'Edit Users',
        description: 'Edit user information',
      },
      {
        value: 'users:delete',
        label: 'Delete Users',
        description: 'Delete user accounts',
      },
      {
        value: 'users:change-password',
        label: 'Change Passwords',
        description: 'Change user passwords',
      },
    ],
  },
  {
    category: 'Role Management',
    description: 'Manage roles and permissions: create, view, update, and delete roles',
    permissions: [
      {
        value: 'roles:create',
        label: 'Create Roles',
        description: 'Create new roles',
      },
      {
        value: 'roles:read',
        label: 'View Roles',
        description: 'View roles and their permissions',
      },
      {
        value: 'roles:update',
        label: 'Edit Roles',
        description: 'Edit roles and permissions',
      },
      {
        value: 'roles:delete',
        label: 'Delete Roles',
        description: 'Delete roles from the system',
      },
    ],
  },
  {
    category: 'Dashboard',
    description: 'Access dashboard and view statistics',
    permissions: [
      {
        value: 'dashboard:view',
        label: 'View Dashboard',
        description: 'Access the main dashboard page',
      },
      {
        value: 'dashboard:statistics',
        label: 'View Statistics',
        description: 'View task statistics and metrics',
      },
      {
        value: 'dashboard:view-users',
        label: 'View Active Users',
        description: 'View the number of active users on the dashboard',
      },
      {
        value: 'dashboard:view-accuracy',
        label: 'View Task Accuracy',
        description: 'View overall task accuracy statistics on the dashboard',
      },
      {
        value: 'dashboard:view-duration',
        label: 'View Task Duration',
        description: 'View completed task duration statistics on the dashboard',
      },
    ],
  },
];

/**
 * Get all permission values as a flat array
 */
export const getAllPermissionValues = (): string[] => {
  return IMPLEMENTED_PERMISSIONS.flatMap(category => 
    category.permissions.map(p => p.value)
  );
};
