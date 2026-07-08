const NODEJS_BASE_URL = import.meta.env.VITE_NODEJS_BASE_URL;

interface EndpointConfig {
    path: string;
    method: string;
    baseUrl: string;
}

interface ApiConfig {
    endpoints: Record<string, EndpointConfig>;
}

interface ApiConfigResult {
    url: string;
    method: string;
    baseUrl: string;
}

export const API_CONFIG: ApiConfig = {
    endpoints: {
        // ============================================
        // AUTHENTICATION ENDPOINTS
        // ============================================
        login: {
            path: '/users/login',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        logout: {
            path: '/auth/logout',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        register: {
            path: '/users',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // USER ENDPOINTS
        // ============================================
        getMe: {
            path: '/users/me',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        changePassword: {
            path: '/users/change-password',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PROJECT ENDPOINTS
        // ============================================
        getProjects: {
            path: '/projects',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectById: {
            path: '/projects/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createProject: {
            path: '/projects',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateProject: {
            path: '/projects/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProject: {
            path: '/projects/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        hardDeleteProject: {
            path: '/import/project/{id}/hard-delete',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ── Project API Keys ──
        listProjectApiKeys: {
            path: '/projects/{projectId}/api-keys',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createProjectApiKey: {
            path: '/projects/{projectId}/api-keys',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        toggleProjectApiKey: {
            path: '/projects/{projectId}/api-keys/{keyId}',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProjectApiKey: {
            path: '/projects/{projectId}/api-keys/{keyId}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // MODULE ENDPOINTS
        // ============================================
        getModules: {
            path: '/modules',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // NOTIFICATION ENDPOINTS
        // ============================================
        getNotifications: {
            path: '/notifications',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        markNotificationRead: {
            path: '/notifications/{id}/read',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        markNotificationUnread: {
            path: '/notifications/{id}/unread',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        markAllNotificationsRead: {
            path: '/notifications/read-all',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PROJECT STATS & STORAGE CONFIG
        // ============================================
        getProjectStats: {
            path: '/projects/{id}/stats',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getDashboardStats: {
            path: '/projects/dashboard-stats',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAnalytics: {
            path: '/projects/analytics',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectAnalytics: {
            path: '/projects/{id}/analytics',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getApiKeyAnalytics: {
            path: '/projects/{id}/api-key-analytics',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // ASSET ENDPOINTS
        // ============================================
        uploadAsset: {
            path: '/assets/upload',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        listAssets: {
            path: '/assets',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAsset: {
            path: '/assets/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAssetSignedUrl: {
            path: '/assets/{id}/signed-url',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteAsset: {
            path: '/assets/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // IMAGE ENDPOINTS
        // ============================================
        getImage: {
            path: '/images/{filename}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // Dashboard read-only attendance (JWT)
        getProjectAttendanceMonthly: {
            path: '/projects/{projectId}/attendance/monthly',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectAttendanceSummary: {
            path: '/projects/{projectId}/attendance/summary',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectAttendanceByDate: {
            path: '/projects/{projectId}/attendance',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
    },
};

export const getImageUrl = (filename: string): string => {
    if (!filename) return '';

    // Handle JSON array strings like '["filename.png"]'
    let processedFilename = filename;
    try {
        if (typeof filename === 'string' && (filename.startsWith('[') || filename.startsWith('{'))) {
            const parsed = JSON.parse(filename);
            if (Array.isArray(parsed) && parsed.length > 0) {
                processedFilename = parsed[0];
            } else if (typeof parsed === 'string') {
                processedFilename = parsed;
            }
        }
    } catch {
        // Not a JSON string, use original
    }

    if (processedFilename.startsWith('data:') || processedFilename.startsWith('blob:') || processedFilename.startsWith('http://') || processedFilename.startsWith('https://')) {
        return processedFilename;
    }

    return getApiUrl('getImage', { filename: processedFilename });
};

export const getApiUrl = (endpoint: string, pathParams: Record<string, string> = {}): string => {
    const endpointConfig = API_CONFIG.endpoints[endpoint];

    if (!endpointConfig) {
        throw new Error(`Endpoint ${endpoint} not found in API configuration`);
    }

    const baseUrl = API_CONFIG.endpoints[endpoint].baseUrl;

    // Replace path parameters in the URL
    let path = endpointConfig.path;
    Object.keys(pathParams).forEach(key => {
        path = path.replace(`{${key}}`, pathParams[key]);
    });

    const fullUrl = `${baseUrl}${path}`;

    return fullUrl;
};

export const getApiUrlWithParams = (endpoint: string, pathParams: Record<string, string> = {}, queryParams: Record<string, string> = {}): ApiConfigResult => {
    const endpointConfig = API_CONFIG.endpoints[endpoint];

    if (!endpointConfig) {
        throw new Error(`Endpoint ${endpoint} not found in API configuration`);
    }

    const baseUrl = API_CONFIG.endpoints[endpoint].baseUrl;

    // Replace path parameters in the URL
    let path = endpointConfig.path;
    Object.keys(pathParams).forEach(key => {
        path = path.replace(`{${key}}`, pathParams[key]);
    });

    const fullUrl = `${baseUrl}${path}`;

    const url = new URL(fullUrl);
    Object.keys(queryParams).forEach(key => {
        url.searchParams.append(key, queryParams[key]);
    });

    return {
        url: url.toString(),
        method: endpointConfig.method,
        baseUrl: baseUrl
    };
};

export const getApiConfig = (endpoint: string, pathParams: Record<string, string> = {}): ApiConfigResult => {
    const endpointConfig = API_CONFIG.endpoints[endpoint];

    if (!endpointConfig) {
        throw new Error(`Endpoint ${endpoint} not found in API configuration`);
    }

    const baseUrl = API_CONFIG.endpoints[endpoint].baseUrl;

    // Replace path parameters in the URL
    let path = endpointConfig.path;
    Object.keys(pathParams).forEach(key => {
        path = path.replace(`{${key}}`, pathParams[key]);
    });

    const fullUrl = `${baseUrl}${path}`;

    return {
        url: fullUrl,
        method: endpointConfig.method,
        baseUrl: baseUrl
    };
};
