import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';

const BASE = import.meta.env.VITE_NODEJS_BASE_URL;

const url = (projectId: string, tail = '') =>
    `${BASE}/projects/${projectId}/providers${tail}`;

const globalUrl = (tail = '') =>
    `${BASE}/global-providers${tail}`;

// ── Types ──────────────────────────────────────────────

export type ProviderCategory = 'storage' | 'email';

export type ProviderAccount = {
    id: string;
    providerId: string;
    projectId: string;
    label: string;
    isDefault: boolean;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    provider?: { id: string; name: string; label: string; category: ProviderCategory };
    creator?: { userId: string; fullName: string } | null;
};

export type ProjectProvider = {
    id: string;
    projectId: string;
    category: ProviderCategory;
    name: string;
    label: string;
    description?: string | null;
    isDefault: boolean;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    creator?: { userId: string; fullName: string } | null;
    accounts?: ProviderAccount[];
    _count?: { accounts: number };
};

export type CreateProviderPayload = {
    category: ProviderCategory;
    name: string;
    label: string;
    description?: string;
    isDefault?: boolean;
    initialAccounts?: Array<{
        label: string;
        credentials: Record<string, string>;
        isDefault?: boolean;
    }>;
};

export type UpdateProviderPayload = {
    label?: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
};

export type CreateAccountPayload = {
    label: string;
    credentials: Record<string, string>;
    isDefault?: boolean;
};

export type UpdateAccountPayload = {
    label?: string;
    credentials?: Record<string, string>;
    isActive?: boolean;
};

// ── Provider endpoints ─────────────────────────────────

export const getProvidersService = async (
    projectId: string,
    category?: ProviderCategory
): Promise<ApiResponse<ProjectProvider[]>> => {
    const params = category ? { category } : {};
    const res = await apiInstance.get<ApiResponse<ProjectProvider[]>>(url(projectId), { params });
    return res.data;
};

export const getProviderByIdService = async (
    projectId: string,
    providerId: string
): Promise<ApiResponse<ProjectProvider>> => {
    const res = await apiInstance.get<ApiResponse<ProjectProvider>>(url(projectId, `/${providerId}`));
    return res.data;
};

export const createProviderService = async (
    projectId: string,
    data: CreateProviderPayload
): Promise<ApiResponse<ProjectProvider>> => {
    const res = await apiInstance.post<ApiResponse<ProjectProvider>>(url(projectId), data);
    return res.data;
};

export const updateProviderService = async (
    projectId: string,
    providerId: string,
    data: UpdateProviderPayload
): Promise<ApiResponse<ProjectProvider>> => {
    const res = await apiInstance.patch<ApiResponse<ProjectProvider>>(url(projectId, `/${providerId}`), data);
    return res.data;
};

export const setDefaultProviderService = async (
    projectId: string,
    providerId: string
): Promise<ApiResponse<ProjectProvider>> => {
    const res = await apiInstance.patch<ApiResponse<ProjectProvider>>(url(projectId, `/${providerId}/set-default`));
    return res.data;
};

export const deleteProviderService = async (
    projectId: string,
    providerId: string
): Promise<ApiResponse<null>> => {
    const res = await apiInstance.delete<ApiResponse<null>>(url(projectId, `/${providerId}`));
    return res.data;
};

// ── Account endpoints ──────────────────────────────────

export const getProviderAccountsService = async (
    projectId: string,
    providerId: string
): Promise<ApiResponse<ProviderAccount[]>> => {
    const res = await apiInstance.get<ApiResponse<ProviderAccount[]>>(url(projectId, `/${providerId}/accounts`));
    return res.data;
};

export const createProviderAccountService = async (
    projectId: string,
    providerId: string,
    data: CreateAccountPayload
): Promise<ApiResponse<ProviderAccount>> => {
    const res = await apiInstance.post<ApiResponse<ProviderAccount>>(url(projectId, `/${providerId}/accounts`), data);
    return res.data;
};

export const updateProviderAccountService = async (
    projectId: string,
    providerId: string,
    accountId: string,
    data: UpdateAccountPayload
): Promise<ApiResponse<ProviderAccount>> => {
    const res = await apiInstance.patch<ApiResponse<ProviderAccount>>(
        url(projectId, `/${providerId}/accounts/${accountId}`),
        data
    );
    return res.data;
};

export const setDefaultAccountService = async (
    projectId: string,
    providerId: string,
    accountId: string
): Promise<ApiResponse<ProviderAccount>> => {
    const res = await apiInstance.patch<ApiResponse<ProviderAccount>>(
        url(projectId, `/${providerId}/accounts/${accountId}/set-default`)
    );
    return res.data;
};

export const deleteProviderAccountService = async (
    projectId: string,
    providerId: string,
    accountId: string
): Promise<ApiResponse<null>> => {
    const res = await apiInstance.delete<ApiResponse<null>>(
        url(projectId, `/${providerId}/accounts/${accountId}`)
    );
    return res.data;
};

export const testProviderAccountService = async (
    projectId: string,
    providerId: string,
    accountId: string
): Promise<ApiResponse<{ tested: boolean; message: string }>> => {
    const res = await apiInstance.post<ApiResponse<{ tested: boolean; message: string }>>(
        url(projectId, `/${providerId}/accounts/${accountId}/test`)
    );
    return res.data;
};

// ── Global provider endpoints (no projectId) ───────────────────────────────

export const getGlobalProvidersService = async (
    category?: ProviderCategory
): Promise<ApiResponse<ProjectProvider[]>> => {
    const params = category ? { category } : {};
    const res = await apiInstance.get<ApiResponse<ProjectProvider[]>>(globalUrl(), { params });
    return res.data;
};

export const createGlobalProviderService = async (
    data: CreateProviderPayload
): Promise<ApiResponse<ProjectProvider>> => {
    const res = await apiInstance.post<ApiResponse<ProjectProvider>>(globalUrl(), data);
    return res.data;
};

export const updateGlobalProviderService = async (
    providerId: string,
    data: UpdateProviderPayload
): Promise<ApiResponse<ProjectProvider>> => {
    const res = await apiInstance.patch<ApiResponse<ProjectProvider>>(globalUrl(`/${providerId}`), data);
    return res.data;
};

export const setDefaultGlobalProviderService = async (
    providerId: string
): Promise<ApiResponse<ProjectProvider>> => {
    const res = await apiInstance.patch<ApiResponse<ProjectProvider>>(globalUrl(`/${providerId}/set-default`));
    return res.data;
};

export const deleteGlobalProviderService = async (
    providerId: string
): Promise<ApiResponse<null>> => {
    const res = await apiInstance.delete<ApiResponse<null>>(globalUrl(`/${providerId}`));
    return res.data;
};

export const createGlobalProviderAccountService = async (
    providerId: string,
    data: CreateAccountPayload
): Promise<ApiResponse<ProviderAccount>> => {
    const res = await apiInstance.post<ApiResponse<ProviderAccount>>(
        globalUrl(`/${providerId}/accounts`), data
    );
    return res.data;
};

export const updateGlobalProviderAccountService = async (
    providerId: string,
    accountId: string,
    data: UpdateAccountPayload
): Promise<ApiResponse<ProviderAccount>> => {
    const res = await apiInstance.patch<ApiResponse<ProviderAccount>>(
        globalUrl(`/${providerId}/accounts/${accountId}`), data
    );
    return res.data;
};

export const setDefaultGlobalAccountService = async (
    providerId: string,
    accountId: string
): Promise<ApiResponse<ProviderAccount>> => {
    const res = await apiInstance.patch<ApiResponse<ProviderAccount>>(
        globalUrl(`/${providerId}/accounts/${accountId}/set-default`)
    );
    return res.data;
};

export const deleteGlobalProviderAccountService = async (
    providerId: string,
    accountId: string
): Promise<ApiResponse<null>> => {
    const res = await apiInstance.delete<ApiResponse<null>>(
        globalUrl(`/${providerId}/accounts/${accountId}`)
    );
    return res.data;
};

export const testGlobalProviderAccountService = async (
    providerId: string,
    accountId: string
): Promise<ApiResponse<{ tested: boolean; message: string }>> => {
    const res = await apiInstance.post<ApiResponse<{ tested: boolean; message: string }>>(
        globalUrl(`/${providerId}/accounts/${accountId}/test`)
    );
    return res.data;
};
