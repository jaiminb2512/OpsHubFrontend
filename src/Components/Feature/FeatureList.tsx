import { useState, useEffect } from 'react';
import {
    Button,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TablePagination,
    Tooltip,
    Box,
    TextField,
    InputAdornment,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    IconButton,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    Extension as FeatureIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deleteFeatureService, getFeaturesService } from '../../Services/ApiServices/featureServices';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { FEATURE_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { ProjectSelect } from '../Common/ProjectSelect';

const FeatureList = () => {
    const navigate = useNavigate();
    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createFeature' },
        { key: 'edit', endpointKey: 'updateFeature', pathParams: { id: 'sample-id' } },
        { key: 'delete', endpointKey: 'deleteFeature', pathParams: { id: 'sample-id' } },
    ]);

    usePageTitle(
        'Features',
        permissions.create ? (
            <Tooltip title="Add Feature" arrow>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(FEATURE_PATHS.CREATE)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: { xs: 0, md: 'auto' },
                        '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 }, ml: { xs: 0, md: -0.5 } },
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                        Add Feature
                    </Box>
                </Button>
            </Tooltip>
        ) : undefined
    );
    const { showError, showSuccess } = useToast();
    const { confirm } = useConfirm();
    const [features, setFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);

    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [matchType, setMatchType] = useState<'exact' | 'like'>(
        searchParams.get('matchType') === 'exact' ? 'exact' : 'like'
    );
    const [projectId, setProjectId] = useState<string>(searchParams.get('projectId') ?? '');

    const fetchFeatures = async (p: number, rpp: number) => {
        try {
            setLoading(true);
            const response = await getFeaturesService(p + 1, rpp, search || undefined, matchType, projectId || undefined);
            if (response.success) {
                setFeatures(response.data.data);
                setTotal(response.data.pagination.total);
            }
        } catch (error) {
            console.error(error);
            showError('Failed to fetch Features');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            if (search) {
                next.set('search', search);
                next.set('matchType', matchType);
            } else {
                next.delete('search');
                next.delete('matchType');
            }
            if (projectId) {
                next.set('projectId', projectId);
            } else {
                next.delete('projectId');
            }
            setSearchParams(next, { replace: true });
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, matchType, projectId]);

    useEffect(() => {
        fetchFeatures(page, rowsPerPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, search, matchType, projectId]);

    const handleDelete = async (feature: { id: string; name?: string; key?: string; isSystem?: boolean }) => {
        if (feature.isSystem) {
            showError('System features cannot be deleted');
            return;
        }
        const label = feature.name || feature.key || 'this feature';
        const confirmed = await confirm({
            title: 'Delete feature?',
            message: `Are you sure you want to delete "${label}"?`,
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;
        try {
            const response = await deleteFeatureService(feature.id);
            if (response?.success) {
                showSuccess(response.message || 'Feature deleted successfully');
                const nextTotal = total - 1;
                const maxPage = Math.max(0, Math.ceil(nextTotal / rowsPerPage) - 1);
                if (page > maxPage) {
                    setPage(maxPage);
                } else {
                    fetchFeatures(page, rowsPerPage);
                }
            } else {
                showError(response?.message || 'Failed to delete feature');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to delete feature');
        }
    };

    return (
        <Container maxWidth={false}>
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
            >
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        value={projectId}
                        onChange={setProjectId}
                        size="small"
                    />
                    <TextField
                        sx={{ flex: 1, minWidth: 220 }}
                        size="small"
                        placeholder="Search features by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={matchType}
                        onChange={(_, value) => value && setMatchType(value)}
                        sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 500 } }}
                    >
                        <ToggleButton value="like">Contains</ToggleButton>
                        <ToggleButton value="exact">Exact</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Feature</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Key</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">
                                    Modules
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">
                                    Status
                                </TableCell>
                                {(permissions.edit || permissions.delete) && (
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">
                                        Actions
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Stack alignItems="center" gap={1}>
                                            <Typography variant="body2" color="text.secondary">
                                                Loading features...
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : features.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Stack alignItems="center" gap={1}>
                                            <FeatureIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                No features found
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                features.map((feature) => (
                                    <TableRow
                                        key={feature.id}
                                        hover
                                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                                    >
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {feature.name}
                                                </Typography>
                                                {feature.description && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 1,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            maxWidth: 360,
                                                        }}
                                                    >
                                                        {feature.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={feature.key}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 500,
                                                    fontFamily: 'monospace',
                                                    fontSize: 12,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={feature.moduleIds?.length ?? 0}
                                                size="small"
                                                variant="filled"
                                                color={feature.moduleIds?.length > 0 ? 'info' : 'default'}
                                                sx={{ fontWeight: 600, minWidth: 32 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={feature.isActive ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={feature.isActive ? 'success' : 'default'}
                                                variant={feature.isActive ? 'filled' : 'outlined'}
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        {(permissions.edit || permissions.delete) && (
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    {permissions.edit && (
                                                        <Tooltip title="Edit" arrow>
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() =>
                                                                    navigate(FEATURE_PATHS.EDIT.replace(':id', feature.id))
                                                                }
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {permissions.delete && (
                                                        <Tooltip title={feature.isSystem ? 'System feature' : 'Delete'} arrow>
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    disabled={feature.isSystem}
                                                                    onClick={() => handleDelete(feature)}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
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

export default FeatureList;
