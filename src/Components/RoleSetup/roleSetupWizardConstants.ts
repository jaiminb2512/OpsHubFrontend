export {
    PRIMARY,
    ICON_BG,
    stepHeadingSx,
    fieldSx,
    wizardSwitchCheckedSx,
} from '../Common/Wizard/setupWizardTheme';

export const steps = ['Role Setup', 'Select Module Groups', 'Select Modules', 'Assign Permissions'];

/** Edit role flow: role details + module groups + modules + permissions. */
export const editRoleSteps = ['Role Details', 'Select Module Groups', 'Select Modules', 'Assign Permissions'];

/** Page size for GET /role-setup/get-roles when loading the role dropdown */
export const ROLES_FETCH_LIMIT = 10;

/** Probe id for permission check only (GET /roles/:id pattern) */
export const ROLE_ID_PERMISSION_PROBE = '00000000-0000-0000-0000-000000000000';
/** Probe name for permission check only (GET /role-setup/module-detail-by-name/:name pattern) */
export const MODULE_NAME_PERMISSION_PROBE = 'Orders';

export const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
    GET: { bg: '#e8f5e9', color: '#2e7d32' },
    POST: { bg: '#e3f2fd', color: '#1565c0' },
    PUT: { bg: '#fff8e1', color: '#f57f17' },
    PATCH: { bg: '#fce4ec', color: '#ad1457' },
    DELETE: { bg: '#fce4ec', color: '#c62828' },
};
