import { useState, type ReactNode } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';

export type WizardHelpButtonProps = {
    title: string;
    children: ReactNode;
    /** Accessible label for the icon button */
    ariaLabel?: string;
};

const WizardHelpButton = ({ title, children, ariaLabel }: WizardHelpButtonProps) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <IconButton
                size="small"
                onClick={() => setOpen(true)}
                aria-label={ariaLabel ?? `How ${title} works`}
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
                <InfoIcon fontSize="small" />
            </IconButton>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
                <DialogContent dividers>{children}</DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button onClick={() => setOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export const WizardHelpSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {title}
        </Typography>
        {children}
    </Box>
);

/** Body text block inside help dialogs */
export const WizardHelpText = ({ children }: { children: ReactNode }) => (
    <Typography variant="body2" color="text.secondary" component="div">
        {children}
    </Typography>
);

export default WizardHelpButton;
