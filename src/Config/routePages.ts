import { lazyPage } from './lazyPage';

export const ProjectListPage = lazyPage(() => import('../Pages/Project/ProjectListPage'));
export const ProjectFormPage = lazyPage(() => import('../Pages/Project/ProjectFormPage'));
export const ProjectApiKeyPage = lazyPage(() => import('../Pages/Project/ProjectApiKeyPage'));
export const DashboardStatsPage = lazyPage(() => import('../Components/Dashboard/DashboardStats'));
export const AttendancePage = lazyPage(() => import('../Pages/Attendance/AttendancePage'));
export const ProjectAnalyticsPage = lazyPage(() => import('../Pages/Analytics/ProjectAnalyticsPage'));
export const ApiKeyAnalyticsPage = lazyPage(() => import('../Pages/Analytics/ApiKeyAnalyticsPage'));
export const ProvidersPage = lazyPage(() => import('../Pages/Provider/ProvidersPage'));
export const GlobalProvidersPage = lazyPage(() => import('../Pages/Provider/GlobalProvidersPage'));
export const CreateGlobalProviderPage = lazyPage(() => import('../Pages/Provider/CreateGlobalProviderPage'));
export const EmailPage = lazyPage(() => import('../Pages/Email/EmailPage'));
