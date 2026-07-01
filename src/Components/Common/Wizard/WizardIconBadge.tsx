import React from 'react';
import { Box } from '@mui/material';
import { ICON_BG, PRIMARY } from './setupWizardTheme';

export interface WizardIconBadgeProps {
    /** Default styles color/size for MUI SvgIcon children */
    children: React.ReactNode;
    sx?: object;
}

const WizardIconBadge: React.FC<WizardIconBadgeProps> = ({ children, sx }) => (
    <Box
        sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: ICON_BG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '& .MuiSvgIcon-root': { fontSize: 20, color: PRIMARY },
            ...sx,
        }}
    >
        {children}
    </Box>
);

export default WizardIconBadge;
