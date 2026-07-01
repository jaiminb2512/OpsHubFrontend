import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    Divider,
    FormControlLabel,
    InputAdornment,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../Utils/ToastContext';
import {
    createModuleGroupService,
    getAssignableModulesForGroupService,
    getModuleGroupByIdService,
    updateModuleGroupService,
    type AssignableModuleOption,
} from '../../Services/ApiServices/moduleGroupServices';
import { MODULE_GROUP_PATHS } from '../../Path';

function formatGroupKey(value: string): string {
    return value.replace(/\s+/g, '_').toUpperCase();
}

import usePageTitle from '../../hooks/usePageTitle';
const ModuleGroupForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    usePageTitle(isEdit ? 'Edit Module Group' : 'Add Module Group');
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isSystem, setIsSystem] = useState(false);
    const [allModules, setAllModules] = useState<AssignableModuleOption[]>([]);
    const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
    const [moduleSearch, setModuleSearch] = useState('');

    const [formData, setFormData] = useState({
        key: '',
        label: '',
        description: '',
        orderIndex: '0',
    });
    const [isPublic, setIsPublic] = useState(true);

    const loadData = useCallback(async () => {
        setFetching(true);
        try {
            const modulesRes = await getAssignableModulesForGroupService();
            if (modulesRes?.success && Array.isArray(modulesRes.data)) {
                setAllModules(modulesRes.data);
            } else {
                showError(modulesRes?.message || 'Failed to load modules');
            }

            if (isEdit && id) {
                const groupRes = await getModuleGroupByIdService(id);
                if (groupRes?.success) {
                    const group = groupRes.data;
                    setFormData({
                        key: group.key || '',
                        label: group.label || '',
                        description: group.description || '',
                        orderIndex: String(group.orderIndex ?? 0),
                    });
                    setIsSystem(!!group.isSystem);
                    setIsPublic(group.isPublic !== undefined ? !!group.isPublic : true);
                    const linked = Array.isArray(group.modules) ? group.modules : [];
                    setSelectedModuleIds(new Set(linked.map((m: { id: string }) => m.id)));
                } else {
                    showError(groupRes?.message || 'Failed to fetch module group');
                }
            }
        } catch {
            showError('Failed to load module group data');
        } finally {
            setFetching(false);
        }
    }, [id, isEdit, showError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredModules = useMemo(() => {
        const q = moduleSearch.trim().toLowerCase();
        if (!q) return allModules;
        return allModules.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                (m.description && m.description.toLowerCase().includes(q))
        );
    }, [allModules, moduleSearch]);

    const filteredIds = useMemo(() => filteredModules.map((m) => m.id), [filteredModules]);

    const allFilteredSelected =
        filteredIds.length > 0 && filteredIds.every((mid) => selectedModuleIds.has(mid));

    const toggleModule = (moduleId: string) => {
        setSelectedModuleIds((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    const selectAllFiltered = () => {
        setSelectedModuleIds((prev) => {
            const next = new Set(prev);
            filteredIds.forEach((mid) => next.add(mid));
            return next;
        });
    };

    const clearAllFiltered = () => {
        setSelectedModuleIds((prev) => {
            const next = new Set(prev);
            filteredIds.forEach((mid) => next.delete(mid));
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.key.trim() || !formData.label.trim()) {
            showError('Key and label are required');
            return;
        }

        const payload = {
            key: formData.key.trim(),
            label: formData.label.trim(),
            description: formData.description.trim() || undefined,
            orderIndex: Number(formData.orderIndex) || 0,
            isPublic,
            moduleIds: [...selectedModuleIds],
        };

        setLoading(true);
        try {
            if (isEdit) {
                await updateModuleGroupService(id!, payload);
                showSuccess('Module group updated successfully');
            } else {
                await createModuleGroupService(payload);
                showSuccess('Module group created successfully');
            }
            navigate(MODULE_GROUP_PATHS.LIST);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showError(err.response?.data?.message || 'Failed to save module group');
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
        <Container maxWidth={false} disableGutters sx={{ width: '100%', py: 1, px: { xs: 0, sm: 1 } }}>

            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
                        {/* Row 1: Key + Label */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2,
                            }}
                        >
                            <TextField
                                fullWidth
                                label="Key"
                                value={formData.key}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, key: formatGroupKey(e.target.value) }))
                                }
                                required
                                disabled={isEdit && isSystem}
                                helperText={
                                    isEdit && isSystem
                                        ? 'System group keys cannot be changed'
                                        : 'Unique identifier, e.g. SETUP, COMPANY_ONBOARD'
                                }
                            />
                            <TextField
                                fullWidth
                                label="Label"
                                value={formData.label}
                                onChange={(e) => setFormData((p) => ({ ...p, label: e.target.value }))}
                                required
                                placeholder="e.g. Setup, Company onboarding"
                            />
                        </Box>

                        {/* Row 2: Description + Display order */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2,
                            }}
                        >
                            <TextField
                                fullWidth
                                label="Description (optional)"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, description: e.target.value }))
                                }
                                multiline
                                rows={3}
                            />
                            <TextField
                                fullWidth
                                label="Display order"
                                type="number"
                                value={formData.orderIndex}
                                onChange={(e) =>
                                    setFormData((p) => ({ ...p, orderIndex: e.target.value }))
                                }
                                helperText="Lower numbers appear first in pickers"
                                inputProps={{ min: 0 }}
                            />
                        </Box>

                        {/* Row 2b: Public toggle */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        Public
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Visible to all companies/roles by default
                                    </Typography>
                                </Box>
                            }
                        />

                        {/* Row 3: Modules box — toolbar row + scrollable list */}
                        <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                borderColor: 'divider',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 2,
                                    py: 1.5,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.default',
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                                >
                                    Modules (optional)
                                </Typography>
                                <TextField
                                    size="small"
                                    placeholder="Search modules…"
                                    value={moduleSearch}
                                    onChange={(e) => setModuleSearch(e.target.value)}
                                    disabled={allModules.length === 0}
                                    sx={{ flex: 1, minWidth: { xs: '100%', md: 160 } }}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={selectAllFiltered}
                                    disabled={filteredIds.length === 0 || allFilteredSelected}
                                >
                                    Select all
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={clearAllFiltered}
                                    disabled={filteredIds.length === 0}
                                >
                                    Clear
                                </Button>
                                {selectedModuleIds.size > 0 && (
                                    <Chip
                                        label={`${selectedModuleIds.size} selected`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}
                            </Box>

                            <Box
                                sx={{
                                    maxHeight: 320,
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    bgcolor: 'action.hover',
                                }}
                            >
                                {allModules.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ p: 2, textAlign: 'center' }}
                                    >
                                        No modules available. Create modules first, then assign them here.
                                    </Typography>
                                ) : filteredModules.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ p: 2, textAlign: 'center' }}
                                    >
                                        No modules match your search.
                                    </Typography>
                                ) : (
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: '1fr',
                                                sm: 'repeat(2, 1fr)',
                                                md: 'repeat(3, 1fr)',
                                                lg: 'repeat(4, 1fr)',
                                            },
                                            gap: 1.5,
                                            p: 1.5,
                                        }}
                                    >
                                        {filteredModules.map((mod) => {
                                            const inOtherGroup =
                                                mod.moduleGroupId &&
                                                mod.moduleGroupId !== id &&
                                                mod.moduleGroup;
                                            const selected = selectedModuleIds.has(mod.id);
                                            return (
                                                <Paper
                                                    key={mod.id}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1,
                                                        borderRadius: 1.5,
                                                        borderColor: selected ? 'primary.main' : 'divider',
                                                        bgcolor: 'background.paper',
                                                        transition: 'border-color 0.15s',
                                                        '&:hover': {
                                                            borderColor: 'primary.light',
                                                            bgcolor: 'background.paper',
                                                        },
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={selected}
                                                                onChange={() => toggleModule(mod.id)}
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={600}
                                                                    noWrap
                                                                    title={mod.name}
                                                                >
                                                                    {mod.name}
                                                                </Typography>
                                                                {mod.description && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="text.secondary"
                                                                        sx={{
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            overflow: 'hidden',
                                                                        }}
                                                                    >
                                                                        {mod.description}
                                                                    </Typography>
                                                                )}
                                                                {inOtherGroup && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="warning.main"
                                                                        sx={{
                                                                            display: 'block',
                                                                            mt: 0.25,
                                                                            lineHeight: 1.3,
                                                                        }}
                                                                    >
                                                                        In {mod.moduleGroup?.label}
                                                                        {selected ? ' · moves here' : ''}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                        sx={{
                                                            alignItems: 'flex-start',
                                                            m: 0,
                                                            width: '100%',
                                                        }}
                                                    />
                                                </Paper>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Stack>

                    <Divider />

                    {/* Sticky actions — always visible */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            px: { xs: 2, sm: 3 },
                            py: 2,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={() => navigate(MODULE_GROUP_PATHS.LIST)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ minWidth: 120 }}
                        >
                            {loading ? (
                                <CircularProgress size={22} color="inherit" />
                            ) : isEdit ? (
                                'Update'
                            ) : (
                                'Create'
                            )}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ModuleGroupForm;
