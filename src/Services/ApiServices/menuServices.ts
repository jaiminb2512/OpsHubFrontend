import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

// ============================================
// TYPES
// ============================================

export interface Menu {
    id: string;
    label: string;
    icon: string | null;
    route: string | null;
    parentId: string | null;
    orderIndex: number;
    isActive: boolean;
    visibleInMenu?: boolean;
    hasChildren?: boolean;
    createdAt?: string;
    permissions?: { permissionId: string; permission?: { id: string; description?: string | null; apiMethod?: string; apiRoute?: string } }[];
    children?: Menu[];
    parent?: Menu;
    projectId?: string | null;
}

export interface CreateMenuRequest {
    label: string;
    icon?: string;
    route?: string;
    parentId?: string | null;
    orderIndex?: number;
    isActive?: boolean;
    visibleIf?: any;
    permissionIds?: string[];
    projectId?: string | null;
}

// ============================================
// MENU SERVICES
// ============================================

/**
 * Get All Menus
 * @param flat - If true, returns a flat list instead of a hierarchy
 */
export const getMenusService = async (
    flat: boolean = false,
    params?: { search?: string; matchType?: 'exact' | 'like'; projectId?: string | null; page?: number; limit?: number; isActive?: boolean }
): Promise<ApiResponse<any>> => {
    const query = new URLSearchParams({ flat: String(flat) });
    if (params?.search) {
        query.set('search', params.search);
        query.set('matchType', params.matchType ?? 'like');
    }
    if (params?.projectId !== undefined && params?.projectId !== null) {
        query.set('projectId', params.projectId);
    }
    if (params?.page !== undefined) {
        query.set('page', String(params.page));
    }
    if (params?.limit !== undefined) {
        query.set('limit', String(params.limit));
    }
    if (params?.isActive !== undefined) {
        query.set('isActive', String(params.isActive));
    }
    const url = `${getApiUrl('getMenus')}?${query.toString()}`;
    const response = await apiInstance.get<ApiResponse<any>>(url);
    return response.data;
};

/**
 * Get Menu By ID
 */
export const getMenuByIdService = async (id: string): Promise<ApiResponse<Menu>> => {
    const response = await apiInstance.get<ApiResponse<Menu>>(getApiUrl('getMenuById', { id }));
    return response.data;
};

/**
 * Create Menu
 */
export const createMenuService = async (data: CreateMenuRequest): Promise<ApiResponse<Menu>> => {
    const response = await apiInstance.post<ApiResponse<Menu>>(getApiUrl('createMenu'), data);
    return response.data;
};

/**
 * Update Menu
 */
export const updateMenuService = async (id: string, data: CreateMenuRequest): Promise<ApiResponse<Menu>> => {
    const response = await apiInstance.put<ApiResponse<Menu>>(
        getApiUrl('updateMenu', { id }),
        data
    );
    return response.data;
};

/**
 * Delete Menu
 */
/**
 * Delete Menu
 */
export const deleteMenuService = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiInstance.delete<ApiResponse<null>>(
        getApiUrl('deleteMenu', { id })
    );
    return response.data;
};

/**
 * Get Menus by Role ID
 */
export const getMenuByRoleIdService = async (roleId: string): Promise<ApiResponse<Menu[]>> => {
    const response = await apiInstance.get<ApiResponse<Menu[]>>(
        getApiUrl('getMenuByRoleId', { roleId })
    );
    return response.data;
};

/**
 * Get My Menus
 */
export const getMyMenusService = async (): Promise<ApiResponse<Menu[]>> => {
    const response = await apiInstance.get<ApiResponse<Menu[]>>(
        getApiUrl('getMyMenus')
    );
    return response.data;
};

/**
 * Get Menu Children (filtered by user's role permissions)
 */
export const getMenuChildrenService = async (parentMenuId: string): Promise<ApiResponse<Menu[]>> => {
    const response = await apiInstance.get<ApiResponse<Menu[]>>(
        getApiUrl('getMenuChildren', { id: parentMenuId })
    );
    return response.data;
};
