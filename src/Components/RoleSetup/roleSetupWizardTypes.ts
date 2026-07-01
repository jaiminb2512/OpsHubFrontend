export type WizardPermission = {
    id: string;
    description: string;
    apiMethod: string;
    apiRoute: string;
};

export type WizardModuleGroup = {
    id: string;
    key: string;
    label: string;
    description?: string | null;
    orderIndex?: number;
    moduleCount?: number;
};

export type WizardModule = {
    id: string;
    name: string;
    description: string;
    permissions: WizardPermission[];
    totalPermission?: number;
    moduleGroups?: WizardModuleGroup[];
    /** @deprecated use moduleGroups */
    moduleGroupId?: string | null;
    /** @deprecated use moduleGroups */
    moduleGroupLabel?: string | null;
};
