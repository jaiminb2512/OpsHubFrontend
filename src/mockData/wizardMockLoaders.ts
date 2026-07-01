import type {
    ModuleSetupWizardMockData,
    PlanSetupWizardMockData,
    RoleSetupWizardMockData,
} from './wizardMockTypes';

/** Lazy-load role wizard JSON (separate chunk; not in main bundle when unused). */
export async function loadRoleSetupWizardMock(): Promise<RoleSetupWizardMockData> {
    const mod = await import('./roleSetupWizard.mock.json');
    return mod.default as RoleSetupWizardMockData;
}

/** Lazy-load module wizard JSON. */
export async function loadModuleSetupWizardMock(): Promise<ModuleSetupWizardMockData> {
    const mod = await import('./moduleSetupWizard.mock.json');
    return mod.default as ModuleSetupWizardMockData;
}

/** Lazy-load plan wizard JSON. */
export async function loadPlanSetupWizardMock(): Promise<PlanSetupWizardMockData> {
    const mod = await import('./planSetupWizard.mock.json');
    return mod.default as PlanSetupWizardMockData;
}
