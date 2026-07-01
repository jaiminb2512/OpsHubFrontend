import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export type CompanyListItem = {
    id: string;
    name: string;
    description?: string | null;
    planId?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    plan?: { id: string; name: string; isPublic: boolean } | null;
    logo?: { id: string; imageUrl: string } | null;
    _count?: { stores: number; warehouses: number };
};

export type AddressInput = {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    phone?: string;
    email?: string;
    label?: string;
};

export type AddressRecord = AddressInput & {
    id: string;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateCompanyStoreInput = {
    id?: string;
    name: string;
    address?: AddressInput;
};

export type CreateCompanyWarehouseInput = {
    name: string;
    address?: AddressInput;
};

export type CreateCompanyPayload = {
    name: string;
    description?: string;
    planId?: string;
    stores?: CreateCompanyStoreInput[];
    warehouses?: CreateCompanyWarehouseInput[];
};

function unwrapListPayload<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    return [];
}

export const getCompaniesService = async (params?: {
    isActive?: boolean;
    projectId?: string;
}): Promise<ApiResponse<CompanyListItem[]>> => {
    const query: Record<string, string> = {};
    if (params?.isActive !== undefined) query.isActive = String(params.isActive);
    if (params?.projectId) query.projectId = params.projectId;
    const response = await apiInstance.get<ApiResponse<CompanyListItem[]>>(getApiUrl('listCompanies'), {
        params: Object.keys(query).length ? query : undefined,
    });
    const body = response.data;
    return {
        ...body,
        data: unwrapListPayload<CompanyListItem>(body.data),
    };
};

export const getCompanyByIdService = async (
    id: string
): Promise<ApiResponse<CompanyListItem>> => {
    const response = await apiInstance.get<ApiResponse<CompanyListItem>>(
        getApiUrl('getCompanyById', { id })
    );
    return response.data;
};

const companyMultipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

const buildCompanyFormData = (payload: CreateCompanyPayload | UpdateCompanyPayload, logo?: File | null) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    if (payload.planId) formData.append('planId', payload.planId);
    if (logo) formData.append('logo', logo);
    return formData;
};

export const createCompanyService = async (
    payload: CreateCompanyPayload,
    logo?: File | null
): Promise<ApiResponse<CompanyListItem>> => {
    if (logo) {
        const response = await apiInstance.post<ApiResponse<CompanyListItem>>(
            getApiUrl('createCompany'),
            buildCompanyFormData(payload, logo),
            companyMultipartConfig
        );
        return response.data;
    }

    const response = await apiInstance.post<ApiResponse<CompanyListItem>>(
        getApiUrl('createCompany'),
        payload
    );
    return response.data;
};

export type UpdateCompanyPayload = {
    name: string;
    description?: string;
    planId?: string;
};

export const updateCompanyService = async (
    id: string,
    payload: UpdateCompanyPayload,
    logo?: File | null
): Promise<ApiResponse<CompanyListItem>> => {
    if (logo) {
        const response = await apiInstance.put<ApiResponse<CompanyListItem>>(
            getApiUrl('updateCompany', { id }),
            buildCompanyFormData(payload, logo),
            companyMultipartConfig
        );
        return response.data;
    }

    const response = await apiInstance.put<ApiResponse<CompanyListItem>>(
        getApiUrl('updateCompany', { id }),
        payload
    );
    return response.data;
};

export const deleteCompanyService = async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.delete<ApiResponse<unknown>>(
        getApiUrl('deleteCompany', { id })
    );
    return response.data;
};

export const hardDeleteCompanyService = async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.delete<ApiResponse<unknown>>(
        getApiUrl('hardDeleteCompany', { id })
    );
    return response.data;
};

export type CompanyLimitUsageRow = {
    id: string;
    period: string;
    periodStart: string;
    periodEnd: string;
    usedValue: number;
    isActive: boolean;
    isDeleted: boolean;
    isCurrent: boolean;
};

export type CompanyPlanLimitItem = {
    planLimitId: string;
    limitId: string;
    limitKey: string;
    limitName: string;
    description?: string | null;
    enforcement: 'max' | 'renewable';
    planCap: number | null;
    period: string | null;
    feature: { key: string; name: string } | null;
    currentUsed: number;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    usages: CompanyLimitUsageRow[];
};

export type CompanyLimitsUsageResult = {
    company: {
        id: string;
        name: string;
        plan: { id: string; name: string; duration?: number | null; isPublic?: boolean } | null;
    };
    subscription: {
        id: string;
        startDate: string;
        endDate: string | null;
        status: string;
    } | null;
    limits: CompanyPlanLimitItem[];
};

export const getCompanyLimitsUsageService = async (
    companyId: string,
    params?: { includeInactive?: boolean }
): Promise<ApiResponse<CompanyLimitsUsageResult>> => {
    const response = await apiInstance.get<ApiResponse<CompanyLimitsUsageResult>>(
        getApiUrl('getCompanyLimitsUsage', { id: companyId }),
        {
            params:
                params?.includeInactive !== undefined
                    ? { includeInactive: String(params.includeInactive) }
                    : undefined,
        }
    );
    return response.data;
};

export type StoresWarehousesPayload = {
    stores: CreateCompanyStoreInput[];
    warehouses: CreateCompanyWarehouseInput[];
};

export type StoreItem = {
    id: string;
    name: string;
    addressId?: string | null;
    address?: AddressRecord | null;
    companyId: string;
};

export type WarehouseItem = {
    id: string;
    name: string;
    addressId?: string | null;
    address?: AddressRecord | null;
    companyId: string;
};

export type StoresWarehousesResult = {
    stores: StoreItem[];
    warehouses: WarehouseItem[];
};

export const getCompanyStoresWarehousesService = async (
    companyId: string
): Promise<ApiResponse<StoresWarehousesResult>> => {
    const response = await apiInstance.get<ApiResponse<StoresWarehousesResult>>(
        getApiUrl('getCompanyStoresWarehouses', { companyId })
    );
    return response.data;
};

export const saveCompanyStoresWarehousesService = async (
    companyId: string,
    payload: StoresWarehousesPayload
): Promise<ApiResponse<StoresWarehousesResult>> => {
    const response = await apiInstance.put<ApiResponse<StoresWarehousesResult>>(
        getApiUrl('saveCompanyStoresWarehouses', { companyId }),
        payload
    );
    return response.data;
};

// ── Individual Store CRUD ──────────────────────────────

export const getCompanyStoresService = async (
    companyId: string
): Promise<ApiResponse<StoreItem[]>> => {
    const response = await apiInstance.get<ApiResponse<StoreItem[]>>(
        getApiUrl('getCompanyStores', { companyId })
    );
    const body = response.data;
    return { ...body, data: unwrapListPayload<StoreItem>(body.data) };
};

export const createCompanyStoreService = async (
    companyId: string,
    payload: { name: string; address?: AddressInput }
): Promise<ApiResponse<StoreItem>> => {
    const response = await apiInstance.post<ApiResponse<StoreItem>>(
        getApiUrl('createCompanyStore', { companyId }),
        payload
    );
    return response.data;
};

export const deleteCompanyStoreService = async (
    companyId: string,
    storeId: string
): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.delete<ApiResponse<unknown>>(
        getApiUrl('deleteCompanyStore', { companyId, storeId })
    );
    return response.data;
};

export const updateCompanyStoreService = async (
    companyId: string,
    storeId: string,
    payload: { name: string; address?: AddressInput }
): Promise<ApiResponse<StoreItem>> => {
    const response = await apiInstance.put<ApiResponse<StoreItem>>(
        getApiUrl('updateCompanyStore', { companyId, storeId }),
        payload
    );
    return response.data;
};

// ── Individual Warehouse CRUD ─────────────────────────

export const getCompanyWarehousesService = async (
    companyId: string
): Promise<ApiResponse<WarehouseItem[]>> => {
    const response = await apiInstance.get<ApiResponse<WarehouseItem[]>>(
        getApiUrl('getCompanyWarehouses', { companyId })
    );
    const body = response.data;
    return { ...body, data: unwrapListPayload<WarehouseItem>(body.data) };
};

export const createCompanyWarehouseService = async (
    companyId: string,
    payload: { name: string; address?: AddressInput }
): Promise<ApiResponse<WarehouseItem>> => {
    const response = await apiInstance.post<ApiResponse<WarehouseItem>>(
        getApiUrl('createCompanyWarehouse', { companyId }),
        payload
    );
    return response.data;
};

export const deleteCompanyWarehouseService = async (
    companyId: string,
    warehouseId: string
): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.delete<ApiResponse<unknown>>(
        getApiUrl('deleteCompanyWarehouse', { companyId, warehouseId })
    );
    return response.data;
};

export const updateCompanyWarehouseService = async (
    companyId: string,
    warehouseId: string,
    payload: { name: string; address?: AddressInput }
): Promise<ApiResponse<WarehouseItem>> => {
    const response = await apiInstance.put<ApiResponse<WarehouseItem>>(
        getApiUrl('updateCompanyWarehouse', { companyId, warehouseId }),
        payload
    );
    return response.data;
};

// ── Company Users ─────────────────────────────────────

export type CompanyUserRole = {
    id: string;
    name: string;
    description: string | null;
    hierarchy: number;
};

export const getCompanyUserRolesService = async (params?: {
    page?: number;
    limit?: number;
    isPublic?: boolean;
    companyId?: string;
}): Promise<ApiResponse<CompanyUserRole[]>> => {
    const response = await apiInstance.get<ApiResponse<unknown>>(
        getApiUrl('getCompanyUserRoles'),
        {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 100,
                ...(params?.isPublic !== undefined ? { isPublic: String(params.isPublic) } : {}),
                ...(params?.companyId !== undefined ? { companyId: params.companyId } : {}),
            },
        }
    );
    const body = response.data;
    const raw = body.data;
    const roles: CompanyUserRole[] =
        Array.isArray(raw) ? raw :
        raw && typeof raw === 'object' && 'roles' in (raw as Record<string, unknown>) ?
            (raw as { roles: CompanyUserRole[] }).roles : [];
    return { ...body, data: roles };
};

export const importCompanyRolesService = async (
    companyId: string,
    roleId: string
): Promise<ApiResponse<any>> => {
    const response = await apiInstance.post<ApiResponse<any>>(
        getApiUrl('importCompanyRoles', { id: companyId }),
        { roleId }
    );
    return response.data;
};

export type CompanyPlanModuleSummary = {
    id: string;
    key: string;
    label: string;
    route?: string | null;
    orderIndex?: number | null;
    totalPermission?: number;
    extraPermissions?: number;
    menus?: number;
    moduleGroupId?: string | null;
    moduleGroup?: { id: string; key: string; label: string } | null;
};

export type CompanyPlanModulesResponse = {
    modules: CompanyPlanModuleSummary[];
    enabledFeatureIds: string[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

const PLAN_MODULES_PAGE_LIMIT = 100;

export const getCompanyPlanModulesService = async (
    companyId: string,
    params?: { page?: number; limit?: number }
): Promise<ApiResponse<CompanyPlanModulesResponse>> => {
    const response = await apiInstance.get<ApiResponse<CompanyPlanModulesResponse>>(
        getApiUrl('getCompanyPlanModules', { companyId }),
        {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? PLAN_MODULES_PAGE_LIMIT,
            },
        }
    );
    return response.data;
};

/** Fetches all plan modules for a company (paginated API). */
export const fetchAllCompanyPlanModulesService = async (
    companyId: string
): Promise<{ modules: CompanyPlanModuleSummary[]; enabledFeatureIds: string[] }> => {
    const all: CompanyPlanModuleSummary[] = [];
    let enabledFeatureIds: string[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const res = await getCompanyPlanModulesService(companyId, {
            page,
            limit: PLAN_MODULES_PAGE_LIMIT,
        });
        if (res.success !== 200 || !res.data) break;

        all.push(...(res.data.modules ?? []));
        enabledFeatureIds = res.data.enabledFeatureIds ?? enabledFeatureIds;
        totalPages = Math.max(1, res.data.totalPages ?? 1);
        page += 1;
    }

    return { modules: all, enabledFeatureIds };
};

export type CompanyUserItem = {
    userId: string;
    fullName: string;
    emailId: string;
    roleId: string;
    roleName: string;
};

export type CreateCompanyUserPayload = {
    fullName: string;
    emailId: string;
    password: string;
    roleId: string;
};

export type CreatedCompanyUser = {
    userId: string;
    fullName: string;
    emailId: string;
    role: { id: string; name: string };
    createdAt: string;
};

export const getCompanyUsersService = async (
    companyId: string
): Promise<ApiResponse<CompanyUserItem[]>> => {
    const response = await apiInstance.get<ApiResponse<CompanyUserItem[]>>(
        getApiUrl('getCompanyUsers', { companyId })
    );
    const body = response.data;
    return {
        ...body,
        data: unwrapListPayload<CompanyUserItem>(body.data),
    };
};

export const createCompanyUserService = async (
    companyId: string,
    payload: CreateCompanyUserPayload
): Promise<ApiResponse<CreatedCompanyUser>> => {
    const response = await apiInstance.post<ApiResponse<CreatedCompanyUser>>(
        getApiUrl('createCompanyUser', { companyId }),
        payload
    );
    return response.data;
};

export type UpdateCompanyUserPayload = {
    fullName?: string;
    roleId?: string;
};

export type UpdatedCompanyUser = {
    userId: string;
    fullName: string;
    emailId: string;
    role: { id: string; name: string };
};

export const updateCompanyUserService = async (
    companyId: string,
    userId: string,
    payload: UpdateCompanyUserPayload
): Promise<ApiResponse<UpdatedCompanyUser>> => {
    const response = await apiInstance.put<ApiResponse<UpdatedCompanyUser>>(
        getApiUrl('updateCompanyUser', { companyId, userId }),
        payload
    );
    return response.data;
};

// ── User Access Mapping ───────────────────────────────

export type UserAccessMapping = {
    userId: string;
    stores: { id: string; name: string }[];
    warehouses: { id: string; name: string }[];
};

export type SaveUserAccessPayload = {
    storeIds: string[];
    warehouseIds: string[];
};

export const getUserAccessMappingService = async (
    companyId: string,
    userId: string
): Promise<ApiResponse<UserAccessMapping>> => {
    const response = await apiInstance.get<ApiResponse<UserAccessMapping>>(
        getApiUrl('getUserAccessMapping', { companyId, userId })
    );
    return response.data;
};

export const saveUserAccessMappingService = async (
    companyId: string,
    userId: string,
    payload: SaveUserAccessPayload
): Promise<ApiResponse<UserAccessMapping>> => {
    const response = await apiInstance.put<ApiResponse<UserAccessMapping>>(
        getApiUrl('saveUserAccessMapping', { companyId, userId }),
        payload
    );
    return response.data;
};

// ── Company Roles (from company-users route) ──

export type CompanyRoleItem = {
    id: string;
    name: string;
    description: string | null;
    hierarchy: number;
    isPublic: boolean;
};

export const getCompanyRolesForCompanyService = async (
    companyId: string
): Promise<ApiResponse<CompanyRoleItem[]>> => {
    const response = await apiInstance.get<ApiResponse<CompanyRoleItem[]>>(
        getApiUrl('getCompanyUserRolesForCompany', { companyId })
    );
    return response.data;
};

// ── Company User Detail ──

export type CompanyUserDetail = {
    userId: string;
    fullName: string;
    emailId: string;
    roleId: string;
    roleName: string;
    hierarchy: number;
    stores: { id: string; name: string }[];
    warehouses: { id: string; name: string }[];
    allStores: { id: string; name: string }[];
    allWarehouses: { id: string; name: string }[];
};

export const getCompanyUserDetailService = async (
    companyId: string,
    userId: string
): Promise<ApiResponse<CompanyUserDetail>> => {
    const response = await apiInstance.get<ApiResponse<CompanyUserDetail>>(
        getApiUrl('getCompanyUserDetail', { companyId, userId })
    );
    return response.data;
};

export type EstimateSubscriptionResult = {
    companyId: string;
    planId: string;
    startDate: string;
    estimatedEndDate: string | null;
    planDuration: number | null;
};

export type SubscribeCompanyPayload = {
    planId: string;
    startDate?: string;
};

export type SubscribeCompanyResult = {
    id: string;
    companyId: string;
    planId: string;
    startDate: string;
    endDate: string | null;
    status: string;
};

export const estimateCompanySubscriptionService = async (
    companyId: string,
    planId: string,
    startDate?: string
): Promise<ApiResponse<EstimateSubscriptionResult>> => {
    const response = await apiInstance.get<ApiResponse<EstimateSubscriptionResult>>(
        getApiUrl('estimateCompanySubscription', { id: companyId }),
        {
            params: {
                planId,
                ...(startDate ? { startDate } : {}),
            },
        }
    );
    return response.data;
};

export const subscribeCompanyService = async (
    companyId: string,
    payload: SubscribeCompanyPayload
): Promise<ApiResponse<SubscribeCompanyResult>> => {
    const response = await apiInstance.post<ApiResponse<SubscribeCompanyResult>>(
        getApiUrl('subscribeCompany', { id: companyId }),
        payload
    );
    return response.data;
};

