import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    Chip,
    CircularProgress,
    Tooltip,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
    Divider,
    Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    List as ListIcon,
    Group as GroupIcon,
    Person as PersonIcon,
    FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    getRolesService,
    deleteRoleService,
    isHierarchyApplyEnabled,
    type Role,
    type GetRolesParams,
} from '../../Services/ApiServices/roleServices';
import { getUsersService, type UserResponse } from '../../Services/ApiServices/userServices';
import { getMenuByRoleIdService, type Menu } from '../../Services/ApiServices/menuServices';
import { USER_PATHS } from '../../Path';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import usePageTitle from '../../hooks/usePageTitle';
import { ROLE_PATHS } from '../../Path';
import { ProjectSelect } from '../Common/ProjectSelect';
import { CompanySelect } from '../Common/CompanySelect';

const RolesPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();

    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createRole' },
        { key: 'edit', endpointKey: 'updateRole', pathParams: { id: 'sample-id' } },
        { key: 'delete', endpointKey: 'deleteRole', pathParams: { id: 'sample-id' } },
        { key: 'viewMenu', endpointKey: 'getMenuByRoleId', pathParams: { roleId: 'sample-id' } },
    ]);
    const canCreate = permissions.create;
    const canEdit = permissions.edit;
    const canDelete = permissions.delete;
    const canViewMenu = permissions.viewMenu;

    const [roles, setRoles] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(9);
    const [fetchedMenus, setFetchedMenus] = useState<Record<string, Menu[]>>({});
    const [loadingMenus, setLoadingMenus] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [usersDialogOpen, setUsersDialogOpen] = useState(false);
    const [usersDialogRole, setUsersDialogRole] = useState<Role | null>(null);
    const [roleUsers, setRoleUsers] = useState<UserResponse[]>([]);
    const [loadingRoleUsers, setLoadingRoleUsers] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    const filtersFromParams = (): GetRolesParams => {
        const companyId = searchParams.get('companyId');
        const isPublic = searchParams.get('isPublic');
        const isSystem = searchParams.get('isSystem');
        const hierarchy = searchParams.get('hierarchy');
        const parentId = searchParams.get('parentId');
        const projectId = searchParams.get('projectId');
        return {
            ...(companyId ? { companyId } : {}),
            ...(isPublic === 'true' || isPublic === 'false' ? { isPublic: isPublic === 'true' } : {}),
            ...(isSystem === 'true' || isSystem === 'false' ? { isSystem: isSystem === 'true' } : {}),
            ...(hierarchy ? { hierarchy: parseInt(hierarchy, 10) } : {}),
            ...(parentId ? { parentId } : {}),
            ...(projectId ? { projectId } : {}),
        };
    };

    const [filters, setFilters] = useState<GetRolesParams>(filtersFromParams());

    const handleFilterChange = (field: keyof GetRolesParams, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const filtersToParams = (f: GetRolesParams) => {
        const params: Record<string, string> = {};
        if (f.companyId) params.companyId = f.companyId;
        if (f.isPublic !== undefined) params.isPublic = String(f.isPublic);
        if (f.isSystem !== undefined) params.isSystem = String(f.isSystem);
        if (f.hierarchy !== undefined) params.hierarchy = String(f.hierarchy);
        if (f.parentId) params.parentId = f.parentId;
        if (f.projectId) params.projectId = f.projectId;
        return params;
    };

    const handleApplyFilters = () => {
        setSearchParams(filtersToParams(filters));
        setPage(0);
        fetchData(filters, 0, rowsPerPage);
    };

    const handleClearFilters = () => {
        setFilters({});
        setSearchParams({});
        setPage(0);
        fetchData({}, 0, rowsPerPage);
    };

    const headerActions = useMemo(
        () =>
            canCreate ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Tooltip title="Remove Module Access" arrow>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => navigate(ROLE_PATHS.DETACH_MODULE)}
                            disabled={loading}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2,
                                minWidth: { xs: 0, md: 'auto' },
                                px: { xs: 1.5, md: 2 },
                                '& .MuiButton-startIcon': {
                                    mr: { xs: 0, md: 1 },
                                    ml: { xs: 0, md: -0.5 }
                                }
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                                Remove Module Access
                            </Box>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Create New Role" arrow>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate(ROLE_PATHS.CREATE)}
                            disabled={loading}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none',
                                fontWeight: 600,
                                minWidth: { xs: 0, md: 'auto' },
                                px: { xs: 1.5, md: 2.5 },
                                '& .MuiButton-startIcon': {
                                    mr: { xs: 0, md: 1 },
                                    ml: { xs: 0, md: -0.5 }
                                }
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                                Create New Role
                            </Box>
                        </Button>
                    </Tooltip>
                </Stack>
            ) : undefined,
        [canCreate, loading, navigate]
    );

    const setPageHeader = usePageTitle('Role Management', headerActions);

    useEffect(() => {
        setPageHeader('Role Management', headerActions);
    }, [headerActions, setPageHeader]);

    useEffect(() => {
        fetchData(filters, 0, rowsPerPage);
    }, []);

    const fetchData = async (overrideFilters?: GetRolesParams, overridePage?: number, overrideLimit?: number) => {
        setLoading(true);
        try {
            const activeFilters = overrideFilters !== undefined ? overrideFilters : filters;
            const activePage = overridePage !== undefined ? overridePage : page;
            const activeLimit = overrideLimit !== undefined ? overrideLimit : rowsPerPage;
            const rolesData = await getRolesService({ ...activeFilters, page: activePage + 1, limit: activeLimit });
            setRoles(rolesData.data || []);
            setTotal(rolesData.total ?? 0);
        } catch (error) {
            console.error("Failed to fetch data", error);
            showError("Failed to load roles", "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (role: Role) => {
        navigate(ROLE_PATHS.EDIT.replace(':id', role.id));
    };

    const handleViewMenu = async (roleId: string) => {
        // If already fetched, maybe toggle? For now, let's just re-fetch or do nothing.
        // Let's toggle visibility if we want, or just fetch if not present.
        // User said "api is called after user click".

        setLoadingMenus(prev => ({ ...prev, [roleId]: true }));
        try {
            const response = await getMenuByRoleIdService(roleId);
            setFetchedMenus(prev => ({ ...prev, [roleId]: response.data || [] }));
        } catch (error) {
            console.error("Failed to fetch menus", error);
            showError("Failed to fetch menus", "Error");
        } finally {
            setLoadingMenus(prev => ({ ...prev, [roleId]: false }));
        }
    };

    const handleViewUsers = async (role: Role) => {
        setUsersDialogRole(role);
        setUsersDialogOpen(true);
        setLoadingRoleUsers(true);
        try {
            const response = await getUsersService(1, 100, "", "", role.id);
            setRoleUsers(response.data?.users || []);
        } catch (error) {
            console.error("Failed to fetch users for role", error);
            showError("Failed to fetch users for this role", "Error");
            setRoleUsers([]);
        } finally {
            setLoadingRoleUsers(false);
        }
    };

    const handleCloseUsersDialog = () => {
        setUsersDialogOpen(false);
        setUsersDialogRole(null);
        setRoleUsers([]);
    };

    const handleGoToUserProfile = (userId: string) => {
        handleCloseUsersDialog();
        navigate(USER_PATHS.EDIT.replace(':userId', userId));
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete role?',
            message: 'Are you sure you want to delete this role?',
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            await deleteRoleService(id);
            showSuccess("Role deleted successfully", "Success");
            const nextTotal = total - 1;
            const maxPage = Math.max(0, Math.ceil(nextTotal / rowsPerPage) - 1);
            const targetPage = page > maxPage ? maxPage : page;
            if (targetPage !== page) setPage(targetPage);
            fetchData(filters, targetPage, rowsPerPage);
        } catch (error: any) {
            console.error("Failed to delete role", error);
            showError(error.response?.data?.message || "Failed to delete role", "Error");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !roles.length) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        size="small"
                        value={filters.projectId || ''}
                        onChange={(val) => handleFilterChange('projectId', val || undefined)}
                    />
                    <CompanySelect
                        size="small"
                        value={filters.companyId || ''}
                        onChange={(val) => handleFilterChange('companyId', val || undefined)}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Is System</InputLabel>
                        <Select
                            value={filters.isSystem === undefined ? '' : filters.isSystem}
                            label="Is System"
                            onChange={(e) => handleFilterChange('isSystem', e.target.value === '' ? undefined : e.target.value === 'true')}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="true">Yes</MenuItem>
                            <MenuItem value="false">No</MenuItem>
                        </Select>
                    </FormControl>
                    {isHierarchyApplyEnabled() && (
                        <TextField
                            size="small"
                            label="Hierarchy"
                            type="number"
                            value={filters.hierarchy ?? ''}
                            onChange={(e) => handleFilterChange('hierarchy', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            sx={{ minWidth: 110 }}
                        />
                    )}
                    <TextField
                        size="small"
                        label="Parent Role ID"
                        value={filters.parentId || ''}
                        onChange={(e) => handleFilterChange('parentId', e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                    <Tooltip title="More filters">
                        <Badge
                            color="primary"
                            variant="dot"
                            invisible={filters.isPublic === undefined}
                        >
                            <IconButton size="small" onClick={() => setFilterModalOpen(true)}>
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Badge>
                    </Tooltip>
                    <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={handleApplyFilters} disabled={loading}>
                            Apply
                        </Button>
                        <Button size="small" variant="outlined" onClick={handleClearFilters} disabled={loading}>
                            Clear
                        </Button>
                    </Stack>
                </Stack>

                {/* Filter Modal */}
                <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>More Filters</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Is Public</InputLabel>
                                <Select
                                    value={filters.isPublic === undefined ? '' : String(filters.isPublic)}
                                    label="Is Public"
                                    onChange={(e) => handleFilterChange('isPublic', e.target.value === '' ? undefined : e.target.value === 'true')}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="true">Yes</MenuItem>
                                    <MenuItem value="false">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFilterModalOpen(false)}>Done</Button>
                    </DialogActions>
                </Dialog>

            <TableContainer sx={{ opacity: loading && roles.length > 0 ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell width="20%"><strong>Role Name</strong></TableCell>
                            {isHierarchyApplyEnabled() && <TableCell align="center" width="10%"><strong>Hierarchy</strong></TableCell>}
                            <TableCell width="20%"><strong>Company</strong></TableCell>
                            <TableCell align="center" width="10%"><strong>Users</strong></TableCell>
                            <TableCell align="center" width="10%"><strong>Modules</strong></TableCell>
                            <TableCell align="center" width="15%"><strong>Permissions</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map((role) => {
                            const menus = fetchedMenus[role.id];
                            const isLoadingMenu = loadingMenus[role.id];

                            return (
                                <TableRow key={role.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">{role.name}</Typography>
                                        {role.isSystem && <Chip label="System" size="small" color="primary" sx={{ mt: 0.5, mb: 1 }} />}

                                        {/* Display Menus if fetched */}
                                        {isLoadingMenu && (
                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={16} />
                                                <Typography variant="caption" color="text.secondary">Loading menus...</Typography>
                                            </Box>
                                        )}

                                        {!isLoadingMenu && menus && (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                                                    ACCESSIBLE MENUS:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {menus.length > 0 ? (
                                                        menus.map(menu => (
                                                            <Chip
                                                                key={menu.id}
                                                                label={menu.label}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">No menus</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        )}
                                    </TableCell>
                                    {isHierarchyApplyEnabled() && (
                                        <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                            <Chip
                                                label={role.hierarchy}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold', minWidth: 40 }}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                        {role.company ? (
                                            <Chip label={role.company.name} size="small" color="secondary" variant="outlined" />
                                        ) : (
                                            <Typography variant="body2" color="text.disabled">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            {role._count?.users || 0}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                        <Chip
                                            label={role._count?.modules || 0}
                                            size="small"
                                            color="info"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                        <Chip
                                            label={role._count?.permissions || 0}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                                        <IconButton
                                            size="small"
                                            color="secondary"
                                            onClick={() => handleViewUsers(role)}
                                            sx={{ mr: 1 }}
                                            title="View Users with this Role"
                                        >
                                            <GroupIcon />
                                        </IconButton>
                                        {canViewMenu && (
                                            <IconButton
                                                size="small"
                                                color="info"
                                                onClick={() => handleViewMenu(role.id)}
                                                sx={{ mr: 1 }}
                                                title="View Accessible Menus"
                                            >
                                                <ListIcon />
                                            </IconButton>
                                        )}
                                        {canEdit && (
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(role)}>
                                                <EditIcon />
                                            </IconButton>
                                        )}
                                        {!role.isSystem && canDelete && (
                                            <IconButton size="small" color="error" onClick={() => handleDelete(role.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {roles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isHierarchyApplyEnabled() ? 7 : 6} align="center">No roles found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => {
                    setPage(newPage);
                    fetchData(filters, newPage, rowsPerPage);
                }}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setRowsPerPage(newLimit);
                    setPage(0);
                    fetchData(filters, 0, newLimit);
                }}
                rowsPerPageOptions={[9, 20, 50, 100]}
            />
            </Paper>

            <Dialog open={usersDialogOpen} onClose={handleCloseUsersDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Users with role "{usersDialogRole?.name}"
                </DialogTitle>
                <DialogContent dividers>
                    {loadingRoleUsers ? (
                        <Box display="flex" justifyContent="center" py={3}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : roleUsers.length === 0 ? (
                        <Typography color="text.secondary" align="center" py={2}>
                            No users found with this role.
                        </Typography>
                    ) : (
                        <Stack divider={<Divider />}>
                            {roleUsers.map((user) => (
                                <Box
                                    key={user.userId}
                                    onClick={() => handleGoToUserProfile(user.userId)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        py: 1.5,
                                        px: 1,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <Avatar src={user.imageUrl} alt={user.fullName}>
                                        {!user.imageUrl && <PersonIcon />}
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography fontWeight={600}>{user.fullName}</Typography>
                                        <Typography variant="body2" color="text.secondary">{user.emailId}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Stack>
    );
};

export default RolesPage;