import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button, Chip, CircularProgress, Divider, FormControl,
    FormControlLabel, IconButton, InputLabel, MenuItem, Paper, Select,
    Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Star as StarIcon,
    RadioButtonUnchecked as NotDefaultIcon,
} from '@mui/icons-material';
import { colors } from '../../Utils/colors';
import { useToast } from '../../Utils/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { DASHBOARD_PATHS } from '../../Path';
import {
    createGlobalProviderService,
    getProviderCatalogService,
    type ProviderCatalogEntry,
} from '../../Services/ApiServices/providerServices';

type AccountDraft = {
    id: string;
    label: string;
    credentialsJson: string;
    isDefault: boolean;
};

const newDraft = (isFirst = false): AccountDraft => ({
    id: Math.random().toString(36).slice(2),
    label: isFirst ? 'Primary' : '',
    credentialsJson: '{}',
    isDefault: isFirst,
});

const tryParseJson = (raw: string): Record<string, string> | null => {
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
    return null;
};

export default function CreateGlobalProviderPage() {
    usePageTitle('Create Global Provider', undefined, true);
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [catalog, setCatalog] = useState<ProviderCatalogEntry[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [selectedProviderId, setSelectedProviderId] = useState('');
    const [label, setLabel] = useState('');
    const [isDefault, setIsDefault] = useState(true);
    const [accounts, setAccounts] = useState<AccountDraft[]>([newDraft(true)]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getProviderCatalogService()
            .then(res => { if (res.success === 200) setCatalog(res.data ?? []); })
            .catch(() => showError('Failed to load provider catalog'))
            .finally(() => setCatalogLoading(false));
    }, []);

    const selectedCatalog = catalog.find(c => c.id === selectedProviderId);

    const updateAccount = (id: string, patch: Partial<AccountDraft>) =>
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

    const addAccount = () => setAccounts(prev => [...prev, newDraft(false)]);

    const removeAccount = (id: string) =>
        setAccounts(prev => {
            const next = prev.filter(a => a.id !== id);
            if (next.length && !next.some(a => a.isDefault)) next[0].isDefault = true;
            return next;
        });

    const setAccountDefault = (id: string) =>
        setAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!selectedProviderId) e.providerId = 'Select a provider';
        if (!label.trim()) e.label = 'Label is required';
        accounts.forEach((acc) => {
            if (!acc.label.trim()) e[`acc_label_${acc.id}`] = 'Account label is required';
            const parsed = tryParseJson(acc.credentialsJson);
            if (!parsed) e[`acc_creds_${acc.id}`] = 'Must be valid JSON object';
            else if (Object.keys(parsed).length === 0) e[`acc_creds_${acc.id}`] = 'Credentials cannot be empty';
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const res = await createGlobalProviderService({
                providerId: selectedProviderId,
                label: label.trim(),
                isDefault,
                initialAccounts: accounts.map(acc => ({
                    label: acc.label.trim(),
                    credentials: tryParseJson(acc.credentialsJson)!,
                    isDefault: acc.isDefault,
                })),
            });

            if (res.success === 201) {
                showSuccess('Global provider created');
                navigate(DASHBOARD_PATHS.GLOBAL_PROVIDERS);
            } else {
                showError(res.message || 'Failed to create provider');
            }
        } catch (e: any) {
            showError(e?.response?.data?.message || 'Error creating provider');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography fontWeight={700} fontSize={15} mb={2.5}>Provider Details</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                    <FormControl size="small" sx={{ flex: 1 }} error={!!errors.providerId}>
                        <InputLabel>Provider *</InputLabel>
                        <Select
                            value={selectedProviderId}
                            label="Provider *"
                            disabled={catalogLoading}
                            onChange={e => {
                                setSelectedProviderId(e.target.value);
                                if (errors.providerId) setErrors(p => ({ ...p, providerId: '' }));
                            }}
                        >
                            {catalogLoading && <MenuItem value=""><em>Loading…</em></MenuItem>}
                            {catalog.map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <span>{p.label}</span>
                                        <Chip label={p.category} size="small"
                                            sx={{ height: 18, fontSize: 10, textTransform: 'capitalize' }} />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.providerId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                {errors.providerId}
                            </Typography>
                        )}
                    </FormControl>

                    <TextField size="small" label="Label *"
                        placeholder="e.g. Main Cloudinary, EU Bucket"
                        value={label}
                        error={!!errors.label}
                        helperText={errors.label}
                        sx={{ flex: 1 }}
                        onChange={e => { setLabel(e.target.value); if (errors.label) setErrors(p => ({ ...p, label: '' })); }} />

                    <FormControlLabel
                        control={<Switch checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />}
                        label="Set as default"
                        sx={{ flexShrink: 0, mt: 0.5 }}
                    />
                </Stack>

                {selectedCatalog?.description && (
                    <Typography variant="caption" color="text.secondary">{selectedCatalog.description}</Typography>
                )}
            </Paper>

            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontWeight={700} fontSize={15}>Accounts</Typography>
                    <Chip label={accounts.length} size="small"
                        sx={{ bgcolor: colors.primary.rgba?.light || '#e8eafc', color: colors.primary.main, fontWeight: 700, height: 20 }} />
                </Stack>
                <Button size="small" startIcon={<AddIcon />} onClick={addAccount}
                    sx={{ color: colors.primary.main, fontSize: 13 }}>
                    Add Account
                </Button>
            </Stack>

            {accounts.map((acc, idx) => (
                <Paper key={acc.id} variant="outlined" sx={{
                    p: 2.5, borderRadius: 2, mb: 2,
                    borderColor: acc.isDefault ? colors.success.main : (colors.border?.light || '#e0e0e0'),
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography fontWeight={600} fontSize={14}>Account {idx + 1}</Typography>
                            {acc.isDefault && (
                                <Chip label="Default" size="small"
                                    sx={{ height: 18, fontSize: 11, bgcolor: colors.success.background, color: colors.success.dark }} />
                            )}
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                            {!acc.isDefault && (
                                <Tooltip title="Set as default">
                                    <IconButton size="small" onClick={() => setAccountDefault(acc.id)}>
                                        <NotDefaultIcon sx={{ fontSize: 16, color: colors.warning.main }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {acc.isDefault && (
                                <Tooltip title="Default account">
                                    <IconButton size="small" disableRipple>
                                        <StarIcon sx={{ fontSize: 16, color: colors.warning.main }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {accounts.length > 1 && (
                                <Tooltip title="Remove account">
                                    <IconButton size="small" onClick={() => removeAccount(acc.id)}>
                                        <DeleteIcon sx={{ fontSize: 16, color: colors.error.main }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Stack>

                    <Stack spacing={2}>
                        <TextField size="small" fullWidth label="Account Label *"
                            placeholder="e.g. Primary, Production, Backup"
                            value={acc.label}
                            error={!!errors[`acc_label_${acc.id}`]}
                            helperText={errors[`acc_label_${acc.id}`]}
                            onChange={e => {
                                updateAccount(acc.id, { label: e.target.value });
                                if (errors[`acc_label_${acc.id}`])
                                    setErrors(p => { const n = { ...p }; delete n[`acc_label_${acc.id}`]; return n; });
                            }} />

                        <TextField fullWidth multiline rows={6}
                            label="Credentials (JSON) *"
                            placeholder={'{\n  "cloudName": "...",\n  "apiKey": "...",\n  "apiSecret": "..."\n}'}
                            value={acc.credentialsJson}
                            error={!!errors[`acc_creds_${acc.id}`]}
                            helperText={errors[`acc_creds_${acc.id}`] || 'Paste credentials as a JSON object'}
                            onChange={e => {
                                updateAccount(acc.id, { credentialsJson: e.target.value });
                                if (errors[`acc_creds_${acc.id}`])
                                    setErrors(p => { const n = { ...p }; delete n[`acc_creds_${acc.id}`]; return n; });
                            }}
                            inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                        />
                    </Stack>
                </Paper>
            ))}

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button variant="outlined" onClick={() => navigate(DASHBOARD_PATHS.GLOBAL_PROVIDERS)} disabled={saving}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={saving}
                    sx={{ background: colors.primary.gradient, minWidth: 160 }}>
                    {saving
                        ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                        : `Create Provider & ${accounts.length} Account${accounts.length > 1 ? 's' : ''}`}
                </Button>
            </Stack>
        </>
    );
}
