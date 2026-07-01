import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl, getApiConfig } from '../../Utils/api';

/** When true, permission checks call the API; when false, no API call and all permissions are treated as allowed */
const isCheckPermissionEnabled = (): boolean =>
  String(import.meta.env.VITE_CHECK_PERMISSION).toLowerCase() === 'true';

/** When false, hierarchy fields are hidden and validation is skipped */
export const isHierarchyApplyEnabled = (): boolean =>
  String(import.meta.env.VITE_HIERARCHY_APPLY).toLowerCase() !== 'false';

// ============================================
// TYPES
// ============================================

export interface Permission {
  id: string;
  moduleId: string;
  module?: any;
  apiId?: string;
  api?: any;
  description: string | null;
  apiMethod?: string;
  apiRoute?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isPublic?: boolean;
  hierarchy: number;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  permissions?: { permission: Permission }[];
  modules?: { module: any }[];
  _count?: {
    users: number;
    permissions: number;
    modules: number;
  };
}

/** Shape of GET /api/roles `data` when paginated */
export interface RolesListPayload {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  hierarchy?: number;
  isPublic?: boolean;
  addModuleIds?: string[];
  removeModuleIds?: string[];
  addPermissionIds?: string[];
  removePermissionIds?: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  hierarchy: number;
  permissionIds?: string[];
}

export interface CreatePermissionRequest {
  module: string;
  description?: string;
  apiMethod: string;
  apiRoute: string;
}

export interface CreatePermissionWithMenuRequest extends CreatePermissionRequest {
  menuLabel: string;
  menuIcon?: string;
  menuRoute?: string;
  menuParentId?: string | null;
  menuOrderIndex?: number;
  menuIsActive?: boolean;
  existingMenuId?: string;
}

export interface EndpointCheckResult {
  method: string;
  path: string;
  allowed: boolean;
}

// ============================================
// ROLE SERVICES
// ============================================

/**
 * Unwrap GET /api/roles body: either a bare Role[] or `{ roles, total, page, ... }`.
 */
function unwrapRolesResponseData(data: unknown): Role[] {
  if (Array.isArray(data)) return data as Role[];
  if (
    data &&
    typeof data === 'object' &&
    'roles' in data &&
    Array.isArray((data as RolesListPayload).roles)
  ) {
    return (data as RolesListPayload).roles;
  }
  return [];
}

export interface GetRolesParams {
  page?: number;
  /** Backend caps this (e.g. 100) */
  limit?: number;
  /** Filter by UserRole.isPublic (true = company-visible roles) */
  isPublic?: boolean;
  companyId?: string | null;
  isSystem?: boolean;
  hierarchy?: number;
  parentId?: string;
  projectId?: string | null;
}

/**
 * Get All Roles (supports paginated API: unwraps `data.roles` into `data`)
 */
export const getRolesService = async (params?: GetRolesParams): Promise<ApiResponse<Role[]> & { total: number }> => {
  const response = await apiInstance.get<ApiResponse<Role[] | RolesListPayload>>(getApiUrl('getRoles'), {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
      ...(params?.isPublic !== undefined ? { isPublic: String(params.isPublic) } : {}),
      ...(params?.isSystem !== undefined ? { isSystem: String(params.isSystem) } : {}),
      ...(params?.companyId !== undefined ? { companyId: params.companyId === null ? 'null' : params.companyId } : {}),
      ...(params?.hierarchy !== undefined ? { hierarchy: params.hierarchy } : {}),
      ...(params?.parentId !== undefined ? { parentId: params.parentId } : {}),
      ...(params?.projectId !== undefined ? { projectId: params.projectId === null ? 'null' : params.projectId } : {}),
    },
  });
  const body = response.data;
  const rawData = body.data;
  const roles = unwrapRolesResponseData(rawData);
  const total = rawData && !Array.isArray(rawData) && 'total' in rawData ? (rawData as RolesListPayload).total : roles.length;
  return {
    ...body,
    data: roles,
    total,
  };
};

/**
 * Get Role By ID
 */
export const getRoleByIdService = async (roleId: string): Promise<ApiResponse<Role>> => {
  const response = await apiInstance.get<ApiResponse<Role>>(getApiUrl('getRoleById', { id: roleId }));
  return response.data;
};

/**
 * Create Role
 */
export const createRoleService = async (roleData: CreateRoleRequest): Promise<ApiResponse<Role>> => {
  const response = await apiInstance.post<ApiResponse<Role>>(
    getApiUrl('createRole'),
    roleData
  );
  return response.data;
};

/**
 * Update Role
 */
export const updateRoleService = async (roleId: string, roleData: UpdateRoleRequest): Promise<ApiResponse<Role>> => {
  const response = await apiInstance.put<ApiResponse<Role>>(
    getApiUrl('updateRole', { id: roleId }),
    roleData
  );
  return response.data;
};

/**
 * Get Grouped Permissions for Roles
 */
export const getRolesPermissionsService = async (): Promise<ApiResponse<Record<string, any[]>>> => {
  const response = await apiInstance.get<ApiResponse<Record<string, any[]>>>(getApiUrl('getRolesPermissions'));
  return response.data;
};

/**
 * Delete Role
 */
export const deleteRoleService = async (roleId: string): Promise<ApiResponse<null>> => {
  const response = await apiInstance.delete<ApiResponse<null>>(
    getApiUrl('deleteRole', { id: roleId })
  );
  return response.data;
};

// ============================================
// PERMISSION SERVICES
// ============================================

/**
 * Get All Permissions
 */
export const getPermissionsService = async (params?: {
  search?: string;
  method?: string;
  matchType?: 'like' | 'exact';
  page?: number;
  limit?: number;
  moduleId?: string;
  projectId?: string | null;
}): Promise<ApiResponse<{ data: Permission[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const response = await apiInstance.get(getApiUrl('getPermissions'), { params });
  return response.data;
};

/**
 * Create Permission
 */
export const createPermissionService = async (data: CreatePermissionRequest): Promise<ApiResponse<Permission>> => {
  const response = await apiInstance.post<ApiResponse<Permission>>(getApiUrl('createPermission'), data);
  return response.data;
};

/**
 * Create Permission with Menu
 */
export const createPermissionWithMenuService = async (data: CreatePermissionWithMenuRequest): Promise<ApiResponse<any>> => {
  const response = await apiInstance.post<ApiResponse<any>>(getApiUrl('createPermissionWithMenu'), data);
  return response.data;
};

/**
 * Delete Permission
 */
export const deletePermissionService = async (permissionId: string): Promise<ApiResponse<null>> => {
  const response = await apiInstance.delete<ApiResponse<null>>(getApiUrl('deletePermission', { id: permissionId }));
  return response.data;
};

/**
 * Remove all permissions and menu access for a module from a role
 */
export const removePermissionsByModuleAndRoleService = async (moduleId: string, roleId: string): Promise<ApiResponse<any>> => {
  const response = await apiInstance.delete<ApiResponse<any>>(getApiUrl('removePermissionsByModuleAndRole'), {
    data: { moduleId, roleId }
  });
  return response.data;
};

/**
 * Get Permissions for a Role
 */
export const getRolePermissionsService = async (roleId: string): Promise<ApiResponse<Permission[]>> => {
  const response = await apiInstance.get<ApiResponse<Permission[]>>(getApiUrl('getRolePermissions', { roleId }));
  return response.data;
};

/**
 * Check permissions for multiple API endpoints (batch)
 * Accepts frontend endpoint keys (from API_CONFIG) and optional path params.
 * Backend uses method + path to resolve permissions.
 * When VITE_CHECK_PERMISSION is false, skips the API call and returns all allowed.
 */
export const checkEndpointPermissionsService = async (
  endpoints: { endpointKey: string; pathParams?: Record<string, string> }[]
): Promise<ApiResponse<{ results: EndpointCheckResult[] }>> => {
  if (!isCheckPermissionEnabled()) {
    const results: EndpointCheckResult[] = endpoints.map(({ endpointKey, pathParams }) => {
      const { url, method } = getApiConfig(endpointKey, pathParams || {});
      const { pathname } = new URL(url);
      return { method, path: pathname, allowed: true };
    });
    return { success: 200, data: { results }, message: 'Permission check disabled' };
  }

  // Build payload in the format backend expects: [{ method, path }]
  const payloadEndpoints = endpoints.map(({ endpointKey, pathParams }) => {
    const { url, method } = getApiConfig(endpointKey, pathParams || {});
    const { pathname } = new URL(url);
    return {
      method,
      path: pathname,
    };
  });

  const response = await apiInstance.post<ApiResponse<{ results: EndpointCheckResult[] }>>(
    getApiUrl('checkEndpointPermissions'),
    { endpoints: payloadEndpoints }
  );

  return response.data;
};
