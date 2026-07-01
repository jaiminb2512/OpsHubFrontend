import {
  TextField,
  Button as MuiButton,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

// MUI-based form container with gradient background
export const FormContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 2.5,
    }}
  >
    {children}
  </Box>
);

// MUI-based form card
export const FormCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      background: 'white',
      borderRadius: 4,
      padding: 5,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      width: '100%',
    }}
  >
    {children}
  </Box>
);

// MUI-based form title
export const FormTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="h4"
    component="h1"
    sx={{
      fontWeight: 700,
      color: '#333',
      marginBottom: 1,
      textAlign: 'center',
    }}
  >
    {children}
  </Typography>
);

// MUI-based form subtitle
export const FormSubtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="body2"
    sx={{
      color: '#666',
      textAlign: 'center',
      marginBottom: 4,
    }}
  >
    {children}
  </Typography>
);

// MUI-based form
export const Form: React.FC<{ children: React.ReactNode; onSubmit?: (e: React.FormEvent) => void }> = ({
  children,
  onSubmit,
}) => (
  <Box
    component="form"
    onSubmit={onSubmit}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2.5,
    }}
  >
    {children}
  </Box>
);

// MUI-based form group
export const FormGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25,
      marginBottom: 3,
    }}
  >
    {children}
  </Box>
);

// MUI-based label (for backward compatibility)
export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement> & {
  children: React.ReactNode;
}> = ({ children, ...props }) => (
  <Typography
    component="label"
    variant="body1"
    sx={{
      fontSize: '15px',
      fontWeight: 600,
      color: '#333',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      marginBottom: '4px',
      '& svg': {
        color: '#667eea',
        fontSize: '16px',
      },
    }}
    {...props}
  >
    {children}
  </Typography>
);

// MUI-based input (TextField)
export const Input: React.FC<{
  label?: string;
  error?: boolean;
  helperText?: string;
  type?: string;
  id?: string;
  name?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  step?: string | number;
  min?: string | number;
  max?: string | number;
}> = ({ label, error, helperText, ...props }) => (
  <TextField
    label={label}
    variant="outlined"
    fullWidth
    error={error}
    helperText={helperText}
    sx={{
      '& .MuiOutlinedInput-root': {
        background: '#fafafa',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '& fieldset': {
          borderColor: '#e0e0e0',
          borderWidth: 2,
        },
        '&:hover fieldset': {
          borderColor: '#ccc',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#667eea',
          boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
        },
        '&.Mui-focused': {
          background: 'white',
          transform: 'translateY(-1px)',
        },
      },
      '& .MuiInputBase-input::placeholder': {
        color: '#999',
      },
    }}
    {...props}
  />
);

// MUI-based select
export const Select: React.FC<{
  label?: string;
  value?: string;
  onChange?: (event: SelectChangeEvent<string>, child: React.ReactNode) => void;
  children?: React.ReactNode;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, children, error, helperText, disabled }) => (
  <FormControl fullWidth error={error}>
    {label && <InputLabel>{label}</InputLabel>}
    <MuiSelect
      value={value}
      onChange={onChange}
      disabled={disabled}
      sx={{
        backgroundColor: '#fafafa',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#e0e0e0',
          borderWidth: 2,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#ccc',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#667eea',
          boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
        },
        '&.Mui-focused': {
          background: 'white',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {children}
    </MuiSelect>
    {helperText && (
      <Typography variant="caption" color={error ? 'error' : 'textSecondary'} sx={{ mt: 0.5, ml: 1.75 }}>
        {helperText}
      </Typography>
    )}
  </FormControl>
);

// MUI-based button
export const Button: React.FC<{
  children?: React.ReactNode;
  variant?: 'contained' | 'outlined' | 'text';
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  startIcon?: React.ReactNode;
}> = ({ children, variant = 'contained', type = 'button', onClick, disabled, startIcon }) => (
  <MuiButton
    variant={variant}
    type={type}
    onClick={onClick}
    disabled={disabled}
    startIcon={startIcon}
    sx={{
      padding: '14px 24px',
      background: variant === 'contained' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 600,
      marginTop: '8px',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '&:disabled': {
        opacity: 0.6,
        transform: 'none',
      },
    }}
  >
    {children}
  </MuiButton>
);

// MUI-based error message
export const ErrorMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Alert
    severity="error"
    sx={{
      backgroundColor: '#fee',
      color: '#c33',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      border: '1px solid #fcc',
      '& .MuiAlert-icon': {
        color: '#c33',
      },
    }}
  >
    {children}
  </Alert>
);

// MUI-based success message
export const SuccessMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Alert
    severity="success"
    sx={{
      backgroundColor: '#efe',
      color: '#3c3',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      border: '1px solid #cfc',
      '& .MuiAlert-icon': {
        color: '#3c3',
      },
    }}
  >
    {children}
  </Alert>
);

// MUI-based link text
export const LinkText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="body2"
    sx={{
      textAlign: 'center',
      marginTop: 3,
      color: '#666',
      '& a': {
        color: '#667eea',
        textDecoration: 'none',
        fontWeight: 600,
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    }}
  >
    {children}
  </Typography>
);

// MUI-based loading spinner
export const LoadingSpinner: React.FC = () => (
  <CircularProgress
    size={20}
    sx={{
      color: 'white',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTopColor: 'white',
      animation: 'spin 0.8s ease-in-out infinite',
      '@keyframes spin': {
        to: { transform: 'rotate(360deg)' },
      },
    }}
  />
);

