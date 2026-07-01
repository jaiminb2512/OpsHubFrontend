import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';

// VITE_NODEJS_BASE_URL already includes /api (e.g. http://localhost:3000/api)
// Strip the trailing /api so we can append our own /api/import/... paths without duplication
const BASE = (import.meta.env.VITE_NODEJS_BASE_URL as string).replace(/\/api\/?$/, '');

export type ImportSummarySection = { created: number; skipped: number };

export type ImportResult = {
    summary: {
        moduleGroups?:    ImportSummarySection;
        modules:          ImportSummarySection;
        features?:        ImportSummarySection;
        apiEndpoints:     ImportSummarySection;
        permissions:      ImportSummarySection;
        roles:            ImportSummarySection;
        rolePermissions:  ImportSummarySection;
        roleModules:      ImportSummarySection;
        menus:            ImportSummarySection;
    };
    errors: string[];
};

export const importProjectDataService = async (
    projectId: string,
    file: File
): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiInstance.post<ApiResponse<ImportResult>>(
        `${BASE}/api/import/project/${projectId}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const importGlobalDataService = async (
    file: File
): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiInstance.post<ApiResponse<ImportResult>>(
        `${BASE}/api/import/global`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const downloadProjectTemplateUrl = (): string => `${BASE}/api/import/template/project`;
export const downloadGlobalTemplateUrl  = (): string => `${BASE}/api/import/template/global`;

export const exportProjectDataUrl = (projectId: string): string => `${BASE}/api/import/export/project/${projectId}`;
export const exportGlobalDataUrl  = (): string => `${BASE}/api/import/export/global`;

export type RoleImportResult = {
    summary: {
        roles:            ImportSummarySection;
        rolePermissions:  ImportSummarySection;
        roleModules:      ImportSummarySection;
    };
    errors: string[];
};

export const importRoleDataService = async (
    file: File,
    opts: { projectId?: string; companyId?: string } = {}
): Promise<ApiResponse<RoleImportResult>> => {
    const params = new URLSearchParams();
    if (opts.projectId) params.set('projectId', opts.projectId);
    if (opts.companyId) params.set('companyId', opts.companyId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const form = new FormData();
    form.append('file', file);
    const response = await apiInstance.post<ApiResponse<RoleImportResult>>(
        `${BASE}/api/import/roles${qs}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const exportRoleDataUrl = (opts: { projectId?: string; companyId?: string } = {}): string => {
    const params = new URLSearchParams();
    if (opts.projectId) params.set('projectId', opts.projectId);
    if (opts.companyId) params.set('companyId', opts.companyId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return `${BASE}/api/import/export/roles${qs}`;
};

export const downloadRoleTemplateUrl = (): string => `${BASE}/api/import/template/roles`;

export type FullImportResult = {
    summary: Record<string, ImportSummarySection>;
    errors: string[];
};

export const importFullFromTailorService = async (
    projectId: string,
    file: File
): Promise<ApiResponse<FullImportResult>> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiInstance.post<ApiResponse<FullImportResult>>(
        `${BASE}/api/import/rbas/full/${projectId}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};
