import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Grid, Paper, Typography, Chip, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Skeleton, IconButton, Tooltip,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Lock as LockIcon,
    VpnKey as KeyIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    Inventory2 as AssetIcon,
    Storage as StorageIcon,
} from '@mui/icons-material';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import { projectAnalyticsPath } from '../../Path/dashboardPaths';
import usePageTitle from '../../hooks/usePageTitle';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
    id: string;
    name: string;
    isActive: boolean;
}

interface KeyStat {
    id: string;
    name?: string;
    keyPreview: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    ageDays: number;
}

interface TypeStat { type: string; count: number; sizeBytes: number }

interface Analytics {
    project: Project;
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    keyStats: KeyStat[];
    totalAssets: number;
    encrypted: number;
    plain: number;
    publicAssets: number;
    privateAssets: number;
    assetTypes: TypeStat[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (bytes?: number | null) => {
    if (!bytes) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const TYPE_COLORS: Record<string, string> = {
    image: '#6366F1', video: '#3B82F6', document: '#F59E0B', audio: '#10B981', other: '#94A3B8',
};

const TYPE_ICONS: Record<string, string> = {
    image: '🖼️', video: '🎬', document: '📄', audio: '🎵', other: '📦',
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string }) => (
    <Paper elevation={0} sx={{
        p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%',
        borderLeft: `3px solid ${accent}`, transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
    }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 10 }}>
                    {label}
                </Typography>
                <Typography variant="h5" fontWeight={700} mt={0.5} sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                    {value}
                </Typography>
                {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
            </Box>
            <Box sx={{ p: 1, bgcolor: `${accent}18`, borderRadius: 2, color: accent }}>{icon}</Box>
        </Stack>
    </Paper>
);

const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const ApiKeyAnalyticsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    usePageTitle(data?.project?.name ? `${data.project.name} · API Keys` : 'API Key Analytics');

    useEffect(() => {
        if (!id) return;
        apiInstance.get(getApiUrl('getApiKeyAnalytics', { id }))
            .then(r => setData(r.data?.data || null))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const proj = data?.project;
    const totalSizeBytes = (data?.assetTypes || []).reduce((s, t) => s + t.sizeBytes, 0);
    const encPct = data ? Math.round((data.encrypted / Math.max(data.encrypted + data.plain, 1)) * 100) : 0;

    return (
        <Box>
            {/* Header */}
            <Stack direction="row" alignItems="flex-start" spacing={1.5} mb={3}>
                <Tooltip title="Back to Project Analytics">
                    <IconButton size="small" onClick={() => navigate(projectAnalyticsPath(id!))}
                        sx={{ mt: 0.25, border: '1px solid', borderColor: 'divider' }}>
                        <BackIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Box flex={1}>
                    {loading ? (
                        <>
                            <Skeleton width={220} height={28} />
                            <Skeleton width={140} height={18} sx={{ mt: 0.5 }} />
                        </>
                    ) : (
                        <>
                            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                                    {proj?.name} — API Keys
                                </Typography>
                                <Chip label={proj?.isActive ? 'Active' : 'Inactive'} size="small"
                                    color={proj?.isActive ? 'success' : 'default'}
                                    variant={proj?.isActive ? 'filled' : 'outlined'} />
                            </Stack>
                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                                Project {proj?.id}
                            </Typography>
                        </>
                    )}
                </Box>
            </Stack>

            {/* Stat cards */}
            <Grid container spacing={2} mb={3}>
                {[
                    { label: 'Total Keys', value: loading ? '—' : data?.totalKeys ?? 0, icon: <KeyIcon />, accent: '#6366F1' },
                    { label: 'Active Keys', value: loading ? '—' : data?.activeKeys ?? 0, sub: loading ? undefined : `${data?.inactiveKeys ?? 0} inactive`, icon: <ActiveIcon />, accent: '#10B981' },
                    { label: 'Total Assets', value: loading ? '—' : (data?.totalAssets ?? 0).toLocaleString(), icon: <AssetIcon />, accent: '#F59E0B' },
                    { label: 'Storage Used', value: loading ? '—' : fmt(totalSizeBytes), sub: loading ? undefined : `${encPct}% encrypted`, icon: <StorageIcon />, accent: '#8B5CF6' },
                ].map(c => (
                    <Grid key={c.label} size={{ xs: 12, sm: 6, md: 3 }}>
                        {loading ? (
                            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                <Skeleton width="60%" height={14} /><Skeleton width="40%" height={32} sx={{ mt: 0.5 }} />
                            </Paper>
                        ) : <StatCard {...c} />}
                    </Grid>
                ))}
            </Grid>

            {/* Keys table + Asset breakdown */}
            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Section title="API Keys" sub="All keys for this project">
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>Name / Key</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }} align="center">Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }} align="right">Age</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }} align="right">Created</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                            <TableCell><Skeleton /></TableCell>
                                        </TableRow>
                                    )) : (data?.keyStats || []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <KeyIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">No API keys</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (data?.keyStats || []).map(k => (
                                        <TableRow key={k.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                            <TableCell>
                                                <Typography variant="caption" fontWeight={600} display="block">
                                                    {k.name || '(unnamed)'}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                                    {k.keyPreview}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    icon={k.isActive ? <ActiveIcon sx={{ fontSize: '14px !important' }} /> : <InactiveIcon sx={{ fontSize: '14px !important' }} />}
                                                    label={k.isActive ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    color={k.isActive ? 'success' : 'default'}
                                                    variant={k.isActive ? 'filled' : 'outlined'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    {k.ageDays}d
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                                    {fmtDate(k.createdAt)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Section>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={2}>
                        {/* Asset type breakdown */}
                        <Section title="Assets by Type" sub="Across this project">
                            {loading ? <Skeleton height={120} /> : (data?.assetTypes || []).length === 0 ? (
                                <Typography variant="caption" color="text.secondary">No assets</Typography>
                            ) : (data?.assetTypes || []).map(t => {
                                const pct = totalSizeBytes ? Math.round((t.sizeBytes / totalSizeBytes) * 100) : 0;
                                return (
                                    <Box key={t.type} mb={1.5}>
                                        <Stack direction="row" justifyContent="space-between" mb={0.4}>
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <Typography variant="caption" sx={{ fontSize: 14 }}>{TYPE_ICONS[t.type] || '📦'}</Typography>
                                                <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{t.type}</Typography>
                                                <Typography variant="caption" color="text.disabled">({t.count})</Typography>
                                            </Stack>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(t.sizeBytes)}</Typography>
                                        </Stack>
                                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                            <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: TYPE_COLORS[t.type] || '#94A3B8', borderRadius: 3, transition: 'width 0.6s ease' }} />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Section>

                        {/* Access + encryption summary */}
                        <Section title="Access & Encryption" sub="Asset visibility and security">
                            {loading ? <Skeleton height={100} /> : (
                                <Box>
                                    <Stack direction="row" spacing={3} mb={2}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Public</Typography>
                                            <Typography variant="h6" fontWeight={700} color="#10B981"
                                                sx={{ fontVariantNumeric: 'tabular-nums' }}>{data?.publicAssets ?? 0}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Private</Typography>
                                            <Typography variant="h6" fontWeight={700} color="#6366F1"
                                                sx={{ fontVariantNumeric: 'tabular-nums' }}>{data?.privateAssets ?? 0}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Encrypted</Typography>
                                            <Typography variant="h6" fontWeight={700} color="#8B5CF6"
                                                sx={{ fontVariantNumeric: 'tabular-nums' }}>{data?.encrypted ?? 0}</Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center" mb={0.75}>
                                        <LockIcon sx={{ fontSize: 12, color: '#8B5CF6' }} />
                                        <Typography variant="caption" color="text.secondary">Encryption ratio</Typography>
                                        <Typography variant="caption" fontWeight={700} color="#8B5CF6" ml="auto !important"
                                            sx={{ fontVariantNumeric: 'tabular-nums' }}>{encPct}%</Typography>
                                    </Stack>
                                    <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', width: `${encPct}%`, bgcolor: '#8B5CF6', borderRadius: 4, transition: 'width 0.8s ease' }} />
                                    </Box>
                                </Box>
                            )}
                        </Section>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ApiKeyAnalyticsPage;
