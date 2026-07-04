import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export interface ModuleItem {
    id: string;
    name: string;
    label?: string;
    description?: string | null;
}

interface ModuleListParams {
    page?: number;
    limit?: number;
    search?: string;
    matchType?: string;
    projectId?: string;
}

interface ModuleListResponse {
    success: number;
    data: {
        data: ModuleItem[];
        totalPages: number;
        total: number;
    };
}

export const getModulesService = async (params: ModuleListParams): Promise<ModuleListResponse> => {
    const url = getApiUrl('getModules');
    const res = await apiInstance.get(url, { params });
    return res.data;
};
