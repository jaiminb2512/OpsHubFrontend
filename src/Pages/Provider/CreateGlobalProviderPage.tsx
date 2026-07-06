import { useState } from 'react';
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
import { createGlobalProviderService, type ProviderCategory } from '../../Services/ApiServices/providerServices';

type AccountDraft = {
    id: string;                           // client-only key
    label: string;
    credentialsJson: string;              // raw JSON string the user types
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

// ─────────────────────────────────────────────────────────────────────────────

export default function CreateGlobalProviderPage() {
    usePageTitle('Create Global Provider', undefined, true);
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    // ── Provider fields ──────────────────────────────────────────────────────
    const [category, setCategory] = useState<ProviderCategory>('storage');
    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [isDefault, setIsDefault] = useState(true);

    // ── Accounts ─────────────────────────────────────────────────────────────
    const [accounts, setAccounts] = useState<AccountDraft[]>([newDraft(true)]);

    // ── Errors ───────────────────────────────────────────────────────────────
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const resolvedName = name.toLowerCase().trim();

    // ── Account helpers ──────────────────────────────────────────────────────

    const updateAccount = (id: string, patch: Partial<AccountDraft>) =>
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

    const addAccount = () =>
        setAccounts(prev => [...prev, newDraft(false)]);

    const removeAccount = (id: string) =>
        setAccounts(prev => {
            const next = prev.filter(a => a.id !== id);
            // ensure at least one is default
            if (next.length && !next.some(a => a.isDefault)) next[0].isDefault = true;
            return next;
        });

    const setAccountDefault = (id: string) =>
        setAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));

    // ── Validation ───────────────────────────────────────────────────────────

    const validate = () => {
        const e: Record<string, string> = {};
        if (!resolvedName) e.name = 'Provider name is required';
        if (!label.trim()) e.label = 'Label is required';

        accounts.forEach((acc) => {
            if (!acc.label.trim())
                e[`acc_label_${acc.id}`] = 'Account label is required';

            const parsed = tryParseJson(acc.credentialsJson);
            if (!parsed)
                e[`acc_creds_${acc.id}`] = 'Must be valid JSON object';
            else if (Object.keys(parsed).length === 0)
                e[`acc_creds_${acc.id}`] = 'Credentials cannot be empty';
        });

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const res = await createGlobalProviderService({
                category,
                name: resolvedName,
                label: label.trim(),
                description: description.trim() || undefined,
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

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>

            {/* ── Section 1: Provider details ── */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography fontWeight={700} fontSize={15} mb={2.5}>
                    Provider Details
                </Typography>

                {/* Row 1: category + provider name + label */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2.5}>
                    <FormControl size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
                        <InputLabel>Category</InputLabel>
                        <Select value={category} label="Category"
                            onChange={e => {
                                setCategory(e.target.value as ProviderCategory);
                                setName('');
                            }}>
                            <MenuItem value="storage">Storage</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField size="small" label="Provider Name *"
                        placeholder="e.g. cloudinary, s3, brevo, smtp"
                        value={name}
                        error={!!errors.name}
                        sx={{ flex: 1 }}
                        onChange={e => {
                            setName(e.target.value);
                            if (errors.name) setErrors(p => ({ ...p, name: '' }));
                        }} />

                    <TextField size="small" label="Label *"
                        placeholder="e.g. Default Cloudinary"
                        value={label}
                        error={!!errors.label}
                        helperText={errors.label}
                        sx={{ flex: 1 }}
                        onChange={e => { setLabel(e.target.value); if (errors.label) setErrors(p => ({ ...p, label: '' })); }} />
                </Stack>

                {/* Row 2: description + default toggle */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                    <TextField size="small" label="Description (optional)"
                        value={description}
                        sx={{ flex: 1 }}
                        onChange={e => setDescription(e.target.value)} />

                    <FormControlLabel
                        control={<Switch checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />}
                        label="Set as default fallback"
                        sx={{ flexShrink: 0, ml: 0, mt: 0.5 }}
                    />
                </Stack>
            </Paper>

            {/* ── Section 2: Accounts ── */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontWeight={700} fontSize={15}>Accounts</Typography>
                    <Chip label={accounts.length} size="small"
                        sx={{
                            bgcolor: colors.primary.rgba?.light || '#e8eafc',
                            color: colors.primary.main, fontWeight: 700, height: 20
                        }} />
                </Stack>
                <Button size="small" startIcon={<AddIcon />} onClick={addAccount}
                    sx={{ color: colors.primary.main, fontSize: 13 }}>
                    Add Account
                </Button>
            </Stack>

            {accounts.map((acc, idx) => (
                <Paper key={acc.id} variant="outlined" sx={{
                    p: 2.5, borderRadius: 2, mb: 2,
                    borderColor: acc.isDefault
                        ? colors.success.main
                        : (colors.border?.light || '#e0e0e0'),
                }}>
                    {/* Account header */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography fontWeight={600} fontSize={14}>
                                Account {idx + 1}
                            </Typography>
                            {acc.isDefault && (
                                <Chip label="Default" size="small"
                                    sx={{
                                        height: 18, fontSize: 11,
                                        bgcolor: colors.success.background,
                                        color: colors.success.dark
                                    }} />
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

                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label="Credentials (JSON) *"
                            placeholder={'{\n  "apiKey": "...",\n  "fromEmail": "you@example.com"\n}'}
                            value={acc.credentialsJson}
                            error={!!errors[`acc_creds_${acc.id}`]}
                            helperText={errors[`acc_creds_${acc.id}`] || 'Paste or type credentials as a JSON object'}
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

            {/* ── Actions ── */}
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button variant="outlined" onClick={() => navigate(DASHBOARD_PATHS.GLOBAL_PROVIDERS)}
                    disabled={saving}>
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
