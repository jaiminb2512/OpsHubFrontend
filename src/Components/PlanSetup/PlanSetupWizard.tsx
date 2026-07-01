import { useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    CircularProgress,
    Typography,
} from '@mui/material';
import {
    StarRate as PlanIcon,
    Tune as FeaturesIcon,
} from '@mui/icons-material';
import {
    WizardLayout,
    WizardStepHeader,
    WizardStepPlanBasics,
    WizardStepSelectCards,
    WizardStepPlanApiLimits,
    WizardHelpButton,
    WizardHelpSection,
    WizardHelpText,
} from '../Common/Wizard';
import type { PlanBillingModel } from '../Common/Wizard';
import type {
    PlanApiLimitsById,
    PlanWizardLimitCatalogItem,
    PlanWizardApiEndpoint,
    PlanApiLimitPeriod,
} from '../Common/Wizard';
import { LIMIT_ENFORCEMENT } from '../../constants/limitEnforcement';
import type { CompanyOption } from '../../types/planTypes';
import { MOCK_COMPANIES } from '../../mockData/planCatalog.mock';
import type { WizardSelectCardItem } from '../Common/Wizard';
import { useToast } from '../../Utils/ToastContext';
import { useWizardStepInUrl } from '../../hooks/useWizardStepInUrl';
import {
    isWizardUseApiEnabled,
    loadPlanSetupWizardMock,
    useWizardMockData,
} from '../../mockData/wizardMockData';

/** Pull the backend's validation message out of a failed axios call, e.g. a 400/500 from the API. */
const getApiErrorMessage = (err: unknown): string | undefined =>
    isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined;

export type PlanSetupDraftPayload = {
    plan: {
        name: string;
        description: string;
        price: string;
        durationDays: string;
        billingModel: string;
        isPublic: boolean;
        companyId: string;
        isActive: boolean;
        projectId?: string | null;
    };
    selectedModuleIds: string[];
    selectedFeatureIds: string[];
    apiLimits: any[];
};

export function normalizePlanApiLimitsForSave(flat: any[]): any[] {
    const byPair = new Map<string, any>();
    for (const row of flat) {
        if (!row?.apiId) continue;
        const rawKey = row.limitKey.trim() || (row.sourceMode === 'new' ? row.newLimitDraft?.key?.trim() ?? '' : '');
        const key = row.sourceMode === 'new' ? rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : rawKey.trim();
        if (!key) continue;
        byPair.set(`${row.apiId}::${key}`, row);
    }
    return [...byPair.values()];
}

export function flatApiLimitsToById(flat: any[]): any {
    const out: any = {};
    for (const row of flat) {
        if (!out[row.apiId]) {
            out[row.apiId] = { limits: [] };
        }
        out[row.apiId].limits.push({
            id: row.id,
            limitId: row.limitId,
            planLimitId: row.planLimitId,
            sourceMode: row.sourceMode ?? 'existing',
            limitKey: row.limitKey,
            newLimitDraft: row.newLimitDraft,
            enforcement: row.enforcement,
            period: row.period ?? undefined,
            limitValue: row.limitValue,
        });
    }
    return out;
}

const deletePlanSetupDraftService = async (_: string): Promise<any> => ({ success: 200, message: '', data: {} });
const getPlanSetupDraftByIdService = async (_: string): Promise<any> => ({ success: 200, message: '', data: { payload: null, step: 0, id: '' } });
import { PLAN_PATHS } from '../../Path/planPaths';
import {
    completePlanWizardService,
    getPlanWizardCompaniesService,
    getPlanWizardFeaturesSetupService,
    getPlanWizardForEditService,
    getPlanWizardLimitsSetupService,
    getPlanWizardPlanLimitsSetupService,
    savePlanWizardFeaturesService,
    updatePlanWizardService,
    type PlanWizardModuleOption,
} from '../../Services/ApiServices/planWizardServices';

type PlanDraft = {
    name: string;
    description: string;
    price: string;
    durationDays: string;
    billingModel: PlanBillingModel;
    isPublic: boolean;
    companyId: string;
    isActive: boolean;
};

type FeatureOption = { id: string; key: string; name: string; description?: string; planFeatures?: { planId: string; isEnabled: boolean }[]; moduleIds?: string[] };

const steps = ['Plan', 'Plan Features', 'Plan Limits'];

const PLAN_LOCAL_DRAFTS_KEY = 'PlanSetupWizardDrafts';

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyPlanState = (): PlanDraft => ({
    name: '',
    description: '',
    price: '',
    durationDays: '',
    billingModel: 'fixed',
    isPublic: true,
    companyId: '',
    isActive: true,
});

type PlanLocalDraftSnapshot = {
    id: string;
    name: string | null;
    timestamp: string;
    activeStep: number;
    plan: PlanDraft;
    selectedModuleIds: string[];
    selectedFeatureIds: string[];
    apiLimits: PlanSetupDraftPayload['apiLimits'];
};

const readLocalPlanDrafts = (): PlanLocalDraftSnapshot[] => {
    try {
        const raw = localStorage.getItem(PLAN_LOCAL_DRAFTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const PlanSetupWizard = () => {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const { planId: editPlanId } = useParams<{ planId?: string }>();
    const openedFromListDraftRef = useRef(false);
    const openedEditRef = useRef(false);

    const useApi = useMemo(() => isWizardUseApiEnabled(), []);

    const {
        data: planMock,
        loading: planMockLoading,
        error: planMockError,
    } = useWizardMockData(!useApi, loadPlanSetupWizardMock);

    const { activeStep, setActiveStep } = useWizardStepInUrl(steps.length);
    const [loading, setLoading] = useState(false);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

    const [companiesList, setCompaniesList] = useState<CompanyOption[]>([]);
    const [featuresList, setFeaturesList] = useState<FeatureOption[]>([]);
    const [featuresLoading, setFeaturesLoading] = useState(false);
    const [limitsCatalog, setLimitsCatalog] = useState<PlanWizardLimitCatalogItem[]>([]);
    const [apiEndpointsList, setApiEndpointsList] = useState<PlanWizardApiEndpoint[]>([]);
    const [limitsLoading, setLimitsLoading] = useState(false);
    const [basicsLoading, setBasicsLoading] = useState(false);

    const [plan, setPlan] = useState<PlanDraft>(emptyPlanState);
    const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(() => new Set());
    const [featureSearch, setFeatureSearch] = useState('');
    const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(() => new Set());
    const [planModulesList, setPlanModulesList] = useState<PlanWizardModuleOption[]>([]);
    const [apiLimitsByApiId, setApiLimitsByApiId] = useState<PlanApiLimitsById>({});

    useEffect(() => {
        if (!planMock) return;
        setCompaniesList(
            planMock.companiesList?.length ? [...planMock.companiesList] : [...MOCK_COMPANIES]
        );
        if (!useApi) {
            setLimitsCatalog([...(planMock.limitsCatalog ?? [])]);
            setApiEndpointsList([...planMock.apiEndpointsList]);
            setFeaturesList([...planMock.featuresList]);
        }
    }, [planMock, useApi]);

    useEffect(() => {
        if (!useApi) return;

        let cancelled = false;
        setBasicsLoading(true);
        (async () => {
            try {
                const res = await getPlanWizardCompaniesService();
                if (cancelled) return;
                if (res.success !== 200) {
                    showError(res.message || 'Failed to load companies');
                    return;
                }
                setCompaniesList(res.data?.companies ?? []);
            } catch (err) {
                if (!cancelled) showError(getApiErrorMessage(err) || 'Failed to load companies');
            } finally {
                if (!cancelled) setBasicsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [useApi, showError]);

    const featuresStepIndex = 1;

    useEffect(() => {
        if (!useApi) {
            setFeaturesLoading(false);
            return;
        }
        if (activeStep !== featuresStepIndex) return;
        if (featuresList.length > 0) return; // already loaded

        let cancelled = false;
        setFeaturesLoading(true);

        (async () => {
            try {
                const res = await getPlanWizardFeaturesSetupService();
                if (cancelled) return;
                if (res.success !== 200) {
                    showError(res.message || 'Failed to load plan features');
                    return;
                }
                const mapped = (res.data?.features ?? []).map((f) => ({
                    id: f.id,
                    key: f.key,
                    name: f.name,
                    description: f.description ?? undefined,
                    planFeatures: f.planFeatures ?? [],
                    moduleIds: f.moduleIds ?? [],
                }));
                setFeaturesList(mapped);
                // In edit mode, pre-select features that already belong to this plan
                if (editPlanId && selectedFeatureIds.size === 0) {
                    const preSelected = new Set(
                        mapped
                            .filter((f) => f.planFeatures.some((pf) => pf.planId === editPlanId))
                            .map((f) => f.id)
                    );
                    setSelectedFeatureIds(preSelected);
                    const allModuleIds = new Set<string>();
                    mapped.forEach((f) => {
                        if (preSelected.has(f.id)) f.moduleIds?.forEach((mid) => allModuleIds.add(mid));
                    });
                    setSelectedModuleIds(allModuleIds);
                }
            } catch (err) {
                if (!cancelled) showError(getApiErrorMessage(err) || 'Failed to load plan features');
            } finally {
                if (!cancelled) setFeaturesLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [useApi, activeStep, showError]);

    const limitsStepIndex = 2;

    useEffect(() => {
        if (!useApi) {
            setLimitsLoading(false);
            return;
        }
        if (activeStep !== limitsStepIndex) return;

        let cancelled = false;
        setLimitsLoading(true);

        (async () => {
            try {
                if (editPlanId) {
                    // Edit mode: fetch plan-scoped modules + APIs with existing limits
                    const res = await getPlanWizardPlanLimitsSetupService(editPlanId, { isLimitAllowed: true });
                    if (cancelled) return;
                    if (res.success !== 200) {
                        showError(res.message || 'Failed to load plan limits setup');
                        return;
                    }
                    setPlanModulesList(res.data?.modules ?? []);
                    setLimitsCatalog(res.data?.limitsCatalog ?? []);
                    setApiEndpointsList(Array.isArray(res.data?.apiEndpoints) ? res.data.apiEndpoints : []);
                } else {
                    // Create mode: use selected feature IDs
                    const featureIds = [...selectedFeatureIds];
                    if (featureIds.length === 0) {
                        setLimitsCatalog([]);
                        setApiEndpointsList([]);
                        setLimitsLoading(false);
                        return;
                    }
                    const res = await getPlanWizardLimitsSetupService(featureIds, { isLimitAllowed: true });
                    if (cancelled) return;
                    if (res.success !== 200) {
                        showError(res.message || 'Failed to load plan limits setup');
                        return;
                    }
                    setLimitsCatalog(res.data?.limitsCatalog ?? []);
                    setApiEndpointsList(Array.isArray(res.data?.apiEndpoints) ? res.data.apiEndpoints : []);
                }
            } catch {
                if (!cancelled) showError('Failed to load plan limits setup');
            } finally {
                if (!cancelled) setLimitsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [useApi, activeStep, editPlanId, selectedFeatureIds, showError]);

    useEffect(() => {
        if (planMockError) {
            showError('Failed to load plan wizard mock data');
        }
    }, [planMockError, showError]);

    const apiLimitsForSave = useMemo(
        () =>
            Object.entries(apiLimitsByApiId).flatMap(([apiId, entry]) =>
                entry.limits.map((row) => {
                    const rawKey =
                        row.limitKey.trim() ||
                        (row.sourceMode === 'new' ? row.newLimitDraft?.key?.trim() ?? '' : '');
                    const resolvedKey =
                        row.sourceMode === 'new'
                            ? rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                            : rawKey;
                    return {
                        id: row.id,
                        apiId,
                        ...(row.limitId ? { limitId: row.limitId } : {}),
                        ...(row.planLimitId ? { planLimitId: row.planLimitId } : {}),
                        sourceMode: row.sourceMode ?? 'existing',
                        limitKey: resolvedKey,
                        newLimitDraft: row.newLimitDraft,
                        enforcement: row.enforcement,
                        period:
                            row.enforcement === LIMIT_ENFORCEMENT.RENEWABLE
                                ? row.period ?? 'monthly'
                                : null,
                        limitValue: row.limitValue,
                    };
                })
            ),
        [apiLimitsByApiId]
    );

    const toggleFeature = (id: string) => {
        setSelectedFeatureIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            // Sync selectedModuleIds from all selected features
            const allModuleIds = new Set<string>();
            featuresList.forEach((f) => {
                if (next.has(f.id)) {
                    f.moduleIds?.forEach((mid) => allModuleIds.add(mid));
                }
            });
            setSelectedModuleIds(allModuleIds);
            return next;
        });
    };

    const canProceedStep = () => {
        if (!useApi) return true;

        if (activeStep === 0) {
            if (!plan.name.trim()) return { ok: false, message: 'Plan name is required' };
            if (plan.billingModel === 'fixed' || plan.billingModel === 'hybrid') {
                if (!plan.price.trim()) return { ok: false, message: 'Price is required for fixed/hybrid plans' };
                if (!plan.durationDays.trim()) return { ok: false, message: 'Duration (days) is required for fixed/hybrid plans' };
            }
            return { ok: true as const };
        }

        if (activeStep === 1) {
            if (featuresLoading) return { ok: false, message: 'Loading features…' };
            if (selectedFeatureIds.size === 0) return { ok: false, message: 'Select at least one feature' };
            return { ok: true as const };
        }

        if (activeStep === 2) {
            if (limitsLoading) return { ok: false, message: 'Loading limits setup…' };

            const catalogKeys = new Set(limitsCatalog.map((c) => c.key.toLowerCase()));
            // limitId -> { customValue, period } seen so far, to catch conflicting values
            // for the same limit reused across multiple APIs in this save.
            const seenByLimitId = new Map<string, { value: string; period?: PlanApiLimitPeriod | null }>();

            for (const [, entry] of Object.entries(apiLimitsByApiId)) {
                // Scenario 3: same API cannot have two limit rows with the same
                // enforcement + period combination (regardless of which limit key is used).
                const seenComboForApi = new Set<string>();

                for (const row of entry.limits) {
                    const mode = row.sourceMode ?? 'existing';
                    const key =
                        String(row.limitKey ?? '').trim() ||
                        (mode === 'new' ? String(row.newLimitDraft?.key ?? '').trim() : '');

                    if (mode === 'new') {
                        const draft = row.newLimitDraft;
                        if (!draft?.key?.trim() || !draft?.name?.trim()) {
                            return {
                                ok: false,
                                message: 'New limits need both key and name',
                            };
                        }
                        // Scenario 1: block creating a "new" limit whose key already exists in the catalog —
                        // user must pick the existing limit instead of creating a duplicate.
                        const normalizedDraftKey = draft.key
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '_')
                            .replace(/[^a-z0-9_]/g, '');
                        if (catalogKeys.has(normalizedDraftKey)) {
                            return {
                                ok: false,
                                message: `Limit key "${draft.key.trim()}" already exists — select it from the existing limits list instead of creating a new one`,
                            };
                        }
                    }

                    if (!key) {
                        return { ok: false, message: 'Select or create a limit key for each added limit' };
                    }
                    if (!String(row.limitValue ?? '').trim()) {
                        return { ok: false, message: 'Enter a value for each added limit' };
                    }
                    if (row.enforcement === LIMIT_ENFORCEMENT.RENEWABLE && !row.period) {
                        return {
                            ok: false,
                            message: 'Renewable limits require a period (daily, weekly, or monthly)',
                        };
                    }

                    const comboKey = `${row.enforcement}::${row.enforcement === LIMIT_ENFORCEMENT.RENEWABLE ? row.period : ''}`;
                    if (seenComboForApi.has(comboKey)) {
                        return {
                            ok: false,
                            message: `This API already has a ${row.enforcement}${row.period ? ` / ${row.period}` : ''} limit — an API can have at most one limit per type and period combination`,
                        };
                    }
                    seenComboForApi.add(comboKey);

                    // Scenario 2: same existing limit (by limitId) mapped to multiple APIs with
                    // conflicting value/period — only one PlanLimit row exists per limit, so the
                    // values must agree across all occurrences.
                    if (mode === 'existing' && row.limitId) {
                        const current = { value: String(row.limitValue ?? '').trim(), period: row.period ?? null };
                        const prev = seenByLimitId.get(row.limitId);
                        if (prev && (prev.value !== current.value || prev.period !== current.period)) {
                            return {
                                ok: false,
                                message: `Limit "${key}" has different values across APIs — it must have one consistent value and period per plan`,
                            };
                        }
                        seenByLimitId.set(row.limitId, current);
                    }
                }
            }
            return { ok: true as const };
        }

        return { ok: true as const };
    };

    const handleNext = async () => {
        const check = canProceedStep();
        if (typeof check === 'object' && 'ok' in check && !check.ok) {
            showError(check.message);
            return;
        }

        // Edit mode: save feature selections when leaving step 2 (features step)
        if (editPlanId && useApi && activeStep === featuresStepIndex) {
            try {
                const res = await savePlanWizardFeaturesService(editPlanId, [...selectedFeatureIds]);
                if (res.success !== 200) {
                    showError(res.message || 'Failed to save plan features');
                    return;
                }
                // Reset limits so step 3 refetches with updated features
                setApiEndpointsList([]);
                setPlanModulesList([]);
                setLimitsCatalog([]);
            } catch (err) {
                showError(getApiErrorMessage(err) || 'Failed to save plan features');
                return;
            }
        }

        if (activeStep < steps.length - 1) {
            setActiveStep((p) => p + 1);
            return;
        }

        await handleFinish();
    };

    const handleBack = () => {
        if (activeStep > 0) setActiveStep((p) => p - 1);
    };

    const buildPlanDraftPayload = (): PlanSetupDraftPayload => ({
        plan,
        selectedModuleIds: [...selectedModuleIds],
        selectedFeatureIds: [...selectedFeatureIds],
        apiLimits: normalizePlanApiLimitsForSave(apiLimitsForSave),
    });

    const applyPlanDraftPayload = (payload: PlanSetupDraftPayload, step?: number) => {
        if (!payload?.plan) return;
        const planPatch = payload.plan;
        setPlan((p) => ({
            ...p,
            ...planPatch,
            billingModel: planPatch.billingModel as PlanBillingModel,
        }));
        setSelectedModuleIds(new Set(payload.selectedModuleIds ?? []));
        setSelectedFeatureIds(new Set(payload.selectedFeatureIds ?? []));
        setApiLimitsByApiId(
            payload.apiLimits?.length ? flatApiLimitsToById(payload.apiLimits) : {}
        );
        if (typeof step === 'number' && step >= 0 && step < steps.length) {
            setActiveStep(step);
        }
    };

    const loadPlanForEdit = async (planId: string) => {
        if (!useApi) {
            showError('Plan editing requires API mode');
            navigate(PLAN_PATHS.LIST);
            return;
        }
        setLoading(true);
        try {
            const res = await getPlanWizardForEditService(planId);
            if (res.success !== 200 || !res.data?.payload) {
                showError(res.message || 'Failed to load plan for editing');
                navigate(PLAN_PATHS.LIST);
                return;
            }
            applyPlanDraftPayload(res.data.payload);
            showSuccess('Plan loaded for editing');
        } catch (err) {
            showError(getApiErrorMessage(err) || 'Failed to load plan for editing');
            navigate(PLAN_PATHS.LIST);
        } finally {
            setLoading(false);
        }
    };

    const loadDraftById = async (draftId: string) => {
        if (useApi) {
            setLoading(true);
            try {
                const res = await getPlanSetupDraftByIdService(draftId);
                if (res.success !== 200 || !res.data) {
                    showError(res.message || 'Failed to load plan draft');
                    return;
                }
                applyPlanDraftPayload(res.data.payload, res.data.step);
                setActiveDraftId(res.data.id);
                showSuccess('Plan draft loaded');
            } catch (err) {
                showError(getApiErrorMessage(err) || 'Failed to load plan draft');
            } finally {
                setLoading(false);
            }
            return;
        }

        const found = readLocalPlanDrafts().find((d) => d.id === draftId);
        if (!found) {
            showError('Draft not found');
            return;
        }
        applyPlanDraftPayload(
            {
                plan: found.plan,
                selectedModuleIds: found.selectedModuleIds,
                selectedFeatureIds: found.selectedFeatureIds,
                apiLimits: found.apiLimits,
            },
            found.activeStep
        );
        setActiveDraftId(found.id);
        showSuccess('Plan draft loaded');
    };

    useEffect(() => {
        if (!editPlanId || !useApi || openedEditRef.current) return;
        openedEditRef.current = true;
        void loadPlanForEdit(editPlanId);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- open once for edit route
    }, [editPlanId, useApi]);

    useEffect(() => {
        const draftId = (location.state as { draftId?: string } | null)?.draftId;
        if (editPlanId || !draftId || openedFromListDraftRef.current) return;
        openedFromListDraftRef.current = true;
        void loadDraftById(draftId);
        navigate(location.pathname, { replace: true, state: {} });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- open once from plan list
    }, [location.state]);



    const handleFinish = async () => {
        const payload = buildPlanDraftPayload();

        if (useApi) {
            setLoading(true);
            try {
                const res = editPlanId
                    ? await updatePlanWizardService(editPlanId, payload)
                    : await completePlanWizardService(payload);
                const ok = editPlanId
                    ? res.success === 200
                    : res.success === 201 || res.success === 200;
                if (!ok) {
                    showError(res.message || (editPlanId ? 'Failed to update plan' : 'Failed to create plan'));
                    return;
                }
                if (!editPlanId && activeDraftId) {
                    try {
                        await deletePlanSetupDraftService(activeDraftId);
                    } catch {
                        // Plan was created; draft cleanup is best-effort
                    }
                }
                showSuccess(editPlanId ? 'Plan updated successfully' : 'Plan created successfully');
                navigate(PLAN_PATHS.LIST);
            } catch (err) {
                showError(getApiErrorMessage(err) || (editPlanId ? 'Failed to update plan' : 'Failed to create plan'));
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            const localPayload = {
                id: uid('planSetup'),
                timestamp: new Date().toISOString(),
                useApi,
                plan,
                selectedModuleIds: [...selectedModuleIds],
                selectedFeatureIds: [...selectedFeatureIds],
                apiLimits: apiLimitsForSave,
            };

            const existingStr = localStorage.getItem('PlanSetupWizardData');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            existing.push(localPayload);
            localStorage.setItem('PlanSetupWizardData', JSON.stringify(existing));

            showSuccess('Plan wizard saved locally.');
            navigate(PLAN_PATHS.LIST);
        } catch {
            showError('Failed to save wizard data locally');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        if (activeStep === 0) {
            if (useApi && basicsLoading) {
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 8,
                            gap: 2,
                        }}
                    >
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Loading companies…
                        </Typography>
                    </Box>
                );
            }
            return (
                <WizardStepPlanBasics
                    icon={<PlanIcon />}
                    useApi={useApi}
                    plan={plan}
                    onPlanChange={(patch) => setPlan((p) => ({ ...p, ...patch }))}
                    companiesList={companiesList}
                />
            );
        }

        if (activeStep === 1) {
            const allFeatureCards: WizardSelectCardItem[] = featuresList.map((f) => ({
                id: f.id,
                name: f.name,
                description: f.description,
                badgeLabel: `Key: ${f.key}`,
            }));
            const filteredAllFeatureCards = featureSearch
                ? allFeatureCards.filter(
                      (c) =>
                          c.name.toLowerCase().includes(featureSearch.toLowerCase()) ||
                          (c.badgeLabel ?? '').toLowerCase().includes(featureSearch.toLowerCase()) ||
                          (c.description ?? '').toLowerCase().includes(featureSearch.toLowerCase())
                  )
                : allFeatureCards;

            return (
                <Box>
                    <WizardStepHeader
                        icon={<FeaturesIcon />}
                        title="Select Plan Features"
                        showDescription={false}
                        afterTitle={
                            <WizardHelpButton title="Plan features — how it works">
                                <WizardHelpSection title="What this step does">
                                    <WizardHelpText>
                                        Choose which features are included in this plan. Only APIs linked to
                                        selected features appear in the limits step.
                                    </WizardHelpText>
                                </WizardHelpSection>
                            </WizardHelpButton>
                        }
                    />

                    {useApi && featuresLoading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 8,
                                gap: 2,
                            }}
                        >
                            <CircularProgress size={36} />
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Loading features…
                            </Typography>
                        </Box>
                    ) : (
                        <WizardStepSelectCards
                            showHeader={false}
                            searchPlaceholder="Search features…"
                            search={featureSearch}
                            onSearchChange={setFeatureSearch}
                            selectedIds={selectedFeatureIds}
                            onClearSelection={() => { setSelectedFeatureIds(new Set()); setSelectedModuleIds(new Set()); }}
                            filteredItems={filteredAllFeatureCards}
                            onToggleItem={toggleFeature}
                            onToggleAll={() => {
                                if (selectedFeatureIds.size === featuresList.length) {
                                    setSelectedFeatureIds(new Set());
                                    setSelectedModuleIds(new Set());
                                } else {
                                    setSelectedFeatureIds(new Set(featuresList.map((f) => f.id)));
                                    const allModuleIds = new Set<string>();
                                    featuresList.forEach((f) => f.moduleIds?.forEach((mid) => allModuleIds.add(mid)));
                                    setSelectedModuleIds(allModuleIds);
                                }
                            }}
                            selectionCountLabel={(count) =>
                                `${count} feature${count !== 1 ? 's' : ''} selected`
                            }
                            emptySearchMessage="No features match your search"
                        />
                    )}
                </Box>
            );
        }

        if (activeStep === 2) {
            if (useApi && limitsLoading) {
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 8,
                            gap: 2,
                        }}
                    >
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Loading API endpoints and limit catalog…
                        </Typography>
                    </Box>
                );
            }
            return (
                <WizardStepPlanApiLimits
                    useApi={useApi}
                    apis={apiEndpointsList}
                    features={featuresList}
                    modules={editPlanId ? planModulesList : undefined}
                    limitsCatalog={limitsCatalog}
                    selectedFeatureIds={selectedFeatureIds}
                    limitsByApiId={apiLimitsByApiId}
                    onLimitsChange={setApiLimitsByApiId}
                />
            );
        }

        return null;
    };

    return (
        <WizardLayout
            title={editPlanId ? 'Edit Plan Wizard' : 'Create Plan Wizard'}
            steps={steps}
            activeStep={activeStep}
            onNext={handleNext}
            onBack={handleBack}
            onStepClick={(i) => setActiveStep(i)}
            parentBackLabel="Plans"
            onParentBack={() => navigate(PLAN_PATHS.LIST)}
            loading={loading || (!useApi && planMockLoading)}
            nextButtonText={useApi ? 'Save & Next' : 'Next'}
            finishButtonText={
                useApi ? (editPlanId ? 'Update plan' : 'Create plan') : 'Finish (Save Local)'
            }
            extraActions={undefined}
        >
            {renderStepContent()}
        </WizardLayout>
    );
};

export default PlanSetupWizard;

