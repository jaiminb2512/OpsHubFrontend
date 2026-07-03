import { lazyPage } from './lazyPage';

export const ProjectListPage = lazyPage(() => import('../Pages/Project/ProjectListPage'));
export const ProjectFormPage = lazyPage(() => import('../Pages/Project/ProjectFormPage'));
export const ProjectApiKeyPage = lazyPage(() => import('../Pages/Project/ProjectApiKeyPage'));
export const DashboardStatsPage = lazyPage(() => import('../Components/Dashboard/DashboardStats'));
export const StorageConfigPage = lazyPage(() => import('../Components/StorageConfig/StorageConfigPage'));
