/**
 * Role interface
 */
export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions?: string[];
  CreatedAt: Date | string;
  UpdatedAt: Date | string;
}

/**
 * Create role DTO
 */
export interface CreateRoleDTO {
  name: string;
  description?: string | null;
  permissions?: string[];
}

/**
 * Update role DTO
 */
export interface UpdateRoleDTO {
  name?: string;
  description?: string | null;
  permissions?: string[];
}
