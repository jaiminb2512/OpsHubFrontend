import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
    Alert,
    IconButton,
    Grid,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Business as BusinessIcon,
    CardMembership as SubscribeIcon,
    CalendarMonth as CalendarIcon,
    Timer as DurationIcon,
    CheckCircleOutline as ActiveIcon,
} from '@mui/icons-material';
import { useToast } from '../../Utils/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { COMPANY_PATHS } from '../../Path/companyPaths';
import { getPlansService } from '../../Services/ApiServices/planServices';
import {
    getCompanyLimitsUsageService,
    estimateCompanySubscriptionService,
    subscribeCompanyService,
    type CompanyLimitsUsageResult,
} from '../../Services/ApiServices/companyServices';
import type { PlanCatalogItem } from '../../types/planTypes';

const PRIMARY = '#4f46e5'; // Premium Indigo

const CompanySubscribePage = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [estimating, setEstimating] = useState(false);

    const [companyData, setCompanyData] = useState<CompanyLimitsUsageResult | null>(null);
    const [plans, setPlans] = useState<PlanCatalogItem[]>([]);

    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().substring(0, 10)
    );
    const [estimatedEndDate, setEstimatedEndDate] = useState<string | null>(null);
    const [planDuration, setPlanDuration] = useState<number | null>(null);

    usePageTitle('Subscribe Company', (
        <Tooltip title="Back to list" arrow>
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(COMPANY_PATHS.LIST)}
                sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#e5e7eb',
                    color: '#4b5563',
                    minWidth: { xs: 0, md: 'auto' },
                    px: { xs: 1.5, md: 2 },
                    '& .MuiButton-startIcon': {
                        mr: { xs: 0, md: 1 },
                        ml: { xs: 0, md: -0.5 }
                    },
                    '&:hover': {
                        borderColor: '#d1d5db',
                        bgcolor: '#f9fafb',
                    },
                }}
            >
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                    Back to list
                </Box>
            </Button>
        </Tooltip>
    ));

    const loadData = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const [companyRes, plansRes] = await Promise.all([
                getCompanyLimitsUsageService(companyId),
                getPlansService({ isActive: true })
            ]);

            if (companyRes.success === 200 && companyRes.data) {
                setCompanyData(companyRes.data);
                if (companyRes.data.company?.plan?.id) {
                    setSelectedPlanId(companyRes.data.company.plan.id);
                }
            } else {
                showError(companyRes.message || 'Failed to load company details');
            }

            if (plansRes.success === 200 && plansRes.data) {
                setPlans(plansRes.data);
            } else {
                showError(plansRes.message || 'Failed to load plans');
            }
        } catch {
            showError('Failed to load subscription details');
        } finally {
            setLoading(false);
        }
    }, [companyId, showError]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const runEstimation = useCallback(async () => {
        if (!companyId || !selectedPlanId) {
            setEstimatedEndDate(null);
            setPlanDuration(null);
            return;
        }

        setEstimating(true);
        try {
            const res = await estimateCompanySubscriptionService(companyId, selectedPlanId, startDate);
            if (res.success === 200 && res.data) {
                setEstimatedEndDate(res.data.estimatedEndDate);
                setPlanDuration(res.data.planDuration);
            } else {
                setEstimatedEndDate(null);
                setPlanDuration(null);
            }
        } catch {
            setEstimatedEndDate(null);
            setPlanDuration(null);
        } finally {
            setEstimating(false);
        }
    }, [companyId, selectedPlanId, startDate]);

    useEffect(() => {
        void runEstimation();
    }, [runEstimation]);

    const handleSubscribe = async () => {
        if (!companyId || !selectedPlanId) return;
        setSubmitting(true);
        try {
            const res = await subscribeCompanyService(companyId, {
                planId: selectedPlanId,
                startDate,
            });

            if (res.success === 200) {
                showSuccess('Company subscribed successfully!');
                navigate(COMPANY_PATHS.LIST);
            } else {
                showError(res.message || 'Subscription failed');
            }
        } catch {
            showError('Failed to activate subscription');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (isoString?: string | null) => {
        if (!isoString) return 'Unlimited / Rolling';
        return new Date(isoString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    const currentPlan = companyData?.company?.plan;
    const currentSub = companyData?.subscription;

    return (
        <Box sx={{ width: '100%' }}>
            <Grid container spacing={3}>
                {/* Left Side: Current Status Summary */}
                <Box sx={{ width: '25%' }}>
                    <Card
                        elevation={0}
                        sx={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 3,
                            height: '100%',
                            width: '100%',
                            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Stack spacing={2.5}>
                                <Stack direction="row" alignItems="center" gap={1.5}>
                                    <IconButton sx={{ bgcolor: 'rgba(79, 70, 229, 0.1)', color: PRIMARY }}>
                                        <BusinessIcon />
                                    </IconButton>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            Company
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color="#111827">
                                            {companyData?.company?.name}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider />

                                <Typography fontWeight={700} fontSize="0.95rem" color="#374151">
                                    Current Subscription Details
                                </Typography>

                                {currentPlan ? (
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                    Active Plan
                                                </Typography>
                                                <Chip
                                                    label={currentPlan.name}
                                                    size="small"
                                                    icon={<ActiveIcon sx={{ color: '#fff !important' }} />}
                                                    sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 600 }}
                                                />
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Start Date
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600} color="#111827">
                                                    {formatDate(currentSub?.startDate)}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    End Date
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600} color="#111827">
                                                    {formatDate(currentSub?.endDate)}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Status
                                                </Typography>
                                                <Chip
                                                    label={currentSub?.status ? currentSub.status.toUpperCase() : 'ACTIVE'}
                                                    size="small"
                                                    color={currentSub?.status === 'active' ? 'success' : 'default'}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                                                />
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ) : (
                                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        No active subscription found. This company is currently unscheduled.
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>

                {/* Right Side: Resubscribe Form */}
                <Box sx={{ width: '73%' }}>
                    <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack spacing={3}>
                                <Stack direction="row" alignItems="center" gap={1.5}>
                                    <IconButton sx={{ bgcolor: 'rgba(79, 70, 229, 0.1)', color: PRIMARY }}>
                                        <SubscribeIcon />
                                    </IconButton>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700} color="#111827">
                                            Change Plan / Subscribe Again
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Selecting a new plan cancels the existing subscription and provisions the new options immediately.
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider />

                                <FormControl fullWidth required>
                                    <InputLabel id="select-plan-label">Choose Plan</InputLabel>
                                    <Select
                                        labelId="select-plan-label"
                                        value={selectedPlanId}
                                        label="Choose Plan"
                                        onChange={(e) => setSelectedPlanId(e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="">
                                            <em>-- Select Plan --</em>
                                        </MenuItem>
                                        {plans.map((pl) => (
                                            <MenuItem key={pl.id} value={pl.id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography fontWeight={600} fontSize="0.9rem">
                                                        {pl.name}
                                                    </Typography>
                                                    {pl.price && (
                                                        <Chip
                                                            label={`$${pl.price}`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Subscription Start Date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                    }}
                                />

                                {/* Estimation Summary Section */}
                                {selectedPlanId && (
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2.5,
                                            border: '1px solid rgba(79, 70, 229, 0.15)',
                                            bgcolor: 'rgba(79, 70, 229, 0.02)',
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight={700} color={PRIMARY} mb={1.5}>
                                            Estimation Summary
                                        </Typography>
                                        {estimating ? (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CircularProgress size={16} sx={{ color: PRIMARY }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Calculating dates...
                                                </Typography>
                                            </Stack>
                                        ) : (
                                            <Stack spacing={1.5}>
                                                <Stack direction="row" alignItems="center" gap={1}>
                                                    <CalendarIcon sx={{ fontSize: 18, color: '#4b5563' }} />
                                                    <Typography variant="body2" color="#4b5563">
                                                        Estimated Start: <strong>{formatDate(startDate)}</strong>
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" alignItems="center" gap={1}>
                                                    <CalendarIcon sx={{ fontSize: 18, color: '#4b5563' }} />
                                                    <Typography variant="body2" color="#4b5563">
                                                        Estimated End: <strong>{formatDate(estimatedEndDate)}</strong>
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" alignItems="center" gap={1}>
                                                    <DurationIcon sx={{ fontSize: 18, color: '#4b5563' }} />
                                                    <Typography variant="body2" color="#4b5563">
                                                        Plan Duration: <strong>{planDuration ? `${planDuration} Days` : 'Unlimited / Rolling'}</strong>
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        )}
                                    </Paper>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                                    <Button
                                        variant="contained"
                                        disabled={!selectedPlanId || submitting || estimating}
                                        onClick={handleSubscribe}
                                        sx={{
                                            px: 4,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            bgcolor: PRIMARY,
                                            '&:hover': {
                                                bgcolor: '#4338ca',
                                            },
                                        }}
                                    >
                                        {submitting ? 'Activating...' : 'Activate Subscription'}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Grid>
        </Box>
    );
};

export default CompanySubscribePage;
