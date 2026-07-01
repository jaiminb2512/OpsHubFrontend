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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { getProjectsService, type ProjectListItem } from '../../Services/ApiServices/projectServices';
import { getCompaniesService, type CompanyListItem } from '../../Services/ApiServices/companyServices';
import {
    importRoleDataService,
    exportRoleDataUrl,
    downloadRoleTemplateUrl,
    type RoleImportResult,
} from '../../Services/ApiServices/importServices';
import { useToast } from '../../Utils/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

const SUMMARY_LABELS: Record<string, string> = {
    roles:           'Roles',
    rolePermissions: 'Role ↔ Permissions',
    roleModules:     'Role ↔ Modules',
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

const RoleImportPage = () => {
    const { showError } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    usePageTitle('Import Roles');

    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [companies, setCompanies] = useState<CompanyListItem[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [companiesLoading, setCompaniesLoading] = useState(true);

    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<RoleImportResult | null>(null);

    useEffect(() => {
        const loadProjects = async () => {
            setProjectsLoading(true);
            try {
                const res = await getProjectsService({ isActive: true });
                if (res.success) setProjects(res.data || []);
            } catch {
                showError('Failed to load projects');
            } finally {
                setProjectsLoading(false);
            }
        };
        const loadCompanies = async () => {
            setCompaniesLoading(true);
            try {
                const res = await getCompaniesService({ isActive: true });
                if (res.success) setCompanies(res.data || []);
            } catch {
                showError('Failed to load companies');
            } finally {
                setCompaniesLoading(false);
            }
        };
        loadProjects();
        loadCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        setImporting(true);
        setResult(null);
        try {
            const res = await importRoleDataService(selectedFile, {
                projectId: selectedProjectId || undefined,
                companyId: selectedCompanyId || undefined,
            });
            if (res.success) {
                setResult(res.data as RoleImportResult);
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
        const url = downloadRoleTemplateUrl();
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rbas-role-import-template.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        const url = exportRoleDataUrl({
            projectId: selectedProjectId || undefined,
            companyId: selectedCompanyId || undefined,
        });
        const suffix = selectedCompanyId
            ? `company-${companies.find(c => c.id === selectedCompanyId)?.name ?? selectedCompanyId}`
            : selectedProjectId
            ? `project-${projects.find(p => p.id === selectedProjectId)?.name ?? selectedProjectId}`
            : 'global';
        const link = document.createElement('a');
        link.href = url;
        link.download = `rbas-roles-${suffix.replace(/\s+/g, '-').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const scopeLabel = selectedProjectId && selectedCompanyId
        ? 'project + company scope'
        : selectedProjectId
        ? 'project scope'
        : selectedCompanyId
        ? 'company scope'
        : 'global (no project / no company)';

    const summaryEntries = result
        ? (Object.entries(result.summary).filter(([, v]) => v !== undefined) as [string, { created: number; skipped: number }][])
        : [];
    const totalCreated = summaryEntries.reduce((s, [, v]) => s + v.created, 0);
    const hasErrors = result && result.errors.length > 0;

    return (
        <>
            {/* Header row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography fontWeight={700} fontSize={18}>Import Roles</Typography>
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
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Export Roles
                    </Button>
                </Stack>
            </Box>

            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Roles are imported into the selected <strong>project</strong> and/or <strong>company</strong> scope.
                Both are optional — leaving them blank creates global roles (<code>projectId: null, companyId: null</code>).
                Existing roles with the same name in the same scope are skipped.
            </Alert>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, mb: 2 }}>
                <Typography fontWeight={700} fontSize={15} mb={2}>Scope Settings</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                    {/* Project selector */}
                    <TextField
                        select
                        label="Project (optional)"
                        size="small"
                        fullWidth
                        value={selectedProjectId}
                        onChange={(e) => { setSelectedProjectId(e.target.value); setResult(null); }}
                        disabled={projectsLoading}
                        helperText="Leave blank for no project scope"
                    >
                        <MenuItem value="">— None (global) —</MenuItem>
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

                    {/* Company selector */}
                    <TextField
                        select
                        label="Company (optional)"
                        size="small"
                        fullWidth
                        value={selectedCompanyId}
                        onChange={(e) => { setSelectedCompanyId(e.target.value); setResult(null); }}
                        disabled={companiesLoading}
                        helperText="Leave blank for no company scope"
                    >
                        <MenuItem value="">— None (global) —</MenuItem>
                        {companiesLoading ? (
                            <MenuItem disabled>Loading…</MenuItem>
                        ) : companies.length === 0 ? (
                            <MenuItem disabled>No companies found</MenuItem>
                        ) : (
                            companies.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))
                        )}
                    </TextField>
                </Stack>

                <Alert severity="info" icon={false} sx={{ borderRadius: 2, mb: 3, py: 0.5 }}>
                    <Typography variant="caption">
                        Current scope: <strong>{scopeLabel}</strong>
                    </Typography>
                </Alert>

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
                    startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
                    onClick={handleImport}
                    disabled={!selectedFile || importing}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 4 }}
                >
                    {importing ? 'Importing…' : 'Import Roles'}
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
                            Role Import {hasErrors && totalCreated === 0 ? 'Failed' : 'Complete'}
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

export default RoleImportPage;
