import { Layers as GroupIcon } from '@mui/icons-material';
import WizardStepSelectCards from '../Common/Wizard/WizardStepSelectCards';
import type { WizardModuleGroup } from './roleSetupWizardTypes';

export interface RoleWizardStepSelectModuleGroupsProps {
    groupsLoading: boolean;
    groupSearch: string;
    onGroupSearchChange: (v: string) => void;
    selectedGroupIds: Set<string>;
    onClearGroups: () => void;
    moduleGroups: WizardModuleGroup[];
    onToggleGroup: (id: string) => void;
    onToggleAllGroups: () => void;
}

const RoleWizardStepSelectModuleGroups = ({
    groupsLoading,
    groupSearch,
    onGroupSearchChange,
    selectedGroupIds,
    onClearGroups,
    moduleGroups,
    onToggleGroup,
    onToggleAllGroups,
}: RoleWizardStepSelectModuleGroupsProps) => {
    const filtered = moduleGroups.filter((g) =>
        g.label.toLowerCase().includes(groupSearch.toLowerCase()) ||
        (g.description ?? '').toLowerCase().includes(groupSearch.toLowerCase())
    );

    const cardItems = filtered.map((g) => ({
        id: g.id,
        name: g.label,
        description: g.description ?? undefined,
        badgeLabel: g.moduleCount != null ? `${g.moduleCount} module${g.moduleCount !== 1 ? 's' : ''}` : undefined,
    }));

    return (
        <WizardStepSelectCards
            icon={<GroupIcon />}
            title="Select Module Groups"
            description="Choose the module groups this role should have access to. You'll pick specific modules from those groups in the next step."
            searchPlaceholder="Search module groups…"
            search={groupSearch}
            onSearchChange={onGroupSearchChange}
            selectedIds={selectedGroupIds}
            onClearSelection={onClearGroups}
            filteredItems={cardItems}
            onToggleItem={onToggleGroup}
            onToggleAll={onToggleAllGroups}
            selectionCountLabel={(count) => `${count} group${count !== 1 ? 's' : ''} selected`}
            emptySearchMessage="No module groups match your search"
            loading={groupsLoading}
            gridMaxHeight="min(52vh, 480px)"
        />
    );
};

export default RoleWizardStepSelectModuleGroups;
