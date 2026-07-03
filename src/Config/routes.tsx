import type { ReactNode } from 'react';
import { PROJECT_PATHS, DASHBOARD_PATHS } from '../Path';
import { ProjectListPage, ProjectFormPage, ProjectApiKeyPage, DashboardStatsPage, StorageConfigPage } from './routePages';

export interface RouteConfig {
    path: string;
    component: () => ReactNode;
    requireAuth?: boolean;
}

export const appRoutes: RouteConfig[] = [
    { path: DASHBOARD_PATHS.STATS, component: DashboardStatsPage, requireAuth: true },
    { path: DASHBOARD_PATHS.STORAGE_CONFIG, component: StorageConfigPage, requireAuth: true },
    { path: PROJECT_PATHS.LIST, component: ProjectListPage, requireAuth: true },
    { path: PROJECT_PATHS.CREATE, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.EDIT, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.API_KEYS, component: ProjectApiKeyPage, requireAuth: true },
];

export const getAllRoutes = (): RouteConfig[] => appRoutes;
