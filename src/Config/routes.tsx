import type { ReactNode } from 'react';
import { PROJECT_PATHS, DASHBOARD_PATHS, ATTENDANCE_PATHS } from '../Path';
import { ProjectListPage, ProjectFormPage, ProjectApiKeyPage, DashboardStatsPage, AttendancePage, ProjectAnalyticsPage, ApiKeyAnalyticsPage, ProvidersPage, GlobalProvidersPage, CreateGlobalProviderPage } from './routePages';

export interface RouteConfig {
    path: string;
    component: () => ReactNode;
    requireAuth?: boolean;
}

export const appRoutes: RouteConfig[] = [
    { path: DASHBOARD_PATHS.STATS, component: DashboardStatsPage, requireAuth: true },
    { path: PROJECT_PATHS.LIST, component: ProjectListPage, requireAuth: true },
    { path: PROJECT_PATHS.CREATE, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.EDIT, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.API_KEYS, component: ProjectApiKeyPage, requireAuth: true },
    { path: ATTENDANCE_PATHS.VIEW, component: AttendancePage, requireAuth: true },
    { path: DASHBOARD_PATHS.PROJECT_ANALYTICS, component: ProjectAnalyticsPage, requireAuth: true },
    { path: DASHBOARD_PATHS.API_KEY_ANALYTICS, component: ApiKeyAnalyticsPage, requireAuth: true },
    { path: PROJECT_PATHS.PROVIDERS, component: ProvidersPage, requireAuth: true },
    { path: DASHBOARD_PATHS.GLOBAL_PROVIDERS, component: GlobalProvidersPage, requireAuth: true },
    { path: DASHBOARD_PATHS.GLOBAL_PROVIDERS_CREATE, component: CreateGlobalProviderPage, requireAuth: true },
];

export const getAllRoutes = (): RouteConfig[] => appRoutes;
