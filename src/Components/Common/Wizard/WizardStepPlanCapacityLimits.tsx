import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    InputAdornment,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Groups as CapacityIcon, Search as SearchIcon } from '@mui/icons-material';
import WizardStepHeader from './WizardStepHeader';
import { PRIMARY, fieldSx } from './setupWizardTheme';
import { LIMIT_ENFORCEMENT_LABELS } from '../../../constants/limitEnforcement';

export type PlanCapacityLimitCatalogItem = {
    id: string;
    key: string;
    name: string;
    description?: string;
    /** When set, limit is shown only if this module is selected in the plan. */
    moduleId?: string | null;
};

export type PlanCapacityLimitValue = {
    customValue: string;
};

export type PlanCapacityLimitsById = Record<string, PlanCapacityLimitValue>;

export type PlanCapacityWizardModule = {
    id: string;
    name: string;
};

export interface WizardStepPlanCapacityLimitsProps {
    useApi: boolean;
    limits: PlanCapacityLimitCatalogItem[];
    modules: PlanCapacityWizardModule[];
    selectedModuleIds: Set<string>;
    limitsByLimitId: PlanCapacityLimitsById;
    onLimitsChange: (next: PlanCapacityLimitsById) => void;
}

const WizardStepPlanCapacityLimits = ({
    useApi,
    limits,
    modules,
    selectedModuleIds,
    limitsByLimitId,
    onLimitsChange,
}: WizardStepPlanCapacityLimitsProps) => {
    const [search, setSearch] = useState('');
    const [bulkMax, setBulkMax] = useState('');
    const [rowSelection, setRowSelection] = useState<Set<string>>(() => new Set());

    const scopedLimits = useMemo(() => {
        return limits.filter((lim) => {
            if (!lim.moduleId) return true;
            return selectedModuleIds.has(lim.moduleId);
        });
    }, [limits, selectedModuleIds]);

    const moduleNameById = useMemo(() => {
        const map = new Map<string, string>();
        modules.forEach((m) => map.set(m.id, m.name));
        return map;
    }, [modules]);

    const filteredLimits = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return scopedLimits;
        return scopedLimits.filter(
            (lim) =>
                lim.name.toLowerCase().includes(q) ||
                lim.key.toLowerCase().includes(q) ||
                (lim.description ?? '').toLowerCase().includes(q)
        );
    }, [scopedLimits, search]);

    const configuredCount = useMemo(
        () => Object.keys(limitsByLimitId).filter((id) => limitsByLimitId[id] != null).length,
        [limitsByLimitId]
    );

    const isConfigured = (limitId: string) => limitsByLimitId[limitId] != null;

    const toggleConfigured = (limitId: string, enabled: boolean) => {
        if (!enabled) {
            const next = { ...limitsByLimitId };
            delete next[limitId];
            onLimitsChange(next);
            setRowSelection((prev) => {
                const n = new Set(prev);
                n.delete(limitId);
                return n;
            });
            return;
        }
        onLimitsChange({
            ...limitsByLimitId,
            [limitId]: limitsByLimitId[limitId] ?? { customValue: '' },
        });
    };

    const patchLimit = (limitId: string, patch: Partial<PlanCapacityLimitValue>) => {
        const current = limitsByLimitId[limitId] ?? { customValue: '' };
        onLimitsChange({
            ...limitsByLimitId,
            [limitId]: { ...current, ...patch },
        });
    };

    const applyBulkToIds = (ids: string[]) => {
        if (ids.length === 0 || !bulkMax.trim()) return;
        const next = { ...limitsByLimitId };
        ids.forEach((limitId) => {
            next[limitId] = { customValue: bulkMax.trim() };
        });
        onLimitsChange(next);
    };

    const toggleRowSelected = (limitId: string) => {
        setRowSelection((prev) => {
            const next = new Set(prev);
            if (next.has(limitId)) next.delete(limitId);
            else next.add(limitId);
            return next;
        });
    };

    const toggleAllVisible = () => {
        const visibleIds = filteredLimits.map((l) => l.id);
        const allSelected = visibleIds.length > 0 && visibleIds.every((id) => rowSelection.has(id));
        setRowSelection((prev) => {
            const next = new Set(prev);
            if (allSelected) visibleIds.forEach((id) => next.delete(id));
            else visibleIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const visibleAllSelected =
        filteredLimits.length > 0 && filteredLimits.every((l) => rowSelection.has(l.id));
    const visibleSomeSelected = filteredLimits.some((l) => rowSelection.has(l.id));

    return (
        <Box>
            <WizardStepHeader
                icon={<CapacityIcon />}
                title="Capacity Limits (Max)"
                description="Hard caps on live records (enforcement: max). For per-month API quotas, use the next step with type Renewable."
            />

            {selectedModuleIds.size === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        Select modules in step 2 to see module-specific capacity limits.
                    </Typography>
                </Paper>
            ) : scopedLimits.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">No capacity limits available in catalog.</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    placeholder="Search name or key…"
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
                                <Chip
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    label={`${configuredCount} / ${scopedLimits.length} configured`}
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
                                    BULK APPLY MAX VALUE
                                </Typography>
                                <TextField
                                    size="small"
                                    label="Max"
                                    value={bulkMax}
                                    onChange={(e) => setBulkMax(e.target.value)}
                                    placeholder="e.g. 10"
                                    sx={{ width: 120, ...fieldSx }}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={rowSelection.size === 0 || !bulkMax.trim()}
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
                        sx={{ borderRadius: 2, maxHeight: { xs: 400, md: 480 }, overflow: 'auto' }}
                    >
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ bgcolor: '#f5f5f5' }}>
                                        <Checkbox
                                            size="small"
                                            indeterminate={visibleSomeSelected && !visibleAllSelected}
                                            checked={visibleAllSelected}
                                            onChange={toggleAllVisible}
                                            sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: PRIMARY } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 72 }}>
                                        Enable
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Limit</TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 130 }}>
                                        Key
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 72 }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 110 }}>
                                        Module
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700, width: 100 }}>
                                        Value
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLimits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                                            No limits match your search
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLimits.map((lim) => {
                                        const configured = isConfigured(lim.id);
                                        const value = limitsByLimitId[lim.id];
                                        const moduleLabel = lim.moduleId
                                            ? moduleNameById.get(lim.moduleId) ?? lim.moduleId
                                            : 'All plans';

                                        return (
                                            <TableRow
                                                key={lim.id}
                                                hover
                                                selected={configured}
                                                sx={{ bgcolor: configured ? 'rgba(102,126,234,0.04)' : undefined }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        checked={rowSelection.has(lim.id)}
                                                        onChange={() => toggleRowSelected(lim.id)}
                                                        sx={{ '&.Mui-checked': { color: PRIMARY } }}
                                                    />
                                                </TableCell>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        checked={configured}
                                                        onChange={(e) => toggleConfigured(lim.id, e.target.checked)}
                                                        sx={{ '&.Mui-checked': { color: PRIMARY } }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {lim.name}
                                                    </Typography>
                                                    {lim.description ? (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {lim.description}
                                                        </Typography>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                                                        {lim.key}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={LIMIT_ENFORCEMENT_LABELS.max}
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                            height: 22,
                                                            bgcolor: 'rgba(34,197,94,0.1)',
                                                            color: '#15803d',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" noWrap>
                                                        {moduleLabel}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        inputProps={{ min: 0, step: 1 }}
                                                        value={value?.customValue ?? ''}
                                                        disabled={!configured}
                                                        onChange={(e) =>
                                                            patchLimit(lim.id, { customValue: e.target.value })
                                                        }
                                                        placeholder="4"
                                                        required={useApi && configured}
                                                        sx={fieldSx}
                                                        fullWidth
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="caption" color="text.secondary">
                        Capacity limits count live records (e.g. active users). Re-subscribing to the same plan does not
                        double these caps.
                    </Typography>
                </Stack>
            )}
        </Box>
    );
};

export default WizardStepPlanCapacityLimits;
