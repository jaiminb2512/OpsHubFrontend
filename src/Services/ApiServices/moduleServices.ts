import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';


export interface Menu {
    id: string;
    key: string;
    label: string;
    route?: string;
    icon?: string;
    hasChildren?: boolean;
    parentId?: string | null;
    orderIndex: number | null;
    isActive?: boolean;
    visibleInMenu?: boolean;
    defaultMenu?: boolean;
    children?: Menu[];
    permissions?: any[];
    totalPermission?: number;
    extraPermissions?: number;
    menus?: number;
}

// ============================================
// BULK MODULE CREATION TYPES
// ============================================

export interface MenuItemData {
    menuId?: string;
    permissionId?: string | null;
    permissionDisplay?: string;
    permissionDescription?: string;
    apiMethod?: string;
    apiRoute?: string;
    label: string;
    route: string;
    icon?: string;
    orderIndex: number;
    defaultMenu: boolean;
    children?: MenuItemData[];
    permission?: any;
}

export interface ExtraPermissionItem {
    id: string;
    display: string;
}

export interface ModuleData {
    name: string;
    description: string;
    extraPermissions: (ExtraPermissionItem | any)[];
    menus: MenuItemData[];
    // Track deletions for bulk update
    deletePermissions?: string[];
    removePermissions?: string[];
    removeMenus?: string[];
}

export interface BulkModuleCreateRequest {
    modules: ModuleData[];
}

export interface BulkModuleCreateResponse {
    module: {
        id: string;
        name: string;
        description: string | null;
    };
    menus: any[];
    extraPermissions: any[];
}

export interface PaginatedModules {
    data: Menu[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** GET /modules — paginated. Omit params or use high limit for dropdowns (default limit 500). */
export const getModulesService = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    matchType?: 'exact' | 'like';
    projectId?: string | null;
    isPublic?: boolean;
}): Promise<ApiResponse<PaginatedModules>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 500;
    const response = await apiInstance.get<ApiResponse<PaginatedModules>>('/modules', {
        params: {
            page,
            limit,
            ...(params?.search ? { search: params.search, matchType: params.matchType ?? 'like' } : {}),
            ...(params?.projectId !== undefined ? { projectId: params.projectId === null ? 'null' : params.projectId } : {}),
            ...(params?.isPublic !== undefined ? { isPublic: params.isPublic } : {}),
        },
    });
    return response.data;
};


/**
 * Create Modules in Bulk with Menus and Permissions
 */
export const createBulkModulesService = async (
    data: any
): Promise<ApiResponse<BulkModuleCreateResponse[]>> => {
    // Uses centralized getApiUrl with correct endpoint mapping
    const response = await apiInstance.post<ApiResponse<BulkModuleCreateResponse[]>>(
        getApiUrl('createBulkModules'),
        data
    );
    return response.data;
};

export const createModuleOnlyService = async (data: {
    name: string;
    description?: string;
}): Promise<ApiResponse<any>> => {
    const response = await apiInstance.post<ApiResponse<any>>(
        getApiUrl('createModuleOnly'),
        data
    );
    return response.data;
};

export const saveFeatureApiPermissionMenuModuleSetUpService = async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiInstance.post<ApiResponse<any>>(
        getApiUrl('saveFeatureApiPermissionMenuModuleSetUp'),
        data
    );
    return response.data;
};

// Get Single Module
export const getModuleService = async (id: string): Promise<ApiResponse<ModuleData>> => {
    const response = await apiInstance.get<ApiResponse<ModuleData>>(`/modules/${id}`);
    return response.data;
};

// Update Module
export const updateModuleService = async (
    id: string,
    data: any
): Promise<ApiResponse<any>> => {
    const response = await apiInstance.put<ApiResponse<any>>(`/modules/${id}`, data);
    return response.data;
};

// Delete Module
export const deleteModuleService = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiInstance.delete<ApiResponse<null>>(`/modules/${id}`);
    return response.data;
};

/** DELETE /api/modules/api-permission-menu/:apiEndpointId — removes endpoint, permissions, roles, menus */
export const deleteApiPermissionMenuSetupService = async (
    apiEndpointId: string
): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.delete<ApiResponse<unknown>>(
        `/modules/api-permission-menu/${encodeURIComponent(apiEndpointId)}`
    );
    return response.data;
};

// ----- Edit-module granular APIs (create/delete menu, create/delete permission, link) -----

export const createModuleMenuService = async (
    moduleId: string,
    data: {
        label: string;
        route?: string;
        icon?: string;
        permissionId?: string;
        parentMenuId?: string;
        orderIndex?: number;
        defaultMenu?: boolean;
        apiMethod?: string;
        apiRoute?: string;
    }
): Promise<ApiResponse<any>> => {
    const response = await apiInstance.post<ApiResponse<any>>(`/modules/${moduleId}/menus`, data);
    return response.data;
};

// --- General Permission Services ---
export const getAllPermissionsService = async (module?: string): Promise<ApiResponse<any[]>> => {
    const response = await apiInstance.get<ApiResponse<any[]>>('/permissions', {
        params: module ? { module } : {}
    });
    return response.data;
};

