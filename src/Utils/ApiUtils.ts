import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
// API Base URL
const BASE_URL = import.meta.env.VITE_NODEJS_BASE_URL;

// Create axios instance
const apiInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: handle errors
apiInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        // DEPRECATED: Automatic logout on 401 was causing issues during mandatory flows
        // (like password reset) and across multiple simultaneous API calls.
        // Components should now handle authorization errors individually if needed.
        
        // if (error?.response?.status === 401) {
        //     clearAuthAndRedirectToLogin(error.config);
        // }
        
        return Promise.reject(error);
    }
);

// Generic API response type
export interface ApiResponse<T = unknown> {
    success: number;
    message: string;
    data: T;
}

// Generic API error response type
export interface ApiError {
    success: number;
    message: string;
    data?: unknown;
}

export default apiInstance;

