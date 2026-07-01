import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export const getModuleGroupsService = async (page = 1, limit = 10, projectId?: string, isPublic?: boolean) => {
    const response = await apiInstance.get(getApiUrl('getModuleGroups'), {
        params: { page, limit, projectId, ...(isPublic !== undefined ? { isPublic } : {}) },
    });
    return response.data;
};

export const getAllModuleGroupsService = async (projectId?: string) => {
    const response = await apiInstance.get(getApiUrl('getAllModuleGroups'), {
        params: { projectId },
    });
    return response.data;
};

export type AssignableModuleOption = {
    id: string;
    name: string;
    description?: string | null;
    moduleGroupId?: string | null;
    moduleGroup?: { id: string; key: string; label: string } | null;
};

export const getAssignableModulesForGroupService = async () => {
    const response = await apiInstance.get(getApiUrl('getAssignableModulesForGroup'));
    return response.data;
};

export const getModuleGroupByIdService = async (id: string) => {
    const response = await apiInstance.get(getApiUrl('getModuleGroupById', { id }));
    return response.data;
};

export const createModuleGroupService = async (data: {
    key: string;
    label: string;
    description?: string;
    orderIndex?: number;
    isPublic?: boolean;
    moduleIds?: string[];
}) => {
    const response = await apiInstance.post(getApiUrl('createModuleGroup'), data);
    return response.data;
};

export const updateModuleGroupService = async (
    id: string,
    data: {
        key?: string;
        label?: string;
        description?: string;
        orderIndex?: number;
        isPublic?: boolean;
        moduleIds?: string[];
    }
) => {
    const response = await apiInstance.put(getApiUrl('updateModuleGroup', { id }), data);
    return response.data;
};

export const deleteModuleGroupService = async (id: string) => {
    const response = await apiInstance.delete(getApiUrl('deleteModuleGroup', { id }));
    return response.data;
};
