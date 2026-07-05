import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Grid, Paper, Typography, Chip, Stack,
    Skeleton, IconButton, Tooltip, Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    ArrowBack as BackIcon,
    Lock as LockIcon,
    VpnKey as KeyIcon,
    Storage as StorageIcon,
    Inventory2 as AssetIcon,
} from '@mui/icons-material';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import { DASHBOARD_PATHS, apiKeyAnalyticsPath } from '../../Path';
import usePageTitle from '../../hooks/usePageTitle';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
    id: string;
    name: string;
    description?: string;
    domain?: string;
    isActive: boolean;
    createdAt: string;
}

interface TrendPoint { date: string; count: number }
interface MonthPoint { month: string; count: number }
interface TypeStat { type: string; count: number; sizeBytes: number }
interface Analytics {
    project: Project;
    totalAssets: number;
    totalSizeBytes: number;
    encrypted: number;
    plain: number;
    activeApiKeys: number;
    trend: TrendPoint[];
    monthly: MonthPoint[];
    assetTypes: TypeStat[];
    accessSplit: { public: number; private: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (bytes?: number | null) => {
    if (!bytes) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const shortDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
};

const shortMonth = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('default', { month: 'short' });
};

const TYPE_COLORS: Record<string, string> = {
    image: '#6366F1', video: '#3B82F6', document: '#F59E0B', audio: '#10B981', other: '#94A3B8',
};

const TYPE_ICONS: Record<string, string> = {
    image: '🖼️', video: '🎬', document: '📄', audio: '🎵', other: '📦',
};

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

// Bar chart (shared for trend and monthly)
const BarChart = ({ data, labelFn, loading, height = 120 }: {
    data: { label: string; count: number }[];
    labelFn?: (l: string) => string;
    loading: boolean;
    height?: number;
}) => {
    const theme = useTheme();
    const accent = theme.palette.primary.main;
    const faint = theme.palette.text.disabled;
    const surface = theme.palette.action.hover;

    if (loading) return <Skeleton variant="rectangular" height={height + 32} sx={{ borderRadius: 2 }} />;
    if (!data.length) return null;

    const W = 600, H = height, padL = 6, padR = 6, padT = 12, padB = 24;
    const chartH = H - padT - padB;
    const max = Math.max(...data.map(d => d.count), 1);
    const barW = (W - padL - padR) / data.length;
    const gap = barW * 0.2;
    const peakIdx = data.findIndex(d => d.count === max);

    const labelStep = Math.max(1, Math.ceil(data.length / 7));

    let bars = '';
    // grid lines
    for (let i = 1; i <= 4; i++) {
        const y = padT + chartH - (i / 4) * chartH;
        bars += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${surface}" stroke-width="0.8"/>`;
    }
    data.forEach((d, i) => {
        const bh = Math.max(2, (d.count / max) * chartH);
        const x = padL + i * barW + gap / 2;
        const y = padT + chartH - bh;
        const isPeak = i === peakIdx;
        bars += `<rect x="${x}" y="${y}" width="${barW - gap}" height="${bh}"
            fill="${accent}" opacity="${isPeak ? 0.95 : 0.5}" rx="2">
            <title>${d.label}: ${d.count}</title>
        </rect>`;
        if (d.count > 0 && isPeak) {
            bars += `<text x="${x + (barW - gap) / 2}" y="${y - 3}" text-anchor="middle" font-size="7" fill="${accent}" font-weight="bold">${d.count}</text>`;
        }
        if (i % labelStep === 0 || i === data.length - 1) {
            bars += `<text x="${x + (barW - gap) / 2}" y="${H - padB + 11}" text-anchor="middle" font-size="7" fill="${faint}">${labelFn ? labelFn(d.label) : d.label}</text>`;
        }
    });

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}
            dangerouslySetInnerHTML={{ __html: bars }} />
    );
};

// Donut chart
const DonutChart = ({ segments, loading, total }: {
    segments: { label: string; value: number; color: string }[];
    loading: boolean;
    total?: number;
}) => {
    if (loading) return (
        <Stack direction="row" alignItems="center" spacing={2}>
            <Skeleton variant="circular" width={110} height={110} />
            <Box flex={1}><Skeleton /><Skeleton width="80%" /><Skeleton width="60%" /></Box>
        </Stack>
    );

    const tot = total ?? segments.reduce((s, sg) => s + sg.value, 0);
    if (!tot) return <Typography variant="caption" color="text.secondary">No data</Typography>;

    const R = 42, r = 28, cx = 50, cy = 50;
    let angle = -Math.PI / 2;
    let paths = '';

    segments.forEach(seg => {
        if (!seg.value) return;
        const sweep = (seg.value / tot) * 2 * Math.PI;
        const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
        const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
        const ix1 = cx + r * Math.cos(angle), iy1 = cy + r * Math.sin(angle);
        const ix2 = cx + r * Math.cos(angle + sweep), iy2 = cy + r * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const pct = Math.round((seg.value / tot) * 100);
        paths += `<path d="M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large},0 ${ix1},${iy1} Z" fill="${seg.color}" opacity="0.9"><title>${seg.label}: ${pct}%</title></path>`;
        angle += sweep;
    });

    return (
        <Stack direction="row" alignItems="center" spacing={2}>
            <Box flexShrink={0}>
                <svg viewBox="0 0 100 100" width={110} height={110}
                    dangerouslySetInnerHTML={{ __html: paths + `<text x="50" y="48" text-anchor="middle" font-size="11" font-weight="bold" fill="currentColor">${tot}</text><text x="50" y="57" text-anchor="middle" font-size="6" fill="grey">total</text>` }} />
            </Box>
            <Box flex={1}>
                {segments.map(seg => {
                    const pct = tot ? Math.round((seg.value / tot) * 100) : 0;
                    return (
                        <Stack key={seg.label} direction="row" alignItems="center" spacing={1} mb={0.75}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: seg.color, flexShrink: 0 }} />
                            <Typography variant="caption" flex={1} color="text.secondary" noWrap sx={{ textTransform: 'capitalize' }}>{seg.label}</Typography>
                            <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>{seg.value}</Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>{pct}%</Typography>
                        </Stack>
                    );
                })}
            </Box>
        </Stack>
    );
};

// Section card wrapper
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

const ProjectAnalyticsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    usePageTitle(data?.project?.name ? `${data.project.name} · Analytics` : 'Project Analytics');

    useEffect(() => {
        if (!id) return;
        apiInstance.get(getApiUrl('getProjectAnalytics', { id }))
            .then(r => setData(r.data?.data || null))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const proj = data?.project;

    const trendData = (data?.trend || []).map(t => ({ label: t.date, count: t.count }));
    const monthlyData = (data?.monthly || []).map(m => ({ label: m.month, count: m.count }));

    const typeSegments = (data?.assetTypes || []).map(t => ({
        label: t.type, value: t.count, color: TYPE_COLORS[t.type] || '#94A3B8',
    }));

    const accessSegments = [
        { label: 'public', value: data?.accessSplit.public ?? 0, color: '#10B981' },
        { label: 'private', value: data?.accessSplit.private ?? 0, color: '#6366F1' },
    ];

    const encPct = data ? Math.round(((data.encrypted) / Math.max(data.encrypted + data.plain, 1)) * 100) : 0;

    return (
        <Box>
            {/* Header */}
            <Stack direction="row" alignItems="flex-start" spacing={1.5} mb={3}>
                <Tooltip title="Back to Dashboard">
                    <IconButton size="small" onClick={() => navigate(DASHBOARD_PATHS.STATS)}
                        sx={{ mt: 0.25, border: '1px solid', borderColor: 'divider' }}>
                        <BackIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Box flex={1}>
                    {loading ? (
                        <>
                            <Skeleton width={200} height={28} />
                            <Skeleton width={120} height={18} sx={{ mt: 0.5 }} />
                        </>
                    ) : (
                        <>
                            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                                    {proj?.name}
                                </Typography>
                                <Chip
                                    label={proj?.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={proj?.isActive ? 'success' : 'default'}
                                    variant={proj?.isActive ? 'filled' : 'outlined'}
                                />
                            </Stack>
                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                                {proj?.id} · Created {proj?.createdAt ? new Date(proj.createdAt).toLocaleDateString() : '—'}
                            </Typography>
                        </>
                    )}
                </Box>
                {!loading && id && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<KeyIcon />}
                        onClick={() => navigate(apiKeyAnalyticsPath(id))}
                        sx={{ flexShrink: 0, alignSelf: 'center' }}
                    >
                        API Keys
                    </Button>
                )}
            </Stack>

            {/* Stat cards */}
            <Grid container spacing={2} mb={3}>
                {[
                    { label: 'Total Assets', value: loading ? '—' : (data?.totalAssets ?? 0).toLocaleString(), icon: <AssetIcon />, accent: '#6366F1' },
                    { label: 'Storage Used', value: loading ? '—' : fmt(data?.totalSizeBytes), icon: <StorageIcon />, accent: '#F59E0B' },
                    { label: 'Encrypted', value: loading ? '—' : `${data?.encrypted ?? 0} (${encPct}%)`, icon: <LockIcon />, accent: '#8B5CF6' },
                    { label: 'Active API Keys', value: loading ? '—' : (data?.activeApiKeys ?? 0), icon: <KeyIcon />, accent: '#10B981' },
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

            {/* Trend charts row */}
            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Section title="Upload Trend" sub="Uploads per day — last 30 days">
                        <BarChart data={trendData} labelFn={shortDate} loading={loading} height={130} />
                    </Section>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Section title="Monthly Uploads" sub="Last 6 months">
                        <BarChart data={monthlyData} labelFn={shortMonth} loading={loading} height={130} />
                    </Section>
                </Grid>
            </Grid>

            {/* Breakdown row */}
            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Section title="Asset Types" sub="By file category">
                        <DonutChart segments={typeSegments} loading={loading} />
                    </Section>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Section title="Access Type" sub="Public vs private">
                        <DonutChart segments={accessSegments} loading={loading} />
                    </Section>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Section title="Encryption" sub="Encrypted vs plain">
                        {loading ? <Skeleton height={110} /> : (
                            <Box>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <LockIcon sx={{ fontSize: 14, color: '#8B5CF6' }} />
                                        <Typography variant="caption" color="text.secondary">Encrypted</Typography>
                                    </Stack>
                                    <Typography variant="caption" fontWeight={700} color="#8B5CF6"
                                        sx={{ fontVariantNumeric: 'tabular-nums' }}>{encPct}%</Typography>
                                </Stack>
                                <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                    <Box sx={{ height: '100%', width: `${encPct}%`, bgcolor: '#8B5CF6', borderRadius: 5, transition: 'width 0.8s ease' }} />
                                </Box>
                                <Stack direction="row" justifyContent="space-between" mt={1} mb={2.5}>
                                    <Typography variant="caption" color="text.disabled">{data?.encrypted ?? 0} encrypted</Typography>
                                    <Typography variant="caption" color="text.disabled">{data?.plain ?? 0} plain</Typography>
                                </Stack>

                                {/* Storage by type */}
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}>
                                    Storage by type
                                </Typography>
                                {(data?.assetTypes || []).map(t => {
                                    const total = data?.totalSizeBytes || 1;
                                    const pct = Math.round((t.sizeBytes / total) * 100);
                                    return (
                                        <Box key={t.type} mt={1}>
                                            <Stack direction="row" justifyContent="space-between" mb={0.25}>
                                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                                    {TYPE_ICONS[t.type]} {t.type}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmt(t.sizeBytes)}
                                                </Typography>
                                            </Stack>
                                            <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                                <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: TYPE_COLORS[t.type] || '#94A3B8', borderRadius: 2 }} />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Section>
                </Grid>
            </Grid>

        </Box>
    );
};

export default ProjectAnalyticsPage;
