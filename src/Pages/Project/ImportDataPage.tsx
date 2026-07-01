import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    MenuItem,
    Stack,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    LinearProgress,
    Tab,
    Tabs,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import PublicIcon from '@mui/icons-material/Public';
import { getProjectsService, type ProjectListItem } from '../../Services/ApiServices/projectServices';
import {
    importFullFromTailorService,
    importGlobalDataService,
    downloadProjectTemplateUrl,
    downloadGlobalTemplateUrl,
    exportProjectDataUrl,
    exportGlobalDataUrl,
    type FullImportResult,
} from '../../Services/ApiServices/importServices';
import { useToast } from '../../Utils/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PROJECT_PATHS } from '../../Path';

type ImportMode = 'project' | 'global';

const SUMMARY_LABELS: Record<string, string> = {
    users:                 'Users',
    companies:             'Companies',
    moduleGroups:          'Module Groups',
    modules:               'Modules',
    moduleGroupModules:    'Module ↔ Groups',
    features:              'Features',
    featureModules:        'Feature ↔ Modules',
    limits:                'Limits',
    apiEndpoints:          'API Endpoints',
    apiLimits:             'API Limits',
    permissions:           'Permissions',
    roles:                 'Roles',
    roleModules:           'Role ↔ Modules',
    rolePermissions:       'Role ↔ Permissions',
    menus:                 'Menus',
    plans:                 'Plans',
    planFeatures:          'Plan ↔ Features',
    planLimits:            'Plan ↔ Limits',
    userRoles:             'User Roles',
    companySubscriptions:  'Company Subscriptions',
    companyFeatures:       'Company Features',
    limitUsages:           'Limit Usages',
};

const SummaryRow = ({ label, data }: { label: string; data: { created: number; skipped: number } }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>{label}</Typography>
        <Stack direction="row" spacing={1}>
            <Chip
                label={`${data.created} created`}
                size="small"
                color={data.created > 0 ? 'success' : 'default'}
                variant={data.created > 0 ? 'filled' : 'outlined'}
            />
            <Chip
                label={`${data.skipped} skipped`}
                size="small"
                variant="outlined"
                sx={{ color: 'text.secondary' }}
            />
        </Stack>
    </Box>
);

const ImportDataPage = () => {
    const { showError } = useToast();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    usePageTitle('Import Data');

    const [mode, setMode] = useState<ImportMode>(
        searchParams.get('mode') === 'global' ? 'global' : 'project'
    );
    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<FullImportResult | null>(null);

    useEffect(() => {
        const load = async () => {
            setProjectsLoading(true);
            try {
                const res = await getProjectsService({ isActive: true });
                if (res.success) {
                    const list = res.data || [];
                    setProjects(list);
                    if (!selectedProjectId && list.length > 0) {
                        setSelectedProjectId(list[0].id);
                    }
                }
            } catch {
                showError('Failed to load projects');
            } finally {
                setProjectsLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleModeChange = (_: React.SyntheticEvent, val: number) => {
        const next: ImportMode = val === 0 ? 'project' : 'global';
        setMode(next);
        setResult(null);
        setSelectedFile(null);
        const params = new URLSearchParams(searchParams);
        params.set('mode', next);
        navigate(`${PROJECT_PATHS.IMPORT}?${params.toString()}`, { replace: true });
    };

    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
        setResult(null);
        const params = new URLSearchParams(searchParams);
        params.set('projectId', projectId);
        navigate(`${PROJECT_PATHS.IMPORT}?${params.toString()}`, { replace: true });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] || null);
        setResult(null);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.json')) {
            setSelectedFile(file);
            setResult(null);
        } else {
            showError('Please drop a .json file');
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;
        if (mode === 'project' && !selectedProjectId) return;
        setImporting(true);
        setResult(null);
        try {
            const res = mode === 'project'
                ? await importFullFromTailorService(selectedProjectId, selectedFile)
                : await importGlobalDataService(selectedFile);
            if (res.success) {
                setResult(res.data as FullImportResult);
            } else {
                showError(res.message || 'Import failed');
            }
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            showError(msg || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const url = mode === 'project' ? downloadProjectTemplateUrl() : downloadGlobalTemplateUrl();
        const link = document.createElement('a');
        link.href = url;
        link.download = mode === 'project'
            ? 'rbas-project-import-template.json'
            : 'rbas-global-import-template.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        if (mode === 'project' && !selectedProjectId) return;
        const url = mode === 'project'
            ? exportProjectDataUrl(selectedProjectId)
            : exportGlobalDataUrl();
        const projectName = projects.find(p => p.id === selectedProjectId)?.name ?? selectedProjectId;
        const filename = mode === 'project'
            ? `rbas-export-${projectName.replace(/\s+/g, '-').toLowerCase()}.json`
            : 'rbas-global-export.json';
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const summaryEntries = result
        ? (Object.entries(result.summary).filter(([, v]) => v !== undefined) as [string, { created: number; skipped: number }][])
        : [];
    const totalCreated = summaryEntries.reduce((s, [, v]) => s + v.created, 0);
    const hasErrors = result && result.errors.length > 0;
    const canImport = selectedFile && (mode === 'global' || selectedProjectId);
    const tabIndex = mode === 'project' ? 0 : 1;

    return (
        <>
            {/* Mode tabs + Download Template */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Tabs
                    value={tabIndex}
                    onChange={handleModeChange}
                    sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
                >
                    <Tab icon={<FolderSpecialIcon fontSize="small" />} iconPosition="start" label="Project Import" />
                    <Tab icon={<PublicIcon fontSize="small" />} iconPosition="start" label="Global Import" />
                </Tabs>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadTemplate}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Download Template
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={mode === 'project' && !selectedProjectId}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Export Data
                    </Button>
                </Stack>
            </Box>

            {/* Mode description */}
            <Alert
                severity={mode === 'global' ? 'warning' : 'info'}
                sx={{ mb: 2, borderRadius: 2 }}
            >
                {mode === 'project' ? (
                    <>
                        <strong>Project Import</strong> — imports the full TailorProject export into the selected RBAS project. All IDs are preserved exactly as exported. Users are imported with <code>canLogin: false</code>.
                    </>
                ) : (
                    <>
                        <strong>Global Import</strong> — data is not scoped to any project (<code>projectId: null</code>). Includes module groups, features, shared modules, and global public roles. Use with care.
                    </>
                )}
            </Alert>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, mb: 2 }}>
                <Typography fontWeight={700} fontSize={15} mb={2}>Import Settings</Typography>

                {/* Project selector — only in project mode */}
                {mode === 'project' && (
                    <TextField
                        select
                        label="Target Project"
                        size="small"
                        fullWidth
                        value={selectedProjectId}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        disabled={projectsLoading}
                        helperText="All imported data will be scoped to this project"
                        sx={{ mb: 3 }}
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
                )}

                {/* Drop zone */}
                <Box
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                        border: '2px dashed',
                        borderColor: selectedFile ? 'success.main' : 'divider',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: selectedFile ? 'success.50' : 'grey.50',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <UploadFileIcon sx={{ fontSize: 40, color: selectedFile ? 'success.main' : 'text.disabled', mb: 1 }} />
                    {selectedFile ? (
                        <>
                            <Typography fontWeight={600} color="success.main">{selectedFile.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                            </Typography>
                        </>
                    ) : (
                        <>
                            <Typography fontWeight={500} color="text.secondary">
                                Drop your JSON file here or click to browse
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                Only .json files accepted · Max 5 MB
                            </Typography>
                        </>
                    )}
                </Box>
            </Paper>

            {/* Import button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    color={mode === 'global' ? 'warning' : 'primary'}
                    startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
                    onClick={handleImport}
                    disabled={!canImport || importing}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 4 }}
                >
                    {importing ? 'Importing…' : mode === 'global' ? 'Import Globally' : 'Import to Project'}
                </Button>
            </Box>

            {importing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

            {/* Result */}
            {result && (
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        {hasErrors && totalCreated === 0 ? (
                            <ErrorOutlineIcon color="error" />
                        ) : (
                            <CheckCircleIcon color="success" />
                        )}
                        <Typography fontWeight={700} fontSize={15}>
                            {mode === 'global' ? 'Global' : 'Project'} Import {hasErrors && totalCreated === 0 ? 'Failed' : 'Complete'}
                        </Typography>
                    </Stack>

                    {summaryEntries.map(([key, data], i) => (
                        <Box key={key}>
                            <SummaryRow label={SUMMARY_LABELS[key] ?? key} data={data} />
                            {i < summaryEntries.length - 1 && <Divider />}
                        </Box>
                    ))}

                    {hasErrors && (
                        <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>
                            <Typography fontWeight={600} variant="body2" gutterBottom>
                                {result.errors.length} warning{result.errors.length > 1 ? 's' : ''}
                            </Typography>
                            <List dense disablePadding>
                                {result.errors.map((e, i) => (
                                    <ListItem key={i} disablePadding>
                                        <ListItemText
                                            primary={e}
                                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Alert>
                    )}
                </Paper>
            )}
        </>
    );
};

export default ImportDataPage;
