export const PROJECT_PATHS = {
    LIST: '/project',
    CREATE: '/project/create',
    EDIT: '/project/edit/:id',
    API_KEYS: '/api-keys',
    IMPORT: '/import-data',
};

// ?projectId=xxx  — pre-select a project
// ?companyId=xxx  — filter projects by company
export const apiKeysPath = (params?: { projectId?: string; companyId?: string }) => {
    if (!params) return PROJECT_PATHS.API_KEYS;
    const q = new URLSearchParams();
    if (params.projectId) q.set('projectId', params.projectId);
    if (params.companyId) q.set('companyId', params.companyId);
    const qs = q.toString();
    return qs ? `${PROJECT_PATHS.API_KEYS}?${qs}` : PROJECT_PATHS.API_KEYS;
};
