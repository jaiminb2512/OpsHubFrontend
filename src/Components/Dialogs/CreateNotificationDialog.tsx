import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Autocomplete,
    CircularProgress,
    Stack,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Chip
} from '@mui/material';
import { createNotificationService } from '../../Services/ApiServices/notificationServices';
import { getUsersService } from '../../Services/ApiServices/userServices';
import type { UserResponse } from '../../Services/ApiServices/userServices';
import { getRolesService } from '../../Services/ApiServices/roleServices';
import type { Role } from '../../Services/ApiServices/roleServices';
import { useToast } from '../../Utils/ToastContext';

interface CreateNotificationDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateNotificationDialog = ({ open, onClose, onSuccess }: CreateNotificationDialogProps) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [fetchingRoles, setFetchingRoles] = useState(false);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        targetType: 'user' as 'user' | 'role' | 'everyone',
        targetId: '', // roleId
        recipientIds: [] as string[], // multiple user IDs
        title: '',
        message: '',
        link: '',
        type: 'info' as 'info' | 'success' | 'warning' | 'error'
    });

    useEffect(() => {
        if (open) {
            fetchUsers('');
            fetchRoles();
        }
    }, [open]);

    const fetchUsers = async (search: string) => {
        setFetchingUsers(true);
        try {
            const response = await getUsersService(1, 100, search);
            if (response && response.success === 200) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const fetchRoles = async () => {
        setFetchingRoles(true);
        try {
            const response = await getRolesService();
            if (response && response.success === 200) {
                setRoles(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch roles", error);
        } finally {
            setFetchingRoles(false);
        }
    };

    // Debounce search
    useEffect(() => {
        if (!open || formData.targetType !== 'user') return;
        const timer = setTimeout(() => {
            fetchUsers(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, formData.targetType]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.title || !formData.message) {
            showToast("warning", "Title and Message are required");
            return;
        }

        if (formData.targetType === 'user' && formData.recipientIds.length === 0) {
            showToast("warning", "Please select at least one recipient");
            return;
        }

        if (formData.targetType === 'role' && !formData.targetId) {
            showToast("warning", "Please select a target role");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                // Clean payload based on target type
                recipientIds: formData.targetType === 'user' ? formData.recipientIds : undefined,
                targetId: formData.targetType === 'role' ? formData.targetId : undefined
            };

            const response = await createNotificationService(payload);
            if (response && (response.success === 201 || response.success === 200)) {
                showToast("success", "Notification sent successfully");
                onSuccess();
                onClose();
                setFormData({
                    targetType: 'user',
                    targetId: '',
                    recipientIds: [],
                    title: '',
                    message: '',
                    link: '',
                    type: 'info'
                });
            }
        } catch (error) {
            console.error("Failed to create notification", error);
            showToast("error", "Failed to send notification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 700 }}>Send New Notification</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <FormControl>
                        <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Send To</FormLabel>
                        <RadioGroup
                            row
                            value={formData.targetType}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                targetType: e.target.value as any,
                                recipientIds: [],
                                targetId: ''
                            }))}
                        >
                            <FormControlLabel value="user" control={<Radio size="small" />} label="Specific Users" />
                            <FormControlLabel value="role" control={<Radio size="small" />} label="By Role" />
                            <FormControlLabel value="everyone" control={<Radio size="small" />} label="Everyone" />
                        </RadioGroup>
                    </FormControl>

                    {formData.targetType === 'user' && (
                        <Autocomplete
                            multiple
                            options={users}
                            getOptionLabel={(option) => `${option.fullName} (${option.emailId})`}
                            loading={fetchingUsers}
                            value={users.filter(u => formData.recipientIds.includes(u.userId))}
                            onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                            onChange={(_, newValue) => {
                                setFormData(prev => ({ ...prev, recipientIds: newValue.map(u => u.userId) }));
                            }}
                            renderTags={(tagValue, getTagProps) =>
                                tagValue.map((option, index) => (
                                    <Chip
                                        label={option.fullName}
                                        size="small"
                                        {...getTagProps({ index })}
                                    />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Recipients"
                                    placeholder="Select users..."
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {fetchingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    )}

                    {formData.targetType === 'role' && (
                        <TextField
                            select
                            label="Target Role"
                            required
                            value={formData.targetId}
                            onChange={(e) => setFormData(prev => ({ ...prev, targetId: e.target.value }))}
                            fullWidth
                        >
                            {fetchingRoles ? (
                                <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Loading roles...</MenuItem>
                            ) : (
                                roles.map((role) => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.name}
                                    </MenuItem>
                                ))
                            )}
                        </TextField>
                    )}

                    <TextField
                        select
                        label="Notification Type"
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                        fullWidth
                    >
                        <MenuItem value="info">Info</MenuItem>
                        <MenuItem value="success">Success</MenuItem>
                        <MenuItem value="warning">Warning</MenuItem>
                        <MenuItem value="error">Error</MenuItem>
                    </TextField>

                    <TextField
                        label="Title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        fullWidth
                    />

                    <TextField
                        label="Message"
                        required
                        multiline
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        fullWidth
                    />

                    <TextField
                        label="Link (Optional)"
                        placeholder="/orders/123"
                        size="small"
                        value={formData.link}
                        onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    Send Notification
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateNotificationDialog;

