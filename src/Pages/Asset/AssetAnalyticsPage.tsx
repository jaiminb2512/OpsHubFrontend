import { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Paper, Typography, Stack, Chip, Skeleton,
    ToggleButton, ToggleButtonGroup, TextField,
    Table, TableHead, TableBody, TableRow, TableCell,
    TableContainer, IconButton, Tooltip, MenuItem,
    Select, OutlinedInput, Checkbox, ListItemText,
    Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Refresh as RefreshIcon,
    BarChart as BarChartIcon,
    CloudUpload as UploadIcon,
    CloudDownload as DownloadIcon,
    Delete as DeleteIcon,
    Error as ErrorIcon,
    Close as CloseIcon,
    SearchOff as EmptyIcon,
} from '@mui/icons-material';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import usePageTitle from '../../hooks/usePageTitle';
import { getProjectsService } from '../../Services/ApiServices/projectServices';
import { getGlobalProvidersService } from '../../Services/ApiServices/providerServices';
import { listProjectApiKeysService } from '../../Services/ApiServices/projectApiKeyServices';
import type { AnalyticsGroupBy, AnalyticsRow } from '../../Services/ApiServices/assetServices';
import type { ProjectListItem } from '../../Services/ApiServices/projectServices';
import type { Provider, ProviderAccount } from '../../Services/ApiServices/providerServices';

const BASE = import.meta.env.VITE_NODEJS_BASE_URL;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Filters {
    groupBy: AnalyticsGroupBy[];
    from: string;
    to: string;
    projectId: string;
    providerId: string;
    providerAccountId: string;
    apiKeyId: string;
}

interface ApiKey { id: string; name: string | null; key: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (bytes: number) => {
    if (!bytes) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const makeFrom = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    return isoDate(d);
};

const ACTION_ICON: Record<string, React.ReactNode> = {
    upload: <UploadIcon sx={{ fontSize: 14 }} />,
    download: <DownloadIcon sx={{ fontSize: 14 }} />,
    delete: <DeleteIcon sx={{ fontSize: 14 }} />,
    signed_url: <BarChartIcon sx={{ fontSize: 14 }} />,
};

const ACTION_COLOR: Record<string, string> = {
    upload: '#6366F1',
    download: '#10B981',
    delete: '#EF4444',
    signed_url: '#F59E0B',
};

const STATUS_COLOR: Record<string, string> = {
    success: '#10B981',
    error: '#EF4444',
};

const GROUP_BY_OPTIONS: { value: AnalyticsGroupBy; label: string }[] = [
    { value: 'project', label: 'Project' },
    { value: 'provider', label: 'Provider' },
    { value: 'account', label: 'Account' },
    { value: 'apiKey', label: 'API Key' },
    { value: 'assetType', label: 'Asset Type' },
    { value: 'action', label: 'Action' },
    { value: 'status', label: 'Status' },
];

const PRESET_RANGES = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
];

const INIT_FILTERS: Filters = {
    groupBy: ['action'],
    from: makeFrom(7),
    to: isoDate(new Date()),
    projectId: '',
    providerId: '',
    providerAccountId: '',
    apiKeyId: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, accent, loading }: {
    label: string; value: string | number; icon: React.ReactNode; accent: string; loading: boolean;
}) => (
    <Paper elevation={0} sx={{
        p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3,
        borderLeft: `3px solid ${accent}`, height: '100%',
    }}>
        {loading ? (
            <><Skeleton width="60%" height={14} /><Skeleton width="40%" height={32} sx={{ mt: 0.5 }} /></>
        ) : (
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 10 }}>
                        {label}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} mt={0.5}
                        sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: `${accent}18`, borderRadius: 2, color: accent }}>{icon}</Box>
            </Stack>
        )}
    </Paper>
);

const MiniBarChart = ({ data, loading }: {
    data: { label: string; value: number; color?: string }[];
    loading: boolean;
}) => {
    const theme = useTheme();
    const faint = theme.palette.text.disabled;
    const surface = theme.palette.action.hover;

    if (loading) return <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} />;
    if (!data.length) return (
        <Stack alignItems="center" justifyContent="center" py={3} gap={1}>
            <EmptyIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">No events in this period</Typography>
        </Stack>
    );

    const W = 560, H = 110, padL = 4, padR = 4, padT = 12, padB = 24;
    const chartH = H - padT - padB;
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = (W - padL - padR) / data.length;
    const gap = barW * 0.28;

    let svg = '';
    for (let i = 1; i <= 3; i++) {
        const y = padT + chartH - (i / 3) * chartH;
        svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${surface}" stroke-width="0.8"/>`;
    }
    data.forEach((d, i) => {
        const bh = Math.max(3, (d.value / max) * chartH);
        const x = padL + i * barW + gap / 2;
        const y = padT + chartH - bh;
        const color = d.color || '#6366F1';
        svg += `<rect x="${x}" y="${y}" width="${barW - gap}" height="${bh}" fill="${color}" opacity="0.85" rx="3"><title>${d.label}: ${d.value}</title></rect>`;
        svg += `<text x="${x + (barW - gap) / 2}" y="${padT + chartH - bh - 4}" text-anchor="middle" font-size="8" fill="${color}" font-weight="600">${d.value}</text>`;
        svg += `<text x="${x + (barW - gap) / 2}" y="${H - padB + 13}" text-anchor="middle" font-size="9" fill="${faint}" text-transform="capitalize">${d.label.replace('_', ' ')}</text>`;
    });

    return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} dangerouslySetInnerHTML={{ __html: svg }} />;
};

const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" display="block">{sub}</Typography>}
        </Box>
        <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
);

const FilterLabel = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="caption" color="text.secondary" fontWeight={600}
        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10, display: 'block', mb: 0.75 }}>
        {children}
    </Typography>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AssetAnalyticsPage = () => {
    usePageTitle('Asset Analytics');

    const [rows, setRows] = useState<AnalyticsRow[]>([]);
    const [actionRows, setActionRows] = useState<AnalyticsRow[]>([]); // always-on action breakdown
    const [loading, setLoading] = useState(false);
    const [preset, setPreset] = useState('7d');

    // Reference data
    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [accounts, setAccounts] = useState<ProviderAccount[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [refLoading, setRefLoading] = useState(true);

    const [filters, setFilters] = useState<Filters>(INIT_FILTERS);

    // Load reference data on mount
    useEffect(() => {
        setRefLoading(true);
        Promise.all([getProjectsService(), getGlobalProvidersService()])
            .then(async ([proj, prov]) => {
                const provList: Provider[] = prov.data ?? [];
                setProjects(proj.data ?? []);
                setProviders(provList);
                const accArrays = await Promise.all(
                    provList.map(p =>
                        apiInstance.get(`${BASE}/global-providers/${p.id}/accounts`)
                            .then((r: any) => r.data?.data ?? [])
                            .catch(() => [] as ProviderAccount[])
                    )
                );
                setAccounts(accArrays.flat());
            })
            .finally(() => setRefLoading(false));
    }, []);

    // Load API keys when project changes
    useEffect(() => {
        if (!filters.projectId) { setApiKeys([]); return; }
        listProjectApiKeysService(filters.projectId)
            .then(res => setApiKeys(res.data ?? []))
            .catch(() => setApiKeys([]));
    }, [filters.projectId]);

    // Name resolvers
    const projectName = (id?: string | null) => id ? (projects.find(p => p.id === id)?.name ?? id) : '—';
    const providerName = (id?: string | null) => id ? (providers.find(p => p.id === id)?.label ?? id) : '—';
    const accountName = (id?: string | null) => id ? (accounts.find(a => a.id === id)?.label ?? id) : '—';
    const apiKeyName = (id?: string | null) => {
        if (!id) return '—';
        const k = apiKeys.find(k => k.id === id);
        return k ? (k.name ?? k.key.slice(0, 14) + '…') : id;
    };

    const resolveCell = (colKey: AnalyticsGroupBy, val?: string | null): string => {
        if (!val) return '—';
        switch (colKey) {
            case 'project': return projectName(val);
            case 'provider': return providerName(val);
            case 'account': return accountName(val);
            case 'apiKey': return apiKeyName(val);
            default: return val;
        }
    };

    // Build base query params (shared by both fetches)
    const buildParams = useCallback((extraGroupBy?: string) => {
        const p: Record<string, string> = {};
        p.groupBy = extraGroupBy ?? filters.groupBy.join(',');
        if (filters.from) p.from = filters.from;
        if (filters.to) p.to = filters.to;
        if (filters.projectId) p.projectId = filters.projectId;
        if (filters.providerId) p.providerId = filters.providerId;
        if (filters.providerAccountId) p.providerAccountId = filters.providerAccountId;
        if (filters.apiKeyId) p.apiKeyId = filters.apiKeyId;
        return p;
    }, [filters]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const url = getApiUrl('getAssetUsageAnalytics');
            const [main, action] = await Promise.all([
                apiInstance.get(url, { params: buildParams() }),
                apiInstance.get(url, { params: buildParams('action') }),
            ]);
            setRows(main.data?.data ?? []);
            setActionRows(action.data?.data ?? []);
        } catch {
            setRows([]);
            setActionRows([]);
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePreset = (_: unknown, val: string | null) => {
        if (!val) return;
        setPreset(val);
        const days = PRESET_RANGES.find(p => p.label === val)?.days ?? 7;
        setFilters(f => ({ ...f, from: makeFrom(days), to: isoDate(new Date()) }));
    };

    // Active entity filters for chips display
    const activeEntityFilters: { label: string; key: keyof Filters }[] = [
        filters.projectId ? { label: `Project: ${projectName(filters.projectId)}`, key: 'projectId' } : null,
        filters.providerId ? { label: `Provider: ${providerName(filters.providerId)}`, key: 'providerId' } : null,
        filters.providerAccountId ? { label: `Account: ${accountName(filters.providerAccountId)}`, key: 'providerAccountId' } : null,
        filters.apiKeyId ? { label: `API Key: ${apiKeyName(filters.apiKeyId)}`, key: 'apiKeyId' } : null,
    ].filter(Boolean) as { label: string; key: keyof Filters }[];

    const clearFilter = (key: keyof Filters) => {
        setFilters(f => {
            const next = { ...f, [key]: '' };
            // cascade clears
            if (key === 'projectId') next.apiKeyId = '';
            if (key === 'providerId') next.providerAccountId = '';
            return next;
        });
    };

    const clearAllFilters = () => setFilters(f => ({
        ...f, projectId: '', providerId: '', providerAccountId: '', apiKeyId: '',
    }));

    // Derived stats
    const totalEvents = rows.reduce((s, r) => s + r.totalEvents, 0);
    const totalSize = rows.reduce((s, r) => s + r.totalSizeBytes, 0);
    const totalErrors = rows.filter(r => r.status === 'error').reduce((s, r) => s + r.totalEvents, 0);
    const totalUploads = rows.filter(r => r.action === 'upload').reduce((s, r) => s + r.totalEvents, 0);

    // Action chart always uses independent actionRows fetch
    const actionChartData = ['upload', 'download', 'delete', 'signed_url'].map(a => ({
        label: a,
        value: actionRows.filter(r => r.action === a).reduce((s, r) => s + r.totalEvents, 0),
        color: ACTION_COLOR[a],
    })).filter(d => d.value > 0);

    const dimensionCols = filters.groupBy.map(g => {
        const fieldMap: Record<AnalyticsGroupBy, keyof AnalyticsRow> = {
            project: 'projectId', provider: 'providerId', account: 'providerAccountId',
            apiKey: 'apiKeyId', assetType: 'assetType', action: 'action', status: 'status',
        };
        return { key: g, field: fieldMap[g] };
    });

    return (
        <Box>
            {/* Stat cards */}
            <Grid container spacing={2} mb={3}>
                {[
                    { label: 'Total Events', value: loading ? '—' : totalEvents.toLocaleString(), icon: <BarChartIcon />, accent: '#6366F1' },
                    { label: 'Uploads', value: loading ? '—' : totalUploads.toLocaleString(), icon: <UploadIcon />, accent: '#10B981' },
                    { label: 'Storage Transferred', value: loading ? '—' : fmt(totalSize), icon: <BarChartIcon />, accent: '#F59E0B' },
                    { label: 'Errors', value: loading ? '—' : totalErrors.toLocaleString(), icon: <ErrorIcon />, accent: '#EF4444' },
                ].map(c => (
                    <Grid key={c.label} size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard {...c} loading={loading} />
                    </Grid>
                ))}
            </Grid>

            {/* Filter bar */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, px: 2, py: 1.25, mb: activeEntityFilters.length ? 1.5 : 3 }}>
                <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">

                    {/* Group By */}
                    <Box>
                        <FilterLabel>Group By</FilterLabel>
                        <Select
                            multiple size="small"
                            value={filters.groupBy}
                            onChange={e => {
                                const val = e.target.value as AnalyticsGroupBy[];
                                if (val.length) setFilters(f => ({ ...f, groupBy: val }));
                            }}
                            input={<OutlinedInput size="small" />}
                            renderValue={selected => (
                                <Stack direction="row" gap={0.5} flexWrap="wrap">
                                    {(selected as AnalyticsGroupBy[]).map(v => (
                                        <Chip key={v}
                                            label={GROUP_BY_OPTIONS.find(o => o.value === v)?.label ?? v}
                                            size="small" sx={{ height: 18, fontSize: 11 }} />
                                    ))}
                                </Stack>
                            )}
                            sx={{ minWidth: 160, maxWidth: 280 }}
                            MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
                        >
                            {GROUP_BY_OPTIONS.map(o => (
                                <MenuItem key={o.value} value={o.value} dense>
                                    <Checkbox checked={filters.groupBy.includes(o.value)} size="small" sx={{ py: 0 }} />
                                    <ListItemText primary={o.label} primaryTypographyProps={{ fontSize: 13 }} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>

                    {/* Date Range */}
                    <Box>
                        <FilterLabel>Date Range</FilterLabel>
                        <Stack direction="row" alignItems="center" gap={0.75}>
                            <ToggleButtonGroup value={preset} exclusive onChange={handlePreset} size="small"
                                sx={{ '& .MuiToggleButtonGroup-grouped': { border: '1px solid !important', borderRadius: '6px !important', m: 0 } }}>
                                {PRESET_RANGES.map(p => (
                                    <ToggleButton key={p.label} value={p.label} sx={{ px: 1.25, py: 0.4, fontSize: 11, textTransform: 'none' }}>
                                        {p.label}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                            <TextField size="small" type="date" value={filters.from}
                                onChange={e => { setPreset(''); setFilters(f => ({ ...f, from: e.target.value })); }}
                                sx={{ width: 130 }} />
                            <Typography variant="caption" color="text.secondary">–</Typography>
                            <TextField size="small" type="date" value={filters.to}
                                onChange={e => { setPreset(''); setFilters(f => ({ ...f, to: e.target.value })); }}
                                sx={{ width: 130 }} />
                        </Stack>
                    </Box>

                    {/* Project */}
                    <Box>
                        <FilterLabel>Project</FilterLabel>
                        <TextField select size="small" sx={{ width: 160 }}
                            value={filters.projectId}
                            onChange={e => setFilters(f => ({ ...f, projectId: e.target.value, apiKeyId: '' }))}
                            disabled={refLoading}>
                            <MenuItem value="">All Projects</MenuItem>
                            {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* Provider */}
                    <Box>
                        <FilterLabel>Provider</FilterLabel>
                        <TextField select size="small" sx={{ width: 150 }}
                            value={filters.providerId}
                            onChange={e => setFilters(f => ({ ...f, providerId: e.target.value, providerAccountId: '' }))}
                            disabled={refLoading}>
                            <MenuItem value="">All Providers</MenuItem>
                            {providers.map(p => <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* Account */}
                    <Box>
                        <FilterLabel>Account</FilterLabel>
                        <TextField select size="small" sx={{ width: 160 }}
                            value={filters.providerAccountId}
                            onChange={e => setFilters(f => ({ ...f, providerAccountId: e.target.value }))}
                            disabled={refLoading}>
                            <MenuItem value="">All Accounts</MenuItem>
                            {accounts
                                .filter(a => !filters.providerId || a.providerId === filters.providerId)
                                .map(a => <MenuItem key={a.id} value={a.id}>{a.label}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* API Key */}
                    <Box>
                        <FilterLabel>API Key</FilterLabel>
                        <Tooltip title={!filters.projectId ? 'Select a project first' : ''} placement="top">
                            <span>
                                <TextField select size="small" sx={{ width: 150 }}
                                    value={filters.apiKeyId}
                                    onChange={e => setFilters(f => ({ ...f, apiKeyId: e.target.value }))}
                                    disabled={!filters.projectId}>
                                    <MenuItem value="">All API Keys</MenuItem>
                                    {apiKeys.map(k => (
                                        <MenuItem key={k.id} value={k.id}>
                                            {k.name ?? k.key.slice(0, 16) + '…'}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </span>
                        </Tooltip>
                    </Box>

                </Stack>
            </Paper>

            {/* Active filter chips */}
            {activeEntityFilters.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" mb={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Filtered by:</Typography>
                    {activeEntityFilters.map(f => (
                        <Chip
                            key={f.key}
                            label={f.label}
                            size="small"
                            onDelete={() => clearFilter(f.key)}
                            deleteIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                            sx={{
                                fontSize: 12, bgcolor: 'primary.main', color: 'white',
                                '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }
                            }}
                        />
                    ))}
                    <Button size="small" onClick={clearAllFilters}
                        sx={{ fontSize: 11, textTransform: 'none', color: 'text.secondary', minWidth: 0, px: 1 }}>
                        Clear all
                    </Button>
                </Stack>
            )}

            {/* Chart + top rows */}
            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Section title="Events by Action" sub="Always shows action breakdown regardless of Group By">
                        <MiniBarChart data={actionChartData} loading={loading} />
                    </Section>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Section title="Top Results" sub="Highest activity rows in current view">
                        {loading ? (
                            <Stack spacing={1}>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={28} />)}</Stack>
                        ) : rows.length === 0 ? (
                            <Stack alignItems="center" justifyContent="center" py={3} gap={1}>
                                <EmptyIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary" textAlign="center">
                                    No events found. Try expanding the date range or clearing filters.
                                </Typography>
                            </Stack>
                        ) : rows.slice(0, 6).map((row, i) => {
                            const label = dimensionCols.map(c => resolveCell(c.key, row[c.field] as string)).join(' · ');
                            const pct = totalEvents ? Math.round((row.totalEvents / totalEvents) * 100) : 0;
                            return (
                                <Box key={i} mb={1.5}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.35}>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '70%' }}>
                                            {label || '(all)'}
                                        </Typography>
                                        <Stack direction="row" gap={0.75}>
                                            <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                                {row.totalEvents.toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">{pct}%</Typography>
                                        </Stack>
                                    </Stack>
                                    <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: 'primary.main', borderRadius: 2, opacity: 0.7 }} />
                                    </Box>
                                </Box>
                            );
                        })}
                    </Section>
                </Grid>
            </Grid>

            {/* Data table */}
            <Section
                title={`Results (${rows.length} row${rows.length !== 1 ? 's' : ''})`}
                sub={`Grouped by: ${filters.groupBy.map(g => GROUP_BY_OPTIONS.find(o => o.value === g)?.label ?? g).join(', ')}`}
            >
                <TableContainer sx={{ maxHeight: 480 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                {dimensionCols.map(c => (
                                    <TableCell key={c.key} sx={{ fontWeight: 700, fontSize: 12, textTransform: 'capitalize', bgcolor: 'background.paper' }}>
                                        {GROUP_BY_OPTIONS.find(o => o.value === c.key)?.label ?? c.key}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, bgcolor: 'background.paper' }}>Events</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, bgcolor: 'background.paper' }}>Size</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {dimensionCols.map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                                        <TableCell><Skeleton /></TableCell>
                                        <TableCell><Skeleton /></TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={dimensionCols.length + 2} align="center" sx={{ py: 5 }}>
                                        <Stack alignItems="center" gap={1}>
                                            <EmptyIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                No events in this date range
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                Try expanding the date range or clearing active filters
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : rows.map((row, i) => (
                                <TableRow key={i} hover>
                                    {dimensionCols.map(c => {
                                        const raw = row[c.field] as string | null | undefined;
                                        const display = resolveCell(c.key, raw);
                                        const isAction = c.key === 'action' && raw;
                                        const isStatus = c.key === 'status' && raw;
                                        return (
                                            <TableCell key={c.key}>
                                                {isAction ? (
                                                    <Stack direction="row" alignItems="center" gap={0.5}>
                                                        <Box sx={{ color: ACTION_COLOR[raw as string] ?? 'text.secondary' }}>
                                                            {ACTION_ICON[raw as string]}
                                                        </Box>
                                                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                                                            {(raw as string).replace('_', ' ')}
                                                        </Typography>
                                                    </Stack>
                                                ) : isStatus ? (
                                                    <Chip label={raw} size="small" sx={{
                                                        height: 18, fontSize: 11,
                                                        bgcolor: `${STATUS_COLOR[raw as string] ?? '#94A3B8'}18`,
                                                        color: STATUS_COLOR[raw as string] ?? 'text.secondary',
                                                        fontWeight: 600,
                                                    }} />
                                                ) : (
                                                    <Typography variant="caption">
                                                        {display === '—' ? <span style={{ opacity: 0.35 }}>—</span> : display}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell align="right">
                                        <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {row.totalEvents.toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {row.totalSizeBytes ? fmt(row.totalSizeBytes) : '—'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Section>
        </Box>
    );
};

export default AssetAnalyticsPage;
