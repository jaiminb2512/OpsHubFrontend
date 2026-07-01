import { lazyPage } from './lazyPage';

export const ProjectListPage = lazyPage(() => import('../Pages/Project/ProjectListPage'));
export const ProjectFormPage = lazyPage(() => import('../Pages/Project/ProjectFormPage'));
export const ProjectApiKeyPage = lazyPage(() => import('../Pages/Project/ProjectApiKeyPage'));
