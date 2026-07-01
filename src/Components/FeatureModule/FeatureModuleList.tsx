import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    Chip,
    Container,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { FEATURE_MODULE_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import {
    deleteFeatureModuleService,
    getFeatureModulesService,
    type FeatureModuleRow,
} from '../../Services/ApiServices/featureModuleServices';
import { getAllFeaturesService } from '../../Services/ApiServices/featureServices';
import { getModulesService } from '../../Services/ApiServices/moduleServices';

type SelectOption = { id: string; name: string };

const FeatureModuleList = () => {
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const { confirm } = useConfirm();
    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createFeatureModule' },
        { key: 'delete', endpointKey: 'deleteFeatureModule', pathParams: { id: 'sample-id' } },
    ]);
    const [searchParams, setSearchParams] = useSearchParams();

    usePageTitle('Feature Module Map',
        permissions.create ? (
        <Tooltip title="Add mapping" arrow>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(FEATURE_MODULE_PATHS.CREATE)}
                sx={{
                    minWidth: { xs: 0, md: 'auto' },
                    px: { xs: 1.5, md: 2.5 },
                    '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 }, ml: { xs: 0, md: -0.5 } },
                }}
            >
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                    Add Mapping
                </Box>
            </Button>
        </Tooltip>
        ) : undefined
    );

    const [rows, setRows] = useState<FeatureModuleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [featureFilter, setFeatureFilter] = useState(searchParams.get('featureId') ?? '');
    const [moduleFilter, setModuleFilter] = useState(searchParams.get('moduleId') ?? '');

    const [features, setFeatures] = useState<SelectOption[]>([]);
    const [modules, setModules] = useState<SelectOption[]>([]);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [featsRes, modsRes] = await Promise.all([
                    getAllFeaturesService(),
                    getModulesService({ page: 1, limit: 1000 }),
                ]);
                const featRows = (featsRes as { data?: { data?: unknown[] } })?.data?.data ?? [];
                if ((featsRes as { success?: number })?.success === 200 && Array.isArray(featRows)) {
                    setFeatures(
                        (featRows as { id: string; name?: string; key?: string }[]).map((f) => ({
                            id: f.id,
                            name: f.name || f.key || f.id,
                        }))
                    );
                }
                const modRows = modsRes?.data?.data ?? [];
                if (modsRes?.success === 200 && Array.isArray(modRows)) {
                    setModules(
                        modRows.map((m: { id: string; name?: string; label?: string }) => ({
                            id: m.id,
                            name: m.label || m.name || m.id,
                        }))
                    );
                }
            } catch {
                showError('Failed to load filter options');
            }
        };
        void loadFilters();
    }, [showError]);

    const fetchRows = async (p: number, rpp: number) => {
        try {
            setLoading(true);
            const res = await getFeatureModulesService(p + 1, rpp, {
                search: search || undefined,
                featureId: featureFilter || undefined,
                moduleId: moduleFilter || undefined,
            });
            if (res.success === 200 && res.data) {
                setRows(res.data.data ?? []);
                setTotal(res.data.total ?? 0);
            }
        } catch {
            showError('Failed to fetch feature module mappings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            if (search) next.set('search', search);
            else next.delete('search');
            if (featureFilter) next.set('featureId', featureFilter);
            else next.delete('featureId');
            if (moduleFilter) next.set('moduleId', moduleFilter);
            else next.delete('moduleId');
            setSearchParams(next, { replace: true });
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, featureFilter, moduleFilter]);

    useEffect(() => {
        void fetchRows(page, rowsPerPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, search, featureFilter, moduleFilter]);

    const handleDelete = async (row: FeatureModuleRow) => {
        const label = `${row.feature?.name || row.feature?.key} → ${row.module?.name}`;
        const confirmed = await confirm({
            title: 'Remove mapping?',
            message: `Remove "${label}"?`,
            confirmText: 'Remove',
            severity: 'error',
        });
        if (!confirmed) return;

        try {
            const res = await deleteFeatureModuleService(row.id);
            if (res.success === 200) {
                showSuccess(res.message || 'Mapping removed');
                const nextTotal = total - 1;
                const maxPage = Math.max(0, Math.ceil(nextTotal / rowsPerPage) - 1);
                if (page > maxPage) setPage(maxPage);
                else void fetchRows(page, rowsPerPage);
            } else {
                showError(res.message || 'Failed to remove mapping');
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            showError(e.response?.data?.message || 'Failed to remove mapping');
        }
    };

    return (
        <Container maxWidth={false} sx={{ pt: 1 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        sx={{ flex: 1, minWidth: 220 }}
                        size="small"
                        placeholder="Search feature or module..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Feature</InputLabel>
                        <Select
                            value={featureFilter}
                            label="Feature"
                            onChange={(e) => setFeatureFilter(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>All features</em>
                            </MenuItem>
                            {features.map((f) => (
                                <MenuItem key={f.id} value={f.id}>
                                    {f.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Module</InputLabel>
                        <Select
                            value={moduleFilter}
                            label="Module"
                            onChange={(e) => setModuleFilter(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>All modules</em>
                            </MenuItem>
                            {modules.map((m) => (
                                <MenuItem key={m.id} value={m.id}>
                                    {m.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Card>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell>Feature</TableCell>
                                <TableCell>Module</TableCell>
                                <TableCell>Created</TableCell>
                                {permissions.delete && (
                                    <TableCell align="right">Actions</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No mappings found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={row.feature?.key || '—'}
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                                <span>{row.feature?.name || '—'}</span>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{row.module?.name || '—'}</TableCell>
                                        <TableCell>
                                            {row.createdAt
                                                ? new Date(row.createdAt).toLocaleString()
                                                : '—'}
                                        </TableCell>
                                        {permissions.delete && (
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() =>
                                                        navigate(
                                                            FEATURE_MODULE_PATHS.MANAGE.replace(
                                                                ':featureId',
                                                                row.featureId
                                                            )
                                                        )
                                                    }
                                                >
                                                    Manage
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    sx={{ ml: 1 }}
                                                    onClick={() => handleDelete(row)}
                                                >
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </Paper>
        </Container>
    );
};

export default FeatureModuleList;
