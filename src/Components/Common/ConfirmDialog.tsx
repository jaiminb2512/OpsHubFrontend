import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import {
    HelpOutline as HelpIcon,
    WarningAmber as WarningIcon,
    ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import colors from '../../Utils/colors';

export type ConfirmSeverity = 'default' | 'warning' | 'error';

export type ConfirmDialogProps = {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    severity?: ConfirmSeverity;
    onConfirm: () => void;
    onCancel: () => void;
};

const severityMeta: Record<
    ConfirmSeverity,
    { icon: typeof HelpIcon; color: string; confirmBg?: string }
> = {
    default: { icon: HelpIcon, color: colors.primary.main },
    warning: { icon: WarningIcon, color: '#f59e0b' },
    error: { icon: ErrorIcon, color: colors.error.main },
};

const ConfirmDialog = ({
    open,
    title = 'Confirm',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    severity = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    const meta = severityMeta[severity];
    const Icon = meta.icon;

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: `1px solid ${colors.border.light}`,
                    },
                },
            }}
        >
            <Box sx={{ height: 4, background: colors.primary.gradient }} />
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pt: 2.5,
                    pb: 1,
                    px: 2.5,
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor:
                            severity === 'error'
                                ? colors.error.background
                                : severity === 'warning'
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : colors.primary.rgba.light,
                        color: meta.color,
                        flexShrink: 0,
                    }}
                >
                    <Icon fontSize="small" />
                </Box>
                <Typography
                    component="span"
                    sx={{
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        color: colors.text.primary,
                        lineHeight: 1.3,
                    }}
                >
                    {title}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 2.5, pt: 0.5, pb: 2 }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: colors.text.secondary,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                    }}
                >
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions
                sx={{
                    px: 2.5,
                    pb: 2.5,
                    pt: 0,
                    gap: 1,
                }}
            >
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '10px',
                        borderColor: colors.border.medium,
                        color: colors.text.secondary,
                        px: 2.5,
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    color={severity === 'error' ? 'error' : 'primary'}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '10px',
                        px: 2.5,
                        boxShadow: colors.shadow.button,
                        ...(severity === 'default' && {
                            background: colors.primary.gradient,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)',
                            },
                        }),
                    }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
