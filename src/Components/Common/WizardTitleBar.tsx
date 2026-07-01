import React from 'react';
import { Box, Typography, Button, CircularProgress, IconButton } from '@mui/material';
import {
    Check as CheckIcon,
    ChevronRight as ChevronRightIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import colors from '../../Utils/colors';
import { usePageTitleContext } from '../../Context/PageTitleContext';

export interface WizardTitleBarProps {
    title?: string;
    steps: string[];
    activeStep: number;
    onStepClick?: (stepIndex: number) => void;
    onNext: () => void;
    loading?: boolean;
    nextButtonText?: string;
    finishButtonText?: string;
    extraActions?: React.ReactNode;
    parentBackLabel?: string;
    onParentBack: () => void;
    isInline?: boolean;
}

const PRIMARY = colors.primary.main;
const GRADIENT = colors.primary.gradient;
const SUCCESS = colors.success.main;
const BTN_SHADOW = colors.shadow.button;

const WizardTitleBar: React.FC<WizardTitleBarProps> = ({
    title,
    steps,
    activeStep,
    onStepClick,
    onNext,
    loading = false,
    nextButtonText = 'Save & Next',
    finishButtonText = 'Finish Setup',
    extraActions,
    parentBackLabel = 'Back',
    onParentBack,
    isInline = false,
}) => {
    const { wizardHeaderRef } = usePageTitleContext();
    const isLast = activeStep === steps.length - 1;

    /** Use ref handlers only — props may be stale; never `?? onNext()` after ref (void return would double-fire). */
    const handleNext = () => {
        if (!isInline && wizardHeaderRef.current?.onNext) wizardHeaderRef.current.onNext();
        else onNext();
    };
    const handleParentBack = () => {
        if (!isInline && wizardHeaderRef.current?.onParentBack) wizardHeaderRef.current.onParentBack();
        else onParentBack();
    };
    const handleStepClick = (index: number) => {
        if (!isInline && wizardHeaderRef.current?.onStepClick) wizardHeaderRef.current.onStepClick(index);
        else onStepClick?.(index);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, md: 2 },
                flex: 1,
                minWidth: 0,
                width: '100%',
            }}
        >
            <IconButton
                size="small"
                onClick={handleParentBack}
                sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    color: colors.text.secondary,
                    flexShrink: 0,
                }}
                aria-label={parentBackLabel}
            >
                <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Button
                type="button"
                variant="text"
                startIcon={<ArrowBackIcon sx={{ fontSize: 20 }} />}
                onClick={handleParentBack}
                sx={{
                    flexShrink: 0,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: colors.text.secondary,
                    minWidth: 'auto',
                    px: 0.5,
                    display: { xs: 'none', sm: 'inline-flex' },
                    '&:hover': { bgcolor: colors.background.hover },
                }}
            >
                {parentBackLabel}
            </Button>

            {title && (
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="text.primary"
                    noWrap
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        fontSize: '1.05rem',
                        flexShrink: 0,
                        maxWidth: 200,
                    }}
                >
                    {title}
                </Typography>
            )}

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    minWidth: 0,
                    overflowX: 'auto',
                }}
            >
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: { xs: 0.5, sm: 1 },
                        flexWrap: 'nowrap',
                        px: { xs: 1.5, sm: 2 },
                        py: 0.75,
                        borderRadius: 999,
                        border: `1.5px solid ${colors.border.light}`,
                        bgcolor: colors.background.secondary,
                    }}
                >
                    {steps.map((label, index) => {
                        const isActive = index === activeStep;
                        const isCompleted = index < activeStep;
                        const isClickable = isCompleted && !!onStepClick;

                        return (
                            <React.Fragment key={`${label}-${index}`}>
                                {index > 0 && (
                                    <ChevronRightIcon
                                        sx={{
                                            fontSize: 20,
                                            color: colors.border.medium,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                <Box
                                    role={isClickable ? 'button' : undefined}
                                    tabIndex={isClickable ? 0 : undefined}
                                    onClick={() => isClickable && handleStepClick(index)}
                                    onKeyDown={(e) => {
                                        if (
                                            isClickable &&
                                            (e.key === 'Enter' || e.key === ' ')
                                        ) {
                                            e.preventDefault();
                                                    handleStepClick(index);
                                        }
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        flexShrink: 0,
                                        cursor: isClickable ? 'pointer' : 'default',
                                        opacity: !isActive && !isCompleted ? 0.75 : 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: '50%',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.78rem',
                                            ...(isCompleted && {
                                                bgcolor: SUCCESS,
                                                color: '#fff',
                                            }),
                                            ...(isActive && {
                                                bgcolor: PRIMARY,
                                                color: '#fff',
                                                boxShadow: '0 2px 8px rgba(102,126,234,0.35)',
                                            }),
                                            ...(!isActive &&
                                                !isCompleted && {
                                                bgcolor: colors.background.primary,
                                                color: colors.text.disabled,
                                                border: `1.5px solid ${colors.border.light}`,
                                            }),
                                        }}
                                    >
                                        {isCompleted ? (
                                            <CheckIcon sx={{ fontSize: 14 }} />
                                        ) : (
                                            index + 1
                                        )}
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: '0.75rem',
                                            fontWeight: isActive ? 700 : isCompleted ? 600 : 400,
                                            color: isActive
                                                ? PRIMARY
                                                : isCompleted
                                                    ? colors.text.primary
                                                    : colors.text.disabled,
                                            whiteSpace: 'nowrap',
                                            display: { xs: 'none', md: 'block' },
                                        }}
                                    >
                                        {label}
                                    </Typography>
                                </Box>
                            </React.Fragment>
                        );
                    })}
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexShrink: 0,
                }}
            >
                {extraActions}
                <Button
                    type="button"
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                    size="small"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2,
                        borderRadius: '10px',
                        background: GRADIENT,
                        boxShadow: BTN_SHADOW,
                        minWidth: 100,
                        whiteSpace: 'nowrap',
                        '&:hover': {
                            background: `linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)`,
                        },
                        '&.Mui-disabled': {
                            background: colors.background.hover,
                            boxShadow: 'none',
                            color: colors.text.tertiary,
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={18} color="inherit" />
                    ) : isLast ? (
                        finishButtonText
                    ) : (
                        nextButtonText
                    )}
                </Button>
            </Box>
        </Box>
    );
};

export default WizardTitleBar;
