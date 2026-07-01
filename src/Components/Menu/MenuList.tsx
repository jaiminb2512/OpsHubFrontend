import { useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
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
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Extension as ExtensionIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    getMenusService,
    deleteMenuService,
    type Menu
} from '../../Services/ApiServices/menuServices';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { MODULE_PATHS } from '../../Path/modulePaths'; // Add this import

import { MENU_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { ProjectSelect } from '../Common/ProjectSelect';
import { hasMuiIcon, resolveMuiIcon } from '../../Utils/muiIconRegistry';

const MenuList = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();
    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createMenu' },
        { key: 'delete', endpointKey: 'deleteMenu' },
    ]);

    usePageTitle('Menu Items', (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Tooltip title="View Modules" arrow>
                <Button
                    variant="outlined"
                    startIcon={<ExtensionIcon />}
                    onClick={() => navigate(MODULE_PATHS.LIST)}
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
                        View Modules
                    </Box>
                </Button>
            </Tooltip>
            {permissions.create && (
                <Tooltip title="Create Menu Item" arrow>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(MENU_PATHS.CREATE)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                            minWidth: { xs: 0, md: 'auto' },
                            px: { xs: 1.5, md: 2.5 },
                            '& .MuiButton-startIcon': {
                                mr: { xs: 0, md: 1 },
                                ml: { xs: 0, md: -0.5 }
                            }
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                            Create Menu Item
                        </Box>
                    </Button>
                </Tooltip>
            )}
        </Stack>
    ));

    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
    const [matchType, setMatchType] = useState<'exact' | 'like'>(
        searchParams.get('matchType') === 'exact' ? 'exact' : 'like'
    );
    const [projectId, setProjectId] = useState<string>(searchParams.get('projectId') ?? '');
    const [isActive, setIsActive] = useState<'' | 'true' | 'false'>('');
    const [filterModalOpen, setFilterModalOpen] = useState(false);

    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '0', 10));
    const [rowsPerPage, setRowsPerPage] = useState(parseInt(searchParams.get('limit') ?? '10', 10));

    useEffect(() => {
        const timer = setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            if (searchTerm) {
                next.set('search', searchTerm);
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
            next.set('page', String(page));
            next.set('limit', String(rowsPerPage));
            setSearchParams(next, { replace: true });
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, matchType, projectId, page, rowsPerPage]);

    // Reset page to 0 when query changes
    useEffect(() => {
        setPage(0);
    }, [searchTerm, matchType, projectId, isActive]);

    useEffect(() => {
        fetchMenus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, matchType, projectId, isActive, page, rowsPerPage]);

    const fetchMenus = async () => {
        setLoading(true);
        try {
            // Fetch flat list for table display
            const response = await getMenusService(true, {
                search: searchTerm || undefined,
                matchType,
                projectId: projectId || undefined,
                page: page + 1,
                limit: rowsPerPage,
                ...(isActive !== '' ? { isActive: isActive === 'true' } : {}),
            });
            if (response.success && response.data) {
                if (Array.isArray(response.data)) {
                    setMenus(response.data);
                    setTotal(response.data.length);
                } else {
                    setMenus(response.data.data || []);
                    setTotal(response.data.total || 0);
                }
            }
        } catch (error) {
            console.error("Failed to fetch menus", error);
            showError("Failed to load menus", "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (menu: Menu) => {
        const confirmMessage = menu.hasChildren
            ? `Are you sure you want to delete "${menu.label}"?\n\nWARNING: This will explicitly delete all sub-menus and associated permissions!`
            : `Are you sure you want to delete "${menu.label}"?`;

        const confirmed = await confirm({
            title: 'Delete menu?',
            message: confirmMessage,
            confirmText: 'Delete',
            severity: menu.hasChildren ? 'warning' : 'error',
        });
        if (!confirmed) return;

        try {
            await deleteMenuService(menu.id);
            showSuccess("Menu item deleted successfully", "Success");
            fetchMenus();
        } catch (error: any) {
            console.error("Failed to delete menu item", error);
            showError(error.response?.data?.message || "Failed to delete menu item", "Error");
        }
    };

    const getParentName = (parentId: string | null) => {
        if (!parentId) return '-';
        const parent = menus.find(m => m.id === parentId);
        return parent ? parent.label : 'Unknown';
    };

    const filteredMenus = menus;

    return (
        <Container maxWidth={false} sx={{ py: 0 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden', borderRadius: 2 }}>
                <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        value={projectId}
                        onChange={setProjectId}
                        size="small"
                    />
                    <TextField
                        sx={{ flex: 1, minWidth: 220 }}
                        variant="outlined"
                        placeholder="Search menu items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                    />
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={matchType}
                        onChange={(_, value) => value && setMatchType(value)}
                    >
                        <ToggleButton value="like">Contains</ToggleButton>
                        <ToggleButton value="exact">Exact</ToggleButton>
                    </ToggleButtonGroup>
                    <Tooltip title="More filters">
                        <Badge color="primary" variant="dot" invisible={isActive === ''}>
                            <IconButton size="small" onClick={() => setFilterModalOpen(true)}>
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Badge>
                    </Tooltip>
                </Box>

                <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>More Filters</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Is Active</InputLabel>
                                <Select
                                    value={isActive}
                                    label="Is Active"
                                    onChange={(e) => { setIsActive(e.target.value as '' | 'true' | 'false'); setPage(0); }}
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

                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Label</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Icon</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Parent</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>API Method</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>API Route</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                {permissions.delete && (
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : filteredMenus.length > 0 ? (
                                filteredMenus.map((menu) => (
                                    <TableRow key={menu.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">{menu.label}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                            {menu.route || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {menu.icon && hasMuiIcon(menu.icon) ? (
                                                (() => {
                                                    const Icon = resolveMuiIcon(menu.icon);
                                                    return <Icon fontSize="small" />;
                                                })()
                                            ) : (
                                                menu.icon || '-'
                                            )}
                                        </TableCell>
                                        <TableCell>{getParentName(menu.parentId)}</TableCell>
                                        <TableCell>{menu.permissions?.[0]?.permission?.apiMethod || '-'}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{menu.permissions?.[0]?.permission?.apiRoute || '-'}</TableCell>
                                        <TableCell>{menu.orderIndex}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={menu.isActive ? "Active" : "Inactive"}
                                                size="small"
                                                color={menu.isActive ? "success" : "default"}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        {permissions.delete && (
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(MENU_PATHS.EDIT.replace(':id', menu.id))}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(menu)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                                        <Typography color="text.secondary">No menu items found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>
        </Container>
    );
};

export default MenuList;
