import React, { useEffect, useState } from 'react';
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
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    FormControlLabel,
    Switch,
    OutlinedInput,
    Chip,
    Checkbox,
    ListItemText
} from '@mui/material';
import {
    Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
    createMenuService,
    updateMenuService,
    getMenuByIdService,
    getMenusService,
    type Menu
} from '../../Services/ApiServices/menuServices';
import { getPermissionsService, type Permission } from '../../Services/ApiServices/roleServices';
import { useToast } from '../../Utils/ToastContext';
import { MENU_PATHS } from '../../Path';
import { ProjectSelect } from '../Common/ProjectSelect';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

import usePageTitle from '../../hooks/usePageTitle';
const MenuCreate = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    usePageTitle(isEditMode ? 'Edit Menu Item' : 'Create New Menu Item');
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    // Data sources
    const [parentOptions, setParentOptions] = useState<Menu[]>([]);
    const [permissionOptions, setPermissionOptions] = useState<Permission[]>([]);

    const [formData, setFormData] = useState({
        label: '',
        icon: '',
        route: '',
        parentId: '',
        orderIndex: 0,
        isActive: true,
        permissionIds: [] as string[],
        projectId: '',
    });

    useEffect(() => {
        loadDependencies();
        if (isEditMode && id) {
            loadMenuData(id);
        }
    }, [id, isEditMode]);

    const loadDependencies = async () => {
        try {
            const [menusResp, permsResp] = await Promise.all([
                getMenusService(true), // fetch flat list
                getPermissionsService()
            ]);
            setParentOptions(menusResp.data || []);
            setPermissionOptions(permsResp.data?.data || []);
        } catch (error) {
            console.error("Failed to load dependencies", error);
            showError("Failed to load form options", "Error");
        }
    };

    const loadMenuData = async (menuId: string) => {
        setInitialLoading(true);
        try {
            const response = await getMenuByIdService(menuId);
            const menu = response.data;
            if (menu) {
                setFormData({
                    label: menu.label,
                    icon: menu.icon || '',
                    route: menu.route || '',
                    parentId: menu.parentId || '',
                    orderIndex: menu.orderIndex,
                    isActive: menu.isActive,
                    permissionIds: menu.permissions?.map((p: any) => p.permissionId).filter(Boolean) || [],
                    projectId: menu.projectId || '',
                });
            }
        } catch (error) {
            console.error("Failed to load menu", error);
            showError("Failed to load menu details", "Error");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async () => {
        if (!formData.label) {
            showError("Label is required", "Validation Error");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                parentId: formData.parentId || null
            };

            if (isEditMode && id) {
                await updateMenuService(id, payload);
                showSuccess("Menu item updated successfully", "Success");
            } else {
                await createMenuService(payload);
                showSuccess("Menu item created successfully", "Success");
            }
            navigate(MENU_PATHS.LIST);
        } catch (error: any) {
            console.error("Failed to save menu", error);
            showError(error.response?.data?.message || "Failed to save menu item", "Error");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            {/* Header */}

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                {/* Form Column */}
                <Box sx={{ flex: 2 }}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>

                        <Stack spacing={3}>
                            <ProjectSelect
                                value={formData.projectId}
                                onChange={(val) => setFormData(prev => ({ ...prev, projectId: val }))}
                                showGlobalOptions={false}
                                size="medium"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Label"
                                name="label"
                                value={formData.label}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Orders"
                            />

                            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                                    fullWidth
                                    label="Route"
                                    name="route"
                                    value={formData.route}
                                    onChange={handleChange}
                                    placeholder="e.g. /orders"
                                    helperText="URL path for this menu item"
                                />
                                <TextField
                                    fullWidth
                                    label="Icon Name"
                                    name="icon"
                                    value={formData.icon}
                                    onChange={handleChange}
                                    placeholder="e.g. ShoppingCart"
                                    helperText="MUI Icon name"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <FormControl fullWidth>
                                    <InputLabel>Parent Menu</InputLabel>
                                    <Select
                                        name="parentId"
                                        value={formData.parentId}
                                        onChange={handleSelectChange}
                                        label="Parent Menu"
                                    >
                                        <MenuItem value="">
                                            <em>None (Top Level)</em>
                                        </MenuItem>
                                        {parentOptions
                                            .filter(m => m.id !== id) // Remove self from parent options to avoid loop
                                            .map((menu) => (
                                                <MenuItem key={menu.id} value={menu.id}>
                                                    {menu.label}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Order Index"
                                    name="orderIndex"
                                    value={formData.orderIndex}
                                    onChange={handleChange}
                                    helperText="Display order (0-99)"
                                />
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel>Required Permissions (Legacy Overrides)</InputLabel>
                                <Select
                                    multiple
                                    name="permissionIds"
                                    value={formData.permissionIds}
                                    onChange={handleSelectChange}
                                    input={<OutlinedInput label="Required Permissions (Legacy Overrides)" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                    MenuProps={MenuProps}
                                >
                                    {permissionOptions.map((perm) => (
                                        <MenuItem key={perm.id} value={perm.id}>
                                            <Checkbox checked={formData.permissionIds.indexOf(perm.id) > -1} />
                                            <ListItemText primary={perm.module} secondary={perm.description} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={handleSwitchChange}
                                        name="isActive"
                                        color="primary"
                                    />
                                }
                                label="Active (Visible in menu)"
                            />
                        </Stack>

                        <Divider sx={{ my: 4 }} />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(MENU_PATHS.LIST)}
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
                                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Menu Item' : 'Create Menu Item')}
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
                            Organize your application's navigation structure here.
                        </Typography>
                        <ul style={{ color: '#666', fontSize: '14px', paddingLeft: '20px' }}>
                            <li><strong>Label</strong>: The text displayed to the user in the sidebar.</li>
                            <li><strong>Route</strong>: The internal URL path (e.g. /dashboard/orders).</li>
                            <li><strong>Icon</strong>: Material-UI icon name to display next to the label.</li>
                            <li><strong>Parent Menu</strong>: Select a parent to create a nested submenu.</li>
                            <li><strong>Permissions</strong>: Link permissions to control who can see this menu item.</li>
                            <li><strong>Order Index</strong>: Controls the display order in the sidebar.</li>
                        </ul>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default MenuCreate;
