import { useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Container,
    Stack,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Business as BusinessIcon,
    AdminPanelSettings as GlobalRoleIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { AUTH_PATHS } from '../Path';
import { needsRoleSelection, type UserRoleContext } from '../Utils/roleContextStorage';

const SelectRolePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { roleContexts, selectRoleContext, logout, userInfo, hasRoleContextSelected } = useAuth();

    useEffect(() => {
        if (!needsRoleSelection(roleContexts) && hasRoleContextSelected) {
            navigate('/home', { replace: true });
        }
    }, [roleContexts, hasRoleContextSelected, navigate]);

    const globalContexts = useMemo(
        () => roleContexts.filter((c) => c.type === 'global'),
        [roleContexts]
    );
    const companyContexts = useMemo(
        () => roleContexts.filter((c) => c.type === 'company'),
        [roleContexts]
    );

    const handleSelect = (ctx: UserRoleContext) => {
        selectRoleContext(ctx);
        navigate('/home', { replace: true });
    };

    const primary = theme.palette.primary.main;

    const renderCard = (ctx: UserRoleContext) => {
        const isGlobal = ctx.type === 'global';
        return (
            <Card
                key={ctx.key}
                elevation={0}
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        borderColor: alpha(primary, 0.5),
                        boxShadow: `0 8px 24px ${alpha(primary, 0.12)}`,
                    },
                }}
            >
                <CardActionArea onClick={() => handleSelect(ctx)} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box
                                sx={{
                                    p: 1.25,
                                    borderRadius: 2,
                                    bgcolor: alpha(primary, 0.1),
                                    color: primary,
                                    display: 'flex',
                                }}
                            >
                                {isGlobal ? <GlobalRoleIcon /> : <BusinessIcon />}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography fontWeight={700} noWrap>
                                    {isGlobal
                                        ? ctx.roleName
                                        : ctx.companyName ?? 'Company'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                    {isGlobal
                                        ? 'Global / system access'
                                        : `Role: ${ctx.roleName}`}
                                </Typography>
                                <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap">
                                    <Chip
                                        size="small"
                                        label={isGlobal ? 'Global' : 'Company'}
                                        color={isGlobal ? 'primary' : 'default'}
                                        variant="outlined"
                                    />
                                    {ctx.isSystem && (
                                        <Chip size="small" label="System" variant="outlined" />
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Card>
        );
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.default',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Stack spacing={3}>
                    <Box textAlign="center">
                        <Typography variant="h5" fontWeight={800} gutterBottom>
                            Choose how to continue
                        </Typography>
                        <Typography color="text.secondary">
                            {userInfo?.fullName
                                ? `Welcome, ${userInfo.fullName}. Select a role context for this session.`
                                : 'Select a role context for this session.'}
                        </Typography>
                    </Box>

                    {globalContexts.length > 0 && (
                        <Box>
                            <Typography
                                variant="overline"
                                color="text.secondary"
                                fontWeight={700}
                                sx={{ mb: 1, display: 'block' }}
                            >
                                Global role
                            </Typography>
                            <Stack spacing={1.5}>{globalContexts.map(renderCard)}</Stack>
                        </Box>
                    )}

                    {companyContexts.length > 0 && (
                        <Box>
                            <Typography
                                variant="overline"
                                color="text.secondary"
                                fontWeight={700}
                                sx={{ mb: 1, display: 'block' }}
                            >
                                Company roles
                            </Typography>
                            <Stack spacing={1.5}>{companyContexts.map(renderCard)}</Stack>
                        </Box>
                    )}

                    <Button
                        variant="text"
                        color="inherit"
                        startIcon={<LogoutIcon />}
                        onClick={() => { logout(); navigate(AUTH_PATHS.LOGIN, { replace: true }); }}
                        sx={{ alignSelf: 'center', textTransform: 'none' }}
                    >
                        Sign out
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
};

export default SelectRolePage;
