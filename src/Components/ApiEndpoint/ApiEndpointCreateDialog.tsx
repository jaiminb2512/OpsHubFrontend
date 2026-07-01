import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { createApiEndpointService, updateApiEndpointService } from '../../Services/ApiServices/apiEndpointServices';
import { useToast } from '../../Utils/ToastContext';

interface ApiEndpointCreateDialogProps {
    open: boolean;
    onClose: (refresh: boolean) => void;
    editingEndpoint?: any;
}

const ApiEndpointCreateDialog: React.FC<ApiEndpointCreateDialogProps> = ({ open, onClose, editingEndpoint }) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        method: '',
        path: '',
        key: '',
        isLimitAllowed: true,
        isActive: true
    });

    useEffect(() => {
        if (editingEndpoint) {
            setFormData({
                method: editingEndpoint.method,
                path: editingEndpoint.path,
                key: editingEndpoint.key,
                isLimitAllowed: editingEndpoint.isLimitAllowed !== undefined ? editingEndpoint.isLimitAllowed : true,
                isActive: editingEndpoint.isActive
            });
        } else {
            setFormData({
                method: '',
                path: '',
                key: '',
                isLimitAllowed: true,
                isActive: true
            });
        }
    }, [editingEndpoint, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Auto-generate key if empty
    useEffect(() => {
        if (!editingEndpoint && formData.method && formData.path && !formData.key) {
            setFormData(prev => ({
                ...prev,
                key: `${formData.method.toUpperCase()}:${formData.path}`
            }));
        }
    }, [formData.method, formData.path]);

    const handleSubmit = async () => {
        if (!formData.method || !formData.path || !formData.key) {
            showError("Method, Path and Key are required");
            return;
        }

        setLoading(true);
        try {
            if (editingEndpoint) {
                await updateApiEndpointService(editingEndpoint.id, formData);
                showSuccess("API Endpoint updated successfully");
            } else {
                await createApiEndpointService(formData);
                showSuccess("API Endpoint created successfully");
            }
            onClose(true);
        } catch (error: any) {
            console.error(error);
            showError(error.response?.data?.message || "Failed to save API Endpoint");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{editingEndpoint ? 'Edit API Endpoint' : 'Create API Endpoint'}</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        fullWidth
                        label="HTTP Method"
                        name="method"
                        value={formData.method}
                        onChange={handleChange}
                        required
                        placeholder="e.g. GET, POST, PUT, DELETE"
                    />
                    <TextField
                        fullWidth
                        label="API Path"
                        name="path"
                        value={formData.path}
                        onChange={handleChange}
                        required
                        placeholder="e.g. /api/users"
                    />
                    <TextField
                        fullWidth
                        label="Unique Key"
                        name="key"
                        value={formData.key}
                        onChange={handleChange}
                        required
                        placeholder="e.g. GET:/api/users"
                        helperText="Used to uniquely identify this endpoint"
                    />
                    <FormControlLabel
                        control={<Switch checked={formData.isActive} onChange={handleChange} name="isActive" color="primary" />}
                        label="Active"
                    />
                    <FormControlLabel
                        control={<Switch checked={formData.isLimitAllowed} onChange={handleChange} name="isLimitAllowed" color="primary" />}
                        label="Limit allowed"
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => onClose(false)} disabled={loading}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApiEndpointCreateDialog;
