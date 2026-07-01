import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
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
    Tooltip,
    Badge,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    deleteModuleGroupService,
    getModuleGroupsService,
} from '../../Services/ApiServices/moduleGroupServices';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { MODULE_GROUP_PATHS } from '../../Path';
import { ProjectSelect } from '../Common/ProjectSelect';

type ModuleGroupRow = {
    id: string;
    key: string;
    label: string;
    description?: string | null;
    orderIndex: number;
    isSystem?: boolean;
    isPublic?: boolean;
    moduleCount?: number;
};

import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
const ModuleGroupList = () => {
    const navigate = useNavigate();
    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createModuleGroup' },
        { key: 'delete', endpointKey: 'deleteModuleGroup', pathParams: { id: 'sample-id' } },
    ]);
    usePageTitle('Module Groups',
        permissions.create ? (
        <Tooltip title="Add Module Group" arrow>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(MODULE_GROUP_PATHS.CREATE)}
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
                    Add Module Group
                </Box>
            </Button>
        </Tooltip>
        ) : undefined
    );
    const { showError, showSuccess } = useToast();
    const { confirm } = useConfirm();
    const [groups, setGroups] = useState<ModuleGroupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [projectId, setProjectId] = useState<string>('');
    const [isPublic, setIsPublic] = useState<'' | 'true' | 'false'>('');
    const [filterModalOpen, setFilterModalOpen] = useState(false);

    const fetchGroups = async (p: number, rpp: number, projId: string, pub: '' | 'true' | 'false' = isPublic) => {
        try {
            setLoading(true);
            const pubFilter = pub !== '' ? pub === 'true' : undefined;
            const response = await getModuleGroupsService(p + 1, rpp, projId || undefined, pubFilter);
            if (response.success) {
                setGroups(response.data.data);
                setTotal(response.data.pagination.total);
            }
        } catch (error) {
            console.error(error);
            showError('Failed to fetch module groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups(page, rowsPerPage, projectId, isPublic);
    }, [page, rowsPerPage, projectId, isPublic]);

    const handleDelete = async (group: ModuleGroupRow) => {
        if (group.isSystem) {
            showError('System module groups cannot be deleted');
            return;
        }
        const label = group.label || group.key;
        const confirmed = await confirm({
            title: 'Delete module group?',
            message: `Delete module group "${label}"? Linked modules will be ungrouped.`,
            confirmText: 'Delete',
            severity: 'warning',
        });
        if (!confirmed) return;
        try {
            const response = await deleteModuleGroupService(group.id);
            if (response?.success) {
                showSuccess(response.message || 'Module group deleted successfully');
                const nextTotal = total - 1;
                const maxPage = Math.max(0, Math.ceil(nextTotal / rowsPerPage) - 1);
                if (page > maxPage) {
                    setPage(maxPage);
                } else {
                    fetchGroups(page, rowsPerPage, projectId);
                }
            } else {
                showError(response?.message || 'Failed to delete module group');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to delete module group');
        }
    };

    return (
        <Stack spacing={2}>
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
            >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        value={projectId}
                        onChange={(val) => { setProjectId(val); setPage(0); }}
                        size="small"
                    />
                    <Tooltip title="More filters">
                        <Badge color="primary" variant="dot" invisible={isPublic === ''}>
                            <IconButton size="small" onClick={() => setFilterModalOpen(true)}>
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Badge>
                    </Tooltip>
                </Stack>

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
            <TableContainer>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell>Key</TableCell>
                            <TableCell>Label</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="center">Order</TableCell>
                            <TableCell align="center">Visibility</TableCell>
                            <TableCell align="center">Modules</TableCell>
                            {permissions.delete && (
                                <TableCell align="right">Actions</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : groups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No module groups found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            groups.map((group) => (
                                <TableRow key={group.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={group.key}
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                        />
                                        {group.isSystem && (
                                            <Chip
                                                label="System"
                                                size="small"
                                                color="secondary"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>{group.label}</TableCell>
                                    <TableCell>{group.description || '—'}</TableCell>
                                    <TableCell align="center">{group.orderIndex}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={group.isPublic === false ? 'Private' : 'Public'}
                                            size="small"
                                            color={group.isPublic === false ? 'default' : 'success'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="center">{group.moduleCount ?? 0}</TableCell>
                                    {permissions.delete && (
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() =>
                                                    navigate(
                                                        MODULE_GROUP_PATHS.EDIT.replace(':id', group.id)
                                                    )
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                disabled={group.isSystem}
                                                onClick={() => handleDelete(group)}
                                                sx={{ ml: 1 }}
                                            >
                                                Delete
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
        </Stack>
    );
};

export default ModuleGroupList;
