import type { SxProps, Theme } from '@mui/material/styles';
import colors from '../../../Utils/colors';

/** Canonical setup-wizard accent (aligned with theme primary). */
export const PRIMARY = colors.primary.main;

export const ICON_BG = colors.primary.rgba.light;

export const WIZARD_BORDER_SUBTLE = colors.border.light;

/** Left indent matching 36px icon badge + ~12px gap (used for step subtitles). */
export const WIZARD_STEP_BODY_INDENT = '52px';

export const stepHeadingSx = {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#1f2937',
    mb: 0.5,
};

export const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        bgcolor: '#f9f9fb',
        '& fieldset': { borderColor: '#ebebeb' },
        '&:hover fieldset': { borderColor: PRIMARY },
        '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 1.5 },
    },
    '& label.Mui-focused': { color: PRIMARY },
    '& .MuiInputLabel-root': { color: '#9ca3af' },
} satisfies SxProps<Theme>;

export const infoIconSx = {
    color: '#9ca3af',
    '&:hover': { color: PRIMARY, bgcolor: 'rgba(102,126,234,0.08)' },
};

/** Checkbox / switch using wizard primary */
export const wizardSwitchCheckedSx = {
    '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PRIMARY },
} as const;

export const wizardIconBadgeBoxSx = {
    width: 36,
    height: 36,
    borderRadius: '10px',
    bgcolor: ICON_BG,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
} as const;

export const wizardIconInBadgeSx = { color: PRIMARY, fontSize: 20 };

/** Section shell (stores/warehouses style blocks inside company wizard). */
export const wizardSectionPaperSx: SxProps<Theme> = {
    p: 2.5,
    borderRadius: '14px',
    border: `1.5px solid ${colors.border.light}`,
    bgcolor: '#fafafa',
};

/** Small card inside a wizard section */
export const wizardItemCardSx: SxProps<Theme> = {
    p: 2,
    borderRadius: '12px',
    border: `1.5px solid ${colors.border.light}`,
    bgcolor: '#ffffff',
};

export const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
    GET: { bg: '#e8f5e9', color: '#2e7d32' },
    POST: { bg: '#e3f2fd', color: '#1565c0' },
    PUT: { bg: '#fff8e1', color: '#f57f17' },
    PATCH: { bg: '#fce4ec', color: '#ad1457' },
    DELETE: { bg: '#fce4ec', color: '#c62828' },
};
