import type { ReactNode } from 'react';
import {
    USER_PATHS,
    ROLE_PATHS,
    MENU_PATHS,
    PERMISSION_PATHS,
    MODULE_PATHS,
    API_ENDPOINT_PATHS,
    FEATURE_PATHS,
    FEATURE_MODULE_PATHS,
    MODULE_GROUP_PATHS,
    COMPANY_PATHS,
    PLAN_PATHS,
    PROJECT_PATHS,
} from '../Path';
import {
    RoleListPage,
    RoleSetupWizardPage,
    RoleImportPage,
    PermissionListPage,
    PermissionCreatePage,
    ApiEndpointListPage,
    ApiEndpointFormPage,
    FeatureListPage,
    FeatureFormPage,
    FeatureModuleListPage,
    FeatureModuleFormPage,
    ModuleGroupListPage,
    ModuleGroupFormPage,
    MenuListPage,
    MenuCreatePage,
    ModuleSetupWizardPage,
    PlanListPage,
    PlanSetupWizardPage,
    CompanyListPage,
    CompanySetupWizardPage,
    CompanySubscribePage,
    CompanyUserListPage,
    CompanyUserEditPage,
    ModuleListPage,
    ModuleEditPage,
    UsersPageRoute,
    CreateUserPageRoute,
    UpdateUserPageRoute,
    UserCompanyRolesPageRoute,
    AddUserPageRoute,
    ProfilePageRoute,
    ProjectListPage,
    ProjectFormPage,
    ProjectApiKeyPage,
    ImportDataPage,
} from './routePages';

export interface RouteConfig {
    path: string;
    component: () => ReactNode;
    requireAuth?: boolean;
}

export const appRoutes: RouteConfig[] = [
    { path: ROLE_PATHS.LIST, component: RoleListPage, requireAuth: true },
    { path: ROLE_PATHS.CREATE, component: RoleSetupWizardPage, requireAuth: true },
    { path: ROLE_PATHS.EDIT, component: RoleSetupWizardPage, requireAuth: true },
    { path: ROLE_PATHS.IMPORT, component: RoleImportPage, requireAuth: true },

    { path: PERMISSION_PATHS.LIST, component: PermissionListPage, requireAuth: true },
    { path: PERMISSION_PATHS.CREATE, component: PermissionCreatePage, requireAuth: true },

    { path: API_ENDPOINT_PATHS.LIST, component: ApiEndpointListPage, requireAuth: true },
    { path: API_ENDPOINT_PATHS.CREATE, component: ApiEndpointFormPage, requireAuth: true },
    { path: API_ENDPOINT_PATHS.EDIT, component: ApiEndpointFormPage, requireAuth: true },

    { path: FEATURE_PATHS.LIST, component: FeatureListPage, requireAuth: true },
    { path: FEATURE_PATHS.CREATE, component: FeatureFormPage, requireAuth: true },
    { path: FEATURE_PATHS.EDIT, component: FeatureFormPage, requireAuth: true },

    { path: FEATURE_MODULE_PATHS.LIST, component: FeatureModuleListPage, requireAuth: true },
    { path: FEATURE_MODULE_PATHS.CREATE, component: FeatureModuleFormPage, requireAuth: true },
    { path: FEATURE_MODULE_PATHS.MANAGE, component: FeatureModuleFormPage, requireAuth: true },

    { path: MODULE_GROUP_PATHS.LIST, component: ModuleGroupListPage, requireAuth: true },
    { path: MODULE_GROUP_PATHS.CREATE, component: ModuleGroupFormPage, requireAuth: true },
    { path: MODULE_GROUP_PATHS.EDIT, component: ModuleGroupFormPage, requireAuth: true },

    { path: MENU_PATHS.LIST, component: MenuListPage, requireAuth: true },
    { path: MENU_PATHS.CREATE, component: MenuCreatePage, requireAuth: true },
    { path: MENU_PATHS.EDIT, component: MenuCreatePage, requireAuth: true },

    { path: MODULE_PATHS.CREATE, component: ModuleSetupWizardPage, requireAuth: true },
    { path: MODULE_PATHS.LIST, component: ModuleListPage, requireAuth: true },
    { path: MODULE_PATHS.EDIT_BULK, component: ModuleEditPage, requireAuth: true },
    { path: MODULE_PATHS.EDIT, component: ModuleEditPage, requireAuth: true },

    { path: PLAN_PATHS.LIST, component: PlanListPage, requireAuth: true },
    { path: PLAN_PATHS.CREATE, component: PlanSetupWizardPage, requireAuth: true },
    { path: PLAN_PATHS.EDIT, component: PlanSetupWizardPage, requireAuth: true },

    { path: COMPANY_PATHS.LIST, component: CompanyListPage, requireAuth: true },
    { path: COMPANY_PATHS.CREATE, component: CompanySetupWizardPage, requireAuth: true },
    { path: COMPANY_PATHS.EDIT, component: CompanySetupWizardPage, requireAuth: true },
    { path: COMPANY_PATHS.SUBSCRIBE, component: CompanySubscribePage, requireAuth: true },
    { path: COMPANY_PATHS.USER_EDIT, component: CompanyUserEditPage, requireAuth: true },
    { path: COMPANY_PATHS.USERS, component: CompanyUserListPage, requireAuth: true },

    { path: USER_PATHS.PROFILE, component: ProfilePageRoute, requireAuth: true },
    { path: USER_PATHS.LIST, component: UsersPageRoute, requireAuth: true },
    { path: USER_PATHS.CREATE, component: CreateUserPageRoute, requireAuth: true },
    { path: USER_PATHS.EDIT, component: UpdateUserPageRoute, requireAuth: true },
    { path: USER_PATHS.COMPANY_ROLES, component: UserCompanyRolesPageRoute, requireAuth: true },
    { path: USER_PATHS.ADD, component: AddUserPageRoute, requireAuth: true },

    { path: PROJECT_PATHS.LIST, component: ProjectListPage, requireAuth: true },
    { path: PROJECT_PATHS.CREATE, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.EDIT, component: ProjectFormPage, requireAuth: true },
    { path: PROJECT_PATHS.API_KEYS, component: ProjectApiKeyPage, requireAuth: true },
    { path: PROJECT_PATHS.IMPORT, component: ImportDataPage, requireAuth: true },
];

export const getAllRoutes = (): RouteConfig[] => appRoutes;
