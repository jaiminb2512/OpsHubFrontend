import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    Container,
    Paper,
    Divider,
    Stack,
    Collapse,
    FormControlLabel,
    Switch,
    MenuItem
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { createPermissionService, createPermissionWithMenuService } from '../../Services/ApiServices/roleServices';
import { getMenusService, type Menu } from '../../Services/ApiServices/menuServices';
import { getModulesService } from '../../Services/ApiServices/moduleServices';
import { getApiEndpointsService } from '../../Services/ApiServices/apiEndpointServices';
import { useToast } from '../../Utils/ToastContext';
import { PERMISSION_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';

const PermissionCreate = () => {
    usePageTitle('Create Permission');
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        moduleId: '',
        description: '',
        apiId: '',
        apiMethod: '',
        apiRoute: ''
    });

    const [modules, setModules] = useState<any[]>([]);
    const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
    const [useExistingApi, setUseExistingApi] = useState(true);

    const [createMenu, setCreateMenu] = useState(false);
    const [linkToExisting, setLinkToExisting] = useState(false);
    const [existingMenus, setExistingMenus] = useState<Menu[]>([]);
    const [selectedMenuId, setSelectedMenuId] = useState('');

    const [menuData, setMenuData] = useState({
        label: '',
        icon: '',
        route: '',
        parentId: ''
    });

    // Fetch initial data (Modules and APIs)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [modsRes, apisRes] = await Promise.all([
                    getModulesService(),
                    getApiEndpointsService()
                ]);
                if (modsRes.success && modsRes.data?.data && Array.isArray(modsRes.data.data)) {
                    setModules(modsRes.data.data);
                }
                if (apisRes.success && Array.isArray(apisRes.data)) {
                    setApiEndpoints(apisRes.data);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
                showError("Failed to load modules or API endpoints", "Network Error");
            }
        };
        fetchInitialData();
    }, []);

    // Fetch menus when link mode is enabled
    useEffect(() => {
        if (linkToExisting && existingMenus.length === 0) {
            const fetchMenus = async () => {
                try {
                    const response = await getMenusService(true); // Fetch flat list
                    if (response.success && Array.isArray(response.data)) {
                        setExistingMenus(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch menus", error);
                    showError("Failed to load existing menus", "Network Error");
                }
            };
            fetchMenus();
        }
    }, [linkToExisting]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMenuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMenuData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.moduleId) {
            showError("Module is required", "Validation Error");
            return;
        }

        if (useExistingApi && !formData.apiId) {
            showError("Please select an API Endpoint", "Validation Error");
            return;
        }

        if (!useExistingApi && (!formData.apiMethod || !formData.apiRoute)) {
            showError("API Method and Route are required for new endpoint", "Validation Error");
            return;
        }

        if (createMenu && !linkToExisting && !menuData.label) {
            showError("Menu Label is required when 'Create Menu Item' is checked", "Validation Error");
            return;
        }

        if (createMenu && linkToExisting && !selectedMenuId) {
            showError("Please select an existing menu to link", "Validation Error");
            return;
        }

        setLoading(true);
        try {
            const requestData: any = {
                moduleId: formData.moduleId,
                description: formData.description,
            };
            if (useExistingApi) {
                requestData.apiId = formData.apiId;
            } else {
                requestData.apiMethod = formData.apiMethod;
                requestData.apiRoute = formData.apiRoute;
            }

            if (createMenu) {
                await createPermissionWithMenuService({
                    ...requestData,
                    existingMenuId: linkToExisting ? selectedMenuId : undefined,
                    menuLabel: linkToExisting ? "placeholder" : menuData.label,
                    menuIcon: menuData.icon,
                    menuRoute: menuData.route,
                    menuParentId: menuData.parentId || null,
                    menuOrderIndex: 0,
                    menuIsActive: true
                });
                showSuccess(linkToExisting ? "Permission linked to menu successfully" : "Permission and Menu item created successfully", "Success");
            } else {
                await createPermissionService(requestData);
                showSuccess("Permission created successfully", "Success");
            }

            navigate(PERMISSION_PATHS.LIST);
        } catch (error: any) {
            console.error("Failed to create permission", error);
            showError(error.response?.data?.message || "Failed to create permission", "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                {/* Form Column */}
                <Box sx={{ flex: 2 }}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>

                        <Stack spacing={3}>
                            <TextField
                                select
                                fullWidth
                                label="Module"
                                name="moduleId"
                                value={formData.moduleId}
                                onChange={handleChange}
                                required
                                helperText="Select the module this permission belongs to"
                            >
                                <MenuItem value=""><em>-- Select Module --</em></MenuItem>
                                {modules.map((mod) => (
                                    <MenuItem key={mod.id} value={mod.id}>
                                        {mod.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={useExistingApi}
                                            onChange={(e) => {
                                                setUseExistingApi(e.target.checked);
                                                setFormData(prev => ({ ...prev, apiId: '', apiMethod: '', apiRoute: '' }));
                                            }}
                                            color="primary"
                                        />
                                    }
                                    label={<Typography fontWeight="medium">Select Existing API Endpoint</Typography>}
                                    sx={{ mb: 2 }}
                                />

                                {useExistingApi ? (
                                    <TextField
                                        select
                                        fullWidth
                                        label="API Endpoint"
                                        name="apiId"
                                        value={formData.apiId}
                                        onChange={handleChange}
                                        required
                                        helperText="Select an existing API route"
                                    >
                                        <MenuItem value=""><em>-- Select API Endpoint --</em></MenuItem>
                                        {apiEndpoints.map((api) => (
                                            <MenuItem key={api.id} value={api.id}>
                                                {api.method} {api.path}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                                        <TextField
                                            fullWidth
                                            label="API Method"
                                            name="apiMethod"
                                            value={formData.apiMethod}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. GET, POST"
                                            helperText="HTTP method"
                                        />
                                        <TextField
                                            fullWidth
                                            label="API Route"
                                            name="apiRoute"
                                            value={formData.apiRoute}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. /api/users"
                                            helperText="API path"
                                        />
                                    </Box>
                                )}
                            </Box>

                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                placeholder="Brief description of what this permission allows..."
                                required
                            />
                        </Stack>

                        <Divider sx={{ my: 4 }} />

                        {/* Optional Menu Creation Section */}
                        <Box sx={{ mb: 4 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={createMenu}
                                        onChange={(e) => setCreateMenu(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography fontWeight="medium">
                                        Associate with Menu Item
                                    </Typography>
                                }
                            />

                            <Collapse in={createMenu}>
                                <Paper variant="outlined" sx={{ p: 3, mt: 2, bgcolor: '#f8f9fa' }}>

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={linkToExisting}
                                                onChange={(e) => {
                                                    setLinkToExisting(e.target.checked);
                                                    if (e.target.checked) setMenuData(prev => ({ ...prev, label: '', route: '', icon: '' }));
                                                }}
                                                color="secondary"
                                            />
                                        }
                                        label="Link to Existing Menu"
                                        sx={{ mb: 2 }}
                                    />

                                    {linkToExisting ? (
                                        <TextField
                                            select
                                            fullWidth
                                            label="Select Existing Menu"
                                            value={selectedMenuId}
                                            onChange={(e) => setSelectedMenuId(e.target.value)}
                                            helperText="The permission will be added to this menu item."
                                        >
                                            <MenuItem value=""><em>-- Select Menu --</em></MenuItem>
                                            {existingMenus.map((menu) => (
                                                <MenuItem key={menu.id} value={menu.id}>
                                                    {menu.label} ({menu.route})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    ) : (
                                        <>
                                            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
                                                New Menu Item Details
                                            </Typography>
                                            <Stack spacing={2}>
                                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Menu Label"
                                                        name="label"
                                                        value={menuData.label}
                                                        onChange={handleMenuChange}
                                                        required={createMenu}
                                                        size="small"
                                                        placeholder="e.g. Orders"
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Route Path"
                                                        name="route"
                                                        value={menuData.route}
                                                        onChange={handleMenuChange}
                                                        size="small"
                                                        placeholder="e.g. /dashboard/orders"
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Icon Name"
                                                        name="icon"
                                                        value={menuData.icon}
                                                        onChange={handleMenuChange}
                                                        size="small"
                                                        placeholder="e.g. ShoppingCart"
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Parent Menu ID (Optional)"
                                                        name="parentId"
                                                        value={menuData.parentId}
                                                        onChange={handleMenuChange}
                                                        size="small"
                                                    />
                                                </Box>
                                            </Stack>
                                        </>
                                    )}
                                </Paper>
                            </Collapse>
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(PERMISSION_PATHS.LIST)}
                                disabled={loading}
                                sx={{ px: 4, borderRadius: 2 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                sx={{
                                    px: 4,
                                    borderRadius: 2,
                                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                                }}
                            >
                                {loading ? 'Creating...' : 'Create Permission'}
                            </Button>
                        </Box>
                    </Paper>
                </Box>

                {/* Info Column */}
                <Box sx={{ flex: 1 }}>
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Tips
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Permissions link Modules and API Endpoints to secure your application.
                        </Typography>
                        <ul style={{ color: '#666', fontSize: '14px', paddingLeft: '20px' }}>
                            <li><strong>Module</strong>: Logical grouping (e.g. users, orders).</li>
                            <li><strong>API Endpoint</strong>: Choose an existing backend API or define a new one.</li>
                            <li><strong>Menu Link</strong>: Connect this permission directly to UI navigation.</li>
                        </ul>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default PermissionCreate;
