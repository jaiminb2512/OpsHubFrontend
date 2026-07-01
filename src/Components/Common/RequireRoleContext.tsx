import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../Context/AuthContext';
import { AUTH_PATHS } from '../../Path';

const RequireRoleContext = ({ children }: { children: React.ReactNode }) => {
    const { isLoading, needToResetPassword, hasRoleContextSelected, roleContexts, userInfo } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (needToResetPassword) {
        return <>{children}</>;
    }

    const isSuperAdmin = (userInfo as any)?.isSuperAdmin === true;

    if (isSuperAdmin) {
        return <>{children}</>;
    }

    if (!hasRoleContextSelected) {
        if (roleContexts.length === 0) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        gap: 2,
                        p: 3,
                    }}
                >
                    <Typography variant="h6" fontWeight={700}>
                        No role assigned
                    </Typography>
                    <Typography color="text.secondary" textAlign="center">
                        Your account has no global or company role. Contact an administrator.
                    </Typography>
                </Box>
            );
        }
        return <Navigate to={AUTH_PATHS.SELECT_ROLE} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default RequireRoleContext;
