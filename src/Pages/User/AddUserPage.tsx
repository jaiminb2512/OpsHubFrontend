import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    Button,
    TextField,
    InputAdornment,
    CircularProgress,
    MenuItem,
    Alert,
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    Badge as BadgeIcon,
} from '@mui/icons-material';
import { createUserByAdminService } from '../../Services/ApiServices/authServices';
import { getUserRolesService } from '../../Services/ApiServices/userServices';
import { useToast } from '../../Utils/ToastContext';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_PATHS } from '../../Path';

const AddUserPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<Array<{ id: string, name: string }>>([]);

    const [formData, setFormData] = useState({
        fullName: '',
        emailId: '',
        password: '',
        roleId: '',
    });

    const [errors, setErrors] = useState({
        fullName: '',
        emailId: '',
        password: '',
        roleId: '',
    });

    // Fetch available roles on component mount
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setLoadingRoles(true);
                const response = await getUserRolesService();

                if (response.success === 200 && response.data) {
                    setAvailableRoles(response.data.map(r => ({ id: r.id, name: r.name })));
                    // Set first role as default if available
                    if (response.data.length > 0) {
                        setFormData(prev => ({ ...prev, roleId: response.data[0].id }));
                    }
                } else {
                    showError('Failed to fetch available roles', 'Error');
                }
            } catch (err: unknown) {
                console.error('Error fetching roles:', err);
                showError('Failed to fetch available roles', 'Error');
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchRoles();
    }, [showError]);

    const validateForm = () => {
        const newErrors = {
            fullName: '',
            emailId: '',
            password: '',
            roleId: '',
        };

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.emailId.trim()) {
            newErrors.emailId = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
            newErrors.emailId = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.roleId) {
            newErrors.roleId = 'Role is required';
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await createUserByAdminService({
                fullName: formData.fullName.trim(),
                emailId: formData.emailId.trim().toLowerCase(),
                password: formData.password,
                roleId: formData.roleId,
            });

            if (response.success === 201) {
                showSuccess('User created successfully!', 'Success');
                // Reset form
                setFormData({
                    fullName: '',
                    emailId: '',
                    password: '',
                    roleId: availableRoles[0]?.id || '',
                });
            } else {
                showError(response.message || 'Failed to create user', 'Error');
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                showError(axiosError.response?.data?.message || 'An error occurred', 'Error');
            } else {
                showError('An unexpected error occurred', 'Error');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingRoles) {
        return (
            <Card sx={{ borderRadius: 1.5, p: 3, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                    <CircularProgress />
                </Box>
            </Card>
        );
    }

    if (availableRoles.length === 0) {
        return (
            <Card sx={{ borderRadius: 1.5, p: 3, mx: 'auto' }}>
                <Alert severity="warning">
                    You don't have permission to create users. No roles are available for your account.
                </Alert>
            </Card>
        );
    }

    return (
        <Card sx={{ borderRadius: 1.5, p: 3, mx: 'auto' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Add New User
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create a new user with the appropriate role and access level.
                </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => {
                            setFormData({ ...formData, fullName: e.target.value });
                            setErrors({ ...errors, fullName: '' });
                        }}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.emailId}
                        onChange={(e) => {
                            setFormData({ ...formData, emailId: e.target.value });
                            setErrors({ ...errors, emailId: '' });
                        }}
                        error={!!errors.emailId}
                        helperText={errors.emailId}
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            setErrors({ ...errors, password: '' });
                        }}
                        error={!!errors.password}
                        helperText={errors.password}
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button
                                        onClick={() => setShowPassword(!showPassword)}
                                        sx={{ minWidth: 'auto', p: 1 }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </Button>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        select
                        label="Role"
                        value={formData.roleId}
                        onChange={(e) => {
                            setFormData({ ...formData, roleId: e.target.value });
                            setErrors({ ...errors, roleId: '' });
                        }}
                        error={!!errors.roleId}
                        helperText={errors.roleId || 'Select the role for this user'}
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <BadgeIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    >
                        {availableRoles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                                {role.name ? role.name.charAt(0).toUpperCase() + role.name.slice(1) : role.id}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                            disabled={loading}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
                                },
                                textTransform: 'none',
                                fontWeight: 600,
                                flex: 1,
                            }}
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(DASHBOARD_PATHS.HOME)}
                            disabled={loading}
                            sx={{ textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </form>
        </Card>
    );
};

export default AddUserPage;

