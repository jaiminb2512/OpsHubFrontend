import { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    LinearProgress,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { PRIMARY } from '../Common/Wizard';
import {
    getCompanyLimitsUsageService,
    type CompanyLimitsUsageResult,
    type CompanyPlanLimitItem,
} from '../../Services/ApiServices/companyServices';
import { useToast } from '../../Utils/ToastContext';

type Props = {
    open: boolean;
    companyId: string;
    companyName: string;
    onClose: () => void;
};

const formatDate = (value: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const capLabel = (cap: number | null) => (cap == null ? 'Unlimited' : String(cap));

const usagePercent = (used: number, cap: number | null) => {
    if (cap == null || cap <= 0) return 0;
    return Math.min(100, Math.round((used / cap) * 100));
};

const LimitRow = ({ item }: { item: CompanyPlanLimitItem }) => {
    const pct = usagePercent(item.currentUsed, item.planCap);

    return (
        <>
            <TableRow sx={{ bgcolor: 'rgba(102,126,234,0.04)' }}>
                <TableCell>
                    <Typography fontWeight={600} fontSize="0.85rem">
                        {item.limitName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        {item.limitKey}
                    </Typography>
                    {item.feature ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                            {item.feature.name}
                        </Typography>
                    ) : null}
                </TableCell>
                <TableCell>
                    <Chip
                        size="small"
                        label={item.enforcement}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20, textTransform: 'capitalize' }}
                    />
                </TableCell>
                <TableCell>{capLabel(item.planCap)}</TableCell>
                <TableCell>
                    <Typography fontWeight={700} color={pct >= 100 ? 'error.main' : 'text.primary'}>
                        {item.currentUsed}
                    </Typography>
                    {item.planCap != null ? (
                        <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                                mt: 0.5,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(0,0,0,0.06)',
                                '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#ef4444' : PRIMARY },
                            }}
                        />
                    ) : null}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                    {formatDate(item.currentPeriodStart)} – {formatDate(item.currentPeriodEnd)}
                </TableCell>
            </TableRow>
            {item.usages.length > 1 &&
                item.usages.map((u) => (
                    <TableRow
                        key={u.id}
                        sx={{
                            opacity: u.isDeleted ? 0.5 : 1,
                            bgcolor: u.isCurrent ? 'rgba(102,126,234,0.08)' : 'transparent',
                        }}
                    >
                        <TableCell colSpan={2} sx={{ pl: 4, fontSize: '0.78rem', color: 'text.secondary' }}>
                            {u.period} period
                            {u.isCurrent ? (
                                <Chip label="current" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                            ) : null}
                            {u.isDeleted ? (
                                <Chip label="removed" size="small" color="default" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                            ) : null}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>—</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{u.usedValue}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>
                            {formatDate(u.periodStart)} – {formatDate(u.periodEnd)}
                        </TableCell>
                    </TableRow>
                ))}
        </>
    );
};

const CompanyLimitsUsageDialog = ({ open, companyId, companyName, onClose }: Props) => {
    const { showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [data, setData] = useState<CompanyLimitsUsageResult | null>(null);

    const load = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await getCompanyLimitsUsageService(companyId, { includeInactive });
            if (res.success === 200 && res.data) {
                setData(res.data);
            } else {
                showError(res.message || 'Failed to load limits and usage');
            }
        } catch {
            showError('Failed to load limits and usage');
        } finally {
            setLoading(false);
        }
    }, [companyId, includeInactive, showError]);

    useEffect(() => {
        if (open && companyId) {
            void load();
        } else if (!open) {
            setData(null);
            setIncludeInactive(false);
        }
    }, [open, companyId, load]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                <Box>
                    <Typography fontWeight={700}>Limits &amp; usage</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {companyName}
                        {data?.company.plan?.name ? ` · ${data.company.plan.name}` : ''}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {data?.subscription ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Subscription: {formatDate(data.subscription.startDate)}
                        {' – '}
                        {data.subscription.endDate ? formatDate(data.subscription.endDate) : 'open-ended'}
                        {' · '}
                        <Chip label={data.subscription.status} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Typography>
                ) : null}

                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={includeInactive}
                            onChange={(e) => setIncludeInactive(e.target.checked)}
                        />
                    }
                    label="Show removed usage rows"
                    sx={{ mb: 1 }}
                />

                {loading ? (
                    <Stack alignItems="center" py={4}>
                        <CircularProgress />
                    </Stack>
                ) : !data?.limits?.length ? (
                    <Typography color="text.secondary" py={3} textAlign="center">
                        {data?.company.plan
                            ? 'No limits configured on this plan.'
                            : 'This company has no plan assigned.'}
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Limit</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Cap</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Used (current)</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Current period</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.limits.map((item) => (
                                    <LimitRow key={item.limitId} item={item} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CompanyLimitsUsageDialog;
