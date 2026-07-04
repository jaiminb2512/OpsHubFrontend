import { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, Typography, Chip, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, Skeleton,
} from '@mui/material';
import {
    FolderOpen as ProjectIcon,
    VpnKey as KeyIcon,
    Storage as StorageIcon,
} from '@mui/icons-material';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import usePageTitle from '../../hooks/usePageTitle';

interface ProjectStat {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    assetCount: number;
    totalSizeBytes: number;
    activeApiKeys: number;
}

const fmt = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

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

const DashboardStats = () => {
    usePageTitle('Dashboard');

    const [projects, setProjects] = useState<ProjectStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiInstance.get(getApiUrl('getDashboardStats'))
            .then(r => setProjects(r.data?.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalAssets = projects.reduce((s, p) => s + p.assetCount, 0);
    const totalBytes = projects.reduce((s, p) => s + p.totalSizeBytes, 0);
    const totalKeys = projects.reduce((s, p) => s + p.activeApiKeys, 0);
    const activeProjects = projects.filter(p => p.isActive).length;
    const maxAssets = Math.max(...projects.map(p => p.assetCount), 1);

    return (
        <>
            {/* Summary cards */}
            <Grid container spacing={2} mb={3}>
                {[
                    { label: 'Total Projects', value: loading ? '—' : projects.length, sub: `${activeProjects} active`, icon: <ProjectIcon /> },
                    { label: 'Total Assets', value: loading ? '—' : totalAssets, icon: <StorageIcon /> },
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

            {/* Per-project breakdown */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight={700}>Projects Breakdown</Typography>
                    <Typography variant="caption" color="text.secondary">Asset count, storage, and API keys per project</Typography>
                </Box>
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
                                    <TableRow key={p.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
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
