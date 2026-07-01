import type {
    ModuleWizardDetailsPayload,
    SaveApiPermissionMenuRequest,
} from '../../Services/ApiServices/moduleSetupWizardServices';

export {
    PRIMARY,
    ICON_BG,
    stepHeadingSx,
    fieldSx,
    infoIconSx,
    wizardSwitchCheckedSx,
} from '../Common/Wizard/setupWizardTheme';

export const moduleWizardSteps = ['Module Setup', 'API, Permission & Menu'] as const;

export const HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'] as const;

/** Feature / API key: uppercase, spaces → underscores */
export function formatKeyInput(value: string): string {
    return value.replace(/\s+/g, '_').toUpperCase();
}

/** Feature name: underscores → spaces, title-case each word */
export function formatFeatureNameInput(value: string): string {
    const spaced = value.replace(/_+/g, ' ').trim();
    if (!spaced) return '';
    return spaced
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function newRowClientId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** One API line item: per-row API source (create vs select existing) + endpoint + permission + menu. */
export type WizardApiEndpointRow = {
    clientId: string;
    /**
     * True when this row was hydrated from GET module-wizard-details (server state).
     * Used to show server delete without treating a user-picked existing API as persisted.
     */
    persistedFromServer?: boolean;
    apiSourceMode: 'create' | 'select';
    method: string;
    path: string;
    key: string;
    isPublic: boolean;
    isLimitAllowed: boolean;
    /** ApiEndpoint id when selecting an existing API or when row was loaded from server */
    apiId: string;
    permissionDescription: string;
    /**
     * create  — user is filling in a new menu item
     * link    — user picked an existing menu from the dropdown
     * linked  — row loaded from server with a menu already attached (display only, not user-selectable)
     * skip    — no menu
     */
    menuMode: 'create' | 'link' | 'linked' | 'skip';
    menuId: string;
    menuLabel: string;
    menuRoute: string;
    menuIcon: string;
    menuParentId: string;
    featureMode?: 'create' | 'select' | 'skip';
    featureKey?: string;
    featureKeyUnlinked?: boolean;
};

export function createEmptyEndpointRow(menuMode: WizardApiEndpointRow['menuMode'] = 'skip'): WizardApiEndpointRow {
    return {
        clientId: newRowClientId(),
        persistedFromServer: false,
        apiSourceMode: 'create',
        method: 'POST',
        path: '',
        key: '',
        isPublic: false,
        isLimitAllowed: true,
        apiId: '',
        permissionDescription: '',
        menuMode,
        menuId: '',
        menuLabel: '',
        menuRoute: '',
        menuIcon: '',
        menuParentId: '',
    };
}

/** Check if a row is essentially blank (no API selected, no path/key/permission set) */
export function isEmptyWizardEndpointRow(row: WizardApiEndpointRow): boolean {
    if (row.apiSourceMode === 'create') {
        return !row.path.trim() && !row.key.trim() && !row.permissionDescription.trim();
    } else {
        return !row.apiId && !row.permissionDescription.trim();
    }
}

/** Build step-2 rows from GET module-wizard-details (permissions + APIs + linked menus). */
export function buildEndpointRowsFromWizardDetails(d: ModuleWizardDetailsPayload): WizardApiEndpointRow[] {
    const apis = d.apiEndpoints ?? [];
    const perms = d.permissions ?? [];
    const menus = d.menus ?? [];
    const apiById = new Map(apis.map((a) => [a.id, a]));

    const rows: WizardApiEndpointRow[] = [];

    for (const p of perms) {
        if (!p.apiId) continue;
        const api = apiById.get(p.apiId);
        if (!api) continue;

        const linkedMenu = menus.find((m) => m.permissionId === p.id);

        rows.push({
            clientId: newRowClientId(),
            persistedFromServer: true,
            apiSourceMode: 'select',
            apiId: p.apiId,
            permissionDescription: p.description ?? '',
            method: api.method,
            path: api.path,
            key: api.key ?? '',
            isPublic: (api as any).isPublic !== undefined ? (api as any).isPublic : false,
            isLimitAllowed: (api as any).isLimitAllowed !== undefined ? (api as any).isLimitAllowed : true,
            menuMode: linkedMenu ? 'linked' : 'skip',
            menuId: linkedMenu?.id ?? '',
            menuLabel: '',
            menuRoute: '',
            menuIcon: '',
            menuParentId: '',
        });
    }

    const usedApiIds = new Set(perms.map((p) => p.apiId).filter(Boolean) as string[]);
    for (const api of apis) {
        if (usedApiIds.has(api.id)) continue;
        rows.push({
            clientId: newRowClientId(),
            persistedFromServer: true,
            apiSourceMode: 'select',
            apiId: api.id,
            permissionDescription: '',
            method: api.method,
            path: api.path,
            key: api.key ?? '',
            isPublic: (api as any).isPublic !== undefined ? (api as any).isPublic : false,
            isLimitAllowed: (api as any).isLimitAllowed !== undefined ? (api as any).isLimitAllowed : true,
            menuMode: 'skip',
            menuId: '',
            menuLabel: '',
            menuRoute: '',
            menuIcon: '',
            menuParentId: '',
        });
    }

    return rows.length > 0 ? rows : [createEmptyEndpointRow()];
}

export function buildBatchPayload(
    endpointRows: WizardApiEndpointRow[],
    finalModuleId: string
): SaveApiPermissionMenuRequest[] {
    return endpointRows.map((row) => ({
        moduleId: finalModuleId,
        permissionDescription: row.permissionDescription.trim(),
        ...(row.apiSourceMode === 'select'
            ? {
                  apiId: row.apiId,
                  isPublic: row.isPublic,
                  isLimitAllowed: row.isLimitAllowed,
              }
            : {
                  method: row.method,
                  path: row.path,
                  key: row.key,
                  isPublic: row.isPublic,
                  isLimitAllowed: row.isLimitAllowed,
              }),
        menuMode: (row.menuMode === 'link' || row.menuMode === 'linked') ? 'select' as const : row.menuMode as 'create' | 'skip',
        ...((row.menuMode === 'link' || row.menuMode === 'linked') && row.menuId && { existingMenuId: row.menuId }),
        ...(row.menuMode === 'create' && {
            menuLabel: row.menuLabel,
            menuRoute: row.menuRoute,
            menuIcon: row.menuIcon,
            menuParentId: row.menuParentId || null,
        }),
    }));
}

/** First validation error message, or null if all rows are valid. */
export function validateWizardEndpointRows(rows: WizardApiEndpointRow[]): string | null {
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const label = `Endpoint ${i + 1}`;
        if (row.apiSourceMode === 'create') {
            if (!row.method?.trim() || !row.path?.trim() || !row.key?.trim()) {
                return `${label}: API method, path, and key are required`;
            }
        } else if (!row.apiId) {
            return `${label}: Please select an API endpoint`;
        }
        if (!row.permissionDescription?.trim()) {
            return `${label}: Permission description is required`;
        }
        if (row.menuMode === 'create' && !row.menuLabel?.trim()) {
            return `${label}: Menu label is required`;
        }
        if (row.menuMode === 'link' && !row.menuId) {
            return `${label}: Please select a menu`;
        }
    }
    return null;
}
