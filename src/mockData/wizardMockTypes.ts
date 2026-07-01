import type { RoleSetupListRole } from '../Services/ApiServices/roleSetupWizardServices';
import type { WizardModule } from '../Components/RoleSetup/roleSetupWizardTypes';

export type ModuleSetupWizardMockModuleOption = {
    id: string;
    label?: string;
    name?: string;
};

export type ModuleSetupWizardMockApiOption = {
    id: string;
    method: string;
    path: string;
    key?: string;
};

export type ModuleSetupWizardMockFeatureOption = {
    id: string;
    name: string;
    key?: string;
};

export type ModuleSetupWizardMockMenuOption = {
    id: string;
    label: string;
};

export type ModuleSetupWizardMockData = {
    modulesList: ModuleSetupWizardMockModuleOption[];
    apiList: ModuleSetupWizardMockApiOption[];
    menuList: ModuleSetupWizardMockMenuOption[];
    featuresList: ModuleSetupWizardMockFeatureOption[];
};

export type RoleSetupWizardMockData = {
    rolesSelect: RoleSetupListRole[];
    modules: WizardModule[];
};

export type PlanSetupWizardMockModuleOption = {
    id: string;
    name: string;
    description?: string;
};

export type PlanSetupWizardMockFeatureOption = {
    id: string;
    moduleId?: string;
    key: string;
    name: string;
    description?: string;
};


export type PlanSetupWizardMockLimitEnforcement = 'max' | 'renewable';

export type PlanSetupWizardMockLimitCatalogOption = {
    key: string;
    name: string;
    enforcement: PlanSetupWizardMockLimitEnforcement;
    defaultPeriod?: 'daily' | 'weekly' | 'monthly';
};

export type PlanSetupWizardMockApiEndpointOption = {
    id: string;
    method: string;
    path: string;
    key: string;
    featureKey?: string;
    suggestedLimitKey?: string;
    defaultEnforcement?: PlanSetupWizardMockLimitEnforcement;
};

export type PlanSetupWizardMockCompanyOption = {
    id: string;
    name: string;
};

export type PlanSetupWizardMockData = {
    companiesList: PlanSetupWizardMockCompanyOption[];
    limitsCatalog: PlanSetupWizardMockLimitCatalogOption[];
    modulesList: PlanSetupWizardMockModuleOption[];
    featuresList: PlanSetupWizardMockFeatureOption[];
    apiEndpointsList: PlanSetupWizardMockApiEndpointOption[];
};
