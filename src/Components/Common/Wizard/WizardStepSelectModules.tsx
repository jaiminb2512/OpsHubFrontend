import { ViewModule as ModuleIcon } from '@mui/icons-material';
import WizardStepSelectCards from './WizardStepSelectCards';
import type { WizardSelectCardItem } from './WizardStepSelectCards';

export type WizardSelectModuleItem = {
    id: string;
    name: string;
    description?: string;
    permissions?: { id: string }[];
    totalPermission?: number;
    moduleGroupLabel?: string | null;
};

export interface WizardStepSelectModulesProps {
    useApi: boolean;
    modulesLoading?: boolean;
    title?: string;
    description?: string;
    moduleSearch: string;
    onModuleSearchChange: (v: string) => void;
    selectedModuleIds: Set<string>;
    onClearModules: () => void;
    filteredModules: WizardSelectModuleItem[];
    onToggleModule: (id: string) => void;
    onToggleAllModules: () => void;
    /** Scroll module cards inside a fixed-height box (role/plan wizards). */
    gridMaxHeight?: number | string;
}

const toCardItems = (modules: WizardSelectModuleItem[], useApi: boolean): WizardSelectCardItem[] =>
    modules.map((m) => {
        const permissionCount = useApi
            ? (m.totalPermission ?? 0)
            : (m.permissions?.length ?? m.totalPermission ?? 0);
        return {
            id: m.id,
            name: m.name,
            description: m.description,
            groupLabel: m.moduleGroupLabel ?? null,
            badgeLabel: `${permissionCount} permissions`,
        };
    });

const WizardStepSelectModules = ({
    useApi,
    modulesLoading = false,
    title = 'Select Modules',
    description = "Choose the modules to include. You'll configure details in the next step.",
    moduleSearch,
    onModuleSearchChange,
    selectedModuleIds,
    onClearModules,
    filteredModules,
    onToggleModule,
    onToggleAllModules,
    gridMaxHeight = 'min(52vh, 480px)',
}: WizardStepSelectModulesProps) => (
    <WizardStepSelectCards
        icon={<ModuleIcon />}
        title={title}
        description={description}
        searchPlaceholder="Search modules…"
        search={moduleSearch}
        onSearchChange={onModuleSearchChange}
        selectedIds={selectedModuleIds}
        onClearSelection={onClearModules}
        filteredItems={toCardItems(filteredModules, useApi)}
        onToggleItem={onToggleModule}
        onToggleAll={onToggleAllModules}
        selectionCountLabel={(count) => `${count} module${count > 1 ? 's' : ''} selected`}
        emptySearchMessage="No modules match your search"
        loading={useApi && modulesLoading}
        gridMaxHeight={gridMaxHeight}
    />
);

export default WizardStepSelectModules;
