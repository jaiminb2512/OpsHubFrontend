import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export type UserCompanyRoleAssignment = {
    id?: string;
    companyId: string;
    companyName?: string;
    roleId: string;
    roleName?: string;
    isActive?: boolean;
};

export type UserCompanyRolesData = {
    user: {
        userId: string;
        fullName: string;
        emailId: string;
        isGlobal: boolean;
    };
    assignments: UserCompanyRoleAssignment[];
};

export type SaveUserCompanyRoleInput = {
    companyId: string;
    roleId: string;
};

export const getUserCompanyRolesService = async (
    userId: string
): Promise<ApiResponse<UserCompanyRolesData>> => {
    const response = await apiInstance.get<ApiResponse<UserCompanyRolesData>>(
        getApiUrl('getUserCompanyRoles', { userId })
    );
    return response.data;
};

export const saveUserCompanyRolesService = async (
    userId: string,
    assignments: SaveUserCompanyRoleInput[]
): Promise<ApiResponse<{ userId: string; assignments: UserCompanyRoleAssignment[] }>> => {
    const response = await apiInstance.put<
        ApiResponse<{ userId: string; assignments: UserCompanyRoleAssignment[] }>
    >(getApiUrl('saveUserCompanyRoles', { userId }), { assignments });
    return response.data;
};
