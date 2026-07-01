import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export type ProjectApiKey = {
    id: string;
    name: string | null;
    key: string;
    isActive: boolean;
    createdAt: string;
    creator?: { userId: string; fullName: string } | null;
};

export const listProjectApiKeysService = async (projectId: string): Promise<ApiResponse<ProjectApiKey[]>> => {
    const response = await apiInstance.get<ApiResponse<ProjectApiKey[]>>(
        getApiUrl('listProjectApiKeys', { projectId })
    );
    return response.data;
};

export const createProjectApiKeyService = async (
    projectId: string,
    data: { name?: string }
): Promise<ApiResponse<ProjectApiKey>> => {
    const response = await apiInstance.post<ApiResponse<ProjectApiKey>>(
        getApiUrl('createProjectApiKey', { projectId }),
        data
    );
    return response.data;
};

export const toggleProjectApiKeyService = async (
    projectId: string,
    keyId: string,
    isActive: boolean
): Promise<ApiResponse<{ id: string; name: string | null; isActive: boolean }>> => {
    const response = await apiInstance.patch(
        getApiUrl('toggleProjectApiKey', { projectId, keyId }),
        { isActive }
    );
    return response.data;
};

export const deleteProjectApiKeyService = async (
    projectId: string,
    keyId: string
): Promise<ApiResponse<unknown>> => {
    const response = await apiInstance.delete(
        getApiUrl('deleteProjectApiKey', { projectId, keyId })
    );
    return response.data;
};
