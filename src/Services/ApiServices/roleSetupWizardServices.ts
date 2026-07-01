import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl, getApiUrlWithParams } from '../../Utils/api';
import type { Role } from './roleServices';

export interface RoleSetupListRole {
    id: string;
    name: string;
    description: string | null;
    hierarchy: number;
    isSystem?: boolean;
    createdAt?: string;
    updatedAt?: string;
    _count?: {
        users: number;
        permissions: number;
        modules: number;
    };
}

export interface PaginatedRolesRoleSetup {
    data: RoleSetupListRole[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface RoleSetupModuleGroupSummary {
    id: string;
    key: string;
    label: string;
    description?: string | null;
    orderIndex?: number;
    moduleCount?: number;
}

export interface RoleSetupModuleSummary {
    id: string;
    name: string;
    key?: string;
    label: string;
    route?: string | null;
    orderIndex?: number | null;
    totalPermission?: number;
    totalPermissions?: number;
    extraPermissions?: number;
    menus?: number;
    description?: string | null;
    moduleGroups?: RoleSetupModuleGroupSummary[];
    /** @deprecated use moduleGroups array */
    moduleGroupId?: string | null;
    /** @deprecated use moduleGroups array */
    moduleGroup?: RoleSetupModuleGroupSummary | null;
    permissions?: RoleSetupPermissionRow[];
}

export interface PaginatedModulesRoleSetup {
    data: RoleSetupModuleSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface RoleSetupPermissionRow {
    id: string;
    description: string;
    apiMethod: string;
    apiRoute: string;
    moduleId: string;
}

/** GET /roles/module-detail-by-name/:name — flat permission rows */
export interface RoleSetupModulePermissionRow {
    permission: { id: string; description: string };
    method: string;
    route: string;
    menu: { id: string; label: string; route: string | null } | null;
}

export interface CreateRoleRoleSetupRequest {
    name: string;
    description?: string;
    hierarchy?: number;
    permissionIds: string[];
    moduleIds?: string[];
    companyId?: string;
}

/** GET /role-setup/get-roles — paginated role list for the wizard */
export const getRolesRoleSetupService = async (params: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<PaginatedRolesRoleSetup>> => {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));
    const { url } = getApiUrlWithParams('getRoles', {}, {
        page: String(page),
        limit: String(limit),
    });
    const response = await apiInstance.get<ApiResponse<{ roles: RoleSetupListRole[]; total: number; page: number; limit: number; totalPages: number }>>(url);
    const payload = response.data;
    return {
        ...payload,
        data: payload.data
            ? { ...payload.data, data: payload.data.roles ?? [] }
            : payload.data,
    } as ApiResponse<PaginatedRolesRoleSetup>;
};

const MODULES_PAGE_LIMIT = 100;

/** GET /role-setup/get-modules — paginated module summaries for wizard */
export const getModulesRoleSetupService = async (params: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<PaginatedModulesRoleSetup>> => {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? MODULES_PAGE_LIMIT));
    const { url } = getApiUrlWithParams('roleSetupGetModules', {}, {
        page: String(page),
        limit: String(limit),
    });
    const response = await apiInstance.get<ApiResponse<PaginatedModulesRoleSetup>>(url);
    return response.data;
};

/** Fetches every module page (backend default limit is 10 without `limit`). */
export const fetchAllModulesRoleSetupService = async (): Promise<RoleSetupModuleSummary[]> => {
    const all: RoleSetupModuleSummary[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const res = await getModulesRoleSetupService({ page, limit: MODULES_PAGE_LIMIT });
        if (res.success !== 200 || !res.data) break;

        const { data, totalPages: pages } = res.data;
        all.push(...(data ?? []));
        totalPages = Math.max(1, pages ?? 1);
        page += 1;
    }

    return all;
};

/** GET /roles/module-detail-by-name/:name — permission, method, route, menu per row */
export const getModuleDetailByNameRoleSetupService = async (
    name: string
): Promise<ApiResponse<RoleSetupModulePermissionRow[]>> => {
    const response = await apiInstance.get<ApiResponse<RoleSetupModulePermissionRow[]>>(
        getApiUrl('roleSetupModuleDetailByName', { name })
    );
    const rows = Array.isArray(response.data.data) ? response.data.data : [];
    return { ...response.data, data: rows };
};

/** POST /role-setup/role-create */
export const createRoleRoleSetupService = async (
    body: CreateRoleRoleSetupRequest
): Promise<ApiResponse<Role>> => {
    const response = await apiInstance.post<ApiResponse<Role>>(
        getApiUrl('createRole'),
        body
    );
    return response.data;
};

/** GET /roles/wizard/module-groups — Step 2: all module groups for role wizard */
export const getRoleWizardModuleGroupsService = async (): Promise<ApiResponse<RoleSetupModuleGroupSummary[]>> => {
    const response = await apiInstance.get<ApiResponse<RoleSetupModuleGroupSummary[]>>(
        getApiUrl('roleWizardGetModuleGroups')
    );
    return response.data;
};

/** POST /roles/wizard/modules — Step 3: modules filtered by selected group IDs */
export const getRoleWizardModulesService = async (
    moduleGroupIds: string[]
): Promise<ApiResponse<RoleSetupModuleSummary[]>> => {
    const response = await apiInstance.post<ApiResponse<RoleSetupModuleSummary[]>>(
        getApiUrl('roleWizardGetModules'),
        { moduleGroupIds }
    );
    return response.data;
};
