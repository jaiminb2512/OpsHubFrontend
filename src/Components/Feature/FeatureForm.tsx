import React, { useState, useEffect } from 'react';
import {
    Button,
    Box,
    Paper,
    TextField,
    FormControlLabel,
    Switch,
    CircularProgress,
    Typography,
    Stack,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../Utils/ToastContext';
import { createFeatureService, updateFeatureService, getFeatureByIdService } from '../../Services/ApiServices/featureServices';
import { FEATURE_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';
import ModuleCheckboxList from '../Common/ModuleCheckboxList';
import { ProjectSelect } from '../Common/ProjectSelect';

const FeatureForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    usePageTitle(isEdit ? 'Edit Feature' : 'Add New Feature');
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [featureModules, setFeatureModules] = useState<{ id: string; name: string }[]>([]);

    const [formData, setFormData] = useState({
        key: '',
        name: '',
        description: '',
        isActive: true,
        moduleIds: [] as string[],
        projectId: '',
    });

    useEffect(() => {
        if (!isEdit) return;
        const fetchFeature = async () => {
            try {
                const response = await getFeatureByIdService(id!);
                if (response.success) {
                    const feature = response.data;
                    const mods: { id: string; name: string }[] = Array.isArray(feature.modules) ? feature.modules : [];
                    setFeatureModules(mods);
                    setFormData({
                        key: feature.key || '',
                        name: feature.name || '',
                        description: feature.description || '',
                        isActive: feature.isActive !== undefined ? feature.isActive : true,
                        moduleIds: mods.length > 0
                            ? mods.map((m) => m.id)
                            : Array.isArray(feature.moduleIds)
                              ? feature.moduleIds
                              : [],
                        projectId: feature.projectId || '',
                    });
                }
            } catch {
                showError('Failed to fetch feature');
            } finally {
                setFetching(false);
            }
        };
        fetchFeature();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.key || !formData.name) {
            showError('Key and Name are required');
            return;
        }
        if (formData.moduleIds.length === 0) {
            showError('At least one module is required');
            return;
        }
        try {
            setLoading(true);
            if (isEdit) {
                await updateFeatureService(id!, formData);
                showSuccess('Feature updated successfully');
            } else {
                await createFeatureService(formData);
                showSuccess('Feature created successfully');
            }
            navigate(FEATURE_PATHS.LIST);
        } catch (error: any) {
            showError(error.response?.data?.message || error.message || 'Failed to save feature');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 1 }}>
            <form onSubmit={handleSubmit}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 3,
                        alignItems: 'start',
                    }}
                >
                    {/* Left — Feature Details */}
                    <Paper
                        elevation={0}
                        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                    >
                        <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography fontWeight={700} fontSize={15}>
                                Feature Details
                            </Typography>
                        </Box>
                        <Stack spacing={2.5} sx={{ p: 3 }}>
                            <ProjectSelect
                                value={formData.projectId}
                                onChange={(val) => setFormData(prev => ({
                                    ...prev,
                                    projectId: val,
                                    moduleIds: [],   // clear stale selections when project changes
                                }))}
                                showGlobalOptions={false}
                                size="small"
                                required
                            />
                            <TextField
                                label="Feature Key"
                                name="key"
                                size="small"
                                value={formData.key}
                                onChange={handleChange}
                                fullWidth
                                required
                                placeholder="e.g. notifications, user_management"
                                disabled={isEdit}
                                helperText={isEdit ? 'Key cannot be changed after creation' : ''}
                            />
                            <TextField
                                label="Feature Name"
                                name="name"
                                size="small"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Description"
                                name="description"
                                size="small"
                                value={formData.description}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Optional description of what this feature does"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        color="success"
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2" fontWeight={500}>
                                        Active
                                    </Typography>
                                }
                            />
                        </Stack>
                    </Paper>

                    {/* Right — Module Mapping */}
                    <ModuleCheckboxList
                        selectedIds={formData.moduleIds}
                        onChange={(ids) => setFormData((prev) => ({ ...prev, moduleIds: ids }))}
                        initialModules={featureModules}
                        projectId={formData.projectId || undefined}
                    />
                </Box>

                {/* Actions bar */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(FEATURE_PATHS.LIST)}
                        disabled={loading}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} /> : null}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                    >
                        {isEdit ? 'Update Feature' : 'Create Feature'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default FeatureForm;
