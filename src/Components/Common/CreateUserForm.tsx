import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button as MuiButton,
    TextField,
    Paper,
    CircularProgress,
    MenuItem,
    InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
    PersonAdd as PersonAddIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import MUICustomBtn from './MUICustomBtn';
import { createUserByAdminService, getRolesService } from '../../Services/ApiServices';
import { useToast } from '../../Utils/ToastContext';
import { USER_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';

const CreateUserForm = () => {
    usePageTitle('Add New User');
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [formData, setFormData] = useState<{
        fullName: string;
        emailId: string;
        password: string;
        roleId: string;
    }>({
        fullName: '',
        emailId: '',
        password: '',
        roleId: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<Array<{ name: string; value: string }>>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch available roles from backend
    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            try {
                const response = await getRolesService();
                if (response.success === 200 && response.data) {
                    // Map the Role objects to { name, value }
                    // Using role.id as value because the createUser api now expects roleId
                    const roles = response.data.map(role => ({
                        name: role.name,
                        value: role.id
                    }));
                    setAvailableRoles(roles);
                } else {
                    showError(response.message || 'Failed to fetch roles', 'Error');
                }
            } catch (err) {
                console.error("Error fetching roles:", err);
                showError('Failed to fetch roles from server', 'Error');
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchRoles();
    }, [showError]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            roleId: value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size and type if needed
            if (file.size > 5 * 1024 * 1024) { // 5MB limit example
                showError('File size too large. Max 5MB.', 'Error');
                return;
            }

            setSelectedImage(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            data.append('emailId', formData.emailId);
            data.append('password', formData.password);
            data.append('roleId', formData.roleId);

            if (selectedImage) {
                data.append('imageUrl', selectedImage);
            }

            const response = await createUserByAdminService(data);

            if (response.success === 201 || response.success === 200) {
                showSuccess(response.message || 'User created successfully!', 'Success');
                setTimeout(() => navigate(USER_PATHS.LIST), 800);
            } else {
                const errorMsg = response.message || 'Failed to create user';
                showError(errorMsg, 'Create Failed');
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                const errorMsg = axiosError.response?.data?.message || 'Failed to create user';
                showError(errorMsg, 'Create Failed');
            } else {
                const errorMsg = 'An unexpected error occurred';
                showError(errorMsg, 'Create Failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper
            sx={{
                background: 'white',
                borderRadius: 3,
                padding: { xs: 2, sm: 3 },
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
        >

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Box sx={{ marginBottom: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                        Profile Picture (Optional)
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                border: '2px dashed #e0e0e0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden',
                                bgcolor: '#fafafa'
                            }}
                        >
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <PersonIcon sx={{ fontSize: 40, color: '#bdbdbd' }} />
                            )}
                        </Box>

                        <MuiButton
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            sx={{
                                textTransform: 'none',
                                borderColor: '#e0e0e0',
                                color: '#666',
                                '&:hover': {
                                    borderColor: '#bdbdbd',
                                    bgcolor: '#fafafa'
                                }
                            }}
                        >
                            Upload Photo
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </MuiButton>

                        {imagePreview && (
                            <MuiButton
                                variant="text"
                                color="error"
                                onClick={() => {
                                    setSelectedImage(null);
                                    setImagePreview(null);
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Remove
                            </MuiButton>
                        )}
                    </Box>
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        label="Full Name *"
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleFormChange}
                        placeholder="Enter full name (e.g., John Doe)"
                        required
                        disabled={submitting}
                        fullWidth
                        InputProps={{
                            startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: '#fafafa',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                '& fieldset': {
                                    borderColor: '#e0e0e0',
                                    borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                    borderColor: '#ccc',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                                },
                                '&.Mui-focused': {
                                    background: 'white',
                                    transform: 'translateY(-1px)',
                                },
                            },
                        }}
                    />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        label="Email Address *"
                        type="email"
                        id="emailId"
                        name="emailId"
                        value={formData.emailId}
                        onChange={handleFormChange}
                        placeholder="Enter email address (e.g., john.doe@example.com)"
                        required
                        disabled={submitting}
                        fullWidth
                        InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: '#fafafa',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                '& fieldset': {
                                    borderColor: '#e0e0e0',
                                    borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                    borderColor: '#ccc',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                                },
                                '&.Mui-focused': {
                                    background: 'white',
                                    transform: 'translateY(-1px)',
                                },
                            },
                        }}
                    />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        label="Password *"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Enter password (minimum 6 characters)"
                        required
                        disabled={submitting}
                        fullWidth
                        inputProps={{ minLength: 6 }}
                        InputProps={{
                            startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <MUICustomBtn
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={submitting}
                                        tooltip="Toggle password visibility"
                                        variant="text"
                                        sx={{
                                            minWidth: 'auto',
                                            padding: 1,
                                        }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </MUICustomBtn>
                                </InputAdornment>
                            ),
                        }}
                        helperText="Password must be at least 6 characters long"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: '#fafafa',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                '& fieldset': {
                                    borderColor: '#e0e0e0',
                                    borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                    borderColor: '#ccc',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                                },
                                '&.Mui-focused': {
                                    background: 'white',
                                    transform: 'translateY(-1px)',
                                },
                            },
                        }}
                    />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        label="Role *"
                        select
                        id="role"
                        name="roleId"
                        value={formData.roleId || ''}
                        onChange={(e) => handleSelectChange(e as SelectChangeEvent<string>)}
                        required
                        disabled={submitting || loadingRoles}
                        fullWidth
                        SelectProps={{
                            displayEmpty: true,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: '#fafafa',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                '& fieldset': {
                                    borderColor: '#e0e0e0',
                                    borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                    borderColor: '#ccc',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                                },
                                '&.Mui-focused': {
                                    background: 'white',
                                    transform: 'translateY(-1px)',
                                },
                            },
                        }}
                    >
                        {loadingRoles ? (
                            <MenuItem value="" disabled>Loading roles...</MenuItem>
                        ) : availableRoles.length === 0 ? (
                            <MenuItem value="" disabled>No roles available</MenuItem>
                        ) : (
                            availableRoles.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                    {role.name}
                                </MenuItem>
                            ))
                        )}
                    </TextField>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1.5,
                        marginTop: 3,
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}
                >
                    <MuiButton
                        type="button"
                        onClick={() => navigate(USER_PATHS.LIST)}
                        disabled={submitting}
                        sx={{
                            padding: '12px 24px',
                            background: '#f5f5f5',
                            color: '#333',
                            border: '2px solid #e0e0e0',
                            borderRadius: 2,
                            fontSize: '14px',
                            fontWeight: 600,
                            '&:hover': {
                                background: '#e8e8e8',
                                borderColor: '#ccc',
                            },
                        }}
                    >
                        Cancel
                    </MuiButton>
                    <MuiButton
                        type="submit"
                        disabled={submitting}
                        startIcon={
                            submitting ? (
                                <CircularProgress size={20} sx={{ color: 'white' }} />
                            ) : (
                                <PersonAddIcon />
                            )
                        }
                        sx={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: 1,
                            fontSize: '16px',
                            fontWeight: 600,
                            minWidth: 160,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
                            },
                            '&:active': {
                                transform: 'translateY(0)',
                            },
                            '&:disabled': {
                                opacity: 0.6,
                                transform: 'none',
                            },
                        }}
                    >
                        {submitting ? 'Creating...' : 'Create User'}
                    </MuiButton>
                </Box>
            </Box>
        </Paper>
    );
};

export default CreateUserForm;

