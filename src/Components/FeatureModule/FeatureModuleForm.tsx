import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../Utils/ToastContext';
import { FEATURE_MODULE_PATHS } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';
import { getAllFeaturesService } from '../../Services/ApiServices/featureServices';
import {
    createFeatureModuleService,
    getFeatureModulesService,
    syncFeatureModulesService,
} from '../../Services/ApiServices/featureModuleServices';
import ModuleCheckboxList from '../Common/ModuleCheckboxList';

type SelectOption = { id: string; name: string };

const FeatureModuleForm = () => {
    const navigate = useNavigate();
    const { featureId: routeFeatureId } = useParams<{ featureId?: string }>();
    const isManageMode = !!routeFeatureId;

    usePageTitle(isManageMode ? 'Manage Feature Modules' : 'Add Feature Module Mapping');
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isManageMode);
    const [features, setFeatures] = useState<SelectOption[]>([]);
    const [featureId, setFeatureId] = useState(routeFeatureId ?? '');
    const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

    useEffect(() => {
        const loadFeatures = async () => {
            try {
                const featsRes = await getAllFeaturesService();
                const featRows = (featsRes as { data?: { data?: SelectOption[] } })?.data?.data ?? [];
                if ((featsRes as { success?: number })?.success === 200 && Array.isArray(featRows)) {
                    setFeatures(
                        featRows.map((f: { id: string; name?: string; key?: string }) => ({
                            id: f.id,
                            name: f.name || f.key || f.id,
                        }))
                    );
                }
            } catch {
                showError('Failed to load features');
            }
        };
        void loadFeatures();
    }, [showError]);

    useEffect(() => {
        if (!isManageMode || !routeFeatureId) return;
        const loadExisting = async () => {
            try {
                const res = await getFeatureModulesService(1, 500, { featureId: routeFeatureId });
                if (res.success === 200 && res.data) {
                    setSelectedModuleIds((res.data.data ?? []).map((row) => row.moduleId));
                }
            } catch {
                showError('Failed to load existing mappings');
            } finally {
                setFetching(false);
            }
        };
        void loadExisting();
    }, [isManageMode, routeFeatureId, showError]);

    const selectedFeature = useMemo(
        () => features.find((f) => f.id === featureId),
        [features, featureId]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!featureId) {
            showError('Feature is required');
            return;
        }
        if (selectedModuleIds.length === 0) {
            showError('Select at least one module');
            return;
        }

        setLoading(true);
        try {
            if (isManageMode) {
                const res = await syncFeatureModulesService({ featureId, moduleIds: selectedModuleIds });
                if (res.success === 200) {
                    showSuccess(res.message || 'Feature modules updated');
                    navigate(FEATURE_MODULE_PATHS.LIST);
                } else {
                    showError(res.message || 'Failed to update mappings');
                }
            } else {
                const res = await createFeatureModuleService({ featureId, moduleIds: selectedModuleIds });
                if (res.success === 200 || res.success === 201) {
                    showSuccess(res.message || 'Mappings created');
                    navigate(FEATURE_MODULE_PATHS.LIST);
                } else {
                    showError(res.message || 'Failed to create mappings');
                }
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            showError(e.response?.data?.message || 'Failed to save mappings');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
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
                    {/* Left — Feature selection */}
                    <Paper
                        elevation={0}
                        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                    >
                        <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography fontWeight={700} fontSize={15}>
                                Feature
                            </Typography>
                        </Box>
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {isManageMode
                                    ? 'Replace all module links for this feature.'
                                    : 'Link a feature to one or more modules for plan and role setup.'}
                            </Typography>
                            <FormControl fullWidth required disabled={isManageMode}>
                                <InputLabel>Feature</InputLabel>
                                <Select
                                    value={featureId}
                                    label="Feature"
                                    onChange={(e) => setFeatureId(e.target.value)}
                                >
                                    {features.map((f) => (
                                        <MenuItem key={f.id} value={f.id}>
                                            {f.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {selectedFeature && (
                                <Typography variant="caption" color="text.secondary">
                                    Managing modules for: <strong>{selectedFeature.name}</strong>
                                </Typography>
                            )}
                        </Box>
                    </Paper>

                    {/* Right — Module list */}
                    <ModuleCheckboxList
                        selectedIds={selectedModuleIds}
                        onChange={setSelectedModuleIds}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(FEATURE_MODULE_PATHS.LIST)}
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
                        {isManageMode ? 'Save Modules' : 'Create Mappings'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default FeatureModuleForm;
