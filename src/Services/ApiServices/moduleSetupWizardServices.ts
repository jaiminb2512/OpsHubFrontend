import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

/** Backend may return a bare array or a paginated envelope `{ data: T[] }` inside `data`. */
function unwrapListPayload<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (
        payload &&
        typeof payload === 'object' &&
        'data' in payload &&
        Array.isArray((payload as { data: unknown }).data)
    ) {
        return (payload as { data: T[] }).data;
    }
    return [];
}

interface PaginatedEnvelope {
    data?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

function unwrapPaginatedPayload(payload: unknown): PaginatedEnvelope {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return payload as PaginatedEnvelope;
    }
    if (Array.isArray(payload)) {
        return { data: payload, total: payload.length, page: 1, limit: payload.length, totalPages: 1 };
    }
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
}

/** Flatten hierarchical GET /menus response when `flat=true` was not used. */
function flattenMenuTree(nodes: unknown[]): WizardMenuOption[] {
    const out: WizardMenuOption[] = [];
    const walk = (items: unknown[]) => {
        for (const node of items) {
            if (!node || typeof node !== 'object') continue;
            const m = node as Record<string, unknown>;
            if (m.id && m.label) {
                out.push({
                    id: String(m.id),
                    label: String(m.label),
                    parentId: (m.parentId as string | null | undefined) ?? null,
                    moduleId: (m.moduleId as string | null | undefined) ?? null,
                    permissionId: (m.permissionId as string | null | undefined) ?? null,
                });
            }
            if (Array.isArray(m.children)) walk(m.children);
        }
    };
    walk(nodes);
    return out;
}

const WIZARD_LIST_PAGE_LIMIT = 100;

export interface WizardModuleGroupOption {
    id: string;
    key: string;
    label: string;
}

export interface WizardModuleOption {
    id: string;
    label?: string;
    name?: string;
    key?: string;
    description?: string;
    totalPermission?: number;
    moduleGroupId?: string | null;
    moduleGroup?: WizardModuleGroupOption | null;
}

export interface WizardApiEndpointOption {
    id: string;
    method: string;
    path: string;
    key?: string;
    featureId?: string | null;
    isLimitAllowed?: boolean;
}

export interface WizardFeatureOption {
    id: string;
    name: string;
    key?: string;
}

export interface WizardMenuOption {
    id: string;
    label: string;
    parentId?: string | null;
    moduleId?: string | null;
    permissionId?: string | null;
}

/** Permission row scoped to a module (wizard / role setup). */
export interface WizardPermissionOption {
    id: string;
    moduleId: string;
    description: string;
    apiMethod?: string | null;
    apiRoute?: string | null;
    apiId?: string | null;
    action?: string | null;
    isActive?: boolean;
}

/** GET /api/module-setup/module-wizard-details/:moduleId */
export interface ModuleWizardDetailsPayload {
    module: { id: string; name: string; description: string | null };
    apiEndpoints: WizardApiEndpointOption[];
    features: WizardFeatureOption[];
    menus: WizardMenuOption[];
    permissions: WizardPermissionOption[];
}

function unwrapModuleWizardDetails(payload: unknown): ModuleWizardDetailsPayload | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    return {
        module: (p.module as ModuleWizardDetailsPayload['module']) ?? { id: '', name: '', description: null },
        apiEndpoints: Array.isArray(p.apiEndpoints) ? (p.apiEndpoints as WizardApiEndpointOption[]) : [],
        features: Array.isArray(p.features) ? (p.features as WizardFeatureOption[]) : [],
        menus: Array.isArray(p.menus) ? (p.menus as WizardMenuOption[]) : [],
        permissions: Array.isArray(p.permissions) ? (p.permissions as WizardPermissionOption[]) : [],
    };
}

export interface CreateModuleRequest {
    name: string;
    description: string;
    isPublic?: boolean;
}

export interface SaveApiPermissionMenuRequest {
    moduleId: string;
    permissionDescription: string;
    menuMode: 'create' | 'select' | 'skip';
    // API — either select existing or create new
    apiId?: string;
    method?: string;
    path?: string;
    key?: string;
    isLimitAllowed?: boolean;
    featureId?: string | null;
    /** Inline feature create (with new API) when `featureId` is omitted */
    featureKey?: string;
    featureName?: string;
    featureDescription?: string;
    // Menu — only when menuMode = 'select'
    existingMenuId?: string;
    // Menu — only when menuMode = 'create'
    menuLabel?: string;
    menuRoute?: string;
    menuIcon?: string;
    menuParentId?: string | null;
}

// GET /api/module-setup/module-wizard-details/:moduleId — module + APIs + features + menus for wizard step 2
export const getModuleWizardDetailsWizardService = async (
    moduleId: string
): Promise<ApiResponse<ModuleWizardDetailsPayload>> => {
    const response = await apiInstance.get<ApiResponse<ModuleWizardDetailsPayload>>(
        getApiUrl('moduleSetupWizardDetails', { moduleId })
    );
    const body = response.data;
    const details = unwrapModuleWizardDetails(body.data);
    return {
        ...body,
        data: details ?? {
            module: { id: moduleId, name: '', description: null },
            apiEndpoints: [],
            features: [],
            menus: [],
            permissions: [],
        },
    };
};

// GET /api/api-endpoints — fetch API endpoints for the "select existing API" dropdown
export const getApiEndpointsWizardService = async (): Promise<ApiResponse<WizardApiEndpointOption[]>> => {
    const response = await apiInstance.get<ApiResponse<WizardApiEndpointOption[]>>(
        getApiUrl('getApiEndpoints')
    );
    const body = response.data;
    return {
        ...body,
        data: unwrapListPayload<WizardApiEndpointOption>(body.data),
    };
};

// GET /api/features — all features when moduleId omitted; pass moduleId to filter
export const getFeaturesWizardService = async (params?: {
    moduleId?: string;
}): Promise<ApiResponse<WizardFeatureOption[]>> => {
    const response = await apiInstance.get<ApiResponse<WizardFeatureOption[]>>(getApiUrl('getFeatures'), {
        params: {
            page: 1,
            limit: 500,
            ...(params?.moduleId ? { moduleId: params.moduleId } : {}),
        },
    });
    const body = response.data;
    return {
        ...body,
        data: unwrapListPayload<WizardFeatureOption>(body.data),
    };
};

// GET /api/menus?flat=true — all menus for parent / link dropdowns
export const getMenusWizardService = async (): Promise<ApiResponse<WizardMenuOption[]>> => {
    const response = await apiInstance.get<ApiResponse<WizardMenuOption[]>>(
        `${getApiUrl('getMenus')}?flat=true`
    );
    const body = response.data;
    const raw = unwrapListPayload<WizardMenuOption>(body.data);
    const hasNestedChildren = raw.some(
        (m) => m && typeof m === 'object' && Array.isArray((m as { children?: unknown[] }).children)
    );
    const data = hasNestedChildren ? flattenMenuTree(raw) : raw;
    return {
        ...body,
        data: data.sort((a, b) => a.label.localeCompare(b.label)),
    };
};

// POST /api/api-endpoints — create a new API endpoint (Save API button)
export const createApiEndpointWizardService = async (data: {
    method: string;
    path: string;
    key: string;
    featureId?: string | null;
    moduleId: string;
}): Promise<ApiResponse<{ id: string }>> => {
    const response = await apiInstance.post<ApiResponse<{ id: string }>>(
        getApiUrl('createApiEndpoint'),
        data
    );
    return response.data;
};

// GET /api/modules — one page (backend default limit is 10)
export const getModulesWizardService = async (params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<WizardModuleOption[]>> => {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? WIZARD_LIST_PAGE_LIMIT));
    const response = await apiInstance.get<ApiResponse<WizardModuleOption[]>>(
        getApiUrl('getModules'),
        { params: { page, limit } }
    );
    const body = response.data;
    return {
        ...body,
        data: unwrapListPayload<WizardModuleOption>(body.data),
    };
};

/** Fetches every module page for wizard step 1 "select existing module". */
export const fetchAllModulesWizardService = async (): Promise<WizardModuleOption[]> => {
    const all: WizardModuleOption[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const response = await apiInstance.get(getApiUrl('getModules'), {
            params: { page, limit: WIZARD_LIST_PAGE_LIMIT },
        });
        const body = response.data as ApiResponse<unknown>;
        if (body.success !== 200) break;

        const envelope = unwrapPaginatedPayload(body.data);
        all.push(...((envelope.data ?? []) as WizardModuleOption[]));
        totalPages = Math.max(1, envelope.totalPages ?? 1);
        page += 1;
    }

    return all;
};

// POST /api/module-setup/save-menu — create a new module (step 1, create mode)
export const createModuleWizardService = async (
    data: CreateModuleRequest
): Promise<ApiResponse<{ id: string; name: string }>> => {
    const response = await apiInstance.post<ApiResponse<{ id: string; name: string }>>(
        getApiUrl('createModuleOnly'),
        data
    );
    return response.data;
};

// POST /api/module-setup/feature — create feature during wizard step 2
export const createFeatureWizardService = async (data: {
    key: string;
    name: string;
    description?: string;
    moduleId: string;
}): Promise<ApiResponse<{ id: string }>> => {
    const response = await apiInstance.post<ApiResponse<{ id: string }>>(
        getApiUrl('moduleSetupCreateFeature'),
        data
    );
    return response.data;
};

// POST /api/module-setup/feature-api-permission-menu — save step 2 (API + permission + menu)
// Body: one object, or an array of rows (batch).
export const saveApiPermissionMenuWizardService = async (
    data: SaveApiPermissionMenuRequest | SaveApiPermissionMenuRequest[]
): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.post<ApiResponse<unknown>>(
        getApiUrl('saveFeatureApiPermissionMenuModuleSetUp'),
        data
    );
    return response.data;
};
