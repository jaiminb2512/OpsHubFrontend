export const DASHBOARD_PATHS = {
    HOME: '/dashboard',
    STATS: '/dashboard/stats',
    STORAGE_CONFIG: '/dashboard/storage-config',
    PROJECT_ANALYTICS: '/dashboard/project/:id',
    API_KEY_ANALYTICS: '/dashboard/project/:id/api-keys',
};

export const projectAnalyticsPath = (id: string) => `/dashboard/project/${id}`;
export const apiKeyAnalyticsPath = (id: string) => `/dashboard/project/${id}/api-keys`;
