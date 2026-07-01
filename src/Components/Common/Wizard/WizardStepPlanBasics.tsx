import type { ReactNode } from 'react';
import {
    Box,
    Chip,
    FormControlLabel,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import {
    Public as PublicIcon,
    Business as BusinessIcon,
    Lock as LockIcon,
    Payments as PaymentsIcon,
    InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import WizardStepHeader from './WizardStepHeader';
import {
    PRIMARY,
    ICON_BG,
    fieldSx,
    wizardSwitchCheckedSx,
    wizardSectionPaperSx,
} from './setupWizardTheme';
import { planVisibilityLabel } from '../../../Utils/planVisibility';
import type { CompanyOption } from '../../../types/planTypes';

export type PlanBillingModel = 'fixed' | 'pay_as_you_go' | 'hybrid';

export type PlanBasicsDraft = {
    name: string;
    description: string;
    price: string;
    durationDays: string;
    billingModel: PlanBillingModel;
    isPublic: boolean;
    companyId: string;
    isActive: boolean;
};

export interface WizardStepPlanBasicsProps {
    icon: ReactNode;
    useApi: boolean;
    plan: PlanBasicsDraft;
    onPlanChange: (patch: Partial<PlanBasicsDraft>) => void;
    companiesList: CompanyOption[];
}

const sectionTitleSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 2,
};

const billingOptions: { value: PlanBillingModel; label: string; hint: string }[] = [
    { value: 'fixed', label: 'Fixed', hint: 'One price for the plan period' },
    { value: 'pay_as_you_go', label: 'Pay as you go', hint: 'Bill by usage (API pending)' },
    { value: 'hybrid', label: 'Hybrid', hint: 'Base fee + usage overages' },
];

const WizardStepPlanBasics = ({
    icon,
    useApi,
    plan,
    onPlanChange,
    companiesList,
}: WizardStepPlanBasicsProps) => {
    const selectedCompany = companiesList.find((c) => c.id === plan.companyId);
    const visibilitySummary = plan.isPublic
        ? 'Public — all companies can subscribe'
        : plan.companyId
            ? `Private — ${selectedCompany?.name ?? 'selected company'}`
            : 'Private — unassigned (link company later)';

    const visibilityPreviewLabel = plan.isPublic
        ? 'Public'
        : plan.companyId
            ? planVisibilityLabel({
                isPublic: false,
                companyId: plan.companyId,
                companyName: selectedCompany?.name,
            })
            : 'Private · Unassigned';

    const requiresPriceDuration =
        plan.billingModel === 'fixed' || plan.billingModel === 'hybrid';

    return (
        <Box>
            <WizardStepHeader
                icon={icon}
                title="Create Plan"
                description="Define pricing, billing model, and who can subscribe to this plan."
                endSlot={
                    <FormControlLabel
                        control={
                            <Switch
                                checked={plan.isActive}
                                onChange={(e) => onPlanChange({ isActive: e.target.checked })}
                                sx={wizardSwitchCheckedSx}
                            />
                        }
                        label={
                            <Typography fontWeight={700} fontSize="0.875rem" color="text.secondary">
                                {plan.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                        }
                        labelPlacement="start"
                        sx={{
                            m: 0,
                            flexShrink: 0,
                            ml: { xs: '44px', sm: 0 },
                        }}
                    />
                }
            />

            <Stack spacing={3}>
                <Paper elevation={0} sx={wizardSectionPaperSx}>
                    <Box sx={sectionTitleSx}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                bgcolor: ICON_BG,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: PRIMARY }}>
                                01
                            </Typography>
                        </Box>
                        <Typography fontWeight={700} fontSize="0.95rem" color="#1f2937">
                            Plan details
                        </Typography>
                    </Box>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Plan name"
                            value={plan.name}
                            onChange={(e) => onPlanChange({ name: e.target.value })}
                            required={useApi}
                            placeholder="e.g., Pro, Starter, Enterprise"
                            sx={fieldSx}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={plan.description}
                            onChange={(e) => onPlanChange({ description: e.target.value })}
                            multiline
                            minRows={2}
                            placeholder="What this plan includes for subscribers…"
                            sx={fieldSx}
                        />
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={wizardSectionPaperSx}>
                    <Box sx={sectionTitleSx}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                bgcolor: ICON_BG,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <PaymentsIcon sx={{ fontSize: 18, color: PRIMARY }} />
                        </Box>
                        <Typography fontWeight={700} fontSize="0.95rem" color="#1f2937">
                            Billing
                        </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Choose how this plan is charged
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 2,
                            alignItems: { md: 'flex-start' },
                        }}
                    >
                        <TextField
                            select
                            fullWidth
                            label="Billing model"
                            value={plan.billingModel}
                            onChange={(e) =>
                                onPlanChange({
                                    billingModel: e.target.value as PlanBillingModel,
                                })
                            }
                            sx={{ ...fieldSx, flex: { md: '1 1 220px' }, minWidth: { md: 200 } }}
                        >
                            {billingOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            label="Price"
                            value={plan.price}
                            onChange={(e) => onPlanChange({ price: e.target.value })}
                            required={useApi && requiresPriceDuration}
                            placeholder={
                                plan.billingModel === 'pay_as_you_go' ? 'Optional' : '999'
                            }
                            sx={{ ...fieldSx, flex: { md: '1 1 160px' }, minWidth: { md: 140 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            fontWeight={600}
                                        >
                                            ₹
                                        </Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Duration in Days"
                            value={plan.durationDays}
                            onChange={(e) => onPlanChange({ durationDays: e.target.value })}
                            required={useApi && requiresPriceDuration}
                            placeholder={
                                plan.billingModel === 'pay_as_you_go' ? 'Optional' : '30'
                            }
                            sx={{ ...fieldSx, flex: { md: '1 1 160px' }, minWidth: { md: 140 } }}
                        />
                    </Box>
                </Paper>

                <Paper elevation={0} sx={wizardSectionPaperSx}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 1,
                            mb: 2,
                        }}
                    >
                        <Box sx={{ ...sectionTitleSx, mb: 0 }}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    bgcolor: ICON_BG,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <PublicIcon sx={{ fontSize: 18, color: PRIMARY }} />
                            </Box>
                            <Typography fontWeight={700} fontSize="0.95rem" color="#1f2937">
                                Visibility
                            </Typography>
                        </Box>
                        <Chip
                            size="small"
                            label={visibilityPreviewLabel}
                            sx={{
                                fontWeight: 600,
                                bgcolor: plan.isPublic ? 'rgba(102,126,234,0.12)' : '#fff7ed',
                                color: plan.isPublic ? PRIMARY : '#b45309',
                                border: '1px solid',
                                borderColor: plan.isPublic ? 'rgba(102,126,234,0.35)' : '#fed7aa',
                            }}
                        />
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                        <Paper
                            component="button"
                            type="button"
                            elevation={0}
                            onClick={() => onPlanChange({ isPublic: true, companyId: '' })}
                            sx={{
                                flex: 1,
                                p: 2,
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: '12px',
                                border: '2px solid',
                                borderColor: plan.isPublic ? PRIMARY : '#e5e7eb',
                                bgcolor: plan.isPublic ? 'rgba(102,126,234,0.06)' : '#fff',
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <PublicIcon
                                    sx={{ color: plan.isPublic ? PRIMARY : 'text.disabled', mt: 0.25 }}
                                />
                                <Box>
                                    <Typography fontWeight={700} fontSize="0.9rem">
                                        Public
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Any company can pick this plan during onboarding.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                        <Paper
                            component="button"
                            type="button"
                            elevation={0}
                            onClick={() => onPlanChange({ isPublic: false })}
                            sx={{
                                flex: 1,
                                p: 2,
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: '12px',
                                border: '2px solid',
                                borderColor: !plan.isPublic ? PRIMARY : '#e5e7eb',
                                bgcolor: !plan.isPublic ? 'rgba(102,126,234,0.06)' : '#fff',
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <LockIcon
                                    sx={{ color: !plan.isPublic ? PRIMARY : 'text.disabled', mt: 0.25 }}
                                />
                                <Box>
                                    <Typography fontWeight={700} fontSize="0.9rem">
                                        Private
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        For one company only — or leave unassigned until the company
                                        exists.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Stack>

                    {!plan.isPublic && (
                        <Stack spacing={1.5}>
                            <TextField
                                select
                                fullWidth
                                label="Assign to company"
                                value={plan.companyId}
                                onChange={(e) => onPlanChange({ companyId: e.target.value })}
                                sx={fieldSx}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BusinessIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            >
                                <MenuItem value="">
                                    <Stack>
                                        <Typography variant="body2" fontWeight={600}>
                                            Unassigned
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Assign from plan list after company is created
                                        </Typography>
                                    </Stack>
                                </MenuItem>
                                {companiesList.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            {!plan.companyId && (
                                <Alert
                                    severity="info"
                                    icon={<InfoIcon fontSize="small" />}
                                    sx={{ borderRadius: '10px', '& .MuiAlert-message': { fontSize: '0.8rem' } }}
                                >
                                    You can create this plan before any company exists. It will not
                                    appear in onboarding until a company is linked.
                                </Alert>
                            )}
                        </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        {visibilitySummary}
                    </Typography>
                </Paper>
            </Stack>
        </Box>
    );
};

export default WizardStepPlanBasics;
