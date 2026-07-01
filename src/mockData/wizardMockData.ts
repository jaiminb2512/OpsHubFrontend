/** True when `VITE_USE_API` is the string `"true"` (case-insensitive). */
export function isWizardUseApiEnabled(): boolean {
    return String(import.meta.env.VITE_USE_API ?? '').trim().toLowerCase() === 'true';
}

export {
    loadRoleSetupWizardMock,
    loadModuleSetupWizardMock,
    loadPlanSetupWizardMock,
} from './wizardMockLoaders';

export { useWizardMockData } from './useWizardMockData';
export type { UseWizardMockDataResult } from './useWizardMockData';

export type {
    ModuleSetupWizardMockData,
    PlanSetupWizardMockData,
    RoleSetupWizardMockData,
} from './wizardMockTypes';
