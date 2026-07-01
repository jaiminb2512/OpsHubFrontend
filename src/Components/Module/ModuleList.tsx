import { useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Checkbox,
    Collapse,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    FiberManualRecord as FiberManualRecordIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { hasMuiIcon, resolveMuiIcon } from '../../Utils/muiIconRegistry';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getModulesService, deleteModuleService, type Menu } from '../../Services/ApiServices/moduleServices';
import { MODULE_PATHS } from '../../Path/modulePaths';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import usePageTitle from '../../hooks/usePageTitle';
import { ProjectSelect } from '../Common/ProjectSelect';
const DynamicIcon = ({ iconName }: { iconName?: string }) => {
    if (!iconName || !hasMuiIcon(iconName)) {
        return <FiberManualRecordIcon sx={{ fontSize: 10 }} />;
    }
    const Icon = resolveMuiIcon(iconName);
    return <Icon fontSize="small" />;
};

const MenuTreeItem = ({ menu, level = 0 }: { menu: Menu; level?: number }) => {
    const [open, setOpen] = useState(false);
    const hasChildren = menu.children && menu.children.length > 0;

    const handleClick = () => {
        setOpen(!open);
    };

    // Common content for the list item
    const itemContent = (
        <>
            <ListItemIcon sx={{ minWidth: 36 }}>
                <DynamicIcon iconName={menu.icon || undefined} />
            </ListItemIcon>
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={level === 0 ? "bold" : "regular"}>
                            {menu.label}
                        </Typography>
                        {menu.route && (
                            <Typography variant="caption" color="text.secondary" sx={{ bgcolor: '#f5f5f5', px: 0.5, borderRadius: 0.5 }}>
                                {menu.route}
                            </Typography>
                        )}
                    </Box>
                }
                secondary={
                    menu.permissions && menu.permissions.length > 0 && (
                        <Typography variant="caption" color="primary.main">
                            Perms: {menu.permissions.map((p: any) => p.permission?.description || p.permission?.apiMethod + ' ' + p.permission?.apiRoute || p.permissionId).join(', ')}
                        </Typography>
                    )
                }
            />
            {hasChildren && (open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
        </>
    );

    const sxProps = {
        borderLeft: level > 0 ? '1px dashed #e0e0e0' : 'none',
        py: 0.5
    };

    return (
        <Box sx={{ pl: level * 2 }}>
            {hasChildren ? (
                <ListItemButton onClick={handleClick} sx={sxProps}>
                    {itemContent}
                </ListItemButton>
            ) : (
                <ListItem sx={sxProps}>
                    {itemContent}
                </ListItem>
            )}

            {hasChildren && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {menu.children?.map((child) => (
                            <MenuTreeItem key={child.id} menu={child} level={level + 1} />
                        ))}
                    </List>
                </Collapse>
            )}
        </Box>
    );
};

const ModuleList = () => {
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const { confirm } = useConfirm();
    usePageTitle('Modules & Menus', (
        <Tooltip title="Create Module" arrow>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(MODULE_PATHS.CREATE)}
                sx={{
                    minWidth: { xs: 0, md: 'auto' },
                    px: { xs: 1.5, md: 2.5 },
                    '& .MuiButton-startIcon': {
                        mr: { xs: 0, md: 1 },
                        ml: { xs: 0, md: -0.5 }
                    }
                }}
            >
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                    Create Module
                </Box>
            </Button>
        </Tooltip>
    ));
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [modules, setModules] = useState<Menu[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [matchType, setMatchType] = useState<'exact' | 'like'>(
        searchParams.get('matchType') === 'exact' ? 'exact' : 'like'
    );
    const [projectId, setProjectId] = useState<string>(searchParams.get('projectId') ?? '');
    const [isPublic, setIsPublic] = useState<'' | 'true' | 'false'>('');
    const [filterModalOpen, setFilterModalOpen] = useState(false);

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
        fetchModules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, search, matchType, projectId, isPublic]);

    const fetchModules = async () => {
        try {
            setFetching(true);
            const response = await getModulesService({
                page: page + 1,
                limit: rowsPerPage,
                search: search || undefined,
                matchType,
                projectId: projectId || undefined,
                ...(isPublic !== '' ? { isPublic: isPublic === 'true' } : {}),
            });
            const payload = response.data;
            setModules(payload?.data ?? []);
            setTotalCount(payload?.total ?? 0);
        } catch (error) {
            console.error("Failed to fetch modules", error);
            showError("Failed to fetch modules list", "Error");
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    const handleDeleteModule = async (module: Menu) => {
        const confirmed = await confirm({
            title: 'Delete module?',
            message: `Are you sure you want to delete module "${module.label}"?\n\nWARNING: This will recursively delete all associated menus and permissions!`,
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;

        try {
            await deleteModuleService(module.id);
            showSuccess("Module deleted successfully", "Success");
            // Re-fetch or filter
            setModules(prev => prev.filter(m => m.id !== module.id));
            setTotalCount(c => Math.max(0, c - 1));
        } catch (error: any) {
            console.error("Failed to delete module", error);
            showError(error.response?.data?.message || "Failed to delete module", "Error");
        }
    };

    const toggleSelected = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === modules.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(modules.map(m => m.id));
        }
    };

    const handleEditSelected = () => {
        if (selectedIds.length === 1) {
            navigate(MODULE_PATHS.EDIT.replace(':id', selectedIds[0]));
        } else if (selectedIds.length > 1) {
            navigate(`${MODULE_PATHS.EDIT_BULK}?ids=${selectedIds.join(',')}`);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        value={projectId}
                        onChange={setProjectId}
                        size="small"
                    />
                    <TextField
                        sx={{ flex: 1, minWidth: 220 }}
                        size="small"
                        variant="outlined"
                        placeholder="Search modules..."
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
                        <Badge color="primary" variant="dot" invisible={isPublic === ''}>
                            <IconButton size="small" onClick={() => setFilterModalOpen(true)}>
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Badge>
                    </Tooltip>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={handleEditSelected}
                        >
                            Edit Selected ({selectedIds.length})
                        </Button>
                    )}
                </Box>

                <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>More Filters</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Is Public</InputLabel>
                                <Select
                                    value={isPublic}
                                    label="Is Public"
                                    onChange={(e) => { setIsPublic(e.target.value as '' | 'true' | 'false'); setPage(0); }}
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
            <TableContainer sx={{ opacity: fetching ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell width={50}>
                                <Checkbox
                                    size="small"
                                    checked={modules.length > 0 && selectedIds.length === modules.length}
                                    indeterminate={selectedIds.length > 0 && selectedIds.length < modules.length}
                                    onChange={toggleSelectAll}
                                />
                            </TableCell>
                            <TableCell width={50} />
                            <TableCell>Module Name</TableCell>
                            <TableCell>Icon</TableCell>
                            <TableCell align="center">Total Permissions</TableCell>
                            <TableCell align="center">Extra Permissions</TableCell>
                            <TableCell align="center">Menus</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {modules.map((module) => (
                            <ModuleRow
                                key={module.id}
                                module={module}
                                onDelete={handleDeleteModule}
                                selected={selectedIds.includes(module.id)}
                                onToggleSelect={() => toggleSelected(module.id)}
                            />
                        ))}
                        {modules.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary">
                                        No modules found. Click "Create Module" to get started.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </TableContainer>
            </Paper>
        </>
    );
};

const ModuleRow = ({ module, onDelete, selected, onToggleSelect }: { module: Menu, onDelete: (module: Menu) => void, selected: boolean, onToggleSelect: () => void }) => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <Checkbox size="small" checked={selected} onChange={onToggleSelect} />
                </TableCell>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight="bold">{module.label}</Typography>
                        {module.route && (
                            <Typography variant="caption" color="text.secondary" sx={{ bgcolor: '#f5f5f5', px: 0.5, borderRadius: 0.5 }}>
                                {module.route}
                            </Typography>
                        )}
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <DynamicIcon iconName={module.icon || 'Extension'} />
                        <Typography variant="caption" sx={{ ml: 1 }}>{module.icon}</Typography>
                    </Box>
                </TableCell>
                <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                        {module.totalPermission ?? 0}
                    </Typography>
                </TableCell>
                <TableCell align="center">
                    <Typography variant="body2">
                        {module.extraPermissions ?? 0}
                    </Typography>
                </TableCell>
                <TableCell align="center">
                    <Typography variant="body2">
                        {module.menus ?? 0}
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(MODULE_PATHS.EDIT.replace(':id', module.id));
                        }}
                        sx={{ mr: 1 }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(module);
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="subtitle2" gutterBottom component="div">
                                Menu Structure
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <List dense>
                                    {module.children && module.children.length > 0 ? (
                                        module.children.map((child) => (
                                            <MenuTreeItem key={child.id} menu={child} />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No menus defined.
                                        </Typography>
                                    )}
                                </List>
                            </Paper>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export default ModuleList;
