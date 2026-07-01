import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export type ProjectListItem = {
    id: string;
    name: string;
    description?: string | null;
    domain?: string | null;
    companyId?: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt?: string | null;
    company?: { id: string; name: string } | null;
};

export const getProjectsService = async (params?: {
    isActive?: boolean;
    companyId?: string;
}): Promise<ApiResponse<ProjectListItem[]>> => {
    const response = await apiInstance.get<ApiResponse<ProjectListItem[]>>(getApiUrl('getProjects'), {
        params: {
            ...(params?.isActive !== undefined ? { isActive: String(params.isActive) } : {}),
            ...(params?.companyId ? { companyId: params.companyId } : {}),
        }
    });
    return response.data;
};

export const getProjectByIdService = async (id: string): Promise<ApiResponse<ProjectListItem>> => {
    const response = await apiInstance.get<ApiResponse<ProjectListItem>>(getApiUrl('getProjectById', { id }));
    return response.data;
};

export const createProjectService = async (data: {
    name: string;
    description?: string;
    domain?: string;
    companyId?: string | null;
}): Promise<ApiResponse<ProjectListItem>> => {
    const response = await apiInstance.post<ApiResponse<ProjectListItem>>(getApiUrl('createProject'), data);
    return response.data;
};

export const updateProjectService = async (id: string, data: {
    name: string;
    description?: string;
    domain?: string;
    companyId?: string | null;
}): Promise<ApiResponse<ProjectListItem>> => {
    const response = await apiInstance.put<ApiResponse<ProjectListItem>>(getApiUrl('updateProject', { id }), data);
    return response.data;
};

export const deleteProjectService = async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.delete<ApiResponse<unknown>>(getApiUrl('deleteProject', { id }));
    return response.data;
};

export const hardDeleteProjectService = async (
    id: string,
    options: { deleteApiKeys?: boolean; deleteProject?: boolean } = {}
): Promise<ApiResponse<{ counts: Record<string, number> }>> => {
    const params: Record<string, string> = {};
    if (options.deleteApiKeys === false) params.deleteApiKeys = 'false';
    if (options.deleteProject === false) params.deleteProject = 'false';
    const response = await apiInstance.delete<ApiResponse<{ counts: Record<string, number> }>>(
        getApiUrl('hardDeleteProject', { id }),
        { params }
    );
    return response.data;
};
