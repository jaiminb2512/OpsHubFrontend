export const COMPANY_PATHS = {
    LIST: '/company',
    CREATE: '/company/create',
    EDIT: '/company/edit/:companyId',
    SUBSCRIBE: '/company/subscribe/:companyId',
    PERFORMANCE: '/company/performance/:companyId',
    USERS: '/company/users',
    USER_EDIT: '/company/users/:userId',
};

export const companyEditPath = (companyId: string) =>
    COMPANY_PATHS.EDIT.replace(':companyId', companyId);

export const companySubscribePath = (companyId: string) =>
    COMPANY_PATHS.SUBSCRIBE.replace(':companyId', companyId);

export const companyPerformancePath = (companyId: string) =>
    COMPANY_PATHS.PERFORMANCE.replace(':companyId', companyId);

export const companyUsersPath = (companyId?: string) =>
    companyId ? `${COMPANY_PATHS.USERS}?companyId=${companyId}` : COMPANY_PATHS.USERS;

export const companyUserEditPath = (userId: string) =>
    COMPANY_PATHS.USER_EDIT.replace(':userId', userId);



