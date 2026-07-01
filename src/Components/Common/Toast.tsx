import { useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Slide,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

function SlideTransition(props: React.ComponentProps<typeof Slide>) {
  return <Slide {...props} direction="left" />;
}

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      pointerEvents: 'none',
    }}>
      {children}
    </div>
  );
};

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastComponent = ({ toast, onClose }: ToastProps) => {
  const [open, setOpen] = useState(true);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    onClose(toast.id);
  };

  const getSeverity = () => {
    switch (toast.type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={toast.duration || 4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{
        bottom: '0px !important',
        right: '0px !important',
        left: { xs: '0px !important', sm: 'auto !important' },
        width: { xs: '100% !important', sm: 'auto !important' },
        maxWidth: { xs: '100% !important', sm: 'auto !important' },
      }}
    >
      <Alert
        onClose={handleClose}
        severity={getSeverity()}
        variant="filled"
        sx={{
          width: '100%',
          minWidth: { xs: 'auto', sm: 320 },
          maxWidth: { xs: '100%', sm: 450 },
          borderRadius: { xs: 0, sm: '12px 0 0 0' },
          boxShadow: { xs: 'none', sm: '-4px -4px 16px rgba(0, 0, 0, 0.15)' },
          py: { xs: 0.75, sm: 1 },
          display: 'flex',
          alignItems: 'center',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {toast.title && !['success', 'error', 'warning', 'info'].includes(toast.title.toLowerCase()) && (
          <AlertTitle>{toast.title}</AlertTitle>
        )}
        {toast.message}
      </Alert>
    </Snackbar>
  );
};

export default ToastComponent;

