import type { LoginResponse } from '.';
import { getMeService } from './userServices';
import {
    clearRoleContextStorage,
    getActiveRoleContext,
    getRoleContextsList,
    isValidActiveContext,
    pickDefaultContext,
    setActiveRoleContext,
    setRoleContextsList,
    type UserRoleContext,
} from '../../Utils/roleContextStorage';

export type { UserRoleContext };
export {
    getActiveRoleContext,
    getRoleContextsList,
    setActiveRoleContext,
    setRoleContextsList,
    clearRoleContextStorage,
    isValidActiveContext,
    pickDefaultContext,
};

// ============================================
// AUTHENTICATION HELPER FUNCTIONS
// ============================================

/**
 * Store authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
    localStorage.setItem('token', token);
};

/**
 * Store user info in localStorage
 */
export const setUserInfo = (userInfo: LoginResponse): void => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
};

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

/**
 * Get user info from localStorage
 */
export const getUserInfo = (): LoginResponse | null => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * Remove authentication token and user info from localStorage
 */
export const removeAuthToken = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    clearRoleContextStorage();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

/**
 * Get current user role
 */
export const getCurrentUserRole = (): string | null => {
    const userInfo = getUserInfo();
    return userInfo?.role || null;
};

/**
 * Auto login using existing token
 * Calls /api/users/me to validate token and fetch user data
 * Returns true if successful, false if token is invalid
 */
export const autoLogin = async (): Promise<boolean> => {
    try {
        const token = getAuthToken();

        // If no token exists, return false
        if (!token) {
            return false;
        }

        const response = await getMeService();

        if (response.success === 200 && response.data) {
            const contexts = response.data.roleContexts ?? [];
            setRoleContextsList(contexts);

            const existing = getActiveRoleContext();
            const active =
                isValidActiveContext(existing, contexts)
                    ? existing
                    : pickDefaultContext(contexts);
            if (active) {
                setActiveRoleContext(active);
            }

            const userInfoToStore: LoginResponse = {
                userId: response.data.userId,
                fullName: response.data.fullName,
                emailId: response.data.emailId,
                role: active?.roleName ?? response.data.role,
                hierarchy: active?.hierarchy ?? response.data.hierarchy,
                token,
                roleContexts: contexts,
                isGlobal: response.data.isGlobal,
                isSuperAdmin: response.data.isSuperAdmin,
                createdAt: response.data.createdAt,
            };

            setUserInfo(userInfoToStore);
            return true;
        } else {
            // Token is invalid, clear auth data
            removeAuthToken();
            return false;
        }
    } catch (error) {
        console.error('Auto login failed:', error);
        // If request fails (e.g., 401), clear auth data
        removeAuthToken();
        return false;
    }
};

