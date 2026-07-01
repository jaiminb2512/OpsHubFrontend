import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import type { UserResponse } from './userServices';

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface LoginRequest {
  emailId: string;
  password: string;
}

import type { UserRoleContext } from '../../Utils/roleContextStorage';

export interface LoginResponse {
  userId: string;
  fullName: string;
  emailId: string;
  role: string | null;
  hierarchy?: number;
  token: string;
  imageUrl?: string;
  needToResetPassword?: boolean;
  isCompanyOnlyUser?: boolean;
  isSuperAdmin?: boolean;
  isGlobal: boolean;
  createdAt: string;
  roleContexts?: UserRoleContext[];
}

export interface RegisterRequest {
  fullName: string;
  emailId: string;
  password: string;
  roleId: string;
}

// ============================================
// AUTHENTICATION SERVICES
// ============================================

/**
 * Login Service
 * POST /api/users/login
 * 
 * @param credentials - Email and password
 * @returns Promise with user data and token
 */
export const loginService = async (
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiInstance.post<ApiResponse<LoginResponse>>(
    getApiUrl('login'),
    credentials
  );
  return response.data;
};

/**
 * Register Service
 * POST /api/users
 * 
 * @param userData - User registration data
 * @returns Promise with created user data
 */
export const registerService = async (
  userData: RegisterRequest
): Promise<ApiResponse<UserResponse>> => {
  const response = await apiInstance.post<ApiResponse<UserResponse>>(
    getApiUrl('register'),
    userData
  );
  return response.data;
};

/**
 * Create User by Admin Service
 * POST /api/users
 * 
 * Note: Requires admin authentication token in headers
 * 
 * @param userData - User data to be created (can be admin, subAdmin, or superAdmin)
 * @returns Promise with created user data
 */
export const createUserByAdminService = async (
  userData: { fullName: string; emailId: string; password: string; roleId: string } | FormData
): Promise<ApiResponse<UserResponse>> => {
  const isFormData = userData instanceof FormData;
  const response = await apiInstance.post<ApiResponse<UserResponse>>(
    getApiUrl('register'),
    userData,
    {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }
  );
  return response.data;
};


/**
 * Logout Service
 * POST /api/auth/logout
 * 
 * @returns Promise with success message
 */
export const logoutService = async (): Promise<ApiResponse<null>> => {
  const response = await apiInstance.post<ApiResponse<null>>(getApiUrl('logout'));
  return response.data;
};

