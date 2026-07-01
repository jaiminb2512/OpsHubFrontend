import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Typography,
    CircularProgress,
    Stack,
    IconButton,
    Tooltip,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    PersonOutline as UserIcon,
} from '@mui/icons-material';
import { useToast } from '../../Utils/ToastContext';
import { useAuth } from '../../Context/AuthContext';
import { companyUserEditPath } from '../../Path/companyPaths';
import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import {
    getCompanyUsersService,
    createCompanyUserService,
    getCompanyRolesForCompanyService,
    type CompanyUserItem,
    type CompanyRoleItem,
} from '../../Services/ApiServices/companyServices';

const CompanyUserListPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { activeContext } = useAuth();
    const companyId = activeContext?.companyId ?? '';

    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createCompanyUser', pathParams: { companyId: 'sample-id' } },
        { key: 'edit', endpointKey: 'updateCompanyUser', pathParams: { companyId: 'sample-id', userId: 'sample-id' } },
    ]);

    const [users, setUsers] = useState<CompanyUserItem[]>([]);
    const [roles, setRoles] = useState<CompanyRoleItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Create dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ fullName: '', emailId: '', password: '', roleId: '' });
    const [creating, setCreating] = useState(false);

    usePageTitle(
        'Company Users',
        permissions.create ? (
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
                Add User
            </Button>
        ) : undefined
    );

    const fetchUsers = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await getCompanyUsersService(companyId);
            if (res.success === 200) {
                setUsers(res.data ?? []);
            } else {
                showError(res.message || 'Failed to fetch users');
            }
        } catch {
            showError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [companyId, showError]);

    const fetchRoles = useCallback(async () => {
        try {
            if (!companyId) return;
            const res = await getCompanyRolesForCompanyService(companyId);
            if (res.success === 200) {
                setRoles(res.data ?? []);
            }
        } catch {
            // roles will be empty
        }
    }, [companyId]);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers, fetchRoles]);

    const handleCreate = async () => {
        if (!companyId) return;
        const { fullName, emailId, password, roleId } = createForm;
        if (!fullName.trim() || !emailId.trim() || !password.trim() || !roleId) {
            showError('All fields are required');
            return;
        }
        setCreating(true);
        try {
            const res = await createCompanyUserService(companyId, {
                fullName: fullName.trim(),
                emailId: emailId.trim(),
                password: password.trim(),
                roleId,
            });
            if (res.success === 201 || res.success === 200) {
                showSuccess('User created successfully');
                setCreateOpen(false);
                setCreateForm({ fullName: '', emailId: '', password: '', roleId: '' });
                fetchUsers();
            } else {
                showError(res.message || 'Failed to create user');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
            >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Role</TableCell>
                                {permissions.edit && (
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">
                                        Actions
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={permissions.edit ? 4 : 3} align="center" sx={{ py: 6 }}>
                                        <Stack alignItems="center" gap={1}>
                                            <UserIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                No users found for this company
                                            </Typography>
                                            {permissions.create && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => setCreateOpen(true)}
                                                    sx={{ mt: 1, textTransform: 'none' }}
                                                >
                                                    Add first user
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u) => (
                                    <TableRow key={u.userId} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                                    {u.fullName.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {u.fullName}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {u.emailId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={u.roleName}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        {permissions.edit && (
                                            <TableCell align="right">
                                                <Tooltip title="Edit user & access" arrow>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() =>
                                                            navigate(companyUserEditPath(u.userId))
                                                        }
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Create User Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Company User</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Full Name"
                            size="small"
                            value={createForm.fullName}
                            onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            size="small"
                            type="email"
                            value={createForm.emailId}
                            onChange={(e) => setCreateForm((p) => ({ ...p, emailId: e.target.value }))}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Password"
                            size="small"
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                            required
                            fullWidth
                        />
                        <FormControl size="small" fullWidth required>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={createForm.roleId}
                                label="Role"
                                onChange={(e) => setCreateForm((p) => ({ ...p, roleId: e.target.value }))}
                            >
                                {roles.map((r) => (
                                    <MenuItem key={r.id} value={r.id}>
                                        {r.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreate}
                        disabled={creating}
                    >
                        {creating ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanyUserListPage;
