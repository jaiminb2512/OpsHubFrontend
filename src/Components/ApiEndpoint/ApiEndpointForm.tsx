import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { API_ENDPOINT_PATHS } from '../../Path';
import { getModulesService } from '../../Services/ApiServices/moduleServices';
import {
    createApiEndpointService,
    getApiEndpointByIdService,
    updateApiEndpointService,
} from '../../Services/ApiServices/apiEndpointServices';
import {
    createMenuService,
    updateMenuService,
    deleteMenuService,
} from '../../Services/ApiServices/menuServices';

import usePageTitle from '../../hooks/usePageTitle';

type SelectOption = { id: string; name: string };

interface LinkedMenu {
    id: string;
    label: string;
    icon: string | null;
    route: string | null;
    parentId: string | null;
    orderIndex: number;
    isActive: boolean;
    permissionId: string;
}

const emptyMenuForm = {
    label: '',
    icon: '',
    route: '',
    orderIndex: 0,
    isActive: true,
};

const ApiEndpointForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    usePageTitle(isEdit ? 'Edit API Endpoint' : 'Add New API Endpoint');
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [modules, setModules] = useState<SelectOption[]>([]);

    const [formData, setFormData] = useState({
        method: '',
        path: '',
        key: '',
        moduleId: '',
        isPublic: false,
        isLimitAllowed: true,
        isActive: true,
    });

    // Menu management state
    const [linkedMenus, setLinkedMenus] = useState<LinkedMenu[]>([]);
    const [firstPermissionId, setFirstPermissionId] = useState<string | null>(null);
    const [addingMenu, setAddingMenu] = useState(false);
    const [menuForm, setMenuForm] = useState(emptyMenuForm);
    const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
    const [editMenuForm, setEditMenuForm] = useState(emptyMenuForm);
    const [menuSaving, setMenuSaving] = useState(false);

    const normalizedMethod = useMemo(() => formData.method.trim().toUpperCase(), [formData.method]);

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const modsRes = await getModulesService();
                if (modsRes?.success && modsRes.data?.data && Array.isArray(modsRes.data.data)) {
                    setModules(modsRes.data.data.map((m: any) => ({ id: m.id, name: m.label || m.name })));
                }
            } catch {
                showError('Failed to load modules');
            }
        };

        fetchDropdowns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isEdit) return;

        const fetchEndpoint = async () => {
            try {
                const res = await getApiEndpointByIdService(id!);
                if (res?.success) {
                    const ep = res.data as any;
                    setFormData({
                        method: ep.method || '',
                        path: ep.path || '',
                        key: ep.key || '',
                        moduleId: ep.moduleId || '',
                        isPublic: ep.isPublic !== undefined ? ep.isPublic : false,
                        isLimitAllowed: ep.isLimitAllowed !== undefined ? ep.isLimitAllowed : true,
                        isActive: ep.isActive !== undefined ? ep.isActive : true,
                    });
                    setLinkedMenus(ep.menus || []);
                    // keep the first permissionId for new menus
                    if (ep.permissions && ep.permissions.length > 0) {
                        setFirstPermissionId(ep.permissions[0].id);
                    }
                } else {
                    showError(res?.message || 'Failed to fetch API Endpoint');
                }
            } catch (e: any) {
                showError(e?.response?.data?.message || 'Failed to fetch API Endpoint');
            } finally {
                setFetching(false);
            }
        };

        fetchEndpoint();
    }, [id, isEdit, showError]);

    useEffect(() => {
        if (isEdit) return;
        if (!formData.key && normalizedMethod && formData.path.trim()) {
            setFormData((prev) => ({ ...prev, key: `${normalizedMethod}:${prev.path.trim()}` }));
        }
    }, [formData.path, formData.key, isEdit, normalizedMethod]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!normalizedMethod || !formData.path.trim() || !formData.key.trim()) {
            showError('Method, Path and Key are required');
            return;
        }
        if (!formData.moduleId) {
            showError('Module is required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                method: normalizedMethod,
                path: formData.path.trim(),
                key: formData.key.trim(),
                moduleId: formData.moduleId,
                isPublic: formData.isPublic,
                isLimitAllowed: formData.isLimitAllowed,
                isActive: formData.isActive,
            };

            if (isEdit) {
                await updateApiEndpointService(id!, payload);
                showSuccess('API Endpoint updated successfully');
            } else {
                await createApiEndpointService(payload);
                showSuccess('API Endpoint created successfully');
            }

            navigate(API_ENDPOINT_PATHS.LIST);
        } catch (e: any) {
            showError(e?.response?.data?.message || e?.message || 'Failed to save API Endpoint');
        } finally {
            setLoading(false);
        }
    };

    // ── Menu handlers ──

    const handleAddMenu = async () => {
        if (!menuForm.label.trim()) {
            showError('Menu label is required');
            return;
        }
        if (!firstPermissionId) {
            showError('No permission linked to this endpoint. Save the endpoint first or ensure it has a permission.');
            return;
        }
        setMenuSaving(true);
        try {
            const res = await createMenuService({
                label: menuForm.label.trim(),
                icon: menuForm.icon.trim() || undefined,
                route: menuForm.route.trim() || undefined,
                orderIndex: menuForm.orderIndex,
                isActive: menuForm.isActive,
                permissionIds: [firstPermissionId],
            });
            if (res?.success) {
                const created = res.data as any;
                setLinkedMenus((prev) => [...prev, { ...created, permissionId: firstPermissionId }]);
                setMenuForm(emptyMenuForm);
                setAddingMenu(false);
                showSuccess('Menu created');
            } else {
                showError(res?.message || 'Failed to create menu');
            }
        } catch (e: any) {
            showError(e?.response?.data?.message || 'Failed to create menu');
        } finally {
            setMenuSaving(false);
        }
    };

    const handleStartEdit = (menu: LinkedMenu) => {
        setEditingMenuId(menu.id);
        setEditMenuForm({
            label: menu.label,
            icon: menu.icon || '',
            route: menu.route || '',
            orderIndex: menu.orderIndex,
            isActive: menu.isActive,
        });
    };

    const handleSaveEdit = async (menu: LinkedMenu) => {
        if (!editMenuForm.label.trim()) {
            showError('Menu label is required');
            return;
        }
        setMenuSaving(true);
        try {
            const res = await updateMenuService(menu.id, {
                label: editMenuForm.label.trim(),
                icon: editMenuForm.icon.trim() || undefined,
                route: editMenuForm.route.trim() || undefined,
                orderIndex: editMenuForm.orderIndex,
                isActive: editMenuForm.isActive,
                permissionIds: [menu.permissionId],
            });
            if (res?.success) {
                setLinkedMenus((prev) =>
                    prev.map((m) =>
                        m.id === menu.id
                            ? { ...m, ...editMenuForm, icon: editMenuForm.icon || null, route: editMenuForm.route || null }
                            : m
                    )
                );
                setEditingMenuId(null);
                showSuccess('Menu updated');
            } else {
                showError(res?.message || 'Failed to update menu');
            }
        } catch (e: any) {
            showError(e?.response?.data?.message || 'Failed to update menu');
        } finally {
            setMenuSaving(false);
        }
    };

    const handleDeleteMenu = async (menu: LinkedMenu) => {
        const confirmed = await confirm({
            title: 'Delete menu?',
            message: `Delete menu "${menu.label}"?`,
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;
        try {
            await deleteMenuService(menu.id);
            setLinkedMenus((prev) => prev.filter((m) => m.id !== menu.id));
            showSuccess('Menu deleted');
        } catch (e: any) {
            showError(e?.response?.data?.message || 'Failed to delete menu');
        }
    };

    if (fetching) {
        return (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="none" sx={{ py: 1 }}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="HTTP Method"
                            value={formData.method}
                            onChange={(e) => setFormData((p) => ({ ...p, method: e.target.value }))}
                            required
                            placeholder="e.g. GET, POST, PUT, DELETE"
                        />
                        <TextField
                            fullWidth
                            label="API Path"
                            value={formData.path}
                            onChange={(e) => setFormData((p) => ({ ...p, path: e.target.value }))}
                            required
                            placeholder="e.g. /api/users"
                        />
                        <TextField
                            fullWidth
                            label="Unique Key"
                            value={formData.key}
                            onChange={(e) => setFormData((p) => ({ ...p, key: e.target.value }))}
                            required
                            placeholder="e.g. GET:/api/users"
                            helperText="Used to uniquely identify this endpoint"
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Module</InputLabel>
                            <Select
                                value={formData.moduleId}
                                label="Module"
                                onChange={(e) => setFormData((p) => ({ ...p, moduleId: e.target.value }))}
                                MenuProps={{ PaperProps: { sx: { bgcolor: 'background.paper' } } }}
                            >
                                {modules.map((m) => (
                                    <MenuItem key={m.id} value={m.id} sx={{ color: 'text.primary' }}>
                                        {m.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                                    name="isActive"
                                    color="primary"
                                />
                            }
                            label="Active"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isPublic}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, isPublic: e.target.checked }))
                                    }
                                    name="isPublic"
                                    color="primary"
                                />
                            }
                            label="Public (skip permission & plan validation)"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isLimitAllowed}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, isLimitAllowed: e.target.checked }))
                                    }
                                    name="isLimitAllowed"
                                    color="primary"
                                />
                            }
                            label="Limit allowed"
                        />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button onClick={() => navigate(API_ENDPOINT_PATHS.LIST)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : null}
                            >
                                {isEdit ? 'Update' : 'Create'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>

            {/* ── Linked Menus (edit mode only) ── */}
            {isEdit && (
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Linked Menus</Typography>
                        <Tooltip title="Add Menu">
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => { setAddingMenu(true); setMenuForm(emptyMenuForm); }}
                                disabled={addingMenu}
                            >
                                Add Menu
                            </Button>
                        </Tooltip>
                    </Box>

                    {addingMenu && (
                        <Box sx={{ mb: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>New Menu</Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    label="Label *"
                                    value={menuForm.label}
                                    onChange={(e) => setMenuForm((p) => ({ ...p, label: e.target.value }))}
                                    sx={{ flex: 2, minWidth: 150 }}
                                />
                                <TextField
                                    size="small"
                                    label="Icon"
                                    value={menuForm.icon}
                                    onChange={(e) => setMenuForm((p) => ({ ...p, icon: e.target.value }))}
                                    placeholder="e.g. HomeIcon"
                                    sx={{ flex: 1, minWidth: 120 }}
                                />
                                <TextField
                                    size="small"
                                    label="Route"
                                    value={menuForm.route}
                                    onChange={(e) => setMenuForm((p) => ({ ...p, route: e.target.value }))}
                                    placeholder="e.g. /dashboard"
                                    sx={{ flex: 2, minWidth: 150 }}
                                />
                                <TextField
                                    size="small"
                                    label="Order"
                                    type="number"
                                    value={menuForm.orderIndex}
                                    onChange={(e) => setMenuForm((p) => ({ ...p, orderIndex: parseInt(e.target.value) || 0 }))}
                                    sx={{ width: 80 }}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={menuForm.isActive}
                                            onChange={(e) => setMenuForm((p) => ({ ...p, isActive: e.target.checked }))}
                                        />
                                    }
                                    label="Active"
                                />
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={menuSaving ? <CircularProgress size={14} /> : <SaveIcon />}
                                    onClick={handleAddMenu}
                                    disabled={menuSaving}
                                >
                                    Save
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<CancelIcon />}
                                    onClick={() => setAddingMenu(false)}
                                    disabled={menuSaving}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    )}

                    <Divider sx={{ mb: 1 }} />

                    {linkedMenus.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                            No menus linked to this endpoint yet.
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Label</TableCell>
                                        <TableCell>Icon</TableCell>
                                        <TableCell>Route</TableCell>
                                        <TableCell align="center">Order</TableCell>
                                        <TableCell align="center">Active</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {linkedMenus.map((menu) =>
                                        editingMenuId === menu.id ? (
                                            <TableRow key={menu.id}>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        value={editMenuForm.label}
                                                        onChange={(e) => setEditMenuForm((p) => ({ ...p, label: e.target.value }))}
                                                        sx={{ width: 150 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        value={editMenuForm.icon}
                                                        onChange={(e) => setEditMenuForm((p) => ({ ...p, icon: e.target.value }))}
                                                        sx={{ width: 120 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        value={editMenuForm.route}
                                                        onChange={(e) => setEditMenuForm((p) => ({ ...p, route: e.target.value }))}
                                                        sx={{ width: 150 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={editMenuForm.orderIndex}
                                                        onChange={(e) => setEditMenuForm((p) => ({ ...p, orderIndex: parseInt(e.target.value) || 0 }))}
                                                        sx={{ width: 70 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Switch
                                                        size="small"
                                                        checked={editMenuForm.isActive}
                                                        onChange={(e) => setEditMenuForm((p) => ({ ...p, isActive: e.target.checked }))}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" color="primary" onClick={() => handleSaveEdit(menu)} disabled={menuSaving}>
                                                        {menuSaving ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => setEditingMenuId(null)} disabled={menuSaving}>
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            <TableRow key={menu.id} hover>
                                                <TableCell>{menu.label}</TableCell>
                                                <TableCell>{menu.icon || '—'}</TableCell>
                                                <TableCell>{menu.route || '—'}</TableCell>
                                                <TableCell align="center">{menu.orderIndex}</TableCell>
                                                <TableCell align="center">
                                                    <Switch size="small" checked={menu.isActive} disabled />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" color="primary" onClick={() => handleStartEdit(menu)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteMenu(menu)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default ApiEndpointForm;
