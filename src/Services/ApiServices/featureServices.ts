import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export const getFeaturesService = async (page = 1, limit = 10, search?: string, matchType: 'exact' | 'like' = 'like', projectId?: string | null) => {
    const response = await apiInstance.get(getApiUrl('getFeatures'), {
        params: {
            page,
            limit,
            ...(search ? { search, matchType } : {}),
            ...(projectId !== undefined ? { projectId: projectId === null ? 'null' : projectId } : {}),
        }
    });
    return response.data;
};

export const getAllFeaturesService = async () => {
    const response = await apiInstance.get(getApiUrl('getFeatures'), {
        params: { page: 1, limit: 1000 }
    });
    return response.data;
};

export const getFeatureByIdService = async (id: string) => {
    const response = await apiInstance.get(getApiUrl('getFeatureById', { id }));
    return response.data;
};

export const createFeatureService = async (data: any) => {
    const response = await apiInstance.post(getApiUrl('createFeature'), data);
    return response.data;
};

export const updateFeatureService = async (id: string, data: any) => {
    const response = await apiInstance.put(getApiUrl('updateFeature', { id }), data);
    return response.data;
};

export const deleteFeatureService = async (id: string) => {
    const response = await apiInstance.delete(getApiUrl('deleteFeature', { id }));
    return response.data;
};
