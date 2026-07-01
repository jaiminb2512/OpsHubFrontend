import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import type { PaginationMeta } from './commonTypes';
import type { Role } from './roleServices';
import type { UserRoleContext } from '../../Utils/roleContextStorage';

// ============================================
// USER TYPES
// ============================================

export interface UserCompanyAssignment {
  companyId: string | null;
  companyName: string | null;
  roleName: string | null;
}

export interface UserResponse {
  userId: string;
  fullName: string;
  emailId: string;
  role: string | null;
  roleId?: string | null;
  hierarchy?: number;
  imageUrl?: string;
  isGlobal: boolean;
  companyId?: string | null;
  companyName?: string | null;
  companyAssignments?: UserCompanyAssignment[];
  createdAt: string;
  token?: string;
  needToResetPassword?: boolean;
  isCompanyOnlyUser?: boolean;
  isSuperAdmin?: boolean;
  roleContexts?: UserRoleContext[];
}

export interface UsersPaginatedResponse {
  users: UserResponse[];
  pagination: PaginationMeta;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  password: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

// ============================================
// USER SERVICES
// ============================================

/**
 * Get Current User (Me) Service
 * GET /api/users/me
 * 
 * Returns the authenticated user's details
 * 
 * @returns Promise with current user data
 */
export const getMeService = async (): Promise<ApiResponse<UserResponse>> => {
  const response = await apiInstance.get<ApiResponse<UserResponse>>(
    getApiUrl('getMe')
  );
  return response.data;
};

export const getMyRoleContextsService = async (): Promise<ApiResponse<UserRoleContext[]>> => {
  const response = await apiInstance.get<ApiResponse<UserRoleContext[]>>(
    getApiUrl('getMyRoleContexts')
  );
  return response.data;
};

/**
 * Change Password Service
 * POST /api/users/change-password
 * 
 * Changes the authenticated user's password (requires authentication)
 * 
 * @param passwordData - Object containing the new password
 * @returns Promise with success message
 */
export const changePasswordService = async (
  passwordData: ChangePasswordRequest
): Promise<ApiResponse<null>> => {
  const response = await apiInstance.post<ApiResponse<null>>(
    getApiUrl('changePassword'),
    passwordData
  );
  return response.data;
};

/**
 * Reset Password Service
 * POST /api/users/reset-password/:userId
 * 
 * Resets a user's password (requires admin or subAdmin role)
 * 
 * @param userId - User ID whose password needs to be reset
 * @param passwordData - Object containing the new password
 * @returns Promise with success message
 */
export const resetPasswordService = async (
  userId: string,
  passwordData: ResetPasswordRequest
): Promise<ApiResponse<null>> => {
  const response = await apiInstance.post<ApiResponse<null>>(
    getApiUrl('resetPassword', { userId }),
    passwordData
  );
  return response.data;
};

/**
 * Get User Roles Service
 * GET /api/users/roles
 * 
 * Returns available roles based on the authenticated user's role
 * 
 * @returns Promise with array of available roles
 */
export const getUserRolesService = async (): Promise<ApiResponse<Role[]>> => {
  const response = await apiInstance.get<ApiResponse<Role[]>>(
    getApiUrl('getUserRoles')
  );
  return response.data;
};

/**
 * Get All Users Service with Pagination and Filtering
 * GET /api/users?page=1&limit=10&search=&role=
 *
 * @param page - Page number (default: 1)
 * @param limit - Number of items per page (default: 10)
 * @param search - Search query for name or email (optional)
 * @param role - Filter by role name (optional)
 * @param roleId - Filter by role id (optional)
 * @param companyId - Filter users assigned to a company (optional)
 * @param isGlobal - Filter by global users when "true" or "false" (optional)
 * @returns Promise with paginated users data
 */
export const getUsersService = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  role: string = "",
  roleId: string = "",
  companyId: string = "",
  isGlobal: string = ""
): Promise<ApiResponse<UsersPaginatedResponse>> => {
  const response = await apiInstance.get<ApiResponse<UsersPaginatedResponse>>(
    getApiUrl('getUsers'),
    {
      params: {
        page,
        limit,
        search,
        role,
        roleId,
        ...(companyId ? { companyId } : {}),
        ...(isGlobal ? { isGlobal } : {}),
      }
    }
  );
  return response.data;
};

/**
 * Get User By ID Service
 * GET /api/users/:id
 * 
 * @param userId - User ID
 * @returns Promise with user data
 */
export const getUserByIdService = async (userId: string): Promise<ApiResponse<UserResponse>> => {
  const response = await apiInstance.get<ApiResponse<UserResponse>>(
    getApiUrl('getUserById', { id: userId })
  );
  return response.data;
};

/**
 * Update User Service
 * PUT /api/users/:id
 * 
 * @param userId - User ID
 * @param userData - User data to update (currently only fullName is supported)
 * @returns Promise with updated user data
 */
export const updateUserService = async (
  userId: string,
  userData: { fullName: string; imageUrl?: string } | FormData
): Promise<ApiResponse<UserResponse>> => {
  const isFormData = userData instanceof FormData;
  const response = await apiInstance.put<ApiResponse<UserResponse>>(
    getApiUrl('updateUser', { id: userId }),
    userData,
    {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }
  );
  return response.data;
};

/**
 * Delete User Service
 * DELETE /api/users/:id
 * 
 * @param userId - User ID
 * @returns Promise with success message
 */
export const deleteUserService = async (userId: string): Promise<ApiResponse<null>> => {
  const response = await apiInstance.delete<ApiResponse<null>>(
    getApiUrl('deleteUser', { id: userId })
  );
  return response.data;
};

export interface FillExternalUsersResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { userId: string; reason: string }[];
}

export const fillExternalUsersService = async (
  payload: object
): Promise<ApiResponse<FillExternalUsersResult>> => {
  const response = await apiInstance.post<ApiResponse<FillExternalUsersResult>>(
    getApiUrl('fillExternalUsers'),
    payload
  );
  return response.data;
};

