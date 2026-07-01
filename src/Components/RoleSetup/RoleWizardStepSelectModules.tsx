import WizardStepSelectModules from '../Common/Wizard/WizardStepSelectModules';
import type { WizardModule } from './roleSetupWizardTypes';

export interface RoleWizardStepSelectModulesProps {
    useApi: boolean;
    modulesLoading: boolean;
    moduleSearch: string;
    onModuleSearchChange: (v: string) => void;
    selectedModuleIds: Set<string>;
    onClearModules: () => void;
    filteredModules: WizardModule[];
    onToggleModule: (id: string) => void;
    onToggleAllModules: () => void;
}

const RoleWizardStepSelectModules = ({ filteredModules, ...rest }: RoleWizardStepSelectModulesProps) => {
    // Normalise moduleGroupLabel from the new moduleGroups array for the shared component
    const normalised = filteredModules.map(m => ({
        ...m,
        moduleGroupLabel: m.moduleGroupLabel ?? m.moduleGroups?.[0]?.label ?? null,
    }));

    return (
        <WizardStepSelectModules
            {...rest}
            filteredModules={normalised}
            title="Select Modules"
            description="Choose the modules this role should have access to. You'll assign specific permissions in the next step."
            gridMaxHeight="min(52vh, 480px)"
        />
    );
};

export default RoleWizardStepSelectModules;
