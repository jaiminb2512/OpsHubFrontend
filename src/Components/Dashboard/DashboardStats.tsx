import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Paper, Typography, Chip, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, Skeleton, Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    FolderOpen as ProjectIcon,
    VpnKey as KeyIcon,
    Storage as StorageIcon,
    CloudUpload as UploadIcon,
    Lock as LockIcon,
    BarChart as ChartIcon,
} from '@mui/icons-material';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import usePageTitle from '../../hooks/usePageTitle';
import { projectAnalyticsPath } from '../../Path/dashboardPaths';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectStat {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    assetCount: number;
    totalSizeBytes: number;
    activeApiKeys: number;
}

interface TrendPoint { date: string; count: number }
interface TypeStat { type: string; count: number; sizeBytes: number }
interface ProviderStat { provider: string; count: number; sizeBytes: number }

interface Analytics {
    trend: TrendPoint[];
    assetTypes: TypeStat[];
    providers: ProviderStat[];
    encrypted: number;
    plain: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const shortDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
};

const TYPE_COLORS: Record<string, string> = {
    image: '#4CAF50',
    video: '#2196F3',
    document: '#FF9800',
    audio: '#9C27B0',
    other: '#607D8B',
};

const PROVIDER_COLORS = ['#1976D2', '#E53935', '#00897B', '#F9A825', '#8E24AA'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: string }) => (
    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="h5" fontWeight={700} mt={0.5}>{value}</Typography>
                {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
            </Box>
            <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 2 }}>{icon}</Box>
        </Stack>
    </Paper>
);

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
);

// Bar chart — upload trend
const TrendChart = ({ data, loading }: { data: TrendPoint[]; loading: boolean }) => {
    const theme = useTheme();
    const W = 100, H = 80, PAD = 4;
    const max = Math.max(...data.map(d => d.count), 1);
    const barW = (W - PAD * 2) / data.length;
    const color = theme.palette.primary.main;

    if (loading) return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />;

    // Show every ~5th label to avoid crowding
    const labelStep = Math.ceil(data.length / 6);

    return (
        <Box>
            <svg viewBox={`0 0 100 ${H}`} style={{ width: '100%', display: 'block' }}>
                {data.map((d, i) => {
                    const bh = Math.max(1, (d.count / max) * (H - PAD * 2 - 12));
                    const x = PAD + i * barW + barW * 0.1;
                    const y = H - PAD - 12 - bh;
                    return (
                        <g key={d.date}>
                            <rect x={x} y={y} width={barW * 0.8} height={bh} fill={color} opacity={0.85} rx={0.5} />
                            {d.count > 0 && (
                                <title>{`${d.date}: ${d.count} upload${d.count !== 1 ? 's' : ''}`}</title>
                            )}
                        </g>
                    );
                })}
                {/* X-axis labels */}
                {data.map((d, i) => i % labelStep === 0 && (
                    <text
                        key={d.date}
                        x={PAD + i * barW + barW / 2}
                        y={H - PAD + 1}
                        textAnchor="middle"
                        fontSize={3.5}
                        fill={theme.palette.text.secondary}
                    >
                        {shortDate(d.date)}
                    </text>
                ))}
            </svg>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                Last 30 days — peak: {max} upload{max !== 1 ? 's' : ''} / day
            </Typography>
        </Box>
    );
};

// Donut chart — asset types or provider distribution
const DonutChart = ({
    segments, loading, centerLabel,
}: {
    segments: { label: string; value: number; color: string }[];
    loading: boolean;
    centerLabel?: string;
}) => {
    if (loading) return <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} />;

    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
            <ChartIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" display="block">No data</Typography>
        </Box>
    );

    const R = 40, r = 26, cx = 50, cy = 50;
    let angle = -Math.PI / 2;
    const paths: { d: string; color: string; label: string; pct: number }[] = [];

    for (const seg of segments) {
        if (seg.value === 0) continue;
        const sweep = (seg.value / total) * 2 * Math.PI;
        const x1 = cx + R * Math.cos(angle);
        const y1 = cy + R * Math.sin(angle);
        const x2 = cx + R * Math.cos(angle + sweep);
        const y2 = cy + R * Math.sin(angle + sweep);
        const ix1 = cx + r * Math.cos(angle);
        const iy1 = cy + r * Math.sin(angle);
        const ix2 = cx + r * Math.cos(angle + sweep);
        const iy2 = cy + r * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        paths.push({
            d: `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large},0 ${ix1},${iy1} Z`,
            color: seg.color,
            label: seg.label,
            pct: Math.round((seg.value / total) * 100),
        });
        angle += sweep;
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flexShrink: 0, position: 'relative' }}>
                <svg viewBox="0 0 100 100" style={{ width: 120, height: 120, display: 'block' }}>
                    {paths.map((p, i) => (
                        <path key={i} d={p.d} fill={p.color} opacity={0.9}>
                            <title>{`${p.label}: ${p.pct}%`}</title>
                        </path>
                    ))}
                    {centerLabel && (
                        <text x={50} y={54} textAnchor="middle" fontSize={8} fontWeight="bold" fill="currentColor">
                            {total}
                        </text>
                    )}
                    {centerLabel && (
                        <text x={50} y={62} textAnchor="middle" fontSize={5} fill="grey">
                            {centerLabel}
                        </text>
                    )}
                </svg>
            </Box>
            <Box sx={{ flex: 1, minWidth: 80 }}>
                {paths.map((p) => (
                    <Stack key={p.label} direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: p.color, flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ flex: 1 }} noWrap>
                            {p.label}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>{p.pct}%</Typography>
                    </Stack>
                ))}
            </Box>
        </Box>
    );
};

// Encrypted vs plain bar
const EncryptedBar = ({ encrypted, plain, loading }: { encrypted: number; plain: number; loading: boolean }) => {
    const total = encrypted + plain;
    const pct = total > 0 ? Math.round((encrypted / total) * 100) : 0;

    if (loading) return <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">Encrypted</Typography>
                <Typography variant="caption" fontWeight={700}>{pct}% ({encrypted})</Typography>
            </Stack>
            <Box sx={{ height: 12, borderRadius: 6, bgcolor: 'action.hover', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: '#9C27B0', borderRadius: 6, transition: 'width 0.6s ease' }} />
            </Box>
            <Stack direction="row" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="text.disabled">{encrypted} encrypted</Typography>
                <Typography variant="caption" color="text.disabled">{plain} plain</Typography>
            </Stack>
        </Box>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const DashboardStats = () => {
    usePageTitle('Dashboard');
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectStat[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
        apiInstance.get(getApiUrl('getDashboardStats'))
            .then(r => setProjects(r.data?.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));

        apiInstance.get(getApiUrl('getAnalytics'))
            .then(r => setAnalytics(r.data?.data || null))
            .catch(console.error)
            .finally(() => setAnalyticsLoading(false));
    }, []);

    const totalAssets = projects.reduce((s, p) => s + p.assetCount, 0);
    const totalBytes = projects.reduce((s, p) => s + p.totalSizeBytes, 0);
    const totalKeys = projects.reduce((s, p) => s + p.activeApiKeys, 0);
    const activeProjects = projects.filter(p => p.isActive).length;
    const maxAssets = Math.max(...projects.map(p => p.assetCount), 1);

    const typeSegments = (analytics?.assetTypes || []).map(t => ({
        label: t.type,
        value: t.count,
        color: TYPE_COLORS[t.type] || '#607D8B',
    }));

    const providerSegments = (analytics?.providers || []).map((p, i) => ({
        label: p.provider,
        value: p.count,
        color: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
    }));

    return (
        <>
            {/* ── Summary cards ── */}
            <Grid container spacing={2} mb={3}>
                {[
                    { label: 'Total Projects', value: loading ? '—' : projects.length, sub: `${activeProjects} active`, icon: <ProjectIcon /> },
                    { label: 'Total Assets', value: loading ? '—' : totalAssets, icon: <UploadIcon sx={{ color: '#2196F3' }} /> },
                    { label: 'Storage Used', value: loading ? '—' : fmt(totalBytes), icon: <StorageIcon sx={{ color: '#FF9800' }} /> },
                    { label: 'Active API Keys', value: loading ? '—' : totalKeys, icon: <KeyIcon sx={{ color: '#4CAF50' }} /> },
                ].map((c) => (
                    <Grid key={c.label} size={{ xs: 12, sm: 6, md: 3 }}>
                        {loading ? (
                            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                <Skeleton width="60%" height={16} />
                                <Skeleton width="40%" height={36} sx={{ mt: 0.5 }} />
                            </Paper>
                        ) : (
                            <StatCard {...c} />
                        )}
                    </Grid>
                ))}
            </Grid>

            {/* ── Analytics charts row ── */}
            <Grid container spacing={2} mb={3}>
                {/* Upload trend */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
                        <SectionTitle title="Upload Trend" sub="Uploads per day — last 30 days" />
                        <Box sx={{ p: 2 }}>
                            <TrendChart data={analytics?.trend || []} loading={analyticsLoading} />
                        </Box>
                    </Paper>
                </Grid>

                {/* Asset type breakdown */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
                        <SectionTitle title="Asset Types" sub="By file category" />
                        <Box sx={{ p: 2 }}>
                            <DonutChart
                                segments={typeSegments}
                                loading={analyticsLoading}
                                centerLabel="total"
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Provider distribution + encrypted ratio */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
                        <SectionTitle title="Providers" sub="Storage provider split" />
                        <Box sx={{ p: 2 }}>
                            <DonutChart
                                segments={providerSegments}
                                loading={analyticsLoading}
                                centerLabel="assets"
                            />
                        </Box>
                        <Divider />
                        <Box sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <LockIcon sx={{ fontSize: 16, color: '#9C27B0' }} />
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Encryption
                                </Typography>
                            </Stack>
                            <EncryptedBar
                                encrypted={analytics?.encrypted ?? 0}
                                plain={analytics?.plain ?? 0}
                                loading={analyticsLoading}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* ── Per-project table ── */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <SectionTitle title="Projects Breakdown" sub="Asset count, storage, and API keys per project" />
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Project</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Assets</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13, minWidth: 180 }}>Usage</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">Storage</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">API Keys</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <ProjectIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">No projects yet</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((p) => (
                                    <TableRow key={p.id} hover onClick={() => navigate(projectAnalyticsPath(p.id))} sx={{ '&:last-child td': { borderBottom: 0 }, cursor: 'pointer' }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                                                {p.id.slice(0, 8)}…
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={600}>{p.assetCount}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(100, (p.assetCount / maxAssets) * 100)}
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2">{fmt(p.totalSizeBytes)}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={<KeyIcon sx={{ fontSize: '14px !important' }} />}
                                                label={p.activeApiKeys}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={p.isActive ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={p.isActive ? 'success' : 'default'}
                                                variant={p.isActive ? 'filled' : 'outlined'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    );
};

export default DashboardStats;
