import { lazyPage } from './lazyPage';

export const UsersPageRoute = lazyPage(() => import('../Pages/User/UsersPage'));
export const CreateUserPageRoute = lazyPage(() => import('../Pages/User/CreateUserPage'));
export const UpdateUserPageRoute = lazyPage(() => import('../Pages/User/UpdateUserPage'));
export const UserCompanyRolesPageRoute = lazyPage(() => import('../Pages/User/UserCompanyRolesPage'));
export const AddUserPageRoute = lazyPage(() => import('../Pages/User/AddUserPage'));
export const ProfilePageRoute = lazyPage(() => import('../Pages/User/ProfilePage'));

export const RoleListPage = lazyPage(() => import('../Components/Role/RoleView'));
export const RoleSetupWizardPage = lazyPage(() => import('../Components/RoleSetup/RoleSetupWizard'));
export const RoleImportPage = lazyPage(() => import('../Pages/Role/RoleImportPage'));
export const ModuleSetupWizardPage = lazyPage(
    () => import('../Components/ModuleSetup/ModuleSetupWizard')
);
export const PermissionListPage = lazyPage(() => import('../Components/Permission/PermissionList'));
export const PermissionCreatePage = lazyPage(
    () => import('../Components/Permission/PermissionCreate')
);
export const MenuListPage = lazyPage(() => import('../Components/Menu/MenuList'));
export const MenuCreatePage = lazyPage(() => import('../Components/Menu/MenuCreate'));
export const ApiEndpointListPage = lazyPage(() => import('../Components/ApiEndpoint/ApiEndpointList'));
export const ApiEndpointFormPage = lazyPage(() => import('../Components/ApiEndpoint/ApiEndpointForm'));
export const FeatureListPage = lazyPage(() => import('../Components/Feature/FeatureList'));
export const FeatureFormPage = lazyPage(() => import('../Components/Feature/FeatureForm'));
export const FeatureModuleListPage = lazyPage(() => import('../Components/FeatureModule/FeatureModuleList'));
export const FeatureModuleFormPage = lazyPage(() => import('../Components/FeatureModule/FeatureModuleForm'));
export const ModuleGroupListPage = lazyPage(() => import('../Components/ModuleGroup/ModuleGroupList'));
export const ModuleGroupFormPage = lazyPage(() => import('../Components/ModuleGroup/ModuleGroupForm'));
export const ModuleListPage = lazyPage(() => import('../Components/Module/ModuleList'));
export const ModuleEditPage = lazyPage(() => import('../Components/Module/ModuleEdit'));
export const PlanSetupWizardPage = lazyPage(() => import('../Components/PlanSetup/PlanSetupWizard'));
export const PlanListPage = lazyPage(() => import('../Components/PlanSetup/PlanList'));
export const CompanyListPage = lazyPage(() => import('../Components/CompanySetup/CompanyList'));
export const CompanySetupWizardPage = lazyPage(
    () => import('../Components/CompanySetup/CompanySetupWizard')
);
export const CompanySubscribePage = lazyPage(
    () => import('../Components/CompanySetup/CompanySubscribePage')
);
export const CompanyUserListPage = lazyPage(() => import('../Pages/CompanyUser/CompanyUserListPage'));
export const CompanyUserEditPage = lazyPage(() => import('../Pages/CompanyUser/CompanyUserEditPage'));
export const ProjectListPage = lazyPage(() => import('../Pages/Project/ProjectListPage'));
export const ProjectFormPage = lazyPage(() => import('../Pages/Project/ProjectFormPage'));
export const ProjectApiKeyPage = lazyPage(() => import('../Pages/Project/ProjectApiKeyPage'));
export const ImportDataPage = lazyPage(() => import('../Pages/Project/ImportDataPage'));
