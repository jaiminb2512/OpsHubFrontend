import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import {
    Box,
    Button,
    Paper,
    Typography,
    CircularProgress,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useToast } from '../../Utils/ToastContext';
import { companyUsersPath } from '../../Path/companyPaths';
import usePageTitle from '../../hooks/usePageTitle';
import {
    updateCompanyUserService,
    // saveUserAccessMappingService,
    getCompanyRolesForCompanyService,
    getCompanyUserDetailService,
    type CompanyRoleItem,
} from '../../Services/ApiServices/companyServices';

const CompanyUserEditPage = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { activeContext } = useAuth();
    const companyId = activeContext?.companyId ?? '';

    usePageTitle('Edit Company User');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState('');
    const [emailId, setEmailId] = useState('');
    const [roleId, setRoleId] = useState('');
    const [roles, setRoles] = useState<CompanyRoleItem[]>([]);

    // Store & warehouse state commented out for now
    // const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
    // const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>([]);
    // const [allStores, setAllStores] = useState<{ id: string; name: string }[]>([]);
    // const [allWarehouses, setAllWarehouses] = useState<{ id: string; name: string }[]>([]);

    const loadData = useCallback(async () => {
        if (!companyId || !userId) return;
        setLoading(true);
        try {
            const [userRes, rolesRes] = await Promise.all([
                getCompanyUserDetailService(companyId, userId),
                getCompanyRolesForCompanyService(companyId),
            ]);

            if (userRes.success === 200 && userRes.data) {
                const d = userRes.data;
                setFullName(d.fullName);
                setEmailId(d.emailId);
                setRoleId(d.roleId);
                // setSelectedStoreIds(d.stores.map((s) => s.id));
                // setSelectedWarehouseIds(d.warehouses.map((w) => w.id));
                // setAllStores(d.allStores);
                // setAllWarehouses(d.allWarehouses);
            }

            if (rolesRes.success === 200) {
                setRoles(rolesRes.data ?? []);
            }
        } catch {
            showError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    }, [companyId, userId, showError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async () => {
        if (!companyId || !userId) return;
        setSaving(true);
        try {
            const updateRes = await updateCompanyUserService(companyId, userId, {
                fullName: fullName.trim() || undefined,
                roleId: roleId || undefined,
            });
            if (updateRes.success !== 200) {
                showError(updateRes.message || 'Failed to update user');
                setSaving(false);
                return;
            }

            // Store/warehouse access mapping save commented out for now
            // const accessRes = await saveUserAccessMappingService(companyId, userId, {
            //     storeIds: selectedStoreIds,
            //     warehouseIds: selectedWarehouseIds,
            // });
            // if (accessRes.success !== 200) {
            //     showError(accessRes.message || 'Failed to save access mapping');
            //     setSaving(false);
            //     return;
            // }

            showSuccess('User updated successfully');
            navigate(companyUsersPath());
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
            >
                <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography fontWeight={700} fontSize={15}>User Details</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                            gap: 2.5,
                        }}
                    >
                        <TextField
                            label="Full Name"
                            size="small"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            size="small"
                            value={emailId}
                            disabled
                            fullWidth
                            helperText="Email cannot be changed"
                        />
                        <FormControl size="small" fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={roleId}
                                label="Role"
                                onChange={(e) => setRoleId(e.target.value)}
                            >
                                {roles.map((r) => (
                                    <MenuItem key={r.id} value={r.id}>
                                        {r.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </Paper>

            {/* Store & Warehouse Access section commented out for now */}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate(companyUsersPath())}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                >
                    Back to Users
                </Button>
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>
        </Box>
    );
};

export default CompanyUserEditPage;
