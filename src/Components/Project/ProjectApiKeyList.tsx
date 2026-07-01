import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Switch,
    CircularProgress,
    Stack,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    OutlinedInput,
    FormLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckIcon from '@mui/icons-material/Check';
import {
    listProjectApiKeysService,
    createProjectApiKeyService,
    toggleProjectApiKeyService,
    deleteProjectApiKeyService,
    type ProjectApiKey,
} from '../../Services/ApiServices/projectApiKeyServices';
import { getProjectsService, type ProjectListItem } from '../../Services/ApiServices/projectServices';
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import usePageTitle from '../../hooks/usePageTitle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PROJECT_PATHS } from '../../Path';

const ProjectApiKeyList = () => {
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    usePageTitle('API Keys');

    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');
    const [projectsLoading, setProjectsLoading] = useState(true);

    const [apiKeys, setApiKeys] = useState<ProjectApiKey[]>([]);
    const [keysLoading, setKeysLoading] = useState(false);

    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [generating, setGenerating] = useState(false);

    // Revealed key dialog state
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Load projects — filtered by companyId if provided in URL; re-runs when URL params change
    useEffect(() => {
        const companyId = searchParams.get('companyId') || '';
        const projectId = searchParams.get('projectId') || '';

        const load = async () => {
            setProjectsLoading(true);
            try {
                const res = await getProjectsService(
                    companyId ? { isActive: true, companyId } : { isActive: true }
                );
                if (res.success) {
                    const list = res.data || [];
                    setProjects(list);
                    // Auto-select: prefer URL projectId, else first in list
                    if (projectId && list.some((p) => p.id === projectId)) {
                        setSelectedProjectId(projectId);
                    } else if (list.length > 0) {
                        setSelectedProjectId(list[0].id);
                    }
                }
            } catch (err) {
                console.error(err);
                showError('Failed to load projects');
            } finally {
                setProjectsLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Sync selected project into URL query param
    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
        const companyId = searchParams.get('companyId') || '';
        const params = new URLSearchParams();
        if (projectId) params.set('projectId', projectId);
        if (companyId) params.set('companyId', companyId);
        navigate(`${PROJECT_PATHS.API_KEYS}?${params.toString()}`, { replace: true });
    };

    // Load keys whenever selected project changes
    useEffect(() => {
        if (!selectedProjectId) return;
        const load = async () => {
            setKeysLoading(true);
            try {
                const res = await listProjectApiKeysService(selectedProjectId);
                if (res.success) setApiKeys(res.data || []);
            } catch (err) {
                console.error(err);
                showError('Failed to load API keys');
            } finally {
                setKeysLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId]);

    const handleGenerate = async () => {
        if (!selectedProjectId) return;
        setGenerating(true);
        try {
            const res = await createProjectApiKeyService(selectedProjectId, { name: newKeyName.trim() || undefined });
            if (res.success && res.data) {
                setApiKeys((prev) => [res.data!, ...prev]);
                setGenerateDialogOpen(false);
                setNewKeyName('');
                setRevealedKey(res.data.key);
                setCopied(false);
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to generate API key');
        } finally {
            setGenerating(false);
        }
    };

    const handleToggle = async (keyId: string, current: boolean) => {
        if (!selectedProjectId) return;
        try {
            const res = await toggleProjectApiKeyService(selectedProjectId, keyId, !current);
            if (res.success) {
                setApiKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: !current } : k)));
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to update API key');
        }
    };

    const handleDelete = async (apiKey: ProjectApiKey) => {
        if (!selectedProjectId) return;
        const confirmed = await confirm({
            title: 'Delete API key?',
            message: `Delete "${apiKey.name || 'Unnamed key'}"? This immediately revokes access for any service using it.`,
            confirmText: 'Delete',
            severity: 'error',
        });
        if (!confirmed) return;
        try {
            await deleteProjectApiKeyService(selectedProjectId, apiKey.id);
            setApiKeys((prev) => prev.filter((k) => k.id !== apiKey.id));
            showSuccess('API key deleted');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to delete API key');
        }
    };

    const handleCopyTableKey = (key: string) => {
        navigator.clipboard.writeText(key);
        showSuccess('Copied to clipboard');
    };

    const handleCopyRevealed = () => {
        if (!revealedKey) return;
        navigator.clipboard.writeText(revealedKey);
        setCopied(true);
        showSuccess('Copied to clipboard');
    };

    return (
        <>
            {/* Project selector + key count + Generate button */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2, mb: 2 }}
            >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        select
                        label="Project"
                        size="small"
                        value={selectedProjectId}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        disabled={projectsLoading}
                        sx={{ minWidth: 280 }}
                        helperText={searchParams.get('companyId') ? 'Filtered by selected company' : undefined}
                    >
                        {projectsLoading ? (
                            <MenuItem disabled>Loading…</MenuItem>
                        ) : projects.length === 0 ? (
                            <MenuItem disabled>No projects found</MenuItem>
                        ) : (
                            projects.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                    {p.company && (
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            ({p.company.name})
                                        </Typography>
                                    )}
                                </MenuItem>
                            ))
                        )}
                    </TextField>
                    <Box sx={{ flex: 1 }} />
                    {!keysLoading && selectedProjectId && (
                        <Chip
                            label={`${apiKeys.length} ${apiKeys.length === 1 ? 'key' : 'keys'}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                        />
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setGenerateDialogOpen(true)}
                        disabled={!selectedProjectId}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Generate New Key
                    </Button>
                </Box>
            </Paper>

            {/* Keys table */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
            >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Key</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Created By</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Created At</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {keysLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : !selectedProjectId ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Select a project to view its API keys.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : apiKeys.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Stack alignItems="center" spacing={1}>
                                            <VpnKeyIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                No API keys for this project. Generate one to allow server-to-server access.
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={() => setGenerateDialogOpen(true)}
                                                sx={{ textTransform: 'none', mt: 1 }}
                                            >
                                                Generate First Key
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                apiKeys.map((apiKey) => (
                                    <TableRow key={apiKey.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {apiKey.name || (
                                                    <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                                        Unnamed
                                                    </Box>
                                                )}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontFamily: 'monospace', color: 'text.secondary', letterSpacing: 0.5 }}
                                                >
                                                    {apiKey.key.substring(0, 9)}…{apiKey.key.slice(-6)}
                                                </Typography>
                                                <Tooltip title="Copy full key">
                                                    <IconButton size="small" onClick={() => handleCopyTableKey(apiKey.key)}>
                                                        <ContentCopyIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {apiKey.creator?.fullName || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(apiKey.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={apiKey.isActive ? 'Active' : 'Inactive'}
                                                color={apiKey.isActive ? 'success' : 'default'}
                                                size="small"
                                                variant={apiKey.isActive ? 'filled' : 'outlined'}
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                                                <Tooltip title={apiKey.isActive ? 'Deactivate' : 'Activate'}>
                                                    <Switch
                                                        size="small"
                                                        checked={apiKey.isActive}
                                                        onChange={() => handleToggle(apiKey.id, apiKey.isActive)}
                                                    />
                                                </Tooltip>
                                                <Tooltip title="Delete key">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(apiKey)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Generate Key Dialog */}
            <Dialog
                open={generateDialogOpen}
                onClose={() => { setGenerateDialogOpen(false); setNewKeyName(''); }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Generate New API Key</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Key Name (Optional)"
                        placeholder='e.g. "Production Web Server"'
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !generating && handleGenerate()}
                        fullWidth
                        size="small"
                        sx={{ mt: 1 }}
                        helperText="A descriptive label to identify where this key is used"
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => { setGenerateDialogOpen(false); setNewKeyName(''); }}
                        disabled={generating}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleGenerate}
                        disabled={generating}
                        startIcon={generating ? <CircularProgress size={16} /> : <AddIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        Generate
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Revealed Key Dialog — shown once after generation */}
            <Dialog
                open={Boolean(revealedKey)}
                onClose={() => setRevealedKey(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VpnKeyIcon color="success" />
                    API Key Generated
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Copy this key now — it won't be shown in full again after you close this dialog.
                    </Typography>
                    <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
                        Your API Key
                    </FormLabel>
                    <OutlinedInput
                        value={revealedKey ?? ''}
                        readOnly
                        fullWidth
                        size="small"
                        inputProps={{ style: { fontFamily: 'monospace', fontSize: 13, letterSpacing: 0.5 } }}
                        endAdornment={
                            <InputAdornment position="end">
                                <Tooltip title={copied ? 'Copied!' : 'Copy key'}>
                                    <IconButton
                                        size="small"
                                        onClick={handleCopyRevealed}
                                        color={copied ? 'success' : 'default'}
                                    >
                                        {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        }
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => setRevealedKey(null)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ProjectApiKeyList;
