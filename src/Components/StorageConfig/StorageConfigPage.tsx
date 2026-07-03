import { useState, useEffect } from 'react';
import {
    Box, Container, Paper, Typography, Stack, Switch, FormControlLabel,
    Select, MenuItem, Button, Chip, Divider, Alert, Skeleton,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    TextField, InputAdornment, Grid,
} from '@mui/material';
import {
    Save as SaveIcon,
    Cloud as CloudIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import { useToast } from '../../Utils/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

const ASSET_TYPES = ['image', 'video', 'document', 'audio', 'other'] as const;
type AssetType = typeof ASSET_TYPES[number];

interface ProviderConfig {
    label: string;
    enabled: boolean;
    supportedAssetTypes: string[];
    maxFileSizeBytes: number;
}

interface StorageConfig {
    providers: Record<string, ProviderConfig>;
    defaults: Record<AssetType, string>;
    signedUrlTtlSeconds: number;
}

const fmt = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const PROVIDER_COLORS: Record<string, string> = {
    cloudinary: '#4361EE',
    s3: '#FF9900',
    railway: '#7928CA',
};

const StorageConfigPage = () => {
    usePageTitle('Storage Configuration');

    const { showSuccess, showError } = useToast();
    const [config, setConfig] = useState<StorageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiInstance.get(getApiUrl('getStorageConfig'))
            .then(r => setConfig(r.data?.data || r.data))
            .catch(() => showError('Failed to load storage config'))
            .finally(() => setLoading(false));
    }, []);

    const handleProviderToggle = (providerKey: string, enabled: boolean) => {
        if (!config) return;
        setConfig({
            ...config,
            providers: {
                ...config.providers,
                [providerKey]: { ...config.providers[providerKey], enabled },
            },
        });
    };

    const handleDefaultChange = (assetType: AssetType, provider: string) => {
        if (!config) return;
        setConfig({ ...config, defaults: { ...config.defaults, [assetType]: provider } });
    };

    const handleTtlChange = (value: number) => {
        if (!config) return;
        setConfig({ ...config, signedUrlTtlSeconds: value });
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await apiInstance.put(getApiUrl('updateStorageConfig'), {
                providers: config.providers,
                defaults: config.defaults,
                signedUrlTtlSeconds: config.signedUrlTtlSeconds,
            });
            showSuccess('Storage configuration saved');
        } catch {
            showError('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth={false}>
                <Stack spacing={2}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Paper key={i} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Skeleton width="30%" height={24} />
                            <Skeleton width="80%" height={20} sx={{ mt: 1 }} />
                        </Paper>
                    ))}
                </Stack>
            </Container>
        );
    }

    if (!config) return null;

    const enabledProviders = Object.entries(config.providers).filter(([, v]) => v.enabled).map(([k]) => k);

    return (
        <>
            <Stack spacing={3}>
                {/* Providers */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" fontWeight={700}>Storage Providers</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Enable or disable providers. At least one must be enabled.
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Provider</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Supported Types</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Max File Size</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Enabled</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(config.providers).map(([key, prov]) => (
                                    <TableRow key={key} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <CloudIcon sx={{ color: PROVIDER_COLORS[key] || 'text.disabled', fontSize: 20 }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{prov.label || key}</Typography>
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>{key}</Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {prov.supportedAssetTypes.map(t => (
                                                    <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                                                ))}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{fmt(prov.maxFileSizeBytes)}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Switch
                                                checked={prov.enabled}
                                                onChange={(e) => handleProviderToggle(key, e.target.checked)}
                                                color="success"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Default provider per asset type */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" fontWeight={700}>Default Provider per Asset Type</Typography>
                        <Typography variant="caption" color="text.secondary">
                            OpsHub uses these defaults — callers cannot override the provider.
                        </Typography>
                    </Box>
                    {enabledProviders.length === 0 ? (
                        <Alert severity="error" sx={{ m: 2 }}>No providers are enabled. Enable at least one provider above.</Alert>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Asset Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Default Provider</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ASSET_TYPES.map(type => {
                                        const current = config.defaults[type];
                                        const providerEnabled = config.providers[current]?.enabled;
                                        return (
                                            <TableRow key={type} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                                        {type}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        size="small"
                                                        value={current}
                                                        onChange={(e) => handleDefaultChange(type, e.target.value)}
                                                        sx={{ minWidth: 160 }}
                                                    >
                                                        {Object.entries(config.providers).map(([k, p]) => (
                                                            <MenuItem key={k} value={k} disabled={!p.enabled}>
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <CloudIcon sx={{ color: PROVIDER_COLORS[k] || 'text.disabled', fontSize: 16 }} />
                                                                    <span>{p.label || k}</span>
                                                                    {!p.enabled && <Chip label="disabled" size="small" sx={{ fontSize: 10 }} />}
                                                                </Stack>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    {providerEnabled ? (
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} />
                                                            <Typography variant="caption" color="success.main">Active</Typography>
                                                        </Stack>
                                                    ) : (
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                                                            <Typography variant="caption" color="error.main">Provider disabled</Typography>
                                                        </Stack>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>

                {/* TTL */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Signed URL TTL</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        How long signed URLs for private assets remain valid.
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <TextField
                                type="number"
                                size="small"
                                label="TTL in seconds"
                                value={config.signedUrlTtlSeconds}
                                onChange={(e) => handleTtlChange(Number(e.target.value))}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                                }}
                                fullWidth
                                inputProps={{ min: 60, max: 86400 }}
                            />
                        </Grid>
                        <Grid item>
                            <Typography variant="body2" color="text.secondary">
                                = {Math.round(config.signedUrlTtlSeconds / 60)} minutes
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Save button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || enabledProviders.length === 0}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                    >
                        {saving ? 'Saving…' : 'Save Configuration'}
                    </Button>
                </Box>
            </Stack>
        </>
    );
};

export default StorageConfigPage;
