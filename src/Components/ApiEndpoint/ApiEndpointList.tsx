import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Tooltip, Box, TextField, MenuItem, ToggleButtonGroup, ToggleButton,
    TablePagination, Stack, InputAdornment, IconButton,
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
    Search as SearchIcon, Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getApiEndpointsService, deleteApiEndpointService } from '../../Services/ApiServices/apiEndpointServices';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { API_ENDPOINT_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { ProjectSelect } from '../Common/ProjectSelect';

const HTTP_METHODS = ['', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_COLORS: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
    GET: 'info', POST: 'success', PUT: 'warning', PATCH: 'warning', DELETE: 'error',
};

const ApiEndpointList = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createApiEndpoint' },
        { key: 'edit', endpointKey: 'updateApiEndpoint', pathParams: { id: 'sample-id' } },
        { key: 'delete', endpointKey: 'deleteApiEndpoint', pathParams: { id: 'sample-id' } },
    ]);
    const { confirm } = useConfirm();

    const [endpoints, setEndpoints] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [method, setMethod] = useState('');
    const [matchType, setMatchType] = useState<'like' | 'exact'>('like');
    const [projectId, setProjectId] = useState<string>('');
    const [isPublic, setIsPublic] = useState<'' | 'true' | 'false'>('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(9);

    const paramsRef = useRef({ search, method, matchType, page, rowsPerPage, projectId, isPublic });
    paramsRef.current = { search, method, matchType, page, rowsPerPage, projectId, isPublic };

    const fetchEndpoints = useCallback(async (overrides?: {
        search?: string; method?: string; matchType?: 'like' | 'exact'; page?: number; limit?: number; projectId?: string | null; isPublic?: '' | 'true' | 'false';
    }, isInitial = false) => {
        const p = paramsRef.current;
        const resolvedIsPublic = overrides?.isPublic !== undefined ? overrides.isPublic : p.isPublic;
        if (isInitial) setLoading(true); else setFetching(true);
        try {
            const response = await getApiEndpointsService({
                search: (overrides?.search ?? p.search) || undefined,
                method: (overrides?.method ?? p.method) || undefined,
                matchType: overrides?.matchType ?? p.matchType,
                page: (overrides?.page ?? p.page) + 1,
                limit: overrides?.limit ?? p.rowsPerPage,
                projectId: (overrides?.projectId !== undefined ? overrides.projectId : p.projectId) || undefined,
                ...(resolvedIsPublic !== '' ? { isPublic: resolvedIsPublic === 'true' } : {}),
            });
            if (response.success === 200 && response.data) {
                setEndpoints(response.data.data ?? []);
                setTotal(response.data.total ?? 0);
            }
        } catch {
            showError('Failed to fetch API endpoints');
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchEndpoints(undefined, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage]);

    // Debounce search / filter changes
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(0);
            fetchEndpoints({ search, method, matchType, projectId, page: 0, limit: paramsRef.current.rowsPerPage });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, method, matchType, projectId]);

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete endpoint?',
            message: 'Are you sure you want to delete this endpoint?',
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;
        try {
            await deleteApiEndpointService(id);
            showSuccess('Endpoint deleted successfully');
            fetchEndpoints();
        } catch {
            showError('Failed to delete endpoint');
        }
    };

    const handleEdit = (endpoint: any) => navigate(API_ENDPOINT_PATHS.EDIT.replace(':id', endpoint.id));

    usePageTitle('API Endpoints', permissions.create ? (
        <Tooltip title="Add Endpoint" arrow>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(API_ENDPOINT_PATHS.CREATE)} sx={{
                minWidth: { xs: 0, md: 'auto' }, px: { xs: 1.5, md: 2.5 },
                '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 }, ml: { xs: 0, md: -0.5 } },
            }}>
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Add Endpoint</Box>
            </Button>
        </Tooltip>
    ) : undefined);

    return (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {/* ── Filter bar ── */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <TextField
                    size="small"
                    placeholder="Search path or key…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 2, minWidth: 180 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                        endAdornment: search ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearch('')}><ClearIcon fontSize="small" /></IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                />
                <TextField
                    select size="small" label="Method" value={method}
                    onChange={(e) => { setMethod(e.target.value); setPage(0); }}
                    sx={{ minWidth: 120 }}
                >
                    {HTTP_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>{m || 'All methods'}</MenuItem>
                    ))}
                </TextField>
                <ToggleButtonGroup
                    size="small" exclusive value={matchType}
                    onChange={(_, val) => { if (val) { setMatchType(val); setPage(0); } }}
                >
                    <ToggleButton value="like">Like</ToggleButton>
                    <ToggleButton value="exact">Exact</ToggleButton>
                </ToggleButtonGroup>
                <ProjectSelect
                    value={projectId}
                    onChange={(val) => { setProjectId(val); setPage(0); }}
                    size="small"
                />
                <TextField
                    select size="small" label="Visibility" value={isPublic}
                    onChange={(e) => { setIsPublic(e.target.value as '' | 'true' | 'false'); setPage(0); }}
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Public</MenuItem>
                    <MenuItem value="false">Private</MenuItem>
                </TextField>
            </Stack>

            {/* ── Table ── */}
            <TableContainer sx={{ opacity: fetching ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell>Method</TableCell>
                            <TableCell>Path</TableCell>
                            <TableCell>Key</TableCell>
                            <TableCell>Limit</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center">Loading…</TableCell></TableRow>
                        ) : endpoints.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center">No API endpoints found.</TableCell></TableRow>
                        ) : endpoints.map((ep) => (
                            <TableRow key={ep.id} hover>
                                <TableCell>
                                    <Chip label={ep.method} size="small" color={METHOD_COLORS[ep.method] ?? 'default'} />
                                </TableCell>
                                <TableCell>{ep.path}</TableCell>
                                <TableCell>{ep.key}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={ep.isLimitAllowed ? 'Allowed' : 'Not allowed'}
                                        color={ep.isLimitAllowed ? 'primary' : 'default'}
                                        size="small" variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={ep.isActive ? 'Active' : 'Inactive'}
                                        color={ep.isActive ? 'success' : 'default'}
                                        size="small" variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {permissions.edit && <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(ep)}>Edit</Button>}
                                    {permissions.delete && <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(ep.id)}>Delete</Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={total}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPageOptions={[10, 20, 50, 100]}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
        </Paper>
    );
};

export default ApiEndpointList;
