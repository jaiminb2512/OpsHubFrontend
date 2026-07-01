import type { LoginResponse } from '.';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import type { ApiResponse } from '../../Utils/ApiUtils';

// ============================================
// AUTHENTICATION HELPER FUNCTIONS
// ============================================

export const setAuthToken = (token: string): void => {
    localStorage.setItem('token', token);
};

export const setUserInfo = (userInfo: LoginResponse): void => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

export const getUserInfo = (): LoginResponse | null => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
};

export const removeAuthToken = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
};

export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

export const getCurrentUserRole = (): string | null => {
    const userInfo = getUserInfo();
    return userInfo?.role ?? null;
};

export const autoLogin = async (): Promise<boolean> => {
    try {
        const token = getAuthToken();
        if (!token) return false;

        const response = await apiInstance.get<ApiResponse<LoginResponse>>(getApiUrl('me'));
        const data = response.data;

        if (data.success === 200 && data.data) {
            setUserInfo({ ...data.data, token });
            return true;
        }

        removeAuthToken();
        return false;
    } catch {
        removeAuthToken();
        return false;
    }
};
