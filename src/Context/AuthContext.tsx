import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
    autoLogin,
    isAuthenticated,
    setAuthToken,
    setUserInfo,
    removeAuthToken,
    getUserInfo,
    setRoleContextsList,
    setActiveRoleContext,
    getActiveRoleContext,
    getRoleContextsList,
    isValidActiveContext,
    pickDefaultContext,
    clearRoleContextStorage,
    type UserRoleContext,
} from '../Services/ApiServices';
import type { LoginResponse } from '../Services/ApiServices/authServices';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    needToResetPassword: boolean;
    roleContexts: UserRoleContext[];
    activeContext: UserRoleContext | null;
    hasRoleContextSelected: boolean;
    userInfo: LoginResponse | null;
    checkAuth: () => Promise<void>;
    login: (token: string, userInfo: LoginResponse) => void;
    logout: () => void;
    selectRoleContext: (context: UserRoleContext) => void;
    syncRoleContexts: (contexts: UserRoleContext[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

const applyContextsToState = (
    contexts: UserRoleContext[],
    existingActive: UserRoleContext | null
) => {
    setRoleContextsList(contexts);
    const active = isValidActiveContext(existingActive, contexts)
        ? existingActive
        : pickDefaultContext(contexts);
    if (active) {
        setActiveRoleContext(active);
    }
    return { contexts, active };
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [needToResetPassword, setNeedToResetPassword] = useState(false);
    const [roleContexts, setRoleContextsState] = useState<UserRoleContext[]>([]);
    const [activeContext, setActiveContextState] = useState<UserRoleContext | null>(null);
    const [userInfo, setUserInfoState] = useState<LoginResponse | null>(null);

    const syncRoleContexts = useCallback((contexts: UserRoleContext[]) => {
        const existing = getActiveRoleContext();
        const { active } = applyContextsToState(contexts, existing);
        setRoleContextsState(contexts);
        setActiveContextState(active);
    }, []);

    const selectRoleContext = useCallback((context: UserRoleContext) => {
        setActiveRoleContext(context);
        setActiveContextState(context);
        const info = getUserInfo();
        if (info) {
            const updated = {
                ...info,
                role: context.roleName,
            };
            setUserInfo(updated);
            setUserInfoState(updated);
        }
    }, []);

    const checkAuth = useCallback(async () => {
        setIsLoading(true);
        try {
            if (isAuthenticated()) {
                const success = await autoLogin();
                setAuthenticated(success);

                const info = getUserInfo();
                setUserInfoState(info);
                setNeedToResetPassword(info?.needToResetPassword === true);

                const contexts = info?.roleContexts ?? getRoleContextsList();
                const active = getActiveRoleContext();
                const { active: resolved } = applyContextsToState(contexts, active);
                setRoleContextsState(contexts);
                setActiveContextState(resolved);
            } else {
                setAuthenticated(false);
                setNeedToResetPassword(false);
                setRoleContextsState([]);
                setActiveContextState(null);
                setUserInfoState(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setAuthenticated(false);
            setNeedToResetPassword(false);
            setRoleContextsState([]);
            setActiveContextState(null);
            setUserInfoState(null);
        } finally {
            setIsLoading(false);
            setIsAuthChecked(true);
        }
    }, []);

    const login = useCallback((token: string, info: LoginResponse) => {
        setAuthToken(token);
        const contexts = info.roleContexts ?? [];
        const { active } = applyContextsToState(contexts, null);

        const storedInfo: LoginResponse = {
            ...info,
            role: active?.roleName ?? info.role,
            roleContexts: contexts,
        };
        setUserInfo(storedInfo);
        setUserInfoState(storedInfo);
        setRoleContextsState(contexts);
        setActiveContextState(active);
        setAuthenticated(true);
        setNeedToResetPassword(info.needToResetPassword === true);
        setIsAuthChecked(true);
        setIsLoading(false);
    }, []);

    const logout = useCallback(() => {
        removeAuthToken();
        clearRoleContextStorage();
        setAuthenticated(false);
        setNeedToResetPassword(false);
        setRoleContextsState([]);
        setActiveContextState(null);
        setUserInfoState(null);
    }, []);

    const hasRoleContextSelected = Boolean(activeContext);

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const contextValue = useMemo(() => ({
        isAuthenticated: authenticated,
        isLoading: isAuthChecked ? false : isLoading,
        needToResetPassword,
        roleContexts,
        activeContext,
        hasRoleContextSelected,
        userInfo,
        checkAuth,
        login,
        logout,
        selectRoleContext,
        syncRoleContexts,
    }), [authenticated, isLoading, isAuthChecked, needToResetPassword, roleContexts, activeContext, hasRoleContextSelected, userInfo, checkAuth, login, logout, selectRoleContext, syncRoleContexts]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
