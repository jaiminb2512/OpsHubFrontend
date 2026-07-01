export type UserRoleContextType = 'global' | 'company';

export interface UserRoleContext {
    type: UserRoleContextType;
    key: string;
    roleId: string;
    roleName: string;
    companyId: string | null;
    companyName: string | null;
    storeId: string | null;
    isSystem?: boolean;
    hierarchy?: number;
}

const ACTIVE_CONTEXT_KEY = 'activeRoleContext';
const CONTEXTS_LIST_KEY = 'roleContexts';

export const setRoleContextsList = (contexts: UserRoleContext[]): void => {
    localStorage.setItem(CONTEXTS_LIST_KEY, JSON.stringify(contexts));
};

export const getRoleContextsList = (): UserRoleContext[] => {
    const raw = localStorage.getItem(CONTEXTS_LIST_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as UserRoleContext[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const setActiveRoleContext = (context: UserRoleContext): void => {
    localStorage.setItem(ACTIVE_CONTEXT_KEY, JSON.stringify(context));
};

export const getActiveRoleContext = (): UserRoleContext | null => {
    const raw = localStorage.getItem(ACTIVE_CONTEXT_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UserRoleContext;
    } catch {
        return null;
    }
};

export const clearRoleContextStorage = (): void => {
    localStorage.removeItem(ACTIVE_CONTEXT_KEY);
    localStorage.removeItem(CONTEXTS_LIST_KEY);
};

export const isValidActiveContext = (
    active: UserRoleContext | null,
    contexts: UserRoleContext[]
): boolean => {
    if (!active || !contexts.length) return false;
    return contexts.some((c) => c.key === active.key);
};

export const needsRoleSelection = (contexts: UserRoleContext[]): boolean => {
    if (contexts.length === 0) return false;
    const hasGlobal = contexts.some((c) => c.type === 'global');
    const hasCompany = contexts.some((c) => c.type === 'company');
    return hasGlobal && hasCompany;
};

export const pickDefaultContext = (contexts: UserRoleContext[]): UserRoleContext | null => {
    if (contexts.length === 0) return null;
    if (needsRoleSelection(contexts)) return null;
    // Only one type present — pick the single entry or the first of multiple same-type contexts
    return contexts.length === 1 ? contexts[0] : null;
};
