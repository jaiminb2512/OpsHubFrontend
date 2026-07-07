import React from 'react';
import { Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import colors from '../../Utils/colors';
import WizardTitleBar from './WizardTitleBar';

export interface WizardLayoutProps {
    title: string;
    steps: string[];
    activeStep: number;
    onStepClick?: (stepIndex: number) => void;
    onNext: () => void;
    onBack: () => void;
    loading?: boolean;
    nextButtonText?: string;
    finishButtonText?: string;
    extraActions?: React.ReactNode;
    children: React.ReactNode;
    parentBackLabel?: string;
    onParentBack?: () => void;
    disableHeaderSync?: boolean;
}

const GRADIENT = colors.primary.gradient;

const WizardLayout: React.FC<WizardLayoutProps> = ({
    title,
    steps,
    activeStep,
    onStepClick,
    onNext,
    loading = false,
    nextButtonText = 'Save & Next',
    finishButtonText = 'Finish Setup',
    extraActions,
    children,
    parentBackLabel = 'Back',
    onParentBack,
    disableHeaderSync = false,
}) => {
    const navigate = useNavigate();

    const handleParentBack = () => {
        if (onParentBack) onParentBack();
        else navigate(-1);
    };

    return (
        <Box sx={{ pb: disableHeaderSync ? 0 : 2, pt: disableHeaderSync ? 0 : 0 }}>
            <Paper
                elevation={0}
                sx={{
                    borderRadius: disableHeaderSync ? 0 : '8px',
                    border: disableHeaderSync ? 'none' : `1.5px solid ${colors.border.light}`,
                    bgcolor: 'transparent',
                    minHeight: disableHeaderSync ? 'auto' : { xs: 360, md: 440 },
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {disableHeaderSync && (
                    <Box sx={{ pb: 1, mb: 1, borderBottom: `1px solid ${colors.border.light}` }}>
                        <WizardTitleBar
                            title={title}
                            steps={steps}
                            activeStep={activeStep}
                            onStepClick={onStepClick}
                            onNext={onNext}
                            loading={loading}
                            nextButtonText={nextButtonText}
                            finishButtonText={finishButtonText}
                            extraActions={extraActions}
                            parentBackLabel={parentBackLabel}
                            onParentBack={handleParentBack}
                            isInline={disableHeaderSync}
                        />
                    </Box>
                )}
                <Box sx={{ height: 3, background: GRADIENT, display: disableHeaderSync ? 'none' : 'block' }} />
                <Box sx={{ p: disableHeaderSync ? 0 : { xs: 2.5, md: 4 }, flexGrow: 1, mt: disableHeaderSync ? 1 : 0 }}>{children}</Box>
            </Paper>
        </Box>
    );
};

export default WizardLayout;
