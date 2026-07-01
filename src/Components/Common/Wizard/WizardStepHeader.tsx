import React from 'react';
import { Box, Typography } from '@mui/material';
import WizardIconBadge from './WizardIconBadge';
import { WIZARD_STEP_BODY_INDENT, stepHeadingSx } from './setupWizardTheme';

const STEP_HEADER_ROW_SX = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1.5,
    mb: 0.5,
    flexWrap: 'wrap' as const,
};

export type WizardStepHeaderProps = {
    /** Rendered inside the tinted icon badge */
    icon: React.ReactNode;
    title: React.ReactNode;
    /** Subtitle aligned under title text */
    description?: React.ReactNode;
    /** Inline after title (tooltip, badges, etc.) */
    afterTitle?: React.ReactNode;
    /** Owns full header row beside the icon+title group (e.g. module “Create New” switch) */
    endSlot?: React.ReactNode;
    /** When false, hides the indented description column even if `description` is set */
    showDescription?: boolean;
    descriptionSx?: object;
};

const WizardStepHeader: React.FC<WizardStepHeaderProps> = ({
    icon,
    title,
    description,
    afterTitle,
    endSlot,
    showDescription = true,
    descriptionSx,
}) => (
    <Box>
        <Box sx={STEP_HEADER_ROW_SX}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <WizardIconBadge>{icon}</WizardIconBadge>
                {typeof title === 'string' ? <Typography sx={stepHeadingSx}>{title}</Typography> : title}
                {afterTitle}
            </Box>
            {endSlot}
        </Box>
        {showDescription && description != null && (
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, ml: WIZARD_STEP_BODY_INDENT, ...descriptionSx }}
            >
                {description}
            </Typography>
        )}
    </Box>
);

export default WizardStepHeader;
