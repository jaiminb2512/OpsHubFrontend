import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
    autoLogin,
    isAuthenticated,
    setAuthToken,
    setUserInfo,
    removeAuthToken,
    getUserInfo,
} from '../Services/ApiServices';
import type { LoginResponse } from '../Services/ApiServices/authServices';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    needToResetPassword: boolean;
    userInfo: LoginResponse | null;
    hasRoleContextSelected: boolean;
    roleContexts: unknown[];
    checkAuth: () => Promise<void>;
    login: (token: string, userInfo: LoginResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [needToResetPassword, setNeedToResetPassword] = useState(false);
    const [userInfo, setUserInfoState] = useState<LoginResponse | null>(null);

    const checkAuth = useCallback(async () => {
        setIsLoading(true);
        try {
            if (isAuthenticated()) {
                const success = await autoLogin();
                setAuthenticated(success);
                const info = getUserInfo();
                setUserInfoState(info);
                setNeedToResetPassword(info?.needToResetPassword === true);
            } else {
                setAuthenticated(false);
                setNeedToResetPassword(false);
                setUserInfoState(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setAuthenticated(false);
            setNeedToResetPassword(false);
            setUserInfoState(null);
        } finally {
            setIsLoading(false);
            setIsAuthChecked(true);
        }
    }, []);

    const login = useCallback((token: string, info: LoginResponse) => {
        setAuthToken(token);
        setUserInfo(info);
        setUserInfoState(info);
        setAuthenticated(true);
        setNeedToResetPassword(info.needToResetPassword === true);
        setIsAuthChecked(true);
        setIsLoading(false);
    }, []);

    const logout = useCallback(() => {
        removeAuthToken();
        setAuthenticated(false);
        setNeedToResetPassword(false);
        setUserInfoState(null);
    }, []);

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const contextValue = useMemo(() => ({
        isAuthenticated: authenticated,
        isLoading: isAuthChecked ? false : isLoading,
        needToResetPassword,
        userInfo,
        hasRoleContextSelected: true,
        roleContexts: [],
        checkAuth,
        login,
        logout,
    }), [authenticated, isLoading, isAuthChecked, needToResetPassword, userInfo, checkAuth, login, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
