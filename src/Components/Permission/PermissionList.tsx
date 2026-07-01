import { useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    FormControl,
    IconButton,
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
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    CircularProgress,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Clear as ClearIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    getPermissionsService,
    deletePermissionService,
    type Permission,
} from '../../Services/ApiServices/roleServices';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { PERMISSION_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { ProjectSelect } from '../Common/ProjectSelect';

const METHOD_COLORS: Record<string, string> = {
    GET: '#4caf50',
    POST: '#2196f3',
    PUT: '#ff9800',
    PATCH: '#9c27b0',
    DELETE: '#f44336',
};

const PermissionList = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();
    const pagePerms = usePagePermissions([
        { key: 'create', endpointKey: 'createPermission' },
        { key: 'delete', endpointKey: 'deletePermission' },
    ]);

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);

    const [search, setSearch] = useState('');
    const [method, setMethod] = useState('');
    const [matchType, setMatchType] = useState<'like' | 'exact'>('like');
    const [projectId, setProjectId] = useState<string>('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(9);

    const paramsRef = useRef({ search, method, matchType, page, rowsPerPage, projectId });
    paramsRef.current = { search, method, matchType, page, rowsPerPage, projectId };

    usePageTitle('Permissions',
        pagePerms.create ? (
            <Tooltip title="Create Permission" arrow>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(PERMISSION_PATHS.CREATE)}
                    sx={{
                        minWidth: { xs: 0, md: 'auto' },
                        px: { xs: 1.5, md: 2.5 },
                        '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 }, ml: { xs: 0, md: -0.5 } },
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                        Create Permission
                    </Box>
                </Button>
            </Tooltip>
        ) : undefined
    );

    const fetchPermissions = async (isInitial = false) => {
        const { search: s, method: m, matchType: mt, page: p, rowsPerPage: rpp, projectId: pid } = paramsRef.current;
        if (isInitial) setLoading(true); else setFetching(true);
        try {
            const res = await getPermissionsService({
                search: s || undefined,
                method: m || undefined,
                matchType: mt,
                page: p + 1,
                limit: rpp,
                projectId: pid || undefined,
            });
            const payload = res.data as any;
            setPermissions(payload.data ?? []);
            setTotal(payload.total ?? 0);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
            showError('Failed to load permissions', 'Error');
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchPermissions(true);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(0);
            fetchPermissions();
        }, 350);
        return () => clearTimeout(t);
    }, [search, method, matchType, projectId]);

    useEffect(() => {
        fetchPermissions();
    }, [page, rowsPerPage]);

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete permission?',
            message: 'Are you sure you want to delete this permission?',
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;

        try {
            await deletePermissionService(id);
            showSuccess('Permission deleted successfully', 'Success');
            fetchPermissions();
        } catch (error: any) {
            console.error('Failed to delete permission', error);
            showError(error.response?.data?.message || 'Failed to delete permission', 'Error');
        }
    };

    return (
        <Box>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        value={projectId}
                        onChange={(val) => { setProjectId(val); setPage(0); }}
                        size="small"
                    />
                    <TextField
                        size="small"
                        placeholder="Search by description, module, or path…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ flex: 1, minWidth: 220 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                            endAdornment: search ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearch('')}><ClearIcon fontSize="small" /></IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Method</InputLabel>
                        <Select
                            label="Method"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                                <MenuItem key={m} value={m}>
                                    <Chip
                                        label={m}
                                        size="small"
                                        sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: METHOD_COLORS[m], color: '#fff' }}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={matchType}
                        onChange={(_, val) => { if (val) setMatchType(val); }}
                    >
                        <ToggleButton value="like">Like</ToggleButton>
                        <ToggleButton value="exact">Exact</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <TableContainer sx={{ opacity: fetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                                {pagePerms.delete && (
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : permissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                        <Typography color="text.secondary">No permissions found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                permissions.map((perm) => {
                                    const method = perm.api?.method || perm.apiMethod || '';
                                    return (
                                        <TableRow key={perm.id} hover>
                                            <TableCell>
                                                {perm.module && typeof perm.module === 'object'
                                                    ? perm.module.name
                                                    : perm.moduleId || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: 'text.secondary', maxWidth: 360 }}>
                                                {perm.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {method ? (
                                                    <Chip
                                                        label={method}
                                                        size="small"
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            fontWeight: 700,
                                                            bgcolor: METHOD_COLORS[method] ?? '#9e9e9e',
                                                            color: '#fff',
                                                        }}
                                                    />
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                {perm.api?.path || perm.apiRoute || '-'}
                                            </TableCell>
                                            {pagePerms.delete && (
                                                <TableCell align="right">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(perm.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
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
                    rowsPerPageOptions={[9, 20, 50, 100]}
                />
            </Paper>
        </Box>
    );
};

export default PermissionList;

