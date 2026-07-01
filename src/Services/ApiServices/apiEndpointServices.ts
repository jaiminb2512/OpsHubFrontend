import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export const createApiEndpointService = async (data: any) => {
    const response = await apiInstance.post(getApiUrl('createApiEndpoint'), data);
    return response.data;
};

export const getApiEndpointsService = async (params?: {
    search?: string;
    method?: string;
    matchType?: 'like' | 'exact';
    page?: number;
    limit?: number;
    isActive?: boolean;
    isPublic?: boolean;
    projectId?: string | null;
}) => {
    const response = await apiInstance.get(getApiUrl('getApiEndpoints'), { params });
    return response.data;
};

export const getApiEndpointByIdService = async (id: string) => {
    const response = await apiInstance.get(getApiUrl('getApiEndpointById', { id }));
    return response.data;
};

export const updateApiEndpointService = async (id: string, data: any) => {
    const response = await apiInstance.put(getApiUrl('updateApiEndpoint', { id }), data);
    return response.data;
};

export const deleteApiEndpointService = async (id: string) => {
    const response = await apiInstance.delete(getApiUrl('deleteApiEndpoint', { id }));
    return response.data;
};
