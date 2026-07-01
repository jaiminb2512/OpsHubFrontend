import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button as MuiButton,
    TextField,
    Paper,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Edit as EditIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import {
    getUserByIdService,
    updateUserService,
    getUserRolesService,
    type UserResponse,
} from '../../Services/ApiServices';
import type { Role } from '../../Services/ApiServices/roleServices';
import { useToast } from '../../Utils/ToastContext';
import { USER_PATHS } from '../../Path';
import { getImageUrl } from '../../Utils/api';
import { formatDateTime } from '../../Utils/dateUtils';
import usePageTitle from '../../hooks/usePageTitle';

const UpdateUserForm = () => {
    usePageTitle('Edit User');
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        roleId: '',
    });
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [userDetails, setUserDetails] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            try {
                const response = await getUserByIdService(userId);
                if (response.success === 200 && response.data) {
                    const user: UserResponse = response.data;
                    setUserDetails(user);
                    setFormData({
                        fullName: user.fullName,
                        roleId: user.roleId ?? '',
                    });
                    if (user.imageUrl) {
                        setImagePreview(getImageUrl(user.imageUrl));
                    }
                } else {
                    showError(response.message || 'Failed to load user details', 'Error');
                    navigate(USER_PATHS.LIST);
                }
            } catch (err: unknown) {
                console.error('fetch user error', err);
                showError('Failed to load user details', 'Error');
                navigate(USER_PATHS.LIST);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();

        getUserRolesService().then(res => {
            if (res.success === 200 && res.data) setAvailableRoles(res.data);
        }).catch(() => {});
    }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
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
        if (!userId) return;

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            if (formData.roleId) data.append('roleId', formData.roleId);
            if (selectedImage) {
                data.append('imageUrl', selectedImage);
            }

            const response = await updateUserService(userId, data);
            if (response.success === 200) {
                showSuccess(response.message || 'User updated successfully!', 'Success');
                setTimeout(() => navigate(USER_PATHS.LIST), 800);
            } else {
                const errorMsg = response.message || 'Failed to update user';
                showError(errorMsg, 'Update Failed');
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                const errorMsg = axiosError.response?.data?.message || 'Failed to update user';
                showError(errorMsg, 'Update Failed');
            } else {
                const errorMsg = 'An unexpected error occurred';
                showError(errorMsg, 'Update Failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Paper
                sx={{
                    background: 'white',
                    borderRadius: 3,
                    padding: { xs: 2, sm: 3 },
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 400,
                }}
            >
                <CircularProgress />
            </Paper>
        );
    }

    if (!userDetails) {
        return null;
    }

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
                            Change Photo
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </MuiButton>

                        {/* Only show remove if there is a preview (either new or existing) */}
                        {/* Note: logic to remove existing image completely from backend is not implemented here yet, 
                            only replacing or setting new one. To properly support removing existing image, 
                            we would need a way to tell backend to set imageUrl to null. */}
                        {selectedImage && (
                            <MuiButton
                                variant="text"
                                color="error"
                                onClick={() => {
                                    setSelectedImage(null);
                                    if (userDetails?.imageUrl) {
                                        setImagePreview(getImageUrl(userDetails.imageUrl));
                                    } else {
                                        setImagePreview(null);
                                    }
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Revert Change
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
                        placeholder="Enter full name"
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
                        label="Email Address"
                        type="email"
                        id="emailId"
                        name="emailId"
                        value={userDetails.emailId}
                        disabled
                        fullWidth
                        InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                        helperText="Email address cannot be modified after account creation"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: '#f5f5f5',
                                borderRadius: '12px',
                                '& fieldset': {
                                    borderColor: '#e0e0e0',
                                    borderWidth: 2,
                                },
                            },
                        }}
                    />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                    <FormControl fullWidth disabled={submitting}>
                        <InputLabel id="role-label">Global Role</InputLabel>
                        <Select
                            labelId="role-label"
                            label="Global Role"
                            value={formData.roleId}
                            onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                            startAdornment={<AdminPanelSettingsIcon sx={{ mr: 1, color: 'action.active' }} />}
                            sx={{
                                background: '#fafafa',
                                borderRadius: '12px',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0', borderWidth: 2 },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                            }}
                        >
                            <MenuItem value=""><em>No global role</em></MenuItem>
                            {availableRoles.map(role => (
                                <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <MuiButton
                        type="button"
                        variant="outlined"
                        size="small"
                        startIcon={<BusinessIcon />}
                        onClick={() =>
                            navigate(USER_PATHS.COMPANY_ROLES.replace(':userId', userId!))
                        }
                        sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600 }}
                    >
                        Manage company & role assignments
                    </MuiButton>
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Created At:</strong> {formatDateTime(userDetails.createdAt)}
                    </Typography>
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
                                <EditIcon />
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
                        {submitting ? 'Updating...' : 'Update User'}
                    </MuiButton>
                </Box>
            </Box>
        </Paper>
    );
};

export default UpdateUserForm;

