import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import {
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Business as BusinessIcon,
    DeleteOutline as DeleteIcon,
    Edit as EditIcon,
    EditNote as DraftIcon,
    FilterList as FilterListIcon,
    Public as PublicIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PLAN_PATHS } from '../../Path/planPaths';
import { PRIMARY } from '../Common/Wizard';
import { MOCK_COMPANIES, SEED_PLAN_CATALOG } from '../../mockData/planCatalog.mock';
import { isWizardUseApiEnabled } from '../../mockData/wizardMockData';
import {
    isUnassignedPrivatePlan,
    loadPlanCatalog,
    planVisibilityLabel,
    resolveCompanyName,
} from '../../Utils/planVisibility';
import type { PlanCatalogItem } from '../../types/planTypes';
import { getPlansService } from '../../Services/ApiServices/planServices';
type SetupDraftSummary = {
    id: string;
    name: string | null;
    step: number;
    createdAt: string;
    updatedAt: string;
};

const listPlanSetupDraftsService = async (): Promise<{ success: number; message?: string; data: SetupDraftSummary[] }> => ({
    success: 200,
    data: [],
});

const deletePlanSetupDraftService = async (id: string): Promise<{ success: number; message?: string; data: any }> => ({
    success: 200,
    data: { id },
});
import { useToast } from '../../Utils/ToastContext';
import { useConfirm } from '../../Utils/ConfirmDialogContext';
import { ProjectSelect } from '../Common/ProjectSelect';

const PLAN_LOCAL_DRAFTS_KEY = 'PlanSetupWizardDrafts';

type LocalDraftRow = {
    id: string;
    name: string | null;
    timestamp: string;
    activeStep: number;
    plan?: { name?: string };
};

const writeLocalPlanDrafts = (rows: LocalDraftRow[]) => {
    localStorage.setItem(PLAN_LOCAL_DRAFTS_KEY, JSON.stringify(rows));
};

const readLocalPlanDrafts = (): SetupDraftSummary[] => {
    try {
        const raw = localStorage.getItem(PLAN_LOCAL_DRAFTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as LocalDraftRow[];
        if (!Array.isArray(parsed)) return [];
        return parsed.map((d) => ({
            id: d.id,
            type: 'plan' as const,
            name: (d.name ?? d.plan?.name ?? '').trim() || null,
            step: d.activeStep ?? 0,
            createdAt: d.timestamp,
            updatedAt: d.timestamp,
        }));
    } catch {
        return [];
    }
};

const getApiErrorMessage = (err: unknown): string | undefined =>
    isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined;

const formatDraftLabel = (name: string | null | undefined, updatedAt: string) => {
    if (name?.trim()) return name.trim();
    return `Draft · ${new Date(updatedAt).toLocaleString()}`;
};

import usePageTitle from '../../hooks/usePageTitle';
import { usePagePermissions } from '../../hooks/usePagePermissions';
const PlanList = () => {
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const { confirm } = useConfirm();
    const permissions = usePagePermissions([
        { key: 'create', endpointKey: 'createPlan' },
        { key: 'delete', endpointKey: 'deletePlan', pathParams: { id: 'sample-id' } },
    ]);
    const useApi = useMemo(() => isWizardUseApiEnabled(), []);

    const [showPrivateOnly, setShowPrivateOnly] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [projectId, setProjectId] = useState<string>('');
    const [filterModalOpen, setFilterModalOpen] = useState(false);

    usePageTitle('Plans',
        permissions.create ? (
            <Tooltip title="Create plan" arrow>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(PLAN_PATHS.CREATE)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: PRIMARY,
                        minWidth: { xs: 0, md: 'auto' },
                        px: { xs: 1.5, md: 2.5 },
                        '& .MuiButton-startIcon': {
                            mr: { xs: 0, md: 1 },
                            ml: { xs: 0, md: -0.5 }
                        }
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                        Create plan
                    </Box>
                </Button>
            </Tooltip>
        ) : undefined
    );
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
    const [drafts, setDrafts] = useState<SetupDraftSummary[]>([]);

    const loadData = useCallback(async () => {
        if (!useApi) {
            const catalog = loadPlanCatalog(SEED_PLAN_CATALOG).map((p) => ({
                ...p,
                companyName: p.companyName ?? resolveCompanyName(p.companyId, MOCK_COMPANIES),
            }));
            setPlans(catalog);
            setDrafts(readLocalPlanDrafts());
            return;
        }

        setLoading(true);
        try {
            const [plansRes, draftsRes] = await Promise.all([
                getPlansService({ projectId: projectId || undefined }),
                listPlanSetupDraftsService(),
            ]);

            if (plansRes.success === 200) {
                setPlans(
                    (plansRes.data ?? []).map((p: any) => ({
                        ...p,
                        companyName:
                            p.companyName ?? resolveCompanyName(p.companyId, MOCK_COMPANIES),
                    }))
                );
            } else {
                showError(plansRes.message || 'Failed to load plans');
            }

            if (draftsRes.success === 200) {
                setDrafts(draftsRes.data ?? []);
            } else {
                showError(draftsRes.message || 'Failed to load plan drafts');
            }
        } catch (err) {
            showError(getApiErrorMessage(err) || 'Failed to load plans and drafts');
        } finally {
            setLoading(false);
        }
    }, [useApi, showError, projectId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const filteredPlans = useMemo(() => {
        return plans.filter((p) => {
            if (!showInactive && p.isActive === false) return false;
            if (showPrivateOnly && p.isPublic) return false;
            return true;
        });
    }, [plans, showInactive, showPrivateOnly]);

    const renderVisibilityChip = (plan: PlanCatalogItem) => {
        if (plan.isPublic) {
            return (
                <Chip
                    size="small"
                    icon={<PublicIcon sx={{ fontSize: 14 }} />}
                    label="Public"
                    color="primary"
                    variant="outlined"
                />
            );
        }
        if (isUnassignedPrivatePlan(plan)) {
            return (
                <Chip
                    size="small"
                    icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                    label="Private · Unassigned"
                    variant="outlined"
                    sx={{ borderColor: '#94a3b8', color: '#64748b' }}
                />
            );
        }
        return (
            <Chip
                size="small"
                icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                label={planVisibilityLabel(plan)}
                variant="outlined"
                sx={{ borderColor: '#f59e0b', color: '#b45309' }}
            />
        );
    };

    const openDraftWizard = (draftId: string) => {
        navigate(PLAN_PATHS.CREATE, { state: { draftId } });
    };

    const handleDeleteDraft = async (draftId: string) => {
        const confirmed = await confirm({
            title: 'Delete draft?',
            message: 'Delete this plan draft? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            severity: 'error',
        });
        if (!confirmed) return;

        if (useApi) {
            try {
                const res = await deletePlanSetupDraftService(draftId);
                if (res.success === 200) {
                    showSuccess('Draft deleted');
                    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
                } else {
                    showError(res.message || 'Failed to delete draft');
                }
            } catch (err) {
                showError(getApiErrorMessage(err) || 'Failed to delete draft');
            }
            return;
        }

        try {
            const raw = localStorage.getItem(PLAN_LOCAL_DRAFTS_KEY);
            const parsed = raw ? (JSON.parse(raw) as LocalDraftRow[]) : [];
            const remaining = Array.isArray(parsed) ? parsed.filter((d) => d.id !== draftId) : [];
            writeLocalPlanDrafts(remaining);
            setDrafts(readLocalPlanDrafts());
            showSuccess('Draft deleted');
        } catch {
            showError('Failed to delete draft');
        }
    };

    return (
        <>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', mb: 0 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ProjectSelect
                        value={projectId}
                        onChange={setProjectId}
                        size="small"
                    />
                    <Tooltip title="More filters">
                        <Badge color="primary" variant="dot" invisible={!showPrivateOnly && !showInactive}>
                            <IconButton size="small" onClick={() => setFilterModalOpen(true)}>
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Badge>
                    </Tooltip>
                </Stack>

                <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>More Filters</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={showPrivateOnly}
                                        onChange={(e) => setShowPrivateOnly(e.target.checked)}
                                    />
                                }
                                label="Company-specific only (Is Public = No)"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={showInactive}
                                        onChange={(e) => setShowInactive(e.target.checked)}
                                    />
                                }
                                label="Show inactive (Is Active = No)"
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFilterModalOpen(false)}>Done</Button>
                    </DialogActions>
                </Dialog>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, pt: 2, pb: 1 }}>
                            Published plans
                        </Typography>
                        <TableContainer sx={{ mb: 0 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Visibility</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        {useApi ? (
                                            <TableCell sx={{ fontWeight: 700 }} align="right">
                                                Actions
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredPlans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={useApi ? 7 : 6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                No published plans match filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPlans.map((plan) => (
                                            <TableRow key={plan.id} hover>
                                                <TableCell>
                                                    <Typography fontWeight={600}>{plan.name}</Typography>
                                                    {plan.description ? (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            display="block"
                                                        >
                                                            {plan.description}
                                                        </Typography>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>{renderVisibilityChip(plan)}</TableCell>
                                                <TableCell>
                                                    {plan.isPublic ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            All companies
                                                        </Typography>
                                                    ) : isUnassignedPrivatePlan(plan) ? (
                                                        <Typography variant="body2" color="warning.main">
                                                            Assign after company is created
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="body2">
                                                            {plan.companyName ?? plan.companyId}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>{plan.price ?? '—'}</TableCell>
                                                <TableCell>
                                                    {plan.durationDays != null && plan.durationDays !== ''
                                                        ? `${plan.durationDays} days`
                                                        : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={plan.isActive === false ? 'Inactive' : 'Active'}
                                                        color={plan.isActive === false ? 'default' : 'success'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                {useApi ? (
                                                    <TableCell align="right">
                                                        <Tooltip title="Edit plan">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Edit plan"
                                                                onClick={() =>
                                                                    navigate(
                                                                        PLAN_PATHS.EDIT.replace(
                                                                            ':planId',
                                                                            plan.id
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                ) : null}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, pt: 2, pb: 1 }}>
                            Drafts
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Step</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Last updated</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {drafts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                No plan drafts saved yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        drafts.map((draft) => (
                                            <TableRow key={draft.id} hover>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <DraftIcon fontSize="small" color="action" />
                                                        <Typography fontWeight={600}>
                                                            {formatDraftLabel(draft.name, draft.updatedAt)}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip size="small" label={`Step ${draft.step + 1}`} variant="outlined" />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(draft.updatedAt).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack
                                                        direction="row"
                                                        spacing={0.5}
                                                        justifyContent="flex-end"
                                                        alignItems="center"
                                                    >
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => openDraftWizard(draft.id)}
                                                            sx={{ textTransform: 'none', borderRadius: 2 }}
                                                        >
                                                            Continue
                                                        </Button>
                                                        {permissions.delete && (
                                                            <Tooltip title="Delete draft">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => void handleDeleteDraft(draft.id)}
                                                                    aria-label="Delete draft"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Paper>

            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    {useApi
                        ? 'Plans: GET /api/plans · Drafts: GET /api/setup-drafts?type=plan'
                        : 'Local mode: seed catalog + localStorage drafts (VITE_USE_API=false).'}
                </Typography>
            </Box>
        </>
    );
};

export default PlanList;
