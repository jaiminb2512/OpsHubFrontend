import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button as MuiButton,
    Paper,
    CircularProgress,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Chip,
    Alert,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
    getUserCompanyRolesService,
    saveUserCompanyRolesService,
    type SaveUserCompanyRoleInput,
} from '../../Services/ApiServices/userCompanyRoleServices';
import {
    getCompaniesService,
    getCompanyUserRolesService,
    type CompanyListItem,
    type CompanyUserRole,
} from '../../Services/ApiServices/companyServices';
import { useToast } from '../../Utils/ToastContext';
import { USER_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';

type AssignmentRow = {
    key: string;
    companyId: string;
    roleId: string;
};

const newRow = (): AssignmentRow => ({
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    companyId: '',
    roleId: '',
});

const UserCompanyRolesForm = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userLabel, setUserLabel] = useState('');
    const [rows, setRows] = useState<AssignmentRow[]>([newRow()]);
    const [companies, setCompanies] = useState<CompanyListItem[]>([]);
    const [roles, setRoles] = useState<CompanyUserRole[]>([]);

    usePageTitle(
        userLabel ? `Company roles — ${userLabel}` : 'Assign user to companies',
        (
            <Tooltip title="Back to users" arrow>
                <MuiButton
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(USER_PATHS.LIST)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: { xs: 0, md: 'auto' },
                        px: { xs: 1.5, md: 2 },
                        '& .MuiButton-startIcon': {
                            mr: { xs: 0, md: 1 },
                            ml: { xs: 0, md: -0.5 }
                        }
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                        Back to users
                    </Box>
                </MuiButton>
            </Tooltip>
        )
    );

    const loadData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [rolesRes, companiesRes, dataRes] = await Promise.all([
                getCompanyUserRolesService({ limit: 100, isPublic: true }),
                getCompaniesService({ isActive: true }),
                getUserCompanyRolesService(userId),
            ]);

            if (rolesRes.success === 200 && rolesRes.data) {
                setRoles(rolesRes.data);
            }
            if (companiesRes.success === 200 && companiesRes.data) {
                setCompanies(companiesRes.data);
            }

            if (dataRes.success === 200 && dataRes.data) {
                const { user, assignments } = dataRes.data;
                if (!user.isGlobal) {
                    showError('Only global users can be assigned to multiple companies', 'Error');
                    navigate(USER_PATHS.LIST);
                    return;
                }
                setUserLabel(user.fullName);
                if (assignments.length > 0) {
                    setRows(
                        assignments.map((a) => ({
                            key: a.id ?? `row-${a.companyId}`,
                            companyId: a.companyId,
                            roleId: a.roleId,
                        }))
                    );
                } else {
                    setRows([newRow()]);
                }
            } else {
                showError(dataRes.message || 'Failed to load assignments', 'Error');
                navigate(USER_PATHS.LIST);
            }
        } catch (err) {
            console.error('load user company roles', err);
            showError('Failed to load company role assignments', 'Error');
            navigate(USER_PATHS.LIST);
        } finally {
            setLoading(false);
        }
    }, [userId, navigate, showError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const usedCompanyIds = useMemo(
        () => new Set(rows.map((r) => r.companyId).filter(Boolean)),
        [rows]
    );

    const companiesAvailable = useMemo(
        () => companies.filter((c) => c.isActive !== false),
        [companies]
    );

    const handleAddRow = () => {
        setRows((prev) => [...prev, newRow()]);
    };

    const handleRemoveRow = (key: string) => {
        setRows((prev) => {
            const next = prev.filter((r) => r.key !== key);
            return next.length > 0 ? next : [newRow()];
        });
    };

    const updateRow = (key: string, patch: Partial<AssignmentRow>) => {
        setRows((prev) =>
            prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
        );
    };

    const handleSave = async () => {
        if (!userId) return;

        const payload: SaveUserCompanyRoleInput[] = [];
        for (const row of rows) {
            if (!row.companyId && !row.roleId) continue;
            if (!row.companyId || !row.roleId) {
                showError('Each row needs both company and role, or remove empty rows', 'Validation');
                return;
            }
            payload.push({ companyId: row.companyId, roleId: row.roleId });
        }

        const companySet = new Set<string>();
        for (const p of payload) {
            if (companySet.has(p.companyId)) {
                showError('Each company can only appear once', 'Validation');
                return;
            }
            companySet.add(p.companyId);
        }

        setSaving(true);
        try {
            const res = await saveUserCompanyRolesService(userId, payload);
            if (res.success === 200) {
                showSuccess(res.message || 'Company roles saved', 'Success');
                if (res.data?.assignments?.length) {
                    setRows(
                        res.data.assignments.map((a) => ({
                            key: a.id ?? `row-${a.companyId}`,
                            companyId: a.companyId,
                            roleId: a.roleId,
                        }))
                    );
                } else {
                    setRows([newRow()]);
                }
            } else {
                showError(res.message || 'Failed to save', 'Error');
            }
        } catch (err: unknown) {
            const msg =
                err &&
                typeof err === 'object' &&
                'response' in err &&
                (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            showError(typeof msg === 'string' ? msg : 'Failed to save company roles', 'Error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Paper
                sx={{
                    p: 4,
                    borderRadius: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    minHeight: 320,
                    alignItems: 'center',
                }}
            >
                <CircularProgress />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}>
            <Alert severity="info" sx={{ mb: 2.5 }}>
                Assign this user to one or more companies. Each company gets its own role via UserRole mapping. Users with a global role can still have company
                contexts for switching after login.
            </Alert>

            <Stack spacing={2}>
                {rows.map((row, index) => (
                    <Paper
                        key={row.key}
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            borderColor: '#e0e0e0',
                            bgcolor: '#fafafa',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                            }}
                        >
                            <Chip
                                label={`Assignment ${index + 1}`}
                                size="small"
                                sx={{ fontWeight: 600 }}
                            />
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveRow(row.key)}
                                aria-label="Remove assignment"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                        >
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Company</InputLabel>
                                <Select
                                    label="Company"
                                    value={row.companyId}
                                    onChange={(e) =>
                                        updateRow(row.key, { companyId: e.target.value })
                                    }
                                >
                                    <MenuItem value="">
                                        <em>Select company</em>
                                    </MenuItem>
                                    {companiesAvailable.map((c) => (
                                        <MenuItem
                                            key={c.id}
                                            value={c.id}
                                            disabled={
                                                usedCompanyIds.has(c.id) &&
                                                c.id !== row.companyId
                                            }
                                        >
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    label="Role"
                                    value={row.roleId}
                                    onChange={(e) =>
                                        updateRow(row.key, { roleId: e.target.value })
                                    }
                                >
                                    <MenuItem value="">
                                        <em>Select role</em>
                                    </MenuItem>
                                    {roles.map((r) => (
                                        <MenuItem key={r.id} value={r.id}>
                                            {r.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Paper>
                ))}

                <MuiButton
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddRow}
                    sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                >
                    Add company
                </MuiButton>
            </Stack>

            <Box
                sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: 1.5,
                    flexWrap: 'wrap',
                }}
            >
                <MuiButton
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    {saving ? 'Saving…' : 'Save assignments'}
                </MuiButton>
                <MuiButton
                    variant="outlined"
                    onClick={() => navigate(USER_PATHS.LIST)}
                    sx={{ textTransform: 'none' }}
                >
                    Cancel
                </MuiButton>
            </Box>
        </Paper>
    );
};

export default UserCompanyRolesForm;
