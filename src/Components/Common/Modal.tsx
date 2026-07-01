import type { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import MUICustomBtn from './MUICustomBtn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const Modal = ({ isOpen, onClose, title, children, footer, size = 'large' }: ModalProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getMaxWidth = () => {
    switch (size) {
      case 'small':
        return 'sm';
      case 'large':
        return 'lg';
      default:
        return 'md';
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={getMaxWidth()}
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: fullScreen ? 0 : '20px',
          minHeight: size === 'large' ? '500px' : '400px',
          maxHeight: '95vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2.5,
          mb: 4,
          borderBottom: '2px solid #f0f0f0',
          fontSize: '28px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {title}
        <MUICustomBtn
          onClick={onClose}
          tooltip="Close modal"
          variant="text"
          sx={{
            color: '#666',
            minWidth: 'auto',
            padding: '8px',
            '&:hover': {
              backgroundColor: '#f0f0f0',
              color: '#333',
            },
          }}
        >
          <CloseIcon />
        </MUICustomBtn>
      </DialogTitle>
      <DialogContent
        sx={{
          mb: 4,
          minHeight: '300px',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '10px',
            '&:hover': {
              background: '#555',
            },
          },
        }}
      >
        {children}
      </DialogContent>
      {footer && (
        <DialogActions
          sx={{
            px: 3,
            py: 3,
            pt: 3,
            borderTop: '2px solid #f0f0f0',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;

