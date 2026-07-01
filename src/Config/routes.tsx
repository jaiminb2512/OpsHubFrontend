import type { ReactNode } from 'react';
import { PROJECT_PATHS } from '../Path';
import { ProjectListPage, ProjectFormPage, ProjectApiKeyPage } from './routePages';

export interface RouteConfig {
    path: string;
    component: () => ReactNode;
    requireAuth?: boolean;
}

export const appRoutes: RouteConfig[] = [
    { path: PROJECT_PATHS.LIST, component: ProjectListPage, requireAuth: true },
    { path: PROJECT_PATHS.CREATE, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.EDIT, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.API_KEYS, component: ProjectApiKeyPage, requireAuth: true },
];

export const getAllRoutes = (): RouteConfig[] => appRoutes;
