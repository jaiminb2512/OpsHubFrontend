import { useState, useEffect, useMemo } from 'react';
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
    Typography,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    BusinessCenter as ProjectIcon,
    VpnKey as VpnKeyIcon,
    DeleteForever as HardDeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getProjectsService, deleteProjectService, hardDeleteProjectService, type ProjectListItem } from '../../Services/ApiServices/projectServices';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { PROJECT_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';

const ProjectList = () => {
    const navigate = useNavigate();

    usePageTitle(
        'Projects',
        <Stack direction="row" spacing={2}>
            <Tooltip title="Add Project" arrow>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(PROJECT_PATHS.CREATE)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: { xs: 0, md: 'auto' },
                        '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 }, ml: { xs: 0, md: -0.5 } },
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                        Add Project
                    </Box>
                </Button>
            </Tooltip>
        </Stack>
    );

    const { showError, showSuccess } = useToast();
    const { confirm } = useConfirm();

    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Local pagination & filtering state
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Hard-delete confirmation dialog state
    const [hardDeleteTarget, setHardDeleteTarget] = useState<ProjectListItem | null>(null);
    const [deleteApiKeys, setDeleteApiKeys] = useState(true);
    const [deleteProjectRecord, setDeleteProjectRecord] = useState(true);
    const [hardDeleteLoading, setHardDeleteLoading] = useState(false);
    const [hardDeleteResult, setHardDeleteResult] = useState<Record<string, number> | null>(null);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await getProjectsService();
            if (response.success) {
                setProjects(response.data || []);
            }
        } catch (error) {
            console.error(error);
            showError('Failed to fetch Projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (project: ProjectListItem) => {
        const confirmed = await confirm({
            title: 'Delete project?',
            message: `Are you sure you want to delete "${project.name}"? This action will perform a soft delete.`,
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;
        try {
            const response = await deleteProjectService(project.id);
            if (response?.success) {
                showSuccess(response.message || 'Project deleted successfully');
                fetchProjects();
            } else {
                showError(response?.message || 'Failed to delete project');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to delete project');
        }
    };

    const openHardDelete = (project: ProjectListItem) => {
        setHardDeleteTarget(project);
        setDeleteApiKeys(true);
        setDeleteProjectRecord(true);
        setHardDeleteResult(null);
    };

    const closeHardDelete = () => {
        if (hardDeleteLoading) return;
        setHardDeleteTarget(null);
        setHardDeleteResult(null);
        if (hardDeleteResult) fetchProjects();
    };

    const handleHardDelete = async () => {
        if (!hardDeleteTarget) return;
        setHardDeleteLoading(true);
        try {
            const response = await hardDeleteProjectService(hardDeleteTarget.id, {
                deleteApiKeys,
                deleteProject: deleteProjectRecord,
            });
            if (response?.success) {
                setHardDeleteResult(response.data?.counts ?? {});
                showSuccess(response.message || `Project "${hardDeleteTarget.name}" data deleted`);
                fetchProjects();
            } else {
                showError(response?.message || 'Hard delete failed');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Hard delete failed');
        } finally {
            setHardDeleteLoading(false);
        }
    };

    // Filter projects based on search query
    const filteredProjects = useMemo(() => {
        if (!search.trim()) return projects;
        const lowerSearch = search.toLowerCase();
        return projects.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            (p.domain && p.domain.toLowerCase().includes(lowerSearch)) ||
            (p.company && p.company.name.toLowerCase().includes(lowerSearch))
        );
    }, [projects, search]);

    // Handle pagination
    const paginatedProjects = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredProjects.slice(start, start + rowsPerPage);
    }, [filteredProjects, page, rowsPerPage]);

    // Ensure page doesn't exceed bounds when search results change
    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(filteredProjects.length / rowsPerPage) - 1);
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [filteredProjects.length, rowsPerPage, page]);

    return (
        <Container maxWidth={false}>
            {/* Search bar */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', p: 1 }}>
                    <TextField
                        sx={{ flex: 1, minWidth: 220 }}
                        size="small"
                        placeholder="Search projects by name, domain, or company..."
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
                </Box>
            </Paper>

            {/* Table */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
            >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Project</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Domain</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Company</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">
                                    Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Stack alignItems="center" gap={1}>
                                            <Typography variant="body2" color="text.secondary">
                                                Loading projects...
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : filteredProjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Stack alignItems="center" gap={1}>
                                            <ProjectIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                No projects found
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedProjects.map((project) => (
                                    <TableRow
                                        key={project.id}
                                        hover
                                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                                    >
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {project.name}
                                                </Typography>
                                                {project.description && (
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
                                                        {project.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {project.domain ? (
                                                <Chip
                                                    label={project.domain}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        fontWeight: 500,
                                                        fontFamily: 'monospace',
                                                        fontSize: 12,
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">N/A</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {project.company ? (
                                                <Typography variant="body2" fontWeight={500}>
                                                    {project.company.name}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">System (No Company)</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={project.isActive ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={project.isActive ? 'success' : 'default'}
                                                variant={project.isActive ? 'filled' : 'outlined'}
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <Tooltip title="Edit" arrow>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => navigate(PROJECT_PATHS.EDIT.replace(':id', project.id))}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Manage API Keys" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`${PROJECT_PATHS.API_KEYS}?projectId=${project.id}`)}
                                                    >
                                                        <VpnKeyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete" arrow>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(project)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Hard Delete" arrow>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openHardDelete(project)}
                                                            sx={{ color: 'error.dark' }}
                                                        >
                                                            <HardDeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredProjects.length}
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

            {/* Hard Delete Confirmation Dialog */}
            <Dialog
                open={!!hardDeleteTarget}
                onClose={closeHardDelete}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.dark' }}>
                    <HardDeleteIcon color="error" />
                    Permanently Delete Project
                </DialogTitle>
                <DialogContent>
                    {hardDeleteResult ? (
                        <>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Operation completed. Deleted records:
                            </Alert>
                            <List dense disablePadding>
                                {Object.entries(hardDeleteResult).map(([key, count]) => (
                                    <ListItem key={key} disableGutters sx={{ py: 0.25 }}>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2">
                                                    <strong>{key}:</strong> {count} record{count !== 1 ? 's' : ''}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    ) : (
                        <>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                This will permanently delete all RBAS data scoped to <strong>{hardDeleteTarget?.name}</strong> — roles, permissions, menus, modules, API endpoints, features, and plans.
                            </Alert>
                            <DialogContentText sx={{ mb: 1 }}>
                                Select what to delete:
                            </DialogContentText>
                            <Stack spacing={0.5} sx={{ mb: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={deleteApiKeys}
                                            onChange={(e) => setDeleteApiKeys(e.target.checked)}
                                            color="error"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>Delete API Keys</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Remove all project API keys used for external authentication
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={deleteProjectRecord}
                                            onChange={(e) => setDeleteProjectRecord(e.target.checked)}
                                            color="error"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>Delete Project</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Remove the project record itself (uncheck to only clear its data)
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Stack>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                                This action cannot be undone. Export project data first if you need a backup.
                            </Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeHardDelete} disabled={hardDeleteLoading}>
                        {hardDeleteResult ? 'Close' : 'Cancel'}
                    </Button>
                    {!hardDeleteResult && (
                        <Button
                            variant="contained"
                            color="error"
                            disabled={hardDeleteLoading}
                            onClick={handleHardDelete}
                            startIcon={<HardDeleteIcon />}
                        >
                            {hardDeleteLoading ? 'Deleting...' : 'Permanently Delete'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProjectList;
