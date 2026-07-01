import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    Paper,
    Divider,
    Stack,
    IconButton,
    Chip,
    Card,
    CardContent,
    Collapse,
    CircularProgress,
    Autocomplete,
    Tab,
    Tabs,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    getModuleService,
    updateModuleService,
    createModuleMenuService,
    getAllPermissionsService,
    deleteApiPermissionMenuSetupService,
    type ModuleData,
    type MenuItemData,
    type ExtraPermissionItem
} from '../../Services/ApiServices/moduleServices';
import {
    getModuleWizardDetailsWizardService,
    getMenusWizardService,
    saveApiPermissionMenuWizardService,
    type SaveApiPermissionMenuRequest,
} from '../../Services/ApiServices/moduleSetupWizardServices';
import {
    buildBatchPayload,
    buildEndpointRowsFromWizardDetails,
    createEmptyEndpointRow,
    validateWizardEndpointRows,
    isEmptyWizardEndpointRow,
    type WizardApiEndpointRow,
} from '../ModuleSetup/moduleWizardShared';
import { ModuleWizardStepApiPermissionMenu } from '../ModuleSetup/ModuleWizardStepApiPermissionMenu';
import { useToast } from '../../Utils/ToastContext';
import { MODULE_PATHS } from '../../Path/modulePaths';
import usePageTitle from '../../hooks/usePageTitle';
import ModuleVisualBuilder from './ModuleVisualBuilder';

// Recursive Menu Entry Component (form / visual builder)
const MenuEntry = ({
    menu,
    onChange,
    onDelete,
    allPermissions
}: {
    menu: MenuItemData,
    onChange: (updatedMenu: MenuItemData) => void,
    onDelete: () => void,
    allPermissions: any[]
}) => {
    const [expanded, setExpanded] = useState(true);
    const [permTab, setPermTab] = useState(menu.permissionId ? 0 : 1);

    const updateField = (field: keyof MenuItemData, value: any) => {
        onChange({ ...menu, [field]: value });
    };

    const addChild = () => {
        const newChild: MenuItemData = {
            label: '',
            route: '',
            permissionId: null,
            apiMethod: 'GET',
            apiRoute: '',
            permissionDescription: '',
            icon: '',
            orderIndex: (menu.children?.length || 0),
            defaultMenu: false,
            children: [] as MenuItemData[]
        };
        onChange({
            ...menu,
            children: [...(menu.children || []), newChild],
        });
    };

    const updateChild = (childIndex: number, updatedChild: MenuItemData) => {
        const newChildren = [...(menu.children || [])];
        newChildren[childIndex] = updatedChild;
        onChange({ ...menu, children: newChildren });
    };

    const deleteChild = (childIndex: number) => {
        const newChildren = (menu.children || []).filter((_, i) => i !== childIndex);
        onChange({ ...menu, children: newChildren });
    };

    const hasChildren = menu.children && menu.children.length > 0;

    return (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ mt: 1 }}>
                    <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                <Stack spacing={1.5} sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <TextField
                            label="Label"
                            value={menu.label}
                            onChange={(e) => updateField('label', e.target.value)}
                            size="small"
                            sx={{ flex: 1, minWidth: 150 }}
                            required
                        />
                        <TextField
                            label="Route"
                            value={menu.route}
                            onChange={(e) => updateField('route', e.target.value)}
                            placeholder="/path"
                            size="small"
                            sx={{ flex: 1, minWidth: 150 }}
                        />
                        <TextField
                            label="Icon (MUI)"
                            value={menu.icon || ''}
                            onChange={(e) => updateField('icon', e.target.value)}
                            placeholder="e.g. Dashboard"
                            size="small"
                            sx={{ flex: 1, minWidth: 150 }}
                        />
                        <TextField
                            label="Order"
                            type="number"
                            value={menu.orderIndex}
                            onChange={(e) => updateField('orderIndex', parseInt(e.target.value) || 0)}
                            size="small"
                            sx={{ width: 80 }}
                        />
                        <IconButton size="small" color="error" onClick={onDelete}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ width: '100%', mt: 0.5, p: 1.5, borderRadius: 1, bgcolor: '#fff', border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Tabs
                                value={permTab}
                                onChange={(_, v) => {
                                    setPermTab(v);
                                    if (v === 0) {
                                        updateField('apiMethod', '');
                                        updateField('apiRoute', '');
                                        updateField('permissionDescription', '');
                                    } else {
                                        updateField('permissionId', null);
                                    }
                                }}
                                sx={{ minHeight: 30 }}
                                TabIndicatorProps={{ sx: { height: 2 } }}
                            >
                                <Tab label="Existing Permission" sx={{ minHeight: 30, py: 0, fontSize: '0.75rem', fontWeight: permTab === 0 ? 'bold' : 'normal' }} />
                                <Tab label="New Permission" sx={{ minHeight: 30, py: 0, fontSize: '0.75rem', fontWeight: permTab === 1 ? 'bold' : 'normal' }} />
                            </Tabs>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                                    <input
                                        type="checkbox"
                                        checked={menu.defaultMenu}
                                        onChange={(e) => updateField('defaultMenu', e.target.checked)}
                                        style={{ marginRight: 6 }}
                                    />
                                    Default
                                </label>
                                <Button
                                    startIcon={<SubdirectoryArrowRightIcon />}
                                    size="small"
                                    onClick={addChild}
                                    sx={{ ml: 2, py: 0 }}
                                >
                                    Add Child
                                </Button>
                            </Box>
                        </Box>

                        {permTab === 0 ? (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Autocomplete
                                    options={allPermissions || []}
                                    getOptionLabel={(option) => `${option.description || ''} (${option.module || 'Unknown'}: ${option.apiMethod} ${option.apiRoute})`}
                                    value={(allPermissions || []).find(p => p.id === menu.permissionId) || null}
                                    onChange={(_, val) => {
                                        updateField('permissionId', val ? val.id : null);
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Search Existing Permission" size="small" />}
                                    size="small"
                                    sx={{ flex: 1 }}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                <TextField
                                    label="Description"
                                    value={menu.permissionDescription || ''}
                                    onChange={(e) => updateField('permissionDescription', e.target.value)}
                                    placeholder="e.g. Manage Fabrics"
                                    size="small"
                                    sx={{ flex: 1, minWidth: 150 }}
                                />
                                <TextField
                                    label="Method"
                                    select
                                    value={menu.apiMethod || 'GET'}
                                    onChange={(e) => updateField('apiMethod', e.target.value)}
                                    size="small"
                                    sx={{ width: 100 }}
                                >
                                    <MenuItem value="GET">GET</MenuItem>
                                    <MenuItem value="POST">POST</MenuItem>
                                    <MenuItem value="PUT">PUT</MenuItem>
                                    <MenuItem value="DELETE">DELETE</MenuItem>
                                </TextField>
                                <TextField
                                    label="API Route"
                                    value={menu.apiRoute || ''}
                                    onChange={(e) => updateField('apiRoute', e.target.value)}
                                    placeholder="/api/..."
                                    size="small"
                                    sx={{ flex: 1, minWidth: 150 }}
                                />
                            </Box>
                        )}
                    </Box>
                </Stack>
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                {hasChildren && (
                    <Box sx={{ mt: 2, pl: 4, borderLeft: '2px dashed #e0e0e0' }}>
                        <Stack spacing={2}>
                            {(menu.children || []).map((child, i) => (
                                <MenuEntry
                                    key={i}
                                    menu={child}
                                    onChange={(updated) => updateChild(i, updated)}
                                    onDelete={() => deleteChild(i)}
                                    allPermissions={allPermissions}
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
            </Collapse>
        </Paper>
    );
};

const ModuleEdit = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const bulkIds = useMemo(() => {
        const raw = searchParams.get('ids');
        if (!raw) return [];
        return raw.split(',').map(s => s.trim()).filter(Boolean);
    }, [searchParams]);
    const isBulkEdit = bulkIds.length > 1;
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // State for a SINGLE module
    const [module, setModule] = useState<ModuleData>({
        name: '',
        description: '',
        extraPermissions: [],
        menus: []
    });

    const [viewMode, setViewMode] = useState<'form' | 'visual' | 'json' | 'apiWizard'>('apiWizard');
    const [wizardJsonText, setWizardJsonText] = useState('');
    const [newPermission, setNewPermission] = useState({ apiMethod: 'GET', apiRoute: '', description: '' });
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [extraPermissionTab, setExtraPermissionTab] = useState(0);

    const useApi = useMemo(() => String(import.meta.env.VITE_USE_API ?? '').trim() === 'true', []);

    const [wizardApiList, setWizardApiList] = useState<{ id: string; method: string; path: string; key?: string }[]>([]);
    const [wizardMenuList, setWizardMenuList] = useState<{ id: string; label: string }[]>([]);
    const [wizardParentMenuList, setWizardParentMenuList] = useState<{ id: string; label: string }[]>([]);
    const [endpointRows, setEndpointRows] = useState<WizardApiEndpointRow[]>(() => [createEmptyEndpointRow()]);
    const [wizardDeleteLoading, setWizardDeleteLoading] = useState(false);

    // Bulk edit: per-module wizard state, keyed by moduleId.
    type BulkModuleState = {
        moduleId: string;
        moduleName: string;
        endpointRows: WizardApiEndpointRow[];
        apiList: { id: string; method: string; path: string; key?: string }[];
        menuList: { id: string; label: string }[];
        parentMenuList: { id: string; label: string }[];
    };
    const [bulkModules, setBulkModules] = useState<BulkModuleState[]>([]);
    const [bulkViewMode, setBulkViewMode] = useState<'ui' | 'json'>('ui');

    const reloadModuleWizardDetails = useCallback(async () => {
        if (!id || !useApi) return;
        try {
            const [res, menusRes] = await Promise.all([
                getModuleWizardDetailsWizardService(id),
                getMenusWizardService(),
            ]);
            const d = res.data;
            if (!d || d.module.id !== id) return;
            setWizardApiList(d.apiEndpoints ?? []);
            setWizardMenuList(d.menus ?? []);
            setWizardParentMenuList(menusRes.data ?? []);
            setEndpointRows(buildEndpointRowsFromWizardDetails(d));
        } catch {
            showError('Failed to load API and permission setup data', 'Error');
        }
    }, [id, useApi, showError]);

    // Deletion tracking
    const [deletedMenuIds, setDeletedMenuIds] = useState<string[]>([]);
    const [deletedPermissionIds, setDeletedPermissionIds] = useState<string[]>([]);

    const [filterModule, setFilterModule] = useState('');

    const handleViewModeChange = (newMode: 'apiWizard' | 'json') => {
        if (viewMode === 'apiWizard' && newMode === 'json') {
            setWizardJsonText(JSON.stringify(
                buildBatchPayload(endpointRows, id || ''),
                null,
                4
            ));
            setViewMode(newMode);
        } else if (viewMode === 'json' && newMode === 'apiWizard') {
            try {
                const parsed = JSON.parse(wizardJsonText);
                const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : null;
                if (items) {
                    const newRows = items.map((item: any) => {
                        const row = createEmptyEndpointRow();
                        row.method = item.method || 'GET';
                        row.path = item.path || '';
                        row.key = item.key || '';
                        row.isLimitAllowed = item.isLimitAllowed ?? true;
                        row.apiId = item.apiId || '';
                        row.apiSourceMode = row.apiId ? 'select' : 'create';

                        row.permissionDescription = item.permissionDescription || '';

                        row.menuMode = item.menuMode || 'skip';
                        row.menuId = item.existingMenuId || '';
                        row.menuLabel = item.menuLabel || '';
                        row.menuRoute = item.menuRoute || '';
                        row.menuIcon = item.menuIcon || '';
                        row.menuParentId = item.menuParentId || '';
                        return row;
                    });
                    setEndpointRows(newRows);
                }
                setViewMode(newMode);
            } catch (e: any) {
                showError('Invalid JSON format: ' + e.message, 'Error');
            }
        }
    };

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await getAllPermissionsService();
                if (res?.data) setAllPermissions(res.data);
            } catch (err) {
                console.error("Failed to fetch all permissions", err);
            }
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        if (isBulkEdit) {
            setFetching(false);
            return;
        }
        if (id) {
            fetchModuleData(id);
        }
    }, [id, isBulkEdit]);

    const fetchModuleData = async (moduleId: string, opts?: { quiet?: boolean }): Promise<ModuleData | null> => {
        const quiet = opts?.quiet === true;
        if (!quiet) setFetching(true);
        try {
            const response = await getModuleService(moduleId);
            if (response && response.data) {
                const d = response.data;
                const normalized: ModuleData = {
                    ...d,
                    extraPermissions: Array.isArray(d.extraPermissions)
                        ? (d.extraPermissions as ExtraPermissionItem[]).map((p) =>
                            typeof p === 'string' ? { id: '', display: p } : { id: p.id, display: p.display }
                        )
                        : [],
                };
                setModule(normalized);
                if (!quiet) {
                    setDeletedMenuIds([]);
                    setDeletedPermissionIds([]);
                }
                return normalized;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch module', error);
            if (!quiet) {
                showError('Failed to fetch module details', 'Error');
                navigate(MODULE_PATHS.LIST);
            }
            return null;
        } finally {
            if (!quiet) setFetching(false);
        }
    };

    useEffect(() => {
        if (isBulkEdit || viewMode !== 'apiWizard' || !id) return;
        if (!useApi) {
            setEndpointRows([createEmptyEndpointRow()]);
            return;
        }
        void reloadModuleWizardDetails();
    }, [viewMode, id, useApi, reloadModuleWizardDetails, isBulkEdit]);

    // Bulk edit: load every selected module's API/permission/menu setup into per-module UI state + combined JSON.
    useEffect(() => {
        if (!isBulkEdit) return;
        if (!useApi) {
            setWizardJsonText('[]');
            setViewMode('json');
            return;
        }
        const loadBulk = async () => {
            try {
                const menusRes = await getMenusWizardService();
                const parentMenuList = menusRes.data ?? [];

                const results = await Promise.all(
                    bulkIds.map(async (moduleId): Promise<BulkModuleState | null> => {
                        const res = await getModuleWizardDetailsWizardService(moduleId);
                        const d = res.data;
                        if (!d || d.module.id !== moduleId) return null;
                        return {
                            moduleId,
                            moduleName: d.module.name || moduleId,
                            endpointRows: buildEndpointRowsFromWizardDetails(d),
                            apiList: d.apiEndpoints ?? [],
                            menuList: d.menus ?? [],
                            parentMenuList,
                        };
                    })
                );
                const validModules = results.filter((r): r is BulkModuleState => r !== null);
                setBulkModules(validModules);

                const combined = validModules.flatMap((m) => buildBatchPayload(m.endpointRows, m.moduleId));
                setWizardJsonText(JSON.stringify(combined, null, 4));
                setViewMode('json');
            } catch {
                showError('Failed to load API and permission setup data for selected modules', 'Error');
            }
        };
        void loadBulk();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBulkEdit, useApi]);

    const patchEndpointRow = (clientId: string, patch: Partial<WizardApiEndpointRow>) => {
        setEndpointRows((rows) =>
            rows.map((r) => {
                if (r.clientId !== clientId) return r;
                return { ...r, ...patch };
            })
        );
    };

    const addWizardEndpointRow = () => {
        setEndpointRows((rows) => [createEmptyEndpointRow(), ...rows]);
    };

    const removeWizardEndpointRow = (clientId: string) => {
        setEndpointRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.clientId !== clientId)));
    };

    // Bulk edit: per-module row handlers.
    const patchBulkEndpointRow = (moduleId: string, clientId: string, patch: Partial<WizardApiEndpointRow>) => {
        setBulkModules((mods) =>
            mods.map((m) => {
                if (m.moduleId !== moduleId) return m;
                return {
                    ...m,
                    endpointRows: m.endpointRows.map((r) => {
                        if (r.clientId !== clientId) return r;
                        return { ...r, ...patch };
                    }),
                };
            })
        );
    };

    const addBulkEndpointRow = (moduleId: string) => {
        setBulkModules((mods) =>
            mods.map((m) => (m.moduleId === moduleId ? { ...m, endpointRows: [createEmptyEndpointRow(), ...m.endpointRows] } : m))
        );
    };

    const removeBulkEndpointRow = (moduleId: string, clientId: string) => {
        setBulkModules((mods) =>
            mods.map((m) => {
                if (m.moduleId !== moduleId) return m;
                if (m.endpointRows.length <= 1) return m;
                return { ...m, endpointRows: m.endpointRows.filter((r) => r.clientId !== clientId) };
            })
        );
    };

    // Sync between bulk UI rows and the combined JSON payload.
    const handleBulkViewModeChange = (newMode: 'ui' | 'json') => {
        if (bulkViewMode === 'ui' && newMode === 'json') {
            const combined = bulkModules.flatMap((m) => buildBatchPayload(m.endpointRows, m.moduleId));
            setWizardJsonText(JSON.stringify(combined, null, 4));
            setBulkViewMode(newMode);
        } else if (bulkViewMode === 'json' && newMode === 'ui') {
            try {
                const parsed = JSON.parse(wizardJsonText);
                if (!Array.isArray(parsed)) {
                    showError('JSON payload must be an array', 'Error');
                    return;
                }
                const byModule = new Map<string, any[]>();
                for (const item of parsed) {
                    const mid = item?.moduleId;
                    if (!mid) continue;
                    if (!byModule.has(mid)) byModule.set(mid, []);
                    byModule.get(mid)!.push(item);
                }
                setBulkModules((mods) =>
                    mods.map((m) => {
                        const items = byModule.get(m.moduleId) || [];
                        const newRows = items.map((item: any) => {
                            const row = createEmptyEndpointRow();
                            row.method = item.method || 'GET';
                            row.path = item.path || '';
                            row.key = item.key || '';
                            row.isLimitAllowed = item.isLimitAllowed ?? true;
                            row.apiId = item.apiId || '';
                            row.apiSourceMode = row.apiId ? 'select' : 'create';

                            row.permissionDescription = item.permissionDescription || '';

                            row.menuMode = item.menuMode || 'skip';
                            row.menuId = item.existingMenuId || '';
                            row.menuLabel = item.menuLabel || '';
                            row.menuRoute = item.menuRoute || '';
                            row.menuIcon = item.menuIcon || '';
                            row.menuParentId = item.menuParentId || '';
                            return row;
                        });
                        return { ...m, endpointRows: newRows.length > 0 ? newRows : [createEmptyEndpointRow()] };
                    })
                );
                setBulkViewMode(newMode);
            } catch (e: any) {
                showError('Invalid JSON format: ' + e.message, 'Error');
            }
        }
    };

    const handleDeletePersistedApiSetup = async (apiEndpointId: string) => {
        setWizardDeleteLoading(true);
        try {
            await deleteApiPermissionMenuSetupService(apiEndpointId);
            showSuccess('API endpoint and linked setup removed from the server', 'Success');
            await reloadModuleWizardDetails();
        } catch (error: unknown) {
            const e = error as { response?: { data?: { message?: string } }; message?: string };
            showError(e.response?.data?.message || e.message || 'Failed to delete API setup', 'Error');
            throw error;
        } finally {
            setWizardDeleteLoading(false);
        }
    };

    const handleFinishApiWizardSetup = async () => {
        if (!isBulkEdit && !id) return;

        let payloadToSave: SaveApiPermissionMenuRequest[];
        if (isBulkEdit && bulkViewMode === 'ui') {
            payloadToSave = [];
            for (const m of bulkModules) {
                const validRows = m.endpointRows.filter(row => !isEmptyWizardEndpointRow(row));
                const validationError = validateWizardEndpointRows(validRows);
                if (validationError) {
                    showError(`${m.moduleName}: ${validationError}`, 'Validation Error');
                    return;
                }
                payloadToSave.push(...buildBatchPayload(validRows, m.moduleId));
            }
        } else if (viewMode === 'json') {
            try {
                payloadToSave = JSON.parse(wizardJsonText);
            } catch (e: any) {
                showError('Invalid JSON format in Wizard Payload: ' + e.message, 'Validation Error');
                return;
            }
        } else {
            const validRows = endpointRows.filter(row => !isEmptyWizardEndpointRow(row));
            const validationError = validateWizardEndpointRows(validRows);
            if (validationError) {
                showError(validationError, 'Validation Error');
                return;
            }
            payloadToSave = buildBatchPayload(validRows, id!);
        }

        setLoading(true);
        try {
            if (useApi && Array.isArray(payloadToSave) && payloadToSave.length > 0) {
                await saveApiPermissionMenuWizardService(payloadToSave);
            }

            if (isBulkEdit) {
                showSuccess('API setup saved for selected modules successfully!', 'Success');
                navigate(MODULE_PATHS.LIST);
                return;
            }

            showSuccess('API setup saved successfully!', 'Success');
            navigate(MODULE_PATHS.LIST);
        } catch (error: unknown) {
            const e = error as { response?: { data?: { message?: string } }; message?: string };
            showError(e.response?.data?.message || e.message || 'Failed to update module', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const updateModuleField = (field: keyof ModuleData, value: any) => {
        setModule(prev => ({ ...prev, [field]: value }));
    };

    const addMenu = async () => {
        if (!id) {
            const newMenu: MenuItemData = {
                label: '',
                route: '',
                permissionId: null,
                apiMethod: 'GET',
                apiRoute: '',
                permissionDescription: '',
                icon: '',
                orderIndex: module.menus.length,
                defaultMenu: false,
                children: []
            };
            setModule(prev => ({ ...prev, menus: [...prev.menus, newMenu] }));
            return;
        }
        setLoading(true);
        try {
            await createModuleMenuService(id, {
                label: 'New Menu',
                route: '',
                orderIndex: module.menus.length,
                defaultMenu: false
            });
            showSuccess('Menu created', 'Success');
            await fetchModuleData(id);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to create menu', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const updateMenu = (index: number, updatedMenu: MenuItemData) => {
        const updatedMenus = [...module.menus];
        updatedMenus[index] = updatedMenu;
        setModule(prev => ({ ...prev, menus: updatedMenus }));
    };

    const removeMenu = async (index: number) => {
        const menu = module.menus[index];
        if (id && menu.menuId) {
            // Track for deletion in bulk update instead of immediate delete
            setDeletedMenuIds(prev => [...prev, menu.menuId!]);
        }
        const updatedMenus = module.menus.filter((_, i) => i !== index);
        setModule(prev => ({ ...prev, menus: updatedMenus }));
    };

    const addExtraPermission = async (permissionId: string, display: string) => {
        if (!permissionId) return;
        if (module.extraPermissions.some((p) => p.id === permissionId)) return;
        setModule(prev => ({
            ...prev,
            extraPermissions: [...prev.extraPermissions, { id: permissionId, display }]
        }));
    };

    const fetchPermissions = useCallback(async (mod?: string, target?: 'module' | 'extra') => {
        try {
            const res = await getAllPermissionsService(mod);
            if (res?.data) {
                setAllPermissions(res.data);
                if (mod && res.data.length === 1 && target) {
                    const val = res.data[0];
                    if (target === 'module') {
                        setModule(prev => ({
                            ...prev,
                            permissionId: val.id,
                            permissionDisplay: val.description || val.id,
                            apiMethod: val.apiMethod,
                            apiRoute: val.apiRoute
                        }));
                    } else if (target === 'extra') {
                        addExtraPermission(val.id, val.description || val.id);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch all permissions", err);
        }
    }, [addExtraPermission]);

    const addExtraPermissionFromCreate = async () => {
        if (!newPermission.apiRoute) {
            showError("API Route is required", "Validation Error");
            return;
        }

        const display = newPermission.description || `${module.name} ${newPermission.apiMethod} ${newPermission.apiRoute}`;

        // Add permission locally
        setModule(prev => ({
            ...prev,
            extraPermissions: [...prev.extraPermissions, { ...newPermission, id: `new-${Date.now()}`, display } as any]
        }));
        setNewPermission({ apiMethod: 'GET', apiRoute: '', description: '' });
        showSuccess('Permission added to module config locally. Press update to persist!', 'Success');
    };

    const removeExtraPermission = async (perm: ExtraPermissionItem) => {
        if (id && perm.id) {
            // Track for deletion/removal
            setDeletedPermissionIds(prev => [...prev, perm.id]);
        }
        setModule(prev => ({
            ...prev,
            extraPermissions: prev.extraPermissions.filter((p) => p.id !== perm.id)
        }));
    };

    // Helper to validate menu recursively
    const validateMenu = (menu: MenuItemData, path: string): string | null => {
        if (!menu.label) return `Menu at ${path} is missing a label`;

        const hasChildren = menu.children && menu.children.length > 0;
        if (!hasChildren && !menu.permissionId && !menu.apiRoute) {
            return `Leaf menu "${menu.label}" (at ${path}) must have a permission`;
        }

        if (menu.children) {
            for (let i = 0; i < menu.children.length; i++) {
                const error = validateMenu(menu.children[i], `${path} > ${menu.children[i].label || 'Unnamed'}`);
                if (error) return error;
            }
        }
        return null;
    };

    const getFormattedPayload = (updatedModule: ModuleData) => {
        const payload: any = {
            ...updatedModule,
            deleteMenus: deletedMenuIds,
            removePermissions: deletedPermissionIds
        };

        const formattedExtraPerms = (payload.extraPermissions || []).map((p: any) => {
            if (p.id && !p.id.startsWith('new-')) return { permissionId: p.id };
            return {
                apiMethod: p.apiMethod || 'GET',
                apiRoute: p.apiRoute,
                description: p.description || p.display
            };
        });

        delete payload.extraPermissions;
        delete payload.menus;

        const formattedMenus = (updatedModule.menus || []).map(menu => {
            const mappedMenu: any = { ...menu };
            if (!mappedMenu.permissionId && (mappedMenu.apiMethod || mappedMenu.apiRoute)) {
                mappedMenu.permission = {
                    apiMethod: mappedMenu.apiMethod,
                    apiRoute: mappedMenu.apiRoute,
                    description: mappedMenu.permissionDescription || mappedMenu.label
                };
            }
            delete mappedMenu.apiMethod;
            delete mappedMenu.apiRoute;
            delete mappedMenu.permissionDescription;
            delete mappedMenu.permissionDisplay;
            return mappedMenu;
        });

        return {
            module: payload,
            extraPermissions: formattedExtraPerms,
            menus: formattedMenus
        };
    };

    const headerActions = (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
            {!isBulkEdit && (
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, val) => {
                        if (val) handleViewModeChange(val);
                    }}
                    size="small"
                    sx={{ mr: 2 }}
                >
                    <ToggleButton value="apiWizard">UI Setup</ToggleButton>
                    <ToggleButton value="json">JSON View</ToggleButton>
                </ToggleButtonGroup>
            )}
            {isBulkEdit && (
                <ToggleButtonGroup
                    value={bulkViewMode}
                    exclusive
                    onChange={(_, val) => {
                        if (val) handleBulkViewModeChange(val);
                    }}
                    size="small"
                    sx={{ mr: 2 }}
                >
                    <ToggleButton value="ui">UI Setup</ToggleButton>
                    <ToggleButton value="json">JSON View</ToggleButton>
                </ToggleButtonGroup>
            )}
            {!isBulkEdit && viewMode === 'apiWizard' && (
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addWizardEndpointRow}
                    disabled={wizardDeleteLoading}
                    sx={{ textTransform: 'none' }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                        Add API endpoint
                    </Box>
                </Button>
            )}
            <Button
                variant="outlined"
                onClick={() => navigate(MODULE_PATHS.LIST)}
                disabled={loading || wizardDeleteLoading}
            >
                Cancel
            </Button>
            <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleFinishApiWizardSetup}
                disabled={loading || wizardDeleteLoading}
                sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
            >
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                    {loading ? 'Updating…' : isBulkEdit ? 'Update Modules' : 'Update Module'}
                </Box>
            </Button>
        </Stack>
    );

    const handleSubmit = async (updatedModule: ModuleData = module) => {
        if (!updatedModule.name.trim()) {
            showError('Module name is required', 'Validation Error');
            return;
        }

        setLoading(true);
        try {
            if (id) {
                const finalPayload = getFormattedPayload(updatedModule);
                await updateModuleService(id, finalPayload);
                showSuccess('Module updated successfully!', 'Success');
                navigate(MODULE_PATHS.LIST);
            }
        } catch (error: any) {
            console.error('Failed to update module', error);
            showError(error.response?.data?.message || 'Failed to update module', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const moduleEditTitle = isBulkEdit
        ? `Bulk Edit Modules (${bulkIds.length})`
        : module.name ? `Edit Module — ${module.name}` : 'Edit Module';

    usePageTitle(moduleEditTitle, headerActions, undefined, [endpointRows, viewMode, wizardJsonText, loading, module.name, isBulkEdit, bulkViewMode, bulkModules]);

    if (fetching) {
        return (
            <Container maxWidth={false} sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <>

            {isBulkEdit && bulkModules.length === 0 && useApi && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                    <CircularProgress />
                </Box>
            )}

            {isBulkEdit && bulkModules.length > 0 && bulkViewMode === 'ui' && (
                <Stack spacing={2}>
                    {bulkModules.map((m) => (
                        <Paper key={m.moduleId} elevation={2} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                                {m.moduleName}
                            </Typography>
                            <ModuleWizardStepApiPermissionMenu
                                moduleId={m.moduleId}
                                endpointRows={m.endpointRows}
                                patchEndpointRow={(clientId, patch) => patchBulkEndpointRow(m.moduleId, clientId, patch)}
                                addEndpointRow={() => addBulkEndpointRow(m.moduleId)}
                                removeEndpointRow={(clientId) => removeBulkEndpointRow(m.moduleId, clientId)}
                                apiList={m.apiList}
                                menuList={m.menuList}
                                parentMenuList={m.parentMenuList}
                            />
                        </Paper>
                    ))}
                </Stack>
            )}

            {!isBulkEdit && viewMode === 'apiWizard' && (
                <Paper elevation={2} sx={{ p: 2 }}>
                    {!useApi && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            VITE_USE_API is not enabled. Update Module will reload the module and call PUT update only
                            (no batch API row save).
                        </Typography>
                    )}
                    <ModuleWizardStepApiPermissionMenu
                        moduleId={id ?? ''}
                        endpointRows={endpointRows}
                        patchEndpointRow={patchEndpointRow}
                        addEndpointRow={addWizardEndpointRow}
                        removeEndpointRow={removeWizardEndpointRow}
                        apiList={wizardApiList}
                        menuList={wizardMenuList}
                        parentMenuList={wizardParentMenuList}
                        onDeletePersistedSetup={useApi ? handleDeletePersistedApiSetup : undefined}
                        persistedDeletePending={wizardDeleteLoading}
                    />
                </Paper>
            )}

            {((!isBulkEdit && viewMode === 'json') || (isBulkEdit && (bulkViewMode === 'json' || (!useApi && bulkModules.length === 0 && bulkIds.length > 0)))) && (
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                            Wizard API Payload (Editable JSON)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {isBulkEdit
                                ? `Edit the combined API setup configuration for ${bulkIds.length} selected modules. Each entry includes its own "moduleId".`
                                : 'Edit the API setup configuration directly. Changes will sync to the UI when you toggle back.'}
                        </Typography>
                        <TextField
                            multiline
                            fullWidth
                            rows={25}
                            value={wizardJsonText}
                            onChange={(e) => setWizardJsonText(e.target.value)}
                            sx={{ fontFamily: 'monospace', mt: 1, backgroundColor: '#f9f9f9' }}
                        />
                    </Box>
                </Paper>
            )}

            {!isBulkEdit && viewMode === 'visual' && (
                <ModuleVisualBuilder
                    module={module}
                    onSave={() => navigate(MODULE_PATHS.LIST)}
                    onCancel={() => navigate(MODULE_PATHS.LIST)}
                    isEdit={true}
                    moduleId={id}
                    refetchModule={
                        id
                            ? async (): Promise<void> => {
                                await fetchModuleData(id);
                            }
                            : undefined
                    }
                />
            )}

            {!isBulkEdit && viewMode === 'form' && (
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                    <Box sx={{ flex: 1 }}>
                        <Card elevation={2}>
                            <CardContent>
                                <Stack spacing={3}>
                                    {/* Module Basic Info */}
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <TextField
                                            label="Name"
                                            value={module.name}
                                            onChange={(e) => updateModuleField('name', e.target.value)}
                                            placeholder="e.g., users, orders"
                                            size="small"
                                            sx={{ flex: 1, minWidth: 200 }}
                                            required
                                            disabled // Usually name is unique and read-only in edit
                                            helperText="Identifier cannot be changed"
                                        />
                                        <TextField
                                            label="Description"
                                            value={module.description}
                                            onChange={(e) => updateModuleField('description', e.target.value)}
                                            placeholder="e.g., User Management"
                                            size="small"
                                            sx={{ flex: 1, minWidth: 200 }}
                                        />
                                    </Box>

                                    {/* Extra Permissions */}
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Extra Permissions (without menu items)
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                            {module.extraPermissions.map((perm, idx) => (
                                                <Chip
                                                    key={perm.id || idx}
                                                    label={perm.display}
                                                    onDelete={() => removeExtraPermission(perm)}
                                                    size="small"
                                                    color="secondary"
                                                />
                                            ))}
                                            {module.extraPermissions.length === 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    No extra permissions
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box sx={{ mt: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid #eee', p: 0 }}>
                                            <Tabs
                                                value={extraPermissionTab}
                                                onChange={(_, v) => setExtraPermissionTab(v)}
                                                variant="fullWidth"
                                                sx={{ minHeight: 40, bgcolor: '#f8f9fa' }}
                                            >
                                                <Tab label="Find Existing" sx={{ minHeight: 40, fontSize: '12px' }} />
                                                <Tab label="Create New" sx={{ minHeight: 40, fontSize: '12px' }} />
                                            </Tabs>

                                            <Box sx={{ p: 2 }}>
                                                {extraPermissionTab === 0 ? (
                                                    <Stack spacing={2}>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <TextField
                                                                label="Filter by Module"
                                                                size="small"
                                                                fullWidth
                                                                value={filterModule}
                                                                onChange={(e) => setFilterModule(e.target.value)}
                                                                placeholder="e.g. users"
                                                                onKeyDown={(e) => e.key === 'Enter' && fetchPermissions(filterModule, 'extra')}
                                                            />
                                                            <Button variant="outlined" size="small" onClick={() => fetchPermissions(filterModule, 'extra')}>
                                                                Fetch
                                                            </Button>
                                                        </Box>
                                                        <Autocomplete
                                                            options={allPermissions}
                                                            getOptionLabel={(option) =>
                                                                `${option.description || ''} (${option.module}: ${option.apiMethod} ${option.apiRoute})`
                                                            }
                                                            onChange={(_, val) => val && addExtraPermission(val.id, val.description || val.id)}
                                                            renderInput={(params) => (
                                                                <TextField {...params} label="Search Existing Permissions" size="small" />
                                                            )}
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </Stack>
                                                ) : (
                                                    <Stack spacing={1.5}>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <TextField
                                                                label="Method"
                                                                select
                                                                size="small"
                                                                sx={{ minWidth: '10%' }}
                                                                value={newPermission.apiMethod}
                                                                onChange={(e) => setNewPermission({ ...newPermission, apiMethod: e.target.value })}
                                                            >
                                                                <MenuItem value="GET">GET</MenuItem>
                                                                <MenuItem value="POST">POST</MenuItem>
                                                                <MenuItem value="PUT">PUT</MenuItem>
                                                                <MenuItem value="DELETE">DELETE</MenuItem>
                                                            </TextField>
                                                            <TextField
                                                                label="API Route"
                                                                fullWidth
                                                                size="small"
                                                                placeholder="/api/..."
                                                                value={newPermission.apiRoute}
                                                                onChange={(e) => setNewPermission({ ...newPermission, apiRoute: e.target.value })}
                                                            />
                                                            <TextField
                                                                label="Description"
                                                                fullWidth
                                                                size="small"
                                                                placeholder="e.g., Export Data"
                                                                value={newPermission.description}
                                                                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                                                            />
                                                        </Box>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<AddIcon />}
                                                            onClick={addExtraPermissionFromCreate}
                                                            disabled={loading}
                                                            fullWidth
                                                        >
                                                            Add Extra Permission
                                                        </Button>
                                                    </Stack>
                                                )}
                                            </Box>
                                        </Box>

                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                            Extra permissions are not linked to any menu item but managed within this module.
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    {/* Menus */}
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                Menu Items
                                            </Typography>
                                            <Button size="small" startIcon={<AddIcon />} onClick={addMenu} variant="outlined">
                                                Add Top Level Menu
                                            </Button>
                                        </Box>

                                        <Stack spacing={2}>
                                            {module.menus.map((menu, menuIndex) => (
                                                <MenuEntry
                                                    key={menuIndex}
                                                    menu={menu}
                                                    onChange={(updated) => updateMenu(menuIndex, updated)}
                                                    onDelete={() => removeMenu(menuIndex)}
                                                    allPermissions={allPermissions}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>

                                    {/* Action Buttons */}
                                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button variant="outlined" onClick={() => navigate(MODULE_PATHS.LIST)} disabled={loading}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            onClick={() => handleSubmit()}
                                            disabled={loading}
                                            sx={{
                                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                            }}
                                        >
                                            {loading ? 'Updating...' : 'Update Module'}
                                        </Button>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}
        </>
    );
};

export default ModuleEdit;