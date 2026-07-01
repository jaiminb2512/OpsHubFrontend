import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Box,
    CircularProgress
} from '@mui/material';
import { useToast } from '../../Utils/ToastContext';
import { createFeatureService, updateFeatureService } from '../../Services/ApiServices/featureServices';

interface FeatureCreateDialogProps {
    open: boolean;
    onClose: (refresh: boolean) => void;
    editingFeature?: any;
}

const FeatureCreateDialog: React.FC<FeatureCreateDialogProps> = ({ open, onClose, editingFeature }) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        key: '',
        name: '',
        description: '',
        isActive: true
    });

    useEffect(() => {
        if (editingFeature) {
            setFormData({
                key: editingFeature.key || '',
                name: editingFeature.name || '',
                description: editingFeature.description || '',
                isActive: editingFeature.isActive !== undefined ? editingFeature.isActive : true
            });
        } else {
            setFormData({
                key: '',
                name: '',
                description: '',
                isActive: true
            });
        }
    }, [editingFeature, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.key || !formData.name) {
            showError("Key and Name are required");
            return;
        }

        try {
            setLoading(true);
            if (editingFeature) {
                await updateFeatureService(editingFeature.id, formData);
                showSuccess("Feature updated successfully");
            } else {
                await createFeatureService(formData);
                showSuccess("Feature created successfully");
            }
            onClose(true);
        } catch (error: any) {
            console.error(error);
            showError(error.message || "Failed to save feature");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
                {editingFeature ? 'Edit Feature' : 'Add New Feature'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Feature Key"
                            name="key"
                            value={formData.key}
                            onChange={handleChange}
                            fullWidth
                            required
                            placeholder="e.g. notifications, user_management"
                            disabled={!!editingFeature}
                            helperText={editingFeature ? "Key cannot be changed after creation" : ""}
                        />
                        <TextField
                            label="Feature Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    color="success"
                                />
                            }
                            label="Is Active"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {editingFeature ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default FeatureCreateDialog;
