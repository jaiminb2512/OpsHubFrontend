import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Chip, CircularProgress, Collapse, Dialog,
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
} from '../../Services/ApiServices/providerServices';

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
    const [accountForm, setAccountForm]         = useState<{ label: string; credentialsJson: string; isDefault: boolean }>({
        label: '', credentialsJson: '', isDefault: false,
    });
    const [accountSaving, setAccountSaving] = useState(false);

    usePageTitle(
        'Global Providers',
        <Button variant="contained" size="small" startIcon={<AddIcon />}
            onClick={() => navigate(DASHBOARD_PATHS.GLOBAL_PROVIDERS_CREATE)}
            sx={{ background: colors.primary.gradient }}>
            Add Provider
        </Button>
    );

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

    const tryParseCredentials = (raw: string): Record<string, string> | null => {
        if (!raw.trim()) return null;
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
        } catch { /* ignore */ }
        return null;
    };

    const openAddAccount = (p: ProjectProvider) => {
        setAccountProvider(p);
        setEditingAccount(null);
        setAccountForm({ label: '', credentialsJson: '{}', isDefault: false });
        setAccountDialog(true);
    };

    const openEditAccount = (p: ProjectProvider, account: ProviderAccount) => {
        setAccountProvider(p);
        setEditingAccount(account);
        setAccountForm({ label: account.label, credentialsJson: '', isDefault: account.isDefault });
        setAccountDialog(true);
    };

    const saveAccount = async () => {
        if (!accountProvider || !accountForm.label) return;
        const parsedCreds = tryParseCredentials(accountForm.credentialsJson);
        // For create: credentials required. For edit: optional (empty = keep existing).
        if (!editingAccount && !parsedCreds) return;
        if (accountForm.credentialsJson.trim() && !parsedCreds) return; // invalid JSON

        setAccountSaving(true);
        try {
            if (editingAccount) {
                const payload: any = { label: accountForm.label };
                if (parsedCreds) payload.credentials = parsedCreds;
                const res = await updateGlobalProviderAccountService(accountProvider.id, editingAccount.id, payload);
                if (res.success === 200) { showSuccess('Account updated'); load(); setAccountDialog(false); }
                else showError(res.message || 'Failed to update');
            } else {
                const res = await createGlobalProviderAccountService(accountProvider.id, {
                    label: accountForm.label,
                    credentials: parsedCreds!,
                    isDefault: accountForm.isDefault,
                });
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

    // ── Render section ───────────────────────────────────────────────────────

    const renderSection = (sectionProviders: ProjectProvider[], category: 'storage' | 'email') => (
        <Box mb={4}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                {category === 'storage'
                    ? <StorageIcon sx={{ fontSize: 18, color: colors.primary.main }} />
                    : <EmailIcon sx={{ fontSize: 18, color: colors.primary.main }} />}
                <Typography variant="h6" fontWeight={700} fontSize={16}>
                    {category === 'storage' ? 'Global Storage Providers' : 'Global Email Providers'}
                </Typography>
                <Chip label={sectionProviders.length} size="small"
                    sx={{ bgcolor: colors.primary.rgba.light, color: colors.primary.main, fontWeight: 700 }} />
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
                        <TextField size="small" fullWidth label="Label *"
                            placeholder="e.g. Primary, Backup"
                            value={accountForm.label}
                            onChange={e => setAccountForm(f => ({ ...f, label: e.target.value }))} />

                        <TextField
                            fullWidth multiline rows={7}
                            label={editingAccount ? 'Credentials (JSON) — leave empty to keep existing' : 'Credentials (JSON) *'}
                            placeholder={'{\n  "apiKey": "...",\n  "fromEmail": "you@example.com"\n}'}
                            value={accountForm.credentialsJson ?? ''}
                            helperText={
                                accountForm.credentialsJson && !tryParseCredentials(accountForm.credentialsJson ?? '')
                                    ? 'Must be a valid JSON object'
                                    : editingAccount ? 'Only filled keys will overwrite existing credentials' : ''
                            }
                            error={!!(accountForm.credentialsJson && !tryParseCredentials(accountForm.credentialsJson ?? ''))}
                            onChange={e => setAccountForm(f => ({ ...f, credentialsJson: e.target.value }))}
                            inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                        />

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
                        disabled={
                            accountSaving || !accountForm.label ||
                            (!editingAccount && !tryParseCredentials(accountForm.credentialsJson ?? '')) ||
                            !!(accountForm.credentialsJson && !tryParseCredentials(accountForm.credentialsJson ?? ''))
                        }
                        sx={{ background: colors.primary.gradient }}>
                        {accountSaving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
