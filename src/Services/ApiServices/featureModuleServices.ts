import apiInstance, { type ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export type FeatureModuleRow = {
    id: string;
    featureId: string;
    moduleId: string;
    createdAt: string;
    feature: { id: string; key: string; name: string; isActive?: boolean };
    module: { id: string; name: string; description?: string | null };
};

export type FeatureModulesListResponse = {
    data: FeatureModuleRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export const getFeatureModulesService = async (
    page = 1,
    limit = 10,
    filters?: { featureId?: string; moduleId?: string; search?: string }
): Promise<ApiResponse<FeatureModulesListResponse>> => {
    const response = await apiInstance.get<ApiResponse<FeatureModulesListResponse>>(
        getApiUrl('getFeatureModules'),
        {
            params: {
                page,
                limit,
                ...(filters?.featureId ? { featureId: filters.featureId } : {}),
                ...(filters?.moduleId ? { moduleId: filters.moduleId } : {}),
                ...(filters?.search ? { search: filters.search } : {}),
            },
        }
    );
    return response.data;
};

export const getFeatureModuleByIdService = async (id: string): Promise<ApiResponse<FeatureModuleRow>> => {
    const response = await apiInstance.get<ApiResponse<FeatureModuleRow>>(
        getApiUrl('getFeatureModuleById', { id })
    );
    return response.data;
};

export const createFeatureModuleService = async (data: {
    featureId: string;
    moduleIds: string[];
}): Promise<ApiResponse<{ data: FeatureModuleRow[]; createdCount: number }>> => {
    const response = await apiInstance.post(getApiUrl('createFeatureModule'), data);
    return response.data;
};

export const syncFeatureModulesService = async (data: {
    featureId: string;
    moduleIds: string[];
}): Promise<ApiResponse<{ data: FeatureModuleRow[] }>> => {
    const response = await apiInstance.put(getApiUrl('syncFeatureModules'), data);
    return response.data;
};

export const deleteFeatureModuleService = async (id: string): Promise<ApiResponse<FeatureModuleRow>> => {
    const response = await apiInstance.delete(getApiUrl('deleteFeatureModule', { id }));
    return response.data;
};
