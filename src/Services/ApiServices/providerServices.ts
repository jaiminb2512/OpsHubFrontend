import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { BASE_URL as BASE } from '../../Utils/api';

const url = (projectId: string, tail = '') =>
    `${BASE}/projects/${projectId}/providers${tail}`;

const globalUrl = (tail = '') =>
    `${BASE}/global-providers${tail}`;

const ppUrl = (projectId: string, tail = '') =>
    `${BASE}/projects/${projectId}/project-providers${tail}`;

// ── Types ──────────────────────────────────────────────

export type ProviderCategory = 'storage' | 'email';

/** A user-configured provider instance (global: projectId=null, project-scoped: projectId set) */
export type Provider = {
    id: string;
    name: string;
    label: string;
    category: ProviderCategory;
    description?: string | null;
    projectId: string | null;
    isDefault: boolean;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    creator?: { userId: string; fullName: string } | null;
    _count?: { accounts: number };
    accounts?: ProviderAccount[];
};

export type ProviderAccount = {
    id: string;
    providerId: string;
    label: string;
    isDefault: boolean;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    provider?: { id: string; name: string; label: string; category: ProviderCategory; projectId: string | null };
    creator?: { userId: string; fullName: string } | null;
};

/** Project ↔ provider+account assignment (ProjectProvider join table) */
export type ProjectProviderAssignment = {
    id: string;
    projectId: string;
    category: ProviderCategory;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    provider: { id: string; name: string; label: string; category: ProviderCategory; projectId: string | null };
    providerAccount: { id: string; label: string; isDefault: boolean; isActive: boolean };
};

export type CreateProviderPayload = {
    name: string;
    label: string;
    category: ProviderCategory;
    description?: string;
    isDefault?: boolean;
    initialAccounts?: Array<{
        label: string;
        credentials: Record<string, unknown>;
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
    credentials: Record<string, unknown>;
    isDefault?: boolean;
};

export type UpdateAccountPayload = {
    label?: string;
    credentials?: Record<string, unknown>;
    isActive?: boolean;
};

export type SetProjectProviderPayload = {
    providerId: string;
    providerAccountId: string;
    category: ProviderCategory;
    isDefault?: boolean;
};

// ── Provider Categories ────────────────────────────────

export const getProviderCategoriesService = async (): Promise<ApiResponse<ProviderCategory[]>> => {
    const res = await apiInstance.get<ApiResponse<ProviderCategory[]>>(`${BASE}/global-providers/categories`);
    return res.data;
};

// ── Project-scoped Provider endpoints ─────────────────

export const getProvidersService = async (
    projectId: string,
    category?: ProviderCategory
): Promise<ApiResponse<Provider[]>> => {
    const params = category ? { category } : {};
    const res = await apiInstance.get<ApiResponse<Provider[]>>(url(projectId), { params });
    return res.data;
};

export const getProviderByIdService = async (
    projectId: string,
    providerId: string
): Promise<ApiResponse<Provider>> => {
    const res = await apiInstance.get<ApiResponse<Provider>>(url(projectId, `/${providerId}`));
    return res.data;
};

export const createProviderService = async (
    projectId: string,
    data: CreateProviderPayload
): Promise<ApiResponse<Provider>> => {
    const res = await apiInstance.post<ApiResponse<Provider>>(url(projectId), data);
    return res.data;
};

export const updateProviderService = async (
    projectId: string,
    providerId: string,
    data: UpdateProviderPayload
): Promise<ApiResponse<Provider>> => {
    const res = await apiInstance.patch<ApiResponse<Provider>>(url(projectId, `/${providerId}`), data);
    return res.data;
};

export const setDefaultProviderService = async (
    projectId: string,
    providerId: string
): Promise<ApiResponse<Provider>> => {
    const res = await apiInstance.patch<ApiResponse<Provider>>(url(projectId, `/${providerId}/set-default`));
    return res.data;
};

export const deleteProviderService = async (
    projectId: string,
    providerId: string
): Promise<ApiResponse<null>> => {
    const res = await apiInstance.delete<ApiResponse<null>>(url(projectId, `/${providerId}`));
    return res.data;
};

// ── Project-scoped Account endpoints ──────────────────

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
        url(projectId, `/${providerId}/accounts/${accountId}`), data
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

// ── Global Provider endpoints (no projectId) ──────────

export const getGlobalProvidersService = async (
    category?: ProviderCategory
): Promise<ApiResponse<Provider[]>> => {
    const params = category ? { category } : {};
    const res = await apiInstance.get<ApiResponse<Provider[]>>(globalUrl(), { params });
    return res.data;
};

export const createGlobalProviderService = async (
    data: CreateProviderPayload
): Promise<ApiResponse<Provider>> => {
    const res = await apiInstance.post<ApiResponse<Provider>>(globalUrl(), data);
    return res.data;
};

export const updateGlobalProviderService = async (
    providerId: string,
    data: UpdateProviderPayload
): Promise<ApiResponse<Provider>> => {
    const res = await apiInstance.patch<ApiResponse<Provider>>(globalUrl(`/${providerId}`), data);
    return res.data;
};

export const setDefaultGlobalProviderService = async (
    providerId: string
): Promise<ApiResponse<Provider>> => {
    const res = await apiInstance.patch<ApiResponse<Provider>>(globalUrl(`/${providerId}/set-default`));
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

// ── ProjectProvider assignment endpoints ──────────────

export const getProjectProviderAssignmentsService = async (
    projectId: string,
    category?: ProviderCategory
): Promise<ApiResponse<ProjectProviderAssignment[]>> => {
    const params = category ? { category } : {};
    const res = await apiInstance.get<ApiResponse<ProjectProviderAssignment[]>>(ppUrl(projectId), { params });
    return res.data;
};

export const setProjectProviderService = async (
    projectId: string,
    data: SetProjectProviderPayload
): Promise<ApiResponse<ProjectProviderAssignment>> => {
    const res = await apiInstance.post<ApiResponse<ProjectProviderAssignment>>(ppUrl(projectId), data);
    return res.data;
};

export const resetProjectProviderService = async (
    projectId: string,
    category: ProviderCategory
): Promise<ApiResponse<{ reset: boolean; message: string }>> => {
    const res = await apiInstance.post<ApiResponse<{ reset: boolean; message: string }>>(
        ppUrl(projectId, '/reset'), { category }
    );
    return res.data;
};

export const setDefaultProjectProviderService = async (
    projectId: string,
    assignmentId: string
): Promise<ApiResponse<ProjectProviderAssignment>> => {
    const res = await apiInstance.patch<ApiResponse<ProjectProviderAssignment>>(
        ppUrl(projectId, `/${assignmentId}/set-default`)
    );
    return res.data;
};

export const removeProjectProviderService = async (
    projectId: string,
    assignmentId: string
): Promise<ApiResponse<null>> => {
    const res = await apiInstance.delete<ApiResponse<null>>(ppUrl(projectId, `/${assignmentId}`));
    return res.data;
};
