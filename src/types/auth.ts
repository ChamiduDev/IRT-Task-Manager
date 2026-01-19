/**
 * User role enumeration
 */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

/**
 * User interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions?: string[];
  CreatedAt: Date | string;
  UpdatedAt: Date | string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Create user DTO
 * Supports both roleId (new system) and role (old system) for backward compatibility
 */
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: UserRole; // Old system - for backward compatibility
  roleId?: string; // New system - preferred
}
