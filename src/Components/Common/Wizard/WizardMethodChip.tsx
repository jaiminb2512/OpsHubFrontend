import { Box } from '@mui/material';
import { METHOD_COLORS } from './setupWizardTheme';

const WizardMethodChip = ({ method }: { method: string }) => {
    const c = METHOD_COLORS[method] ?? { bg: '#f5f5f5', color: '#555' };
    return (
        <Box
            component="span"
            sx={{
                px: 1,
                py: 0.2,
                borderRadius: '5px',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                bgcolor: c.bg,
                color: c.color,
                whiteSpace: 'nowrap',
            }}
        >
            {method}
        </Box>
    );
};

export default WizardMethodChip;
