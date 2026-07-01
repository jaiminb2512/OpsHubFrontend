import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import MUICustomBtn from '../Common/MUICustomBtn';
import { changePasswordService } from '../../Services/ApiServices';
import { useToast } from '../../Utils/ToastContext';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  isForced?: boolean; // If true, user cannot close the dialog without changing password
}

const ChangePasswordDialog = ({ open, onClose, isForced = false }: ChangePasswordDialogProps) => {
  const { showError, showSuccess } = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ oldPassword?: string; password?: string; confirmPassword?: string }>({});

  const validatePassword = (pwd: string): string | null => {
    if (!pwd || pwd.trim() === '') {
      return 'Password is required';
    }
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    // Clear error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Clear error when user starts typing
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleOldPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOldPassword(e.target.value);
    if (errors.oldPassword) {
      setErrors(prev => ({ ...prev, oldPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate old password (required unless forced reset)
    if (!isForced && (!oldPassword || oldPassword.trim() === '')) {
      setErrors({ oldPassword: 'Current password is required' });
      return;
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await changePasswordService({ oldPassword, password });

      if (response.success === 200) {
        showSuccess('Password changed successfully!', 'Success');

        // Update userInfo in localStorage to set needToResetPassword to false
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          parsedUserInfo.needToResetPassword = false;
          localStorage.setItem('userInfo', JSON.stringify(parsedUserInfo));
        }

        // Reset form
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});

        // Close dialog
        onClose();
      } else {
        showError(response.message || 'Failed to change password', 'Error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Failed to change password. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isForced) {
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disableEscapeKeyDown={isForced}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight={600}>
          Change Password
        </Typography>
        {isForced && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your account requires a password change before you can continue.
          </Typography>
        )}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {isForced && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              For security reasons, you must change your password before accessing the system.
            </Alert>
          )}

          {!isForced && (
            <TextField
              fullWidth
              type={showOldPassword ? 'text' : 'password'}
              label="Current Password"
              value={oldPassword}
              onChange={handleOldPasswordChange}
              error={!!errors.oldPassword}
              helperText={errors.oldPassword}
              required
              disabled={loading}
              margin="normal"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      disabled={loading}
                      edge="end"
                      aria-label={showOldPassword ? 'Hide password' : 'Show password'}
                    >
                      {showOldPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="New Password"
            value={password}
            onChange={handlePasswordChange}
            error={!!errors.password}
            helperText={errors.password || 'Must be at least 8 characters with uppercase, lowercase, number, and special character'}
            required
            disabled={loading}
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    edge="end"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm New Password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            required
            disabled={loading}
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    edge="end"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {!isForced && (
            <MUICustomBtn
              onClick={handleClose}
              disabled={loading}
              variant="outlined"
              color="secondary"
              tooltip="Cancel"
            >
              Cancel
            </MUICustomBtn>
          )}
          <MUICustomBtn
            type="submit"
            disabled={loading}
            variant="contained"
            tooltip="Change Password"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </MUICustomBtn>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ChangePasswordDialog;

