import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Panel,
    applyEdgeChanges,
    applyNodeChanges,
    addEdge,
    type Node,
    type Edge,
    type Connection,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    Drawer,
    Divider,
    IconButton,
    Stack,
    MenuItem,
    Chip,
    Autocomplete,
    CircularProgress,
    Tab,
    Tabs
} from '@mui/material';
import { Save, Add, Delete, Close, SubdirectoryArrowRight } from '@mui/icons-material';
import MenuNode from './components/MenuNode';
import {
    createBulkModulesService,
    updateModuleService,
    createModuleMenuService,
    getAllPermissionsService,
    type ModuleData,
    type MenuItemData
} from '../../Services/ApiServices/moduleServices';
import { useToast } from '../../Utils/ToastContext';

const nodeTypes = {
    menuNode: MenuNode,
};

interface ModuleVisualBuilderProps {
    module: ModuleData;
    onSave: (updatedModule: ModuleData) => void;
    onCancel: () => void;
    isEdit?: boolean;
    moduleId?: string;
    /** When in edit mode, call after create/delete menu or permission to refetch module */
    refetchModule?: () => Promise<void>;
}

const ModuleVisualBuilder = ({
    module: initialModule,
    onSave,
    onCancel,
    isEdit = false,
    moduleId,
    refetchModule
}: ModuleVisualBuilderProps) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [moduleInfo, setModuleInfo] = useState({
        name: initialModule.name || '',
        description: initialModule.description || '',
        extraPermissions: [...(initialModule.extraPermissions || [])].map((p) =>
            typeof p === 'string' ? { id: '', display: p } : { id: p.id, display: p.display }
        )
    });

    const [deletedMenuIds, setDeletedMenuIds] = useState<string[]>([]);
    const [deletedPermissionIds, setDeletedPermissionIds] = useState<string[]>([]);

    const [newPermission, setNewPermission] = useState({
        apiMethod: 'GET',
        apiRoute: '',
        description: ''
    });

    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [permissionTab, setPermissionTab] = useState(0); // 0 for Find, 1 for Create
    const [newPermissionTab, setNewPermissionTab] = useState(0); // 0 for Find, 1 for Create (extra perms)
    const [filterModule, setFilterModule] = useState('');

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

    // Helper: Map Tree to Nodes/Edges
    const mapTreeToFlow = useCallback((module: ModuleData) => {
        const flowNodes: Node[] = [];
        const flowEdges: Edge[] = [];

        // Root Module Node
        const rootId = 'root';
        flowNodes.push({
            id: rootId,
            type: 'menuNode',
            position: { x: 400, y: 50 },
            data: {
                label: module.description || module.name || 'Root Element',
                isModule: true,
                route: '',
                permissionId: null,
                permissionDisplay: '',
                apiMethod: 'GET',
                apiRoute: ''
            },
        });

        const processMenus = (menus: MenuItemData[], parentId: string, level: number) => {
            menus.forEach((menu, index) => {
                const nodeId = menu.menuId || `${parentId}-${index}-${Date.now()}`;
                const xPos = 400 + (index - (menus.length - 1) / 2) * 250;
                const yPos = 50 + (level + 1) * 150;

                flowNodes.push({
                    id: nodeId,
                    type: 'menuNode',
                    position: { x: xPos, y: yPos },
                    data: { ...menu, isModule: false, menuId: menu.menuId },
                });

                flowEdges.push({
                    id: `e-${parentId}-${nodeId}`,
                    source: parentId,
                    target: nodeId,
                    animated: true,
                });

                if (menu.children && menu.children.length > 0) {
                    processMenus(menu.children, nodeId, level + 1);
                }
            });
        };

        if (module.menus) {
            processMenus(module.menus, rootId, 0);
        }

        setNodes(flowNodes);
        setEdges(flowEdges);
    }, []);

    useEffect(() => {
        mapTreeToFlow(initialModule);
    }, [initialModule, mapTreeToFlow]);

    useEffect(() => {
        setModuleInfo({
            name: initialModule.name || '',
            description: initialModule.description || '',
            extraPermissions: [...(initialModule.extraPermissions || [])].map((p) =>
                typeof p === 'string' ? { id: '', display: p } : { id: p.id, display: p.display }
            )
        });
        setDeletedMenuIds([]);
        setDeletedPermissionIds([]);
    }, [initialModule]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect: OnConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        []
    );

    const onNodeClick = (_: any, node: Node) => setSelectedElement(node);
    const onEdgeClick = (_: any, edge: Edge) => setSelectedElement(edge);

    const updateSelectedNode = (field: string, value: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedElement.id) {
                    return {
                        ...node,
                        data: { ...node.data, [field]: value },
                    };
                }
                return node;
            })
        );
        setSelectedElement((prev: any) => {
            if (!prev) return prev;
            return { ...prev, data: { ...prev.data, [field]: value } };
        });
    };

    const fetchPermissions = useCallback(async (mod?: string, target?: 'module' | 'extra') => {
        try {
            const res = await getAllPermissionsService(mod);
            if (res?.data) {
                setAllPermissions(res.data);
                if (mod && res.data.length === 1 && selectedElement && target) {
                    const val = res.data[0];
                    if (target === 'module') {
                        if (selectedElement.id === 'root') {
                            setModuleInfo(prev => ({
                                ...prev,
                                permissionId: val.id,
                                permissionDisplay: val.description || val.id,
                                apiMethod: val.apiMethod,
                                apiRoute: val.apiRoute
                            }));
                        }
                        updateSelectedNode('permissionId', val.id);
                        updateSelectedNode('permissionDisplay', val.description || val.id);
                        updateSelectedNode('apiMethod', val.apiMethod);
                        updateSelectedNode('apiRoute', val.apiRoute);
                    } else if (target === 'extra') {
                        setModuleInfo(prev => {
                            if (prev.extraPermissions.some(p => p.id === val.id)) return prev;
                            return {
                                ...prev,
                                extraPermissions: [...prev.extraPermissions, { id: val.id, display: val.description || val.id }]
                            };
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch permissions", err);
        }
    }, [selectedElement]);

    const addMenu = useCallback(async (parentId: string = 'root') => {
        if (isEdit && moduleId && refetchModule) {
            setLoading(true);
            try {
                const parentNode = nodes.find(n => n.id === parentId);
                const parentMenuId = parentId !== 'root' && parentNode?.data?.menuId ? parentNode.data.menuId : undefined;
                await createModuleMenuService(moduleId, {
                    label: 'New Menu',
                    route: '',
                    icon: '',
                    orderIndex: 0,
                    defaultMenu: false,
                    parentMenuId: parentMenuId
                });
                showSuccess('Menu created', 'Success');
                await refetchModule();
            } catch (err: any) {
                showError(err.response?.data?.message || 'Failed to create menu', 'Error');
            } finally {
                setLoading(false);
            }
            return;
        }
        const newNodeId = `menu-${Date.now()}`;
        const parentNode = nodes.find(n => n.id === parentId);
        const position = parentNode ? { x: parentNode.position.x, y: parentNode.position.y + 150 } : { x: 400, y: 100 };

        const newNode: Node = {
            id: newNodeId,
            type: 'menuNode',
            position,
            data: {
                label: 'New Menu',
                route: '',
                permissionId: null,
                permissionDisplay: '',
                apiMethod: 'GET',
                apiRoute: '',
                icon: '',
                orderIndex: 0,
                defaultMenu: false,
                children: [],
                isModule: false
            },
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat({
            id: `e-${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
            animated: true
        }));
    }, [nodes, isEdit, moduleId, refetchModule]);

    const handleCreatePermission = async () => {
        if (!newPermission.apiRoute) {
            showError("API Route is required", "Validation Error");
            return;
        }

        const display = newPermission.description || `${moduleInfo.name} ${newPermission.apiMethod} ${newPermission.apiRoute}`;

        // Always add it locally. We don't save to backend immediately here.
        setModuleInfo(prev => ({
            ...prev,
            extraPermissions: [...prev.extraPermissions, { ...newPermission, id: `new-${Date.now()}`, display } as any]
        }));

        setNewPermission({ apiMethod: 'GET', apiRoute: '', description: '' });
        showSuccess('Permission added to module', 'Success');
    };

    const handleInternalSave = async () => {
        if (!moduleInfo.name) {
            showError("Module Name is required", "Validation Error");
            return;
        }
        // Reconstruct Tree
        const buildTree = (parentId: string): MenuItemData[] => {
            const childEdges = edges.filter(e => e.source === parentId);
            return childEdges.map(edge => {
                const node = nodes.find(n => n.id === edge.target);
                if (!node) return null;
                const menuObj = { ...node.data };
                if (menuObj.permissionId) {
                    // Retain permissionId in the object
                } else if (menuObj.apiMethod || menuObj.apiRoute) {
                    menuObj.permission = {
                        apiMethod: menuObj.apiMethod,
                        apiRoute: menuObj.apiRoute,
                        description: menuObj.permissionDescription || menuObj.label
                    };
                }
                if (!menuObj.permissionId) {
                    delete menuObj.permissionId;
                }
                delete menuObj.permissionDisplay;
                delete menuObj.apiMethod;
                delete menuObj.apiRoute;
                return {
                    ...menuObj,
                    children: buildTree(node.id)
                } as MenuItemData;
            }).filter(Boolean) as MenuItemData[];
        };



        const formattedExtraPerms = moduleInfo.extraPermissions.map((p: any) => {
            if (p.id && !p.id.startsWith('new-')) return { permissionId: p.id };
            return {
                apiMethod: p.apiMethod || 'GET',
                apiRoute: p.apiRoute,
                description: p.description || p.display
            };
        });

        const updatedModule: any = {
            module: {
                ...initialModule,
                ...moduleInfo,
                name: moduleInfo.name,
                description: moduleInfo.description,
                deleteMenus: deletedMenuIds,
                removePermissions: deletedPermissionIds
            },
            extraPermissions: formattedExtraPerms,
            menus: buildTree('root')
        };

        delete updatedModule.module.deletePermissions;
        delete updatedModule.module.extraPermissions;
        delete updatedModule.module.menus;

        const hasMenusArray = updatedModule.menus && updatedModule.menus.length > 0;

        if (!hasMenusArray) {
            showError(`Module must have at least one child menu item`, 'Validation Error');
            return;
        }

        setLoading(true);
        try {
            if (isEdit && moduleId) {
                await updateModuleService(moduleId, updatedModule);
                showSuccess("Module updated successfully", "Success");
            } else {
                // Bulk create with a single module as per user request
                await createBulkModulesService(updatedModule);
                showSuccess("Module created successfully", "Success");
            }
            onSave(updatedModule);
        } catch (error: any) {
            console.error("Failed to save module structure", error);
            showError(error.response?.data?.message || "Failed to save module changes", "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            width: '100%',
            height: 'calc(100vh - 150px)',
            display: 'flex',
            // // Primary black cursor for the workspace
            // '& .react-flow__pane': {
            //     cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M7 2l12 11.2l-5.8 0.8l3.4 6.8l-2.4 1.2l-3.2-6.6l-4 4.1V2z' fill='black' stroke='white' stroke-width='1'/%3E%3C/svg%3E"), auto !important`,
            // },
            // // Ensure nodes use the black cursor as well
            // '& .react-flow__node': {
            //     cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M7 2l12 11.2l-5.8 0.8l3.4 6.8l-2.4 1.2l-3.2-6.6l-4 4.1V2z' fill='black' stroke='white' stroke-width='1'/%3E%3C/svg%3E"), move !important`,
            // }
        }}>
            <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#f4f7f6' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    fitView
                >
                    <Background />
                    <Controls />

                    <Panel position="top-left">
                        <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{moduleInfo.description || 'Unnamed Module'}</Typography>
                                <Typography variant="caption" color="text.secondary">{moduleInfo.name}</Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => addMenu()}>Add Menu</Button>
                            <Button
                                variant="contained"
                                size="small"
                                color="success"
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                                onClick={handleInternalSave}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant="outlined" size="small" onClick={onCancel} disabled={loading}>Cancel</Button>
                        </Paper>
                    </Panel>
                </ReactFlow>
            </Box>

            {/* Properties Drawer */}
            <Drawer
                anchor="right"
                open={!!selectedElement}
                onClose={() => setSelectedElement(null)}
                PaperProps={{
                    sx: {
                        width: 500,
                        p: 3,
                        background: 'rgba(255,255,255,0.98)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
                        zIndex: 2000 // Ensure it's above everything including Dialogs
                    }
                }}
                sx={{ zIndex: 2000 }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Properties</Typography>
                    <IconButton onClick={() => setSelectedElement(null)} size="small"><Close /></IconButton>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {selectedElement && !('source' in selectedElement) && (
                    <Stack spacing={3}>
                        <TextField
                            label="Label"
                            fullWidth
                            size="small"
                            value={selectedElement.data.label}
                            onChange={(e) => updateSelectedNode('label', e.target.value)}
                        />

                        {selectedElement.id === 'root' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Module Configuration</Typography>
                                <TextField
                                    label="Module Name"
                                    fullWidth
                                    size="small"
                                    value={moduleInfo.name}
                                    onChange={(e) => setModuleInfo({ ...moduleInfo, name: e.target.value })}
                                    disabled={isEdit}
                                    helperText={isEdit ? "Name cannot be changed" : "Unique identifier (e.g., users, orders)"}
                                    required
                                />
                                <TextField
                                    label="Description"
                                    fullWidth
                                    size="small"
                                    value={moduleInfo.description}
                                    onChange={(e) => setModuleInfo({ ...moduleInfo, description: e.target.value })}
                                />

                                <Box>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom sx={{ opacity: 0.7 }}>Extra Permissions</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                        {moduleInfo.extraPermissions.map((perm, idx) => (
                                            <Chip
                                                key={perm.id || idx}
                                                label={perm.display}
                                                onDelete={() => {
                                                    if (perm.id) {
                                                        setDeletedPermissionIds(prev => [...prev, perm.id!]);
                                                    }
                                                    setModuleInfo(prev => ({
                                                        ...prev,
                                                        extraPermissions: prev.extraPermissions.filter(p => p.id !== perm.id)
                                                    }));
                                                }}
                                                size="small"
                                            />
                                        ))}
                                    </Box>

                                    <Box sx={{ mt: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid #eee', overflow: 'hidden' }}>
                                        <Tabs
                                            value={newPermissionTab}
                                            onChange={(_, v) => setNewPermissionTab(v)}
                                            variant="fullWidth"
                                            sx={{ minHeight: 16, bgcolor: '#f8f9fa' }}
                                        >
                                            <Tab label="Find Existing" sx={{ minHeight: 36, fontSize: '11px' }} />
                                            <Tab label="Create New" sx={{ minHeight: 36, fontSize: '11px' }} />
                                        </Tabs>
                                        <Box sx={{ p: 2 }}>
                                            {newPermissionTab === 0 ? (
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
                                                        <Button variant="outlined" size="small" onClick={() => fetchPermissions(filterModule, 'extra')}>Fetch</Button>
                                                    </Box>
                                                    <Autocomplete
                                                        options={allPermissions}
                                                        componentsProps={{ popper: { style: { zIndex: 2001 } } }}
                                                        getOptionLabel={(option) => `${option.description || ''} (${option.module}: ${option.apiMethod} ${option.apiRoute})`}
                                                        onChange={(_, val) => {
                                                            if (!val) return;
                                                            setModuleInfo(prev => {
                                                                if (prev.extraPermissions.some(p => p.id === val.id)) return prev;
                                                                return {
                                                                    ...prev,
                                                                    extraPermissions: [...prev.extraPermissions, { id: val.id, display: val.description || val.id }]
                                                                };
                                                            });
                                                        }}
                                                        renderInput={(params) => <TextField {...params} label="Search Existing Permissions" size="small" />}
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
                                                            sx={{ width: 100 }}
                                                            SelectProps={{ MenuProps: { sx: { zIndex: 2001 } } }}
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
                                                    </Box>
                                                    <TextField
                                                        label="Description"
                                                        fullWidth
                                                        size="small"
                                                        placeholder="e.g., Export Data"
                                                        value={newPermission.description}
                                                        onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<Add />}
                                                        onClick={handleCreatePermission}
                                                        disabled={loading}
                                                        fullWidth
                                                    >
                                                        {isEdit ? 'Create & Add' : 'Add to Module'}
                                                    </Button>
                                                </Stack>
                                            )}
                                        </Box>
                                    </Box>

                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Extra permissions are not linked to any menu item but managed within this module.
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ border: '1px solid #eee', borderRadius: 2, overflow: 'hidden' }}>
                                    <Tabs
                                        value={permissionTab}
                                        onChange={(_, v) => setPermissionTab(v)}
                                        variant="fullWidth"
                                        sx={{ minHeight: 40, bgcolor: '#f8f9fa' }}
                                    >
                                        <Tab label="Existing" sx={{ minHeight: 40, fontSize: '11px' }} />
                                        <Tab label="New" sx={{ minHeight: 40, fontSize: '11px' }} />
                                    </Tabs>
                                    <Box sx={{ p: 2 }}>
                                        {permissionTab === 0 ? (
                                            <Stack spacing={2}>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <TextField
                                                        label="Filter by Module"
                                                        size="small"
                                                        fullWidth
                                                        value={filterModule}
                                                        onChange={(e) => setFilterModule(e.target.value)}
                                                        placeholder="e.g. users"
                                                        onKeyDown={(e) => e.key === 'Enter' && fetchPermissions(filterModule, 'module')}
                                                    />
                                                    <Button variant="outlined" size="small" onClick={() => fetchPermissions(filterModule, 'module')}>Fetch</Button>
                                                </Box>
                                                <Autocomplete
                                                    options={allPermissions}
                                                    componentsProps={{ popper: { style: { zIndex: 2001 } } }}
                                                    getOptionLabel={(option) => `${option.description || ''} (${option.module}: ${option.apiMethod} ${option.apiRoute})`}
                                                    value={allPermissions.find(p => p.id === selectedElement.data.permissionId) || null}
                                                    onChange={(_, val) => {
                                                        updateSelectedNode('permissionId', val?.id || null);
                                                        updateSelectedNode('permissionDisplay', val ? (val.description || val.id) : '');
                                                        updateSelectedNode('apiMethod', val?.apiMethod || 'GET');
                                                        updateSelectedNode('apiRoute', val?.apiRoute || '');
                                                    }}
                                                    renderInput={(params) => <TextField {...params} label="Select Permission" size="small" />}
                                                    size="small"
                                                    fullWidth
                                                />
                                            </Stack>
                                        ) : (
                                            <Stack spacing={1.5}>
                                                <TextField
                                                    label="Permission Description"
                                                    fullWidth
                                                    size="small"
                                                    placeholder="e.g. Manage Fabrics"
                                                    value={selectedElement.data.permissionDescription || ''}
                                                    onChange={(e) => updateSelectedNode('permissionDescription', e.target.value)}
                                                />
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <TextField
                                                        label="Method"
                                                        select
                                                        size="small"
                                                        sx={{ width: 100 }}
                                                        SelectProps={{ MenuProps: { sx: { zIndex: 2001 } } }}
                                                        value={selectedElement.data.apiMethod || 'GET'}
                                                        onChange={(e) => updateSelectedNode('apiMethod', e.target.value)}
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
                                                        value={selectedElement.data.apiRoute || ''}
                                                        onChange={(e) => updateSelectedNode('apiRoute', e.target.value)}
                                                    />
                                                </Box>
                                            </Stack>
                                        )}
                                    </Box>
                                </Box>
                                <TextField label="Icon (MUI)" fullWidth size="small" value={selectedElement.data.icon || ''} onChange={(e) => updateSelectedNode('icon', e.target.value)} placeholder="e.g. Dashboard" />
                                <TextField label="Order Index" type="number" fullWidth size="small" value={selectedElement.data.orderIndex || 0} onChange={(e) => updateSelectedNode('orderIndex', parseInt(e.target.value) || 0)} />

                                <Button
                                    variant="outlined"
                                    startIcon={<SubdirectoryArrowRight />}
                                    onClick={() => addMenu(selectedElement.id)}
                                >
                                    Add Child Menu
                                </Button>
                            </Box>
                        )}

                        <Divider />

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            disabled={selectedElement.id === 'root'}
                            onClick={() => {
                                if (selectedElement.id === 'root') return;

                                // Track for deletion if it's an existing menu
                                if (selectedElement.data.menuId) {
                                    setDeletedMenuIds(prev => [...prev, selectedElement.data.menuId]);
                                }

                                // Remove from Flow
                                setNodes((nds) => nds.filter((n) => n.id !== selectedElement.id));
                                setEdges((eds) => eds.filter((e) => e.source !== selectedElement.id && e.target !== selectedElement.id));
                                setSelectedElement(null);
                            }}
                        >
                            Delete {selectedElement.id === 'root' ? 'Module' : 'Menu'}
                        </Button>
                    </Stack>
                )}

                {selectedElement && 'source' in selectedElement && (
                    <Box>
                        <Typography variant="body1">Connection Properties</Typography>
                        <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => {
                                setEdges(eds => eds.filter(e => e.id !== selectedElement.id));
                                setSelectedElement(null);
                            }}
                        >
                            Remove Connection
                        </Button>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};

export default ModuleVisualBuilder;
