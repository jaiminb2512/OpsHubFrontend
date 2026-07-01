import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl, getApiUrlWithParams } from '../../Utils/api';
import type {
    PlanWizardApiEndpoint,
    PlanWizardLimitCatalogItem,
} from '../../Components/Common/Wizard/WizardStepPlanApiLimits';
import type { CompanyOption } from '../../types/planTypes';
export type PlanSetupDraftPayload = {
    plan: {
        name: string;
        description: string;
        price: string;
        durationDays: string;
        billingModel: string;
        isPublic: boolean;
        companyId: string;
        isActive: boolean;
        projectId?: string | null;
    };
    selectedModuleIds: string[];
    selectedFeatureIds: string[];
    apiLimits: any[];
};

export type PlanWizardModuleRow = {
    id: string;
    name: string;
    label?: string;
    description?: string;
    totalPermission?: number;
    moduleGroupId?: string | null;
    moduleGroup?: { id: string; key?: string; label: string } | null;
};

export type PlanFeatureLink = {
    planId: string;
    isEnabled: boolean;
};

export type PlanModuleFeatureRow = {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
    planFeatures: PlanFeatureLink[];
    moduleIds: string[];
};

export type PlanWizardFeaturesSetupPayload = {
    features: PlanModuleFeatureRow[];
};

export type PlanWizardLimitsSetupPayload = {
    limitsCatalog: PlanWizardLimitCatalogItem[];
    apiEndpoints: PlanWizardApiEndpoint[];
};

export type PlanWizardCompleteResult = {
    plan: { id: string; name: string };
};

export const getPlanWizardCompaniesService = async (): Promise<
    ApiResponse<{ companies: CompanyOption[] }>
> => {
    const response = await apiInstance.get<ApiResponse<{ companies: CompanyOption[] }>>(
        getApiUrl('planWizardCompanies')
    );
    return response.data;
};

export const getPlanWizardModulesService = async (): Promise<
    ApiResponse<{ modules: PlanWizardModuleRow[] }>
> => {
    const response = await apiInstance.get<ApiResponse<{ modules: PlanWizardModuleRow[] }>>(
        getApiUrl('planWizardModules')
    );
    return response.data;
};

export const getPlanWizardFeaturesSetupService = async (): Promise<ApiResponse<PlanWizardFeaturesSetupPayload>> => {
    const response = await apiInstance.get<ApiResponse<PlanWizardFeaturesSetupPayload>>(
        getApiUrl('planWizardFeaturesSetup')
    );
    return response.data;
};

export const getPlanWizardLimitsSetupService = async (
    featureIds: string[],
    options?: { isLimitAllowed?: boolean }
): Promise<ApiResponse<PlanWizardLimitsSetupPayload>> => {
    const query: Record<string, string> = {
        featureIds: featureIds.join(','),
    };
    if (options?.isLimitAllowed !== undefined) {
        query.isLimitAllowed = String(options.isLimitAllowed);
    }
    const { url } = getApiUrlWithParams('planWizardLimitsSetup', {}, query);
    const response = await apiInstance.get<ApiResponse<PlanWizardLimitsSetupPayload>>(url);
    return response.data;
};

export const completePlanWizardService = async (
    payload: PlanSetupDraftPayload
): Promise<ApiResponse<PlanWizardCompleteResult>> => {
    const response = await apiInstance.post<ApiResponse<PlanWizardCompleteResult>>(
        getApiUrl('planWizardComplete'),
        payload
    );
    return response.data;
};

export type PlanWizardEditPayload = {
    payload: PlanSetupDraftPayload;
};

export type PlanWizardModuleOption = { id: string; name: string };

export type PlanWizardPlanLimitsSetupPayload = {
    modules: PlanWizardModuleOption[];
    apiEndpoints: (PlanWizardApiEndpoint & {
        moduleId: string;
        existingLimit: {
            limitId: string;
            limitKey: string | null;
            value: number;
            enforcement: string;
            period: string | null;
        } | null;
    })[];
    limitsCatalog: PlanWizardLimitCatalogItem[];
};

export const savePlanWizardFeaturesService = async (
    planId: string,
    featureIds: string[]
): Promise<ApiResponse<{ planId: string }>> => {
    const response = await apiInstance.put<ApiResponse<{ planId: string }>>(
        getApiUrl('planWizardSaveFeatures', { planId }),
        { featureIds }
    );
    return response.data;
};

export const getPlanWizardPlanLimitsSetupService = async (
    planId: string,
    options?: { isLimitAllowed?: boolean }
): Promise<ApiResponse<PlanWizardPlanLimitsSetupPayload>> => {
    const query: Record<string, string> = {};
    if (options?.isLimitAllowed !== undefined) {
        query.isLimitAllowed = String(options.isLimitAllowed);
    }
    const { url } = getApiUrlWithParams('planWizardPlanLimitsSetup', { planId }, query);
    const response = await apiInstance.get<ApiResponse<PlanWizardPlanLimitsSetupPayload>>(url);
    return response.data;
};

export const getPlanWizardForEditService = async (
    planId: string
): Promise<ApiResponse<PlanWizardEditPayload>> => {
    const response = await apiInstance.get<ApiResponse<PlanWizardEditPayload>>(
        getApiUrl('planWizardForEdit', { planId })
    );
    return response.data;
};

export const updatePlanWizardService = async (
    planId: string,
    payload: PlanSetupDraftPayload
): Promise<ApiResponse<PlanWizardCompleteResult>> => {
    const response = await apiInstance.put<ApiResponse<PlanWizardCompleteResult>>(
        getApiUrl('planWizardUpdate', { planId }),
        payload
    );
    return response.data;
};
