import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Button, Chip, CircularProgress, Divider, FormControl,
    IconButton, InputLabel, MenuItem, Paper, Select, Stack, Tooltip, Typography,
} from '@mui/material';
import {
    CheckCircle as ActiveIcon,
    CloudUpload as StorageIcon,
    Email as EmailIcon,
    LinkOff as ResetIcon,
    Sync as IntegrateIcon,
    WifiTetheringError as TestIcon,
} from '@mui/icons-material';
import { colors } from '../../Utils/colors';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import usePageTitle from '../../hooks/usePageTitle';
import {
    getGlobalProvidersService,
    getProjectProviderAssignmentsService,
    setProjectProviderService,
    resetProjectProviderService,
    testGlobalProviderAccountService,
    type Provider,
    type ProviderAccount,
    type ProviderCategory,
    type ProjectProviderAssignment,
} from '../../Services/ApiServices/providerServices';

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: ProviderCategory[] = ['storage', 'email'];

const CategoryIcon = ({ category }: { category: ProviderCategory }) =>
    category === 'storage'
        ? <StorageIcon sx={{ fontSize: 18, color: colors.primary.main }} />
        : <EmailIcon sx={{ fontSize: 18, color: colors.primary.main }} />;

// ── Per-category card ─────────────────────────────────────────────────────────

function CategoryCard({
    category,
    projectId,
    globalProviders,
    assignment,
    onSaved,
}: {
    category: ProviderCategory;
    projectId: string;
    globalProviders: Provider[];
    assignment: ProjectProviderAssignment | undefined;
    onSaved: () => void;
}) {
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();

    const providers = globalProviders.filter(p => p.category === category && p.isActive && !p.isDeleted);

    const [selectedProviderId, setSelectedProviderId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    // When assignment changes from outside, reset local selection
    useEffect(() => {
        setSelectedProviderId('');
        setSelectedAccountId('');
    }, [assignment?.id]);

    const chosenProvider = providers.find(p => p.id === selectedProviderId);
    const accounts: ProviderAccount[] = chosenProvider?.accounts?.filter(a => a.isActive && !a.isDeleted) ?? [];

    const handleProviderChange = (pid: string) => {
        setSelectedProviderId(pid);
        setSelectedAccountId('');
    };

    const handleIntegrate = async () => {
        if (!selectedProviderId || !selectedAccountId) return;
        setSaving(true);
        try {
            const res = await setProjectProviderService(projectId, {
                providerId: selectedProviderId,
                providerAccountId: selectedAccountId,
                category,
                isDefault: true,
            });
            if (res.success === 200) {
                showSuccess(`${category} provider integrated`);
                setSelectedProviderId('');
                setSelectedAccountId('');
                onSaved();
            } else {
                showError(res.message || 'Failed to integrate');
            }
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            showError(err?.response?.data?.message || 'Failed to integrate');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        const ok = await confirm({
            title: `Reset ${category} provider`,
            message: `This project will fall back to the global default ${category} provider. Continue?`,
            confirmText: 'Reset', confirmColor: 'warning',
        });
        if (!ok) return;
        try {
            const res = await resetProjectProviderService(projectId, category);
            if (res.success === 200) { showSuccess(res.data?.message || 'Reset to global'); onSaved(); }
            else showError(res.message || 'Failed to reset');
        } catch { showError('Failed to reset'); }
    };

    const handleTest = async () => {
        if (!assignment) return;
        setTesting(true);
        try {
            const res = await testGlobalProviderAccountService(
                assignment.provider.id,
                assignment.providerAccount.id,
            );
            if (res.success === 200) showSuccess(res.data?.message || 'Connection successful');
            else showError(res.message || 'Test failed');
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            showError(err?.response?.data?.message || 'Connection test failed');
        } finally {
            setTesting(false);
        }
    };

    const label = category === 'storage' ? 'Storage' : 'Email';

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            {/* Header */}
            <Box sx={{
                px: 2.5, py: 1.75,
                bgcolor: colors.background.secondary,
                borderBottom: `1px solid ${colors.border.light}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CategoryIcon category={category} />
                    <Typography fontWeight={700} fontSize={15}>{label} Provider</Typography>
                </Stack>
                {assignment && (
                    <Tooltip title={`Test active ${label.toLowerCase()} connection`}>
                        <span>
                            <IconButton size="small" onClick={handleTest} disabled={testing}>
                                {testing
                                    ? <CircularProgress size={14} />
                                    : <TestIcon sx={{ fontSize: 17, color: colors.info.main }} />}
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
            </Box>

            <Box sx={{ p: 2.5 }}>
                {/* Active assignment */}
                {assignment ? (
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}
                        sx={{
                            p: 1.5, borderRadius: 1.5,
                            bgcolor: colors.success.background,
                            border: `1px solid ${colors.success.main}22`,
                        }}>
                        <ActiveIcon sx={{ fontSize: 18, color: colors.success.main, flexShrink: 0 }} />
                        <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                <Typography fontWeight={700} fontSize={14} color={colors.success.dark}>
                                    {assignment.provider.label}
                                </Typography>
                                <Chip label={assignment.provider.name} size="small"
                                    sx={{ height: 18, fontSize: 10, bgcolor: colors.primary.rgba.light, color: colors.primary.main }} />
                                <Typography fontSize={13} color="text.secondary">
                                    · {assignment.providerAccount.label}
                                </Typography>
                                {assignment.isDefault && (
                                    <Chip label="Default" size="small"
                                        sx={{ height: 18, fontSize: 10, bgcolor: colors.success.background, color: colors.success.dark }} />
                                )}
                            </Stack>
                        </Box>
                        <Tooltip title={`Reset to global ${label.toLowerCase()} provider`}>
                            <IconButton size="small" onClick={handleReset}>
                                <ResetIcon sx={{ fontSize: 16, color: colors.warning.main }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ) : (() => {
                    const defaultProvider = providers.find(p => p.isDefault);
                    const defaultAccount = defaultProvider?.accounts?.find(a => a.isDefault && a.isActive && !a.isDeleted)
                        ?? defaultProvider?.accounts?.find(a => a.isActive && !a.isDeleted);
                    return (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}
                            sx={{
                                p: 1.5, borderRadius: 1.5,
                                bgcolor: colors.background.secondary,
                                border: `1px dashed ${colors.border.light}`,
                            }}>
                            <Typography fontSize={13} color="text.secondary">
                                Using global default {label.toLowerCase()} provider
                                {defaultProvider && defaultAccount && (
                                    <> — <strong>{defaultProvider.label}</strong> · {defaultAccount.label}</>
                                )}
                            </Typography>
                            {defaultProvider && defaultAccount && (
                                <Button size="small" variant="outlined"
                                    disabled={saving}
                                    onClick={async () => {
                                        setSaving(true);
                                        try {
                                            const res = await setProjectProviderService(projectId, {
                                                providerId: defaultProvider.id,
                                                providerAccountId: defaultAccount.id,
                                                category,
                                                isDefault: true,
                                            });
                                            if (res.success === 200) { showSuccess(`${label} provider set`); onSaved(); }
                                            else showError(res.message || 'Failed');
                                        } catch { showError('Failed to set provider'); }
                                        finally { setSaving(false); }
                                    }}
                                    sx={{ ml: 2, flexShrink: 0, fontSize: 12, borderColor: colors.primary.main, color: colors.primary.main }}>
                                    {saving ? <CircularProgress size={14} /> : 'Use Default'}
                                </Button>
                            )}
                        </Stack>
                    );
                })()}

                {/* Provider + Account selector */}
                {providers.length === 0 ? (
                    <Typography fontSize={13} color="text.secondary">
                        No global {label.toLowerCase()} providers available. Create one in Global Providers first.
                    </Typography>
                ) : (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
                        <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
                            <InputLabel>Select Provider</InputLabel>
                            <Select
                                value={selectedProviderId}
                                label="Select Provider"
                                onChange={e => handleProviderChange(e.target.value)}
                            >
                                {providers.map(p => (
                                    <MenuItem key={p.id} value={p.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>{p.label}</span>
                                            <Chip label={p.name} size="small"
                                                sx={{ height: 16, fontSize: 10, bgcolor: colors.primary.rgba.light, color: colors.primary.main }} />
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ flex: 1, minWidth: 160 }} disabled={!selectedProviderId}>
                            <InputLabel>Select Account</InputLabel>
                            <Select
                                value={selectedAccountId}
                                label="Select Account"
                                onChange={e => setSelectedAccountId(e.target.value)}
                            >
                                {accounts.map(a => (
                                    <MenuItem key={a.id} value={a.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>{a.label}</span>
                                            {a.isDefault && (
                                                <Chip label="Default" size="small"
                                                    sx={{ height: 16, fontSize: 10, bgcolor: colors.success.background, color: colors.success.dark }} />
                                            )}
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <IntegrateIcon />}
                            disabled={!selectedProviderId || !selectedAccountId || saving}
                            onClick={handleIntegrate}
                            sx={{ background: colors.primary.gradient, whiteSpace: 'nowrap', height: 40 }}
                        >
                            Integrate
                        </Button>
                    </Stack>
                )}
            </Box>
        </Paper>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProvidersPage() {
    usePageTitle('Project Providers');
    const { id: projectId } = useParams<{ id: string }>();
    const { showError } = useToast();

    const [globalProviders, setGlobalProviders] = useState<Provider[]>([]);
    const [assignments, setAssignments] = useState<ProjectProviderAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const [gpRes, ppRes] = await Promise.all([
                getGlobalProvidersService(),
                getProjectProviderAssignmentsService(projectId),
            ]);
            if (gpRes.success === 200) setGlobalProviders(gpRes.data ?? []);
            if (ppRes.success === 200) setAssignments(ppRes.data ?? []);
        } catch { showError('Failed to load providers'); }
        finally { setLoading(false); }
    }, [projectId]);

    useEffect(() => { load(); }, [load]);

    const getAssignment = (category: ProviderCategory) =>
        assignments.find(a => a.category === category && a.isDefault);

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Select which global provider and account this project should use for each category.
                Leave unset to use the global default.
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress size={32} />
                </Box>
            ) : (
                <>
                    {CATEGORIES.map((cat, i) => (
                        <Box key={cat}>
                            <CategoryCard
                                category={cat}
                                projectId={projectId!}
                                globalProviders={globalProviders}
                                assignment={getAssignment(cat)}
                                onSaved={load}
                            />
                            {i < CATEGORIES.length - 1 && <Divider sx={{ mb: 3 }} />}
                        </Box>
                    ))}
                </>
            )}
        </Box>
    );
}
