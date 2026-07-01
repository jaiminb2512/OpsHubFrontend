import React, { useState, useEffect } from 'react';
import {
    Button,
    Box,
    Paper,
    TextField,
    CircularProgress,
    Typography,
    Stack,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../Utils/ToastContext';
import { createProjectService, updateProjectService, getProjectByIdService } from '../../Services/ApiServices/projectServices';
import { PROJECT_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';

const ProjectForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    usePageTitle(isEdit ? 'Edit Project' : 'Add New Project');
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        domain: '',
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                if (isEdit && id) {
                    const projectRes = await getProjectByIdService(id);
                    if (projectRes.success && projectRes.data) {
                        const p = projectRes.data;
                        setFormData({
                            name: p.name || '',
                            description: p.description || '',
                            domain: p.domain || '',
                        });
                    }
                }
            } catch (error) {
                console.error(error);
                showError('Failed to load initial data');
            } finally {
                setFetching(false);
            }
        };

        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showError('Project name is required');
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description || undefined,
            domain: formData.domain || undefined,
        };

        try {
            setLoading(true);
            if (isEdit && id) {
                await updateProjectService(id, payload);
                showSuccess('Project updated successfully');
            } else {
                await createProjectService(payload);
                showSuccess('Project created successfully');
            }
            navigate(PROJECT_PATHS.LIST);
        } catch (error: any) {
            console.error(error);
            showError(error.response?.data?.message || error.message || 'Failed to save project');
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
        <Box>
            <form onSubmit={handleSubmit}>
                <Paper
                    elevation={0}
                    sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                >
                    <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography fontWeight={700} fontSize={15}>
                            Project Details
                        </Typography>
                    </Box>
                    <Stack spacing={3} sx={{ p: 4 }}>
                        <TextField
                            label="Project Name"
                            name="name"
                            size="small"
                            value={formData.name}
                            onChange={handleChange}
                            fullWidth
                            required
                            placeholder="e.g. Acme Corp internal dashboard"
                        />
                        <TextField
                            label="Domain URL (Optional)"
                            name="domain"
                            size="small"
                            value={formData.domain}
                            onChange={handleChange}
                            fullWidth
                            placeholder="e.g. https://app.example.com"
                        />
                        <TextField
                            label="Description (Optional)"
                            name="description"
                            size="small"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Describe the purpose of this project..."
                        />
                    </Stack>
                </Paper>

                {/* Actions bar */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(PROJECT_PATHS.LIST)}
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
                        {isEdit ? 'Update Project' : 'Create Project'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default ProjectForm;
