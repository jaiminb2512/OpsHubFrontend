import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Chip, CircularProgress, Collapse, Dialog,
    DialogActions, DialogContent, DialogTitle, Divider,
    FormControlLabel, IconButton, Paper,
    Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    CheckCircle as DefaultIcon,
    CloudUpload as StorageIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Email as EmailIcon,
    ExpandLess,
    ExpandMore,
    Language as GlobalIcon,
    RadioButtonUnchecked as NotDefaultIcon,
    Star as StarIcon,
    WifiTetheringError as TestIcon,
} from '@mui/icons-material';
import { colors } from '../../Utils/colors';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import usePageTitle from '../../hooks/usePageTitle';
import { DASHBOARD_PATHS } from '../../Path';
import {
    getGlobalProvidersService,
    updateGlobalProviderService,
    setDefaultGlobalProviderService,
    deleteGlobalProviderService,
    createGlobalProviderAccountService,
    updateGlobalProviderAccountService,
    setDefaultGlobalAccountService,
    deleteGlobalProviderAccountService,
    testGlobalProviderAccountService,
    type ProjectProvider,
    type ProviderAccount,
    type UpdateProviderPayload,
    type CreateAccountPayload,
} from '../../Services/ApiServices/providerServices';

// ── Credential field definitions ─────────────────────────────────────────────

const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; secret?: boolean; multiline?: boolean }[]> = {
    cloudinary: [
        { key: 'cloudName', label: 'Cloud Name' },
        { key: 'apiKey', label: 'API Key', secret: true },
        { key: 'apiSecret', label: 'API Secret', secret: true },
        { key: 'folder', label: 'Folder (optional)' },
    ],
    s3: [
        { key: 'accessKeyId', label: 'Access Key ID', secret: true },
        { key: 'secretAccessKey', label: 'Secret Access Key', secret: true },
        { key: 'region', label: 'Region (e.g. us-east-1)' },
        { key: 'bucket', label: 'Bucket Name' },
        { key: 'endpoint', label: 'Endpoint (optional — for S3-compatible)' },
    ],
    local: [
        { key: 'uploadDir', label: 'Upload Directory (absolute server path)' },
        { key: 'baseUrl', label: 'Public Base URL' },
    ],
    b2: [
        { key: 'accountId', label: 'Account ID', secret: true },
        { key: 'applicationKey', label: 'Application Key', secret: true },
        { key: 'bucketId', label: 'Bucket ID' },
        { key: 'bucketName', label: 'Bucket Name' },
        { key: 'endpoint', label: 'Endpoint' },
    ],
    gcs: [
        { key: 'projectId', label: 'GCS Project ID' },
        { key: 'bucket', label: 'Bucket Name' },
        { key: 'credentials', label: 'Service Account JSON', secret: true, multiline: true },
    ],
    brevo: [
        { key: 'apiKey', label: 'API Key', secret: true },
        { key: 'fromEmail', label: 'From Email' },
        { key: 'fromName', label: 'From Name' },
    ],
    smtp: [
        { key: 'host', label: 'Host' },
        { key: 'port', label: 'Port (e.g. 587)' },
        { key: 'user', label: 'Username' },
        { key: 'pass', label: 'Password', secret: true },
        { key: 'fromEmail', label: 'From Email' },
        { key: 'fromName', label: 'From Name' },
        { key: 'secure', label: 'Secure (true/false)' },
    ],
    resend: [
        { key: 'apiKey', label: 'API Key', secret: true },
        { key: 'fromEmail', label: 'From Email' },
        { key: 'fromName', label: 'From Name' },
    ],
    sendgrid: [
        { key: 'apiKey', label: 'API Key', secret: true },
        { key: 'fromEmail', label: 'From Email' },
        { key: 'fromName', label: 'From Name' },
    ],
};

// ── Styles ───────────────────────────────────────────────────────────────────

const cardSx = {
    borderRadius: 2,
    border: `1px solid ${colors.border.light}`,
    overflow: 'hidden',
    mb: 2,
};

const headerSx = {
    p: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    bgcolor: colors.background.secondary,
    borderBottom: `1px solid ${colors.border.light}`,
};

const accountRowSx = {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    alignItems: 'center',
    gap: 1,
    p: '10px 16px',
    borderBottom: `1px solid ${colors.border.divider}`,
    '&:last-child': { borderBottom: 'none' },
};

// ── AccountRow ───────────────────────────────────────────────────────────────

const AccountRow = ({
    account,
    providerId,
    onSetDefault,
    onDelete,
    onTest,
    onEdit,
    testing,
}: {
    account: ProviderAccount;
    providerId: string;
    onSetDefault: (id: string) => void;
    onDelete: (id: string, label: string) => void;
    onTest: (id: string) => void;
    onEdit: (a: ProviderAccount) => void;
    testing: boolean;
}) => (
    <Box sx={accountRowSx}>
        <Stack direction="row" alignItems="center" spacing={1}>
            {account.isDefault
                ? <DefaultIcon sx={{ fontSize: 16, color: colors.success.main }} />
                : <NotDefaultIcon sx={{ fontSize: 16, color: colors.text.tertiary }} />}
            <Typography variant="body2" fontWeight={account.isDefault ? 600 : 400}>
                {account.label}
            </Typography>
            {account.isDefault && (
                <Chip label="Default" size="small"
                    sx={{ height: 18, fontSize: 11, bgcolor: colors.success.background, color: colors.success.dark }} />
            )}
            {!account.isActive && (
                <Chip label="Inactive" size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />
            )}
        </Stack>

        <Tooltip title="Test connection">
            <span>
                <IconButton size="small" onClick={() => onTest(account.id)} disabled={testing}>
                    {testing
                        ? <CircularProgress size={14} />
                        : <TestIcon sx={{ fontSize: 16, color: colors.info.main }} />}
                </IconButton>
            </span>
        </Tooltip>

        <Stack direction="row" spacing={0.5}>
            {!account.isDefault && (
                <Tooltip title="Set as default">
                    <IconButton size="small" onClick={() => onSetDefault(account.id)}>
                        <StarIcon sx={{ fontSize: 16, color: colors.warning.main }} />
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(account)}>
                    <EditIcon sx={{ fontSize: 16, color: colors.info.main }} />
                </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete(account.id, account.label)}>
                    <DeleteIcon sx={{ fontSize: 16, color: colors.error.main }} />
                </IconButton>
            </Tooltip>
        </Stack>
    </Box>
);

// ── Main page ────────────────────────────────────────────────────────────────

export default function GlobalProvidersPage() {
    usePageTitle('Global Providers');

    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const confirm = useConfirm();

    const [providers, setProviders]   = useState<ProjectProvider[]>([]);
    const [loading, setLoading]       = useState(true);
    const [expanded, setExpanded]     = useState<Record<string, boolean>>({});
    const [testingId, setTestingId]   = useState<string | null>(null);

    // Edit provider dialog (for existing providers only — create uses dedicated page)
    const [providerDialog, setProviderDialog]   = useState(false);
    const [editingProvider, setEditingProvider] = useState<ProjectProvider | null>(null);
    const [providerForm, setProviderForm]       = useState<UpdateProviderPayload>({
        label: '', description: '', isDefault: false,
    });
    const [providerSaving, setProviderSaving] = useState(false);

    // Account dialog
    const [accountDialog, setAccountDialog]     = useState(false);
    const [accountProvider, setAccountProvider] = useState<ProjectProvider | null>(null);
    const [editingAccount, setEditingAccount]   = useState<ProviderAccount | null>(null);
    const [accountForm, setAccountForm]         = useState<CreateAccountPayload & { isDefault?: boolean }>({
        label: '', credentials: {}, isDefault: false,
    });
    const [accountSaving, setAccountSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getGlobalProvidersService();
            if (res.success === 200) setProviders(res.data ?? []);
        } catch { showError('Failed to load global providers'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const storageProviders = providers.filter(p => p.category === 'storage' && !p.isDeleted);
    const emailProviders   = providers.filter(p => p.category === 'email'   && !p.isDeleted);

    // ── Provider actions ─────────────────────────────────────────────────────

    const openEditProvider = (p: ProjectProvider) => {
        setEditingProvider(p);
        setProviderForm({ label: p.label, description: p.description ?? '', isDefault: p.isDefault });
        setProviderDialog(true);
    };

    const saveProvider = async () => {
        if (!providerForm.label || !editingProvider) return;
        setProviderSaving(true);
        try {
            const res = await updateGlobalProviderService(editingProvider.id, providerForm);
            if (res.success === 200) { showSuccess('Provider updated'); load(); setProviderDialog(false); }
            else showError(res.message || 'Failed to update');
        } catch (e: any) { showError(e?.response?.data?.message || 'Error saving provider'); }
        finally { setProviderSaving(false); }
    };

    const handleSetDefaultProvider = async (p: ProjectProvider) => {
        try {
            await setDefaultGlobalProviderService(p.id);
            showSuccess(`${p.label} set as default`);
            load();
        } catch { showError('Failed to set default'); }
    };

    const handleDeleteProvider = async (p: ProjectProvider) => {
        const ok = await confirm({
            title: 'Delete Global Provider',
            message: `Delete "${p.label}"? Projects using this as fallback will lose their provider.`,
            confirmText: 'Delete', confirmColor: 'error',
        });
        if (!ok) return;
        try {
            const res = await deleteGlobalProviderService(p.id);
            if (res.success === 200) { showSuccess('Provider deleted'); load(); }
            else showError(res.message || 'Failed to delete');
        } catch (e: any) { showError(e?.response?.data?.message || 'Cannot delete'); }
    };

    // ── Account actions ──────────────────────────────────────────────────────

    const openAddAccount = (p: ProjectProvider) => {
        setAccountProvider(p);
        setEditingAccount(null);
        setAccountForm({ label: '', credentials: {}, isDefault: false });
        setAccountDialog(true);
    };

    const openEditAccount = (p: ProjectProvider, account: ProviderAccount) => {
        setAccountProvider(p);
        setEditingAccount(account);
        setAccountForm({ label: account.label, credentials: {}, isDefault: account.isDefault });
        setAccountDialog(true);
    };

    const saveAccount = async () => {
        if (!accountProvider) return;
        setAccountSaving(true);
        try {
            if (editingAccount) {
                const payload: any = { label: accountForm.label };
                if (Object.keys(accountForm.credentials).length > 0) payload.credentials = accountForm.credentials;
                const res = await updateGlobalProviderAccountService(accountProvider.id, editingAccount.id, payload);
                if (res.success === 200) { showSuccess('Account updated'); load(); setAccountDialog(false); }
                else showError(res.message || 'Failed to update');
            } else {
                const res = await createGlobalProviderAccountService(accountProvider.id, accountForm as CreateAccountPayload);
                if (res.success === 201) { showSuccess('Account added'); load(); setAccountDialog(false); }
                else showError(res.message || 'Failed to add');
            }
        } catch (e: any) { showError(e?.response?.data?.message || 'Error saving account'); }
        finally { setAccountSaving(false); }
    };

    const handleSetDefaultAccount = async (providerId: string, accountId: string) => {
        try {
            await setDefaultGlobalAccountService(providerId, accountId);
            showSuccess('Default account updated');
            load();
        } catch { showError('Failed to set default'); }
    };

    const handleDeleteAccount = async (providerId: string, accountId: string, label: string) => {
        const ok = await confirm({
            title: 'Delete Account',
            message: `Delete account "${label}"?`,
            confirmText: 'Delete', confirmColor: 'error',
        });
        if (!ok) return;
        try {
            const res = await deleteGlobalProviderAccountService(providerId, accountId);
            if (res.success === 200) { showSuccess('Account deleted'); load(); }
            else showError(res.message || 'Failed to delete');
        } catch (e: any) { showError(e?.response?.data?.message || 'Cannot delete'); }
    };

    const handleTestAccount = async (providerId: string, accountId: string) => {
        setTestingId(accountId);
        try {
            const res = await testGlobalProviderAccountService(providerId, accountId);
            if (res.success === 200) showSuccess(res.data?.message || 'Connection successful');
            else showError(res.message || 'Test failed');
        } catch (e: any) { showError(e?.response?.data?.message || 'Connection test failed'); }
        finally { setTestingId(null); }
    };

    const credentialFields = CREDENTIAL_FIELDS[accountProvider?.name?.toLowerCase() ?? ''] ?? [];

    // ── Render section ───────────────────────────────────────────────────────

    const renderSection = (sectionProviders: ProjectProvider[], category: 'storage' | 'email') => (
        <Box mb={4}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    {category === 'storage'
                        ? <StorageIcon sx={{ fontSize: 18, color: colors.primary.main }} />
                        : <EmailIcon sx={{ fontSize: 18, color: colors.primary.main }} />}
                    <Typography variant="h6" fontWeight={700} fontSize={16}>
                        {category === 'storage' ? 'Global Storage Providers' : 'Global Email Providers'}
                    </Typography>
                    <Chip label={sectionProviders.length} size="small"
                        sx={{ bgcolor: colors.primary.rgba.light, color: colors.primary.main, fontWeight: 700 }} />
                </Stack>
                <Button size="small" startIcon={<AddIcon />} variant="outlined"
                    onClick={() => navigate(DASHBOARD_PATHS.GLOBAL_PROVIDERS_CREATE)}
                    sx={{
                        borderColor: colors.primary.main, color: colors.primary.main,
                        '&:hover': { bgcolor: colors.primary.rgba.light }
                    }}>
                    Add {category === 'storage' ? 'Storage' : 'Email'} Provider
                </Button>
            </Stack>

            {sectionProviders.length === 0 ? (
                <Paper variant="outlined" sx={{
                    p: 3, textAlign: 'center', borderRadius: 2,
                    borderStyle: 'dashed', borderColor: colors.border.light
                }}>
                    <Typography color="text.secondary" fontSize={14}>
                        No global {category} providers yet. Projects without their own {category} provider will fail until one is added here.
                    </Typography>
                </Paper>
            ) : (
                sectionProviders.map(p => {
                    const isOpen = expanded[p.id] ?? true;
                    return (
                        <Paper key={p.id} sx={cardSx}>
                            <Box sx={headerSx}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <IconButton size="small"
                                        onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !isOpen }))}>
                                        {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                    </IconButton>
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography fontWeight={700} fontSize={15}>{p.label}</Typography>
                                            <Chip label={p.name} size="small"
                                                sx={{
                                                    bgcolor: colors.primary.rgba.light,
                                                    color: colors.primary.main, fontSize: 11
                                                }} />
                                            {p.isDefault && (
                                                <Chip label="Default" size="small"
                                                    sx={{
                                                        bgcolor: colors.success.background,
                                                        color: colors.success.dark, fontSize: 11
                                                    }} />
                                            )}
                                            {!p.isActive && <Chip label="Inactive" size="small" color="warning" />}
                                        </Stack>
                                        {p.description && (
                                            <Typography fontSize={12} color="text.secondary" mt={0.25}>
                                                {p.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </Stack>

                                <Stack direction="row" spacing={0.5}>
                                    {!p.isDefault && (
                                        <Tooltip title="Set as default fallback">
                                            <IconButton size="small" onClick={() => handleSetDefaultProvider(p)}>
                                                <StarIcon sx={{ fontSize: 18, color: colors.warning.main }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => openEditProvider(p)}>
                                            <EditIcon sx={{ fontSize: 18, color: colors.info.main }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleDeleteProvider(p)}>
                                            <DeleteIcon sx={{ fontSize: 18, color: colors.error.main }} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Box>

                            <Collapse in={isOpen}>
                                {(p.accounts ?? []).length === 0 ? (
                                    <Box p={2}>
                                        <Typography fontSize={13} color="text.secondary">
                                            No accounts yet — add one to activate this global provider.
                                        </Typography>
                                    </Box>
                                ) : (
                                    (p.accounts ?? []).map(account => (
                                        <AccountRow
                                            key={account.id}
                                            account={account}
                                            providerId={p.id}
                                            testing={testingId === account.id}
                                            onSetDefault={(id) => handleSetDefaultAccount(p.id, id)}
                                            onDelete={(id, label) => handleDeleteAccount(p.id, id, label)}
                                            onTest={(id) => handleTestAccount(p.id, id)}
                                            onEdit={(acc) => openEditAccount(p, acc)}
                                        />
                                    ))
                                )}
                                <Box sx={{ p: 1.5, borderTop: `1px solid ${colors.border.divider}` }}>
                                    <Button size="small" startIcon={<AddIcon />}
                                        onClick={() => openAddAccount(p)}
                                        sx={{ color: colors.primary.main, fontSize: 13 }}>
                                        Add Account
                                    </Button>
                                </Box>
                            </Collapse>
                        </Paper>
                    );
                })
            )}
        </Box>
    );

    return (
        <>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                <Box sx={{
                    width: 40, height: 40, borderRadius: 2, display: 'grid',
                    placeItems: 'center', background: colors.primary.gradient
                }}>
                    <GlobalIcon sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={800} letterSpacing="-0.03em">
                        Global Providers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Fallback providers used by any project that hasn't configured its own
                    </Typography>
                </Box>
            </Stack>

            {/* Info banner */}
            <Alert severity="info" sx={{ mb: 3, fontSize: 13 }}>
                <strong>Resolution order:</strong> Project-scoped provider (default account) →
                Global provider (default account). Projects with their own provider configured
                always take priority.
            </Alert>

            {loading ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress size={32} />
                </Box>
            ) : (
                <>
                    {renderSection(storageProviders, 'storage')}
                    <Divider sx={{ my: 3 }} />
                    {renderSection(emailProviders, 'email')}
                </>
            )}

            {/* ── Edit Provider Dialog ── */}
            <Dialog open={providerDialog} onClose={() => setProviderDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Edit Global Provider</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} mt={1}>
                        <TextField size="small" fullWidth label="Label"
                            value={providerForm.label ?? ''}
                            onChange={e => setProviderForm(f => ({ ...f, label: e.target.value }))} />

                        <TextField size="small" fullWidth label="Description (optional)"
                            value={providerForm.description ?? ''}
                            onChange={e => setProviderForm(f => ({ ...f, description: e.target.value }))} />

                        <FormControlLabel
                            control={
                                <Switch checked={!!providerForm.isDefault}
                                    onChange={e => setProviderForm(f => ({ ...f, isDefault: e.target.checked }))} />
                            }
                            label="Set as default fallback for this category"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setProviderDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={saveProvider}
                        disabled={providerSaving || !providerForm.label}
                        sx={{ background: colors.primary.gradient }}>
                        {providerSaving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Add / Edit Account Dialog ── */}
            <Dialog open={accountDialog} onClose={() => setAccountDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>
                    {editingAccount ? 'Edit Account' : `Add Account — ${accountProvider?.name}`}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} mt={1}>
                        <TextField size="small" fullWidth label="Label"
                            placeholder="e.g. Primary, Backup"
                            value={accountForm.label}
                            onChange={e => setAccountForm(f => ({ ...f, label: e.target.value }))} />

                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Credentials{editingAccount ? ' (leave blank to keep existing)' : ''}
                        </Typography>

                        {credentialFields.length > 0 ? (
                            credentialFields.map(field => (
                                <TextField key={field.key} size="small" fullWidth
                                    label={field.label}
                                    type={field.secret ? 'password' : 'text'}
                                    multiline={field.multiline}
                                    rows={field.multiline ? 4 : 1}
                                    placeholder={editingAccount ? '••••••••' : ''}
                                    value={accountForm.credentials[field.key] ?? ''}
                                    onChange={e => setAccountForm(f => ({
                                        ...f,
                                        credentials: { ...f.credentials, [field.key]: e.target.value },
                                    }))} />
                            ))
                        ) : (
                            <Alert severity="info" sx={{ fontSize: 13 }}>
                                No credential template for "{accountProvider?.name}".
                            </Alert>
                        )}

                        {!editingAccount && (
                            <FormControlLabel
                                control={
                                    <Switch checked={!!accountForm.isDefault}
                                        onChange={e => setAccountForm(f => ({ ...f, isDefault: e.target.checked }))} />
                                }
                                label="Set as default account"
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setAccountDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={saveAccount}
                        disabled={accountSaving || !accountForm.label ||
                            (!editingAccount && Object.keys(accountForm.credentials).length === 0)}
                        sx={{ background: colors.primary.gradient }}>
                        {accountSaving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
