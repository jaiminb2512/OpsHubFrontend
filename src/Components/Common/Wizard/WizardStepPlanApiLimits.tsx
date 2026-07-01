import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    IconButton,
    InputAdornment,
    MenuItem,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    DeleteOutline as DeleteIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    Search as SearchIcon,
    Speed as LimitsIcon,
} from '@mui/icons-material';
import WizardStepHeader from './WizardStepHeader';
import WizardMethodChip from './WizardMethodChip';
import WizardHelpButton, { WizardHelpSection, WizardHelpText } from './WizardHelpButton';
import { PRIMARY, fieldSx } from './setupWizardTheme';
import type { LimitEnforcement } from '../../../constants/limitEnforcement';
import {
    LIMIT_ENFORCEMENT,
    LIMIT_ENFORCEMENT_HINTS,
    LIMIT_ENFORCEMENT_LABELS,
} from '../../../constants/limitEnforcement';

export type PlanApiLimitPeriod = 'daily' | 'weekly' | 'monthly';

/** ON = select existing limit; OFF = create new limit */
export type PlanLimitSourceMode = 'existing' | 'new';

export type PlanNewLimitDraft = {
    key: string;
    name: string;
    featureId: string;
    description?: string;
};

export type PlanApiLimitRow = {
    id: string;
    limitId?: string;
    planLimitId?: string;
    sourceMode: PlanLimitSourceMode;
    enforcement: LimitEnforcement;
    limitKey: string;
    newLimitDraft?: PlanNewLimitDraft;
    period?: PlanApiLimitPeriod;
    limitValue: string;
};

/** One API can have zero or more limits */
export type PlanApiLimitsEntry = {
    limits: PlanApiLimitRow[];
};

export type PlanApiLimitValue = PlanApiLimitRow;

export type PlanWizardLimitCatalogItem = {
    key: string;
    name: string;
    enforcement: LimitEnforcement;
    defaultPeriod?: PlanApiLimitPeriod;
};

export type PlanWizardApiEndpoint = {
    id: string;
    method: string;
    path: string;
    key: string;
    featureKey?: string;
    suggestedLimitKey?: string;
    defaultEnforcement?: LimitEnforcement;
};

export type PlanWizardFeature = {
    id: string;
    moduleId?: string;
    key: string;
    name: string;
};

export type PlanWizardModule = {
    id: string;
    name: string;
};

export type PlanApiLimitsById = Record<string, PlanApiLimitsEntry>;

export interface WizardStepPlanApiLimitsProps {
    useApi: boolean;
    apis: PlanWizardApiEndpoint[];
    features: PlanWizardFeature[];
    modules?: PlanWizardModule[];
    limitsCatalog: PlanWizardLimitCatalogItem[];
    selectedFeatureIds: Set<string>;
    limitsByApiId: PlanApiLimitsById;
    onLimitsChange: (next: PlanApiLimitsById) => void;
}

const newLimitId = () => `lim-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function emptyNewLimitDraft(api: PlanWizardApiEndpoint, features: PlanWizardFeature[]): PlanNewLimitDraft {
    const featureId =
        api.featureKey != null ? features.find((f) => f.key === api.featureKey)?.id ?? '' : '';
    return { key: '', name: '', featureId };
}

function newLimitRow(
    api: PlanWizardApiEndpoint,
    catalog: PlanWizardLimitCatalogItem[],
    enforcement?: LimitEnforcement
): PlanApiLimitRow {
    const enf =
        enforcement ??
        api.defaultEnforcement ??
        (api.method === 'POST' ? LIMIT_ENFORCEMENT.RENEWABLE : LIMIT_ENFORCEMENT.MAX);
    const suggested = api.suggestedLimitKey ?? '';
    const suggestedCat = catalog.find((c) => c.key === suggested);
    const limitKey =
        suggestedCat?.enforcement === enf
            ? suggested
            : catalog.find((c) => c.enforcement === enf)?.key ?? '';

    return {
        id: newLimitId(),
        sourceMode: 'existing',
        enforcement: enf,
        limitKey,
        limitValue: '',
        ...(enf === LIMIT_ENFORCEMENT.RENEWABLE
            ? { period: suggestedCat?.defaultPeriod ?? 'monthly' }
            : {}),
    };
}

const getLimits = (limitsByApiId: PlanApiLimitsById, apiId: string): PlanApiLimitRow[] =>
    limitsByApiId[apiId]?.limits ?? [];

const WizardStepPlanApiLimits = ({
    useApi,
    apis,
    features,
    modules,
    limitsCatalog,
    selectedFeatureIds,
    limitsByApiId,
    onLimitsChange,
}: WizardStepPlanApiLimitsProps) => {
    const [search, setSearch] = useState('');
    const [featureFilterId, setFeatureFilterId] = useState<string>('all');
    const [moduleFilterId, setModuleFilterId] = useState<string>('all');
    const [bulkEnforcement, setBulkEnforcement] = useState<LimitEnforcement>(LIMIT_ENFORCEMENT.RENEWABLE);
    const [bulkPeriod, setBulkPeriod] = useState<PlanApiLimitPeriod>('monthly');
    const [bulkLimit, setBulkLimit] = useState('');
    const [rowSelection, setRowSelection] = useState<Set<string>>(() => new Set());
    const [expandedApiIds, setExpandedApiIds] = useState<Set<string>>(() => new Set());

    const catalogByKey = useMemo(() => {
        const m = new Map<string, PlanWizardLimitCatalogItem>();
        limitsCatalog.forEach((c) => m.set(c.key, c));
        return m;
    }, [limitsCatalog]);

    const limitsForEnforcement = (enforcement: LimitEnforcement) =>
        limitsCatalog.filter((c) => c.enforcement === enforcement);

    const featureByKey = useMemo(() => {
        const map = new Map<string, PlanWizardFeature>();
        features.forEach((f) => map.set(f.key, f));
        return map;
    }, [features]);

    const selectedFeatures = useMemo(
        () => features.filter((f) => selectedFeatureIds.has(f.id)),
        [features, selectedFeatureIds]
    );

    const selectedFeatureKeys = useMemo(() => new Set(selectedFeatures.map((f) => f.key)), [selectedFeatures]);

    const apiList = apis ?? [];

    const useModuleFilter = Array.isArray(modules) && modules.length > 0;

    const scopedApis = useMemo(() => {
        if (useModuleFilter) return apiList;
        if (selectedFeatureKeys.size === 0) return [];
        return apiList.filter((api) => !api.featureKey || selectedFeatureKeys.has(api.featureKey));
    }, [apiList, selectedFeatureKeys, useModuleFilter]);

    const filteredApis = useMemo(() => {
        const q = search.trim().toLowerCase();
        return scopedApis.filter((api) => {
            if (useModuleFilter) {
                if (moduleFilterId !== 'all' && (api as any).moduleId !== moduleFilterId) return false;
            } else {
                if (featureFilterId !== 'all') {
                    const f = features.find((x) => x.id === featureFilterId);
                    if (f && api.featureKey !== f.key) return false;
                }
            }
            if (!q) return true;
            const featureName = api.featureKey ? featureByKey.get(api.featureKey)?.name ?? '' : '';
            return (
                api.method.toLowerCase().includes(q) ||
                api.path.toLowerCase().includes(q) ||
                api.key.toLowerCase().includes(q) ||
                featureName.toLowerCase().includes(q)
            );
        });
    }, [scopedApis, search, featureFilterId, moduleFilterId, features, featureByKey, useModuleFilter]);

    const configuredCount = useMemo(
        () => scopedApis.filter((api) => getLimits(limitsByApiId, api.id).length > 0).length,
        [scopedApis, limitsByApiId]
    );

    const totalLimitRows = useMemo(
        () => Object.values(limitsByApiId).reduce((n, e) => n + e.limits.length, 0),
        [limitsByApiId]
    );

    const setLimitsForApi = (apiId: string, limits: PlanApiLimitRow[]) => {
        const next = { ...limitsByApiId };
        if (limits.length === 0) {
            delete next[apiId];
        } else {
            next[apiId] = { limits };
        }
        onLimitsChange(next);
    };

    const toggleExpanded = (apiId: string) => {
        setExpandedApiIds((prev) => {
            const next = new Set(prev);
            if (next.has(apiId)) next.delete(apiId);
            else next.add(apiId);
            return next;
        });
    };

    const addLimit = (api: PlanWizardApiEndpoint, enforcement?: LimitEnforcement) => {
        const limits = [
            ...getLimits(limitsByApiId, api.id),
            newLimitRow(api, limitsCatalog, enforcement),
        ];
        setLimitsForApi(api.id, limits);
        setExpandedApiIds((prev) => new Set(prev).add(api.id));
    };

    const removeLimit = (apiId: string, limitId: string) => {
        const nextLimits = getLimits(limitsByApiId, apiId).filter((r) => r.id !== limitId);
        setLimitsForApi(apiId, nextLimits);
        if (nextLimits.length === 0) {
            setExpandedApiIds((prev) => {
                const next = new Set(prev);
                next.delete(apiId);
                return next;
            });
        }
    };

    const patchLimit = (apiId: string, limitId: string, patch: Partial<PlanApiLimitRow>) => {
        const api = apis.find((a) => a.id === apiId);
        const limits = getLimits(limitsByApiId, apiId).map((row) => {
            if (row.id !== limitId) return row;
            let next: PlanApiLimitRow = { ...row, ...patch };

            if (patch.sourceMode === 'new' && api) {
                next = {
                    ...next,
                    sourceMode: 'new',
                    limitKey: '',
                    newLimitDraft: row.newLimitDraft ?? emptyNewLimitDraft(api, features),
                };
            }
            if (patch.sourceMode === 'existing') {
                next = { ...next, sourceMode: 'existing', newLimitDraft: undefined };
            }

            if (patch.enforcement === LIMIT_ENFORCEMENT.MAX) {
                next = { ...next, period: undefined };
            } else if (patch.enforcement === LIMIT_ENFORCEMENT.RENEWABLE && !next.period) {
                next = { ...next, period: 'monthly' };
            }

            if (patch.limitKey) {
                const cat = catalogByKey.get(patch.limitKey);
                if (cat?.enforcement === LIMIT_ENFORCEMENT.MAX) {
                    next = { ...next, enforcement: LIMIT_ENFORCEMENT.MAX, period: undefined };
                } else if (cat?.enforcement === LIMIT_ENFORCEMENT.RENEWABLE) {
                    next = {
                        ...next,
                        enforcement: LIMIT_ENFORCEMENT.RENEWABLE,
                        period: next.period ?? cat.defaultPeriod ?? 'monthly',
                    };
                }
            }

            if (next.enforcement === LIMIT_ENFORCEMENT.MAX) {
                next = { ...next, period: undefined };
            }

            return next;
        });
        setLimitsForApi(apiId, limits);
    };

    const patchNewLimitDraft = (
        apiId: string,
        limitId: string,
        draftPatch: Partial<PlanNewLimitDraft>
    ) => {
        const limits = getLimits(limitsByApiId, apiId).map((row) => {
            if (row.id !== limitId) return row;
            const draft = row.newLimitDraft ?? { key: '', name: '', featureId: '' };
            const nextDraft = { ...draft, ...draftPatch };
            return {
                ...row,
                newLimitDraft: nextDraft,
                ...(draftPatch.key !== undefined ? { limitKey: draftPatch.key } : {}),
            };
        });
        setLimitsForApi(apiId, limits);
    };

    const applyBulkToIds = (ids: string[]) => {
        if (ids.length === 0) return;
        const next = { ...limitsByApiId };
        ids.forEach((apiId) => {
            const api = apis.find((a) => a.id === apiId);
            if (!api) return;
            const row = newLimitRow(api, limitsCatalog, bulkEnforcement);
            row.limitValue = bulkLimit.trim();
            if (bulkEnforcement === LIMIT_ENFORCEMENT.RENEWABLE) {
                row.period = bulkPeriod;
            }
            const existing = next[apiId]?.limits ?? [];
            next[apiId] = { limits: [...existing, row] };
        });
        onLimitsChange(next);
    };

    const toggleRowSelected = (apiId: string) => {
        setRowSelection((prev) => {
            const next = new Set(prev);
            if (next.has(apiId)) next.delete(apiId);
            else next.add(apiId);
            return next;
        });
    };

    const toggleAllVisible = () => {
        const visibleIds = filteredApis.map((a) => a.id);
        const allSelected = visibleIds.length > 0 && visibleIds.every((id) => rowSelection.has(id));
        setRowSelection((prev) => {
            const next = new Set(prev);
            if (allSelected) visibleIds.forEach((id) => next.delete(id));
            else visibleIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const visibleAllSelected =
        filteredApis.length > 0 && filteredApis.every((a) => rowSelection.has(a.id));
    const visibleSomeSelected = filteredApis.some((a) => rowSelection.has(a.id));

    const helpDialog = (
        <>
            <WizardHelpSection title="What this step does">
                <WizardHelpText>
                    Attach plan limits to API routes. An API can have zero limits, one, or many — you choose
                    with <strong>Add limit</strong>.
                </WizardHelpText>
            </WizardHelpSection>
            <WizardHelpSection title="Max vs Renewable">
                <WizardHelpText>
                    <strong>Max</strong> — {LIMIT_ENFORCEMENT_HINTS.max}
                </WizardHelpText>
                <WizardHelpText>
                    <strong>Renewable</strong> — {LIMIT_ENFORCEMENT_HINTS.renewable}
                </WizardHelpText>
            </WizardHelpSection>
            <WizardHelpSection title="Select / Create switch">
                <WizardHelpText>
                    Switch to the right of delete: <strong>on</strong> = pick an existing limit; <strong>off</strong> =
                    enter a new key and name (saved with the plan — feature comes from the API route).
                </WizardHelpText>
            </WizardHelpSection>
            <WizardHelpSection title="Multiple limits per API">
                <WizardHelpText>
                    Example: POST /customers with both <code>max_customers</code> (max) and{' '}
                    <code>customers_per_month</code> (renewable). Click <strong>Add limit</strong> once per
                    rule — not every API needs both types. Use the arrow to expand and edit limits below each
                    route.
                </WizardHelpText>
            </WizardHelpSection>
            <WizardHelpSection title="Bulk apply">
                <WizardHelpText>
                    Select APIs with the checkbox, set type / period / value, then <strong>Apply to selected</strong>{' '}
                    to append one new limit row on each selected API.
                </WizardHelpText>
            </WizardHelpSection>
        </>
    );

    return (
        <Box>
            <WizardStepHeader
                icon={<LimitsIcon />}
                title="Plan Limits"
                showDescription={false}
                afterTitle={
                    <WizardHelpButton title="Plan limits — how it works">{helpDialog}</WizardHelpButton>
                }
            />

            {!useModuleFilter && selectedFeatureIds.size === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        Select at least one feature in the previous step to see related API endpoints.
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    placeholder="Search method, path, key, feature…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    sx={{ minWidth: 240, flex: 1, ...fieldSx }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                {useModuleFilter ? (
                                    <TextField
                                        select
                                        size="small"
                                        label="Module"
                                        value={moduleFilterId}
                                        onChange={(e) => setModuleFilterId(e.target.value)}
                                        sx={{ minWidth: 200, ...fieldSx }}
                                    >
                                        <MenuItem value="all">All modules</MenuItem>
                                        {(modules ?? []).map((m) => (
                                            <MenuItem key={m.id} value={m.id}>
                                                {m.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                ) : (
                                    <TextField
                                        select
                                        size="small"
                                        label="Feature"
                                        value={featureFilterId}
                                        onChange={(e) => setFeatureFilterId(e.target.value)}
                                        sx={{ minWidth: 200, ...fieldSx }}
                                    >
                                        <MenuItem value="all">All selected features</MenuItem>
                                        {selectedFeatures.map((f) => (
                                            <MenuItem key={f.id} value={f.id}>
                                                {f.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                                <Chip
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    label={`${configuredCount} APIs · ${totalLimitRows} limits`}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1.5,
                                    alignItems: 'flex-end',
                                    pt: 0.5,
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ width: '100%' }}>
                                    BULK APPLY (adds one limit row per selected API)
                                </Typography>
                                <TextField
                                    select
                                    size="small"
                                    label="Type"
                                    value={bulkEnforcement}
                                    onChange={(e) => setBulkEnforcement(e.target.value as LimitEnforcement)}
                                    sx={{ width: 120, ...fieldSx }}
                                >
                                    <MenuItem value="max">Max</MenuItem>
                                    <MenuItem value="renewable">Renewable</MenuItem>
                                </TextField>
                                {bulkEnforcement === LIMIT_ENFORCEMENT.RENEWABLE && (
                                    <TextField
                                        select
                                        size="small"
                                        label="Period"
                                        value={bulkPeriod}
                                        onChange={(e) => setBulkPeriod(e.target.value as PlanApiLimitPeriod)}
                                        sx={{ width: 120, ...fieldSx }}
                                    >
                                        <MenuItem value="daily">Daily</MenuItem>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                    </TextField>
                                )}
                                <TextField
                                    size="small"
                                    label="Value"
                                    value={bulkLimit}
                                    onChange={(e) => setBulkLimit(e.target.value)}
                                    placeholder="e.g. 100"
                                    sx={{ width: 100, ...fieldSx }}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={rowSelection.size === 0}
                                    onClick={() => applyBulkToIds([...rowSelection])}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    Apply to selected ({rowSelection.size})
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="inherit"
                                    onClick={() => onLimitsChange({})}
                                    sx={{ textTransform: 'none', fontWeight: 600, ml: 'auto' }}
                                >
                                    Clear all
                                </Button>
                            </Box>
                        </Stack>
                    </Paper>

                    <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ borderRadius: 2, maxHeight: { xs: 520, md: 640 }, overflow: 'auto' }}
                    >
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ bgcolor: '#f5f5f5' }}>
                                        <Checkbox
                                            size="small"
                                            checked={visibleAllSelected}
                                            indeterminate={visibleSomeSelected && !visibleAllSelected}
                                            disabled={filteredApis.length === 0}
                                            onChange={toggleAllVisible}
                                            sx={{ '&.Mui-checked': { color: PRIMARY } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', width: 40 }} />
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 72 }}>
                                        Method
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, minWidth: 160 }}>
                                        Route
                                    </TableCell>
                                    <TableCell
                                        sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 100 }}
                                        align="center"
                                    >
                                        No. of limits
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 120 }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredApis.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                                            {scopedApis.length === 0
                                                ? 'No API endpoints are linked to the selected features yet.'
                                                : 'No APIs match your search or filter.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredApis.flatMap((api) => {
                                        const limits = getLimits(limitsByApiId, api.id);
                                        const isExpanded = expandedApiIds.has(api.id);
                                        const limitCount = limits.length;

                                        const summaryRow = (
                                            <TableRow
                                                key={api.id}
                                                hover
                                                sx={{
                                                    bgcolor: rowSelection.has(api.id)
                                                        ? 'rgba(102,126,234,0.04)'
                                                        : undefined,
                                                }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        checked={rowSelection.has(api.id)}
                                                        onChange={() => toggleRowSelected(api.id)}
                                                        sx={{ '&.Mui-checked': { color: PRIMARY } }}
                                                    />
                                                </TableCell>
                                                <TableCell padding="checkbox">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleExpanded(api.id)}
                                                        aria-label={
                                                            isExpanded ? 'Collapse limits' : 'Expand limits'
                                                        }
                                                    >
                                                        {isExpanded ? (
                                                            <ExpandLessIcon fontSize="small" />
                                                        ) : (
                                                            <ExpandMoreIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell>
                                                    <WizardMethodChip method={api.method} />
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={api.path}>
                                                        <Typography
                                                            variant="caption"
                                                            fontFamily="monospace"
                                                            sx={{ wordBreak: 'break-all' }}
                                                        >
                                                            {api.path}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        size="small"
                                                        label={limitCount}
                                                        color={limitCount > 0 ? 'primary' : 'default'}
                                                        variant={limitCount > 0 ? 'filled' : 'outlined'}
                                                        sx={{ minWidth: 32, fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => addLimit(api)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            borderRadius: 2,
                                                            borderColor: PRIMARY,
                                                            color: PRIMARY,
                                                        }}
                                                    >
                                                        Add limit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );

                                        const detailRow = isExpanded ? (
                                            <TableRow key={`${api.id}-details`}>
                                                <TableCell
                                                    colSpan={6}
                                                    sx={{ p: 0, bgcolor: '#f8f9fc', borderBottom: '2px solid #eee' }}
                                                >
                                                    {limitCount === 0 ? (
                                                        <Box sx={{ px: 2, py: 1.5 }}>
                                                            <Typography variant="caption" color="text.disabled">
                                                                No limits on this API. Click Add limit above.
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 700, width: 100 }}>
                                                                        Type
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>
                                                                        Limit
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 700, width: 100 }}>
                                                                        Period
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 700, width: 88 }}>
                                                                        Value
                                                                    </TableCell>
                                                                    <TableCell sx={{ width: 120 }} align="right">
                                                                        Actions
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {limits.map((limitRow) => {
                                                                    const keysForType = limitsForEnforcement(
                                                                        limitRow.enforcement
                                                                    );
                                                                    const selectMode =
                                                                        (limitRow.sourceMode ?? 'existing') ===
                                                                        'existing';
                                                                    return (
                                                                        <TableRow key={limitRow.id} hover>
                                                                            <TableCell>
                                                                                <TextField
                                                                                    select
                                                                                    size="small"
                                                                                    value={limitRow.enforcement}
                                                                                    onChange={(e) =>
                                                                                        patchLimit(api.id, limitRow.id, {
                                                                                            enforcement: e.target
                                                                                                .value as LimitEnforcement,
                                                                                        })
                                                                                    }
                                                                                    sx={fieldSx}
                                                                                    fullWidth
                                                                                >
                                                                                    <MenuItem value="max">
                                                                                        {LIMIT_ENFORCEMENT_LABELS.max}
                                                                                    </MenuItem>
                                                                                    <MenuItem value="renewable">
                                                                                        {
                                                                                            LIMIT_ENFORCEMENT_LABELS.renewable
                                                                                        }
                                                                                    </MenuItem>
                                                                                </TextField>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {selectMode ? (
                                                                                    <TextField
                                                                                        select
                                                                                        size="small"
                                                                                        label="Limit key"
                                                                                        value={limitRow.limitKey}
                                                                                        onChange={(e) =>
                                                                                            patchLimit(api.id, limitRow.id, {
                                                                                                limitKey: e.target.value,
                                                                                            })
                                                                                        }
                                                                                        sx={fieldSx}
                                                                                        fullWidth
                                                                                    >
                                                                                        <MenuItem value="">
                                                                                            <em>Select key</em>
                                                                                        </MenuItem>
                                                                                        {keysForType.map((c) => (
                                                                                            <MenuItem
                                                                                                key={c.key}
                                                                                                value={c.key}
                                                                                            >
                                                                                                {c.name} ({c.key})
                                                                                            </MenuItem>
                                                                                        ))}
                                                                                    </TextField>
                                                                                ) : (
                                                                                    <Box
                                                                                        sx={{
                                                                                            display: 'flex',
                                                                                            gap: 1,
                                                                                            alignItems: 'flex-start',
                                                                                        }}
                                                                                    >
                                                                                        <TextField
                                                                                            size="small"
                                                                                            label="Key"
                                                                                            placeholder="max_orders"
                                                                                            value={
                                                                                                limitRow.newLimitDraft
                                                                                                    ?.key ?? ''
                                                                                            }
                                                                                            onChange={(e) =>
                                                                                                patchNewLimitDraft(
                                                                                                    api.id,
                                                                                                    limitRow.id,
                                                                                                    { key: e.target.value }
                                                                                                )
                                                                                            }
                                                                                            sx={{ ...fieldSx, flex: 1 }}
                                                                                        />
                                                                                        <TextField
                                                                                            size="small"
                                                                                            label="Name"
                                                                                            placeholder="Max Orders"
                                                                                            value={
                                                                                                limitRow.newLimitDraft
                                                                                                    ?.name ?? ''
                                                                                            }
                                                                                            onChange={(e) =>
                                                                                                patchNewLimitDraft(
                                                                                                    api.id,
                                                                                                    limitRow.id,
                                                                                                    { name: e.target.value }
                                                                                                )
                                                                                            }
                                                                                            sx={{ ...fieldSx, flex: 1 }}
                                                                                        />
                                                                                    </Box>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {limitRow.enforcement ===
                                                                                    LIMIT_ENFORCEMENT.MAX ? (
                                                                                    <Typography
                                                                                        variant="caption"
                                                                                        color="text.disabled"
                                                                                    >
                                                                                        —
                                                                                    </Typography>
                                                                                ) : (
                                                                                    <TextField
                                                                                        select
                                                                                        size="small"
                                                                                        value={limitRow.period ?? 'monthly'}
                                                                                        onChange={(e) =>
                                                                                            patchLimit(
                                                                                                api.id,
                                                                                                limitRow.id,
                                                                                                {
                                                                                                    period: e.target
                                                                                                        .value as PlanApiLimitPeriod,
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                        sx={fieldSx}
                                                                                        fullWidth
                                                                                    >
                                                                                        <MenuItem value="daily">
                                                                                            Daily
                                                                                        </MenuItem>
                                                                                        <MenuItem value="weekly">
                                                                                            Weekly
                                                                                        </MenuItem>
                                                                                        <MenuItem value="monthly">
                                                                                            Monthly
                                                                                        </MenuItem>
                                                                                    </TextField>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <TextField
                                                                                    size="small"
                                                                                    type="number"
                                                                                    value={limitRow.limitValue}
                                                                                    onChange={(e) =>
                                                                                        patchLimit(api.id, limitRow.id, {
                                                                                            limitValue: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    placeholder="100"
                                                                                    required={useApi}
                                                                                    sx={fieldSx}
                                                                                    fullWidth
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell align="right">
                                                                                <Box
                                                                                    sx={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'flex-end',
                                                                                        gap: 0.25,
                                                                                    }}
                                                                                >
                                                                                    <Tooltip title="Remove limit">
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            color="error"
                                                                                            onClick={() =>
                                                                                                removeLimit(
                                                                                                    api.id,
                                                                                                    limitRow.id
                                                                                                )
                                                                                            }
                                                                                            aria-label="Remove limit"
                                                                                        >
                                                                                            <DeleteIcon fontSize="small" />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                    <Tooltip
                                                                                        title={
                                                                                            selectMode
                                                                                                ? 'Select existing limit (switch off to create new)'
                                                                                                : 'Create new limit (switch on to select existing)'
                                                                                        }
                                                                                    >
                                                                                        <FormControlLabel
                                                                                            control={
                                                                                                <Switch
                                                                                                    size="small"
                                                                                                    checked={selectMode}
                                                                                                    onChange={(e) =>
                                                                                                        patchLimit(
                                                                                                            api.id,
                                                                                                            limitRow.id,
                                                                                                            {
                                                                                                                sourceMode:
                                                                                                                    e.target
                                                                                                                        .checked
                                                                                                                        ? 'existing'
                                                                                                                        : 'new',
                                                                                                            }
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                            }
                                                                                            label={
                                                                                                <Typography
                                                                                                    variant="caption"
                                                                                                    sx={{
                                                                                                        fontSize: 10,
                                                                                                        fontWeight: 600,
                                                                                                        lineHeight: 1.1,
                                                                                                    }}
                                                                                                >
                                                                                                    {selectMode
                                                                                                        ? 'Select'
                                                                                                        : 'Create'}
                                                                                                </Typography>
                                                                                            }
                                                                                            labelPlacement="bottom"
                                                                                            sx={{ m: 0 }}
                                                                                        />
                                                                                    </Tooltip>
                                                                                </Box>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ) : null;

                                        return detailRow ? [summaryRow, detailRow] : [summaryRow];
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            )}
        </Box>
    );
};

export default WizardStepPlanApiLimits;
