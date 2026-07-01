import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Business as BusinessIcon,
    Edit as EditIcon,
    BarChart as LimitsUsageIcon,
    DeleteOutline as SoftDeleteIcon,
    DeleteForever as HardDeleteIcon,
    CardMembership as SubscribeIcon,
    Analytics as PerformanceIcon,
    People as PeopleIcon,
    VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import CompanyLimitsUsageDialog from './CompanyLimitsUsageDialog';
import { ProjectSelect } from '../Common/ProjectSelect';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { COMPANY_PATHS, companyEditPath, companySubscribePath, companyPerformancePath, companyUsersPath } from '../../Path/companyPaths';
import { apiKeysPath } from '../../Path';
import { PRIMARY } from '../Common/Wizard';
import {
    getCompaniesService,
    deleteCompanyService,
    hardDeleteCompanyService,
    type CompanyListItem,
} from '../../Services/ApiServices/companyServices';
import { useToast } from '../../Utils/ToastContext';
import { usePagePermissions } from '../../hooks/usePagePermissions';

const getApiErrorMessage = (err: unknown): string | undefined =>
    isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined;

type DeleteConfirm = {
    open: boolean;
    companyId: string;
    companyName: string;
    mode: 'soft' | 'hard';
};

const CompanyList = () => {
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createCompany' },
        { key: 'edit', endpointKey: 'updateCompany', pathParams: { id: 'sample-id' } },
        { key: 'delete', endpointKey: 'deleteCompany', pathParams: { id: 'sample-id' } },
    ]);
    const [showInactive, setShowInactive] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<CompanyListItem[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>({
        open: false, companyId: '', companyName: '', mode: 'soft',
    });
    const [deleting, setDeleting] = useState(false);
    const [limitsDialog, setLimitsDialog] = useState<{
        open: boolean;
        companyId: string;
        companyName: string;
    }>({ open: false, companyId: '', companyName: '' });

    usePageTitle('Companies', (
        <Stack direction="row" alignItems="center" gap={1}>
            {permissions.create && (
                <Tooltip title="Create company" arrow>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(COMPANY_PATHS.CREATE)}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: PRIMARY,
                            minWidth: { xs: 0, md: 'auto' },
                            px: { xs: 1.5, md: 2.5 },
                            '& .MuiButton-startIcon': {
                                mr: { xs: 0, md: 1 },
                                ml: { xs: 0, md: -0.5 }
                            }
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                            Create company
                        </Box>
                    </Button>
                </Tooltip>
            )}
        </Stack>
    ));

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCompaniesService({
                projectId: projectId || undefined,
            });
            if (res.success === 200) {
                setCompanies(res.data ?? []);
            } else {
                showError(res.message || 'Failed to load companies');
            }
        } catch {
            showError('Failed to load companies');
        } finally {
            setLoading(false);
        }
    }, [showError, projectId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const openDeleteDialog = (company: CompanyListItem, mode: 'soft' | 'hard') => {
        setDeleteConfirm({ open: true, companyId: company.id, companyName: company.name, mode });
    };

    const closeDeleteDialog = () => {
        setDeleteConfirm((prev) => ({ ...prev, open: false }));
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const res = deleteConfirm.mode === 'hard'
                ? await hardDeleteCompanyService(deleteConfirm.companyId)
                : await deleteCompanyService(deleteConfirm.companyId);

            if (res.success === 200) {
                showSuccess(
                    deleteConfirm.mode === 'hard'
                        ? `"${deleteConfirm.companyName}" permanently deleted`
                        : `"${deleteConfirm.companyName}" deactivated`
                );
                void loadData();
            } else {
                showError(res.message || 'Delete failed');
            }
        } catch (err) {
            showError(getApiErrorMessage(err) || 'Failed to delete company');
        } finally {
            setDeleting(false);
            closeDeleteDialog();
        }
    };

    const filteredCompanies = useMemo(
        () => companies.filter((c) => showInactive || c.isActive !== false),
        [companies, showInactive]
    );

    return (
        <Stack spacing={2}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        value={projectId}
                        onChange={(val) => setProjectId(val)}
                        size="small"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                size="small"
                            />
                        }
                        label="Show inactive"
                        sx={{ mr: 0, ml: 0 }}
                    />
                </Stack>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small" aria-label="Companies list">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Stores</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Warehouses</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    {(permissions.edit || permissions.delete) && (
                                        <TableCell sx={{ fontWeight: 700 }} align="right">
                                            Actions
                                        </TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCompanies.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            align="center"
                                            sx={{ py: 4, color: 'text.secondary' }}
                                        >
                                            No companies found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCompanies.map((company) => (
                                        <TableRow key={company.id} hover>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" gap={1}>
                                                    <BusinessIcon
                                                        sx={{ fontSize: 18, color: PRIMARY }}
                                                    />
                                                    <Box>
                                                        <Typography
                                                            fontWeight={600}
                                                            onClick={() => navigate(companyPerformancePath(company.id))}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                color: 'primary.main',
                                                                '&:hover': {
                                                                    color: 'primary.dark',
                                                                    textDecoration: 'underline'
                                                                }
                                                            }}
                                                        >
                                                            {company.name}
                                                        </Typography>
                                                        {company.description ? (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                display="block"
                                                            >
                                                                {company.description}
                                                            </Typography>
                                                        ) : null}
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {company.plan?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>{company._count?.stores ?? 0}</TableCell>
                                            <TableCell>{company._count?.warehouses ?? 0}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={
                                                        company.isActive === false
                                                            ? 'Inactive'
                                                            : 'Active'
                                                    }
                                                    color={
                                                        company.isActive === false
                                                            ? 'default'
                                                            : 'success'
                                                    }
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            {(permissions.edit || permissions.delete) && (
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                        <Tooltip title="View limits & usage">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="View limits and usage"
                                                                onClick={() =>
                                                                    setLimitsDialog({
                                                                        open: true,
                                                                        companyId: company.id,
                                                                        companyName: company.name,
                                                                    })
                                                                }
                                                                sx={{ color: PRIMARY }}
                                                            >
                                                                <LimitsUsageIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Subscribe / Change Plan">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Subscribe / Change Plan"
                                                                onClick={() => navigate(companySubscribePath(company.id))}
                                                                sx={{ color: '#4f46e5' }}
                                                            >
                                                                <SubscribeIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="View company performance">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="View company performance"
                                                                onClick={() => navigate(companyPerformancePath(company.id))}
                                                                sx={{ color: '#0ea5e9' }}
                                                            >
                                                                <PerformanceIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Manage users">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Manage users"
                                                                onClick={() => navigate(companyUsersPath(company.id))}
                                                                sx={{ color: '#8b5cf6' }}
                                                            >
                                                                <PeopleIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Manage API Keys">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Manage API Keys"
                                                                onClick={() =>
                                                                    navigate(apiKeysPath({ companyId: company.id }))
                                                                }
                                                                sx={{ color: '#0369a1' }}
                                                            >
                                                                <VpnKeyIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {permissions.edit && (
                                                            <Tooltip title="Edit company">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Edit company"
                                                                    onClick={() =>
                                                                        navigate(companyEditPath(company.id), {
                                                                            state: { company },
                                                                        })
                                                                    }
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {permissions.delete && company.isActive !== false && (
                                                            <Tooltip title="Deactivate (soft delete)">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Soft delete company"
                                                                    onClick={() => openDeleteDialog(company, 'soft')}
                                                                    sx={{ color: '#f59e0b' }}
                                                                >
                                                                    <SoftDeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {permissions.delete && (
                                                            <Tooltip title="Permanently delete">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Hard delete company"
                                                                    onClick={() => openDeleteDialog(company, 'hard')}
                                                                    sx={{ color: '#ef4444' }}
                                                                >
                                                                    <HardDeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <CompanyLimitsUsageDialog
                open={limitsDialog.open}
                companyId={limitsDialog.companyId}
                companyName={limitsDialog.companyName}
                onClose={() => setLimitsDialog({ open: false, companyId: '', companyName: '' })}
            />

            {/* Delete confirmation dialog */}
            <Dialog open={deleteConfirm.open} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {deleteConfirm.mode === 'hard' ? 'Permanently Delete Company?' : 'Deactivate Company?'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {deleteConfirm.mode === 'hard' ? (
                            <>
                                This will <strong>permanently remove</strong> &quot;{deleteConfirm.companyName}&quot; and
                                all its data — users, stores, warehouses, orders, products,
                                subscriptions, and everything else. <strong>This cannot be undone.</strong>
                            </>
                        ) : (
                            <>
                                This will deactivate &quot;{deleteConfirm.companyName}&quot; and its stores,
                                warehouses, users, and subscriptions. The data will be preserved and can be
                                restored later.
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDeleteDialog} disabled={deleting} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        color={deleteConfirm.mode === 'hard' ? 'error' : 'warning'}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {deleting
                            ? 'Deleting…'
                            : deleteConfirm.mode === 'hard'
                                ? 'Delete Permanently'
                                : 'Deactivate'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default CompanyList;
