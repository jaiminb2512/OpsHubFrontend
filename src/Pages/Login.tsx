import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { AUTH_PATHS, PROJECT_PATHS } from '../Path';
import { loginService } from '../Services/ApiServices';
import { useToast } from '../Utils/ToastContext';

const APP_BRAND =
  (typeof import.meta.env.VITE_APP_BRAND_NAME === 'string' && import.meta.env.VITE_APP_BRAND_NAME.trim()) ||
  'OpsHub';

// Match inner-page palette from src/Utils/colors.ts
const GRADIENT   = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const ACCENT     = '#667eea';
const ACCENT_ALT = '#764ba2';
const PAGE_BG    = '#f5f7fa';
const CARD_BG    = '#ffffff';
const SURFACE    = '#f8f9fa';
const BORDER     = '#e0e0e0';
const TEXT_PRI   = '#333333';
const TEXT_SEC   = '#6b7280';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 1; }
`;

const FEATURES = [
  { icon: <CloudUploadRoundedIcon sx={{ fontSize: 20 }} />, label: 'Asset upload & storage', desc: 'Upload files to any provider — S3, Cloudinary, local — with one API.' },
  { icon: <FolderOpenRoundedIcon sx={{ fontSize: 20 }} />, label: 'Project-scoped access', desc: 'Each microservice gets its own project with isolated API keys and assets.' },
  { icon: <VpnKeyRoundedIcon sx={{ fontSize: 20 }} />, label: 'API key management', desc: 'Generate, rotate, and revoke keys per project without touching code.' },
  { icon: <StorageRoundedIcon sx={{ fontSize: 20 }} />, label: 'Provider flexibility', desc: 'Switch storage backends with config — no code changes required.' },
];

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated: isLoggedIn, login } = useAuth();
  const { showError, showSuccess } = useToast();
  const mdUp = useMediaQuery('(min-width:900px)');

  const [formData, setFormData] = useState({ emailId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);

  const panelRef = useCallback((node: HTMLDivElement | null) => {
    if (node) requestAnimationFrame(() => setReady(true));
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(PROJECT_PATHS.LIST, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginService(formData);
      if (response.success === 200 && response.data) {
        login(response.data.token, response.data);
        showSuccess('Login successful! Redirecting...', 'Success');
        navigate(PROJECT_PATHS.LIST, { replace: true });
      } else {
        showError(response.message || 'Login failed', 'Login Failed');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        showError(err.response?.data?.message || 'Login failed. Please try again.', 'Login Failed');
      } else {
        showError('An unexpected error occurred. Please try again.', 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      bgcolor: SURFACE,
      fontSize: 14,
      '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(ACCENT, 0.5) },
      '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.12)}` },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT, borderWidth: 2 },
    },
    '& .MuiInputLabel-root': { fontSize: 14 },
    '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: PAGE_BG }}>

      {/* ── Left: gradient identity panel ── */}
      {mdUp && (
        <Box sx={{
          width: '44%', flexShrink: 0,
          background: GRADIENT,
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden', p: 5,
        }}>
          {/* Grid texture */}
          <Box aria-hidden sx={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }} />
          {/* Glow top */}
          <Box aria-hidden sx={{
            position: 'absolute', width: 380, height: 380,
            left: -80, top: -80, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%)',
            filter: 'blur(30px)',
          }} />
          {/* Glow bottom */}
          <Box aria-hidden sx={{
            position: 'absolute', width: 280, height: 280,
            right: -40, bottom: '12%', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)',
            filter: 'blur(30px)',
          }} />

          {/* Brand */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.35)',
              display: 'grid', placeItems: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <CloudUploadRoundedIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>
              {APP_BRAND}
            </Typography>
          </Stack>

          {/* Headline */}
          <Box sx={{ mt: 'auto', mb: 4, position: 'relative', zIndex: 1 }}>
            <Box sx={{
              display: 'inline-block', px: 1.5, py: 0.4, borderRadius: 1.5, mb: 2,
              border: '1px solid rgba(255,255,255,0.35)',
              bgcolor: 'rgba(255,255,255,0.15)',
            }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Asset management hub
              </Typography>
            </Box>

            <Typography sx={{
              color: '#fff', fontWeight: 800, letterSpacing: '-0.04em',
              lineHeight: 1.1, fontSize: { md: '2rem', lg: '2.6rem' },
            }}>
              One hub for all your{' '}
              <Box component="span" sx={{ opacity: 0.85 }}>
                project assets
              </Box>
            </Typography>

            <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.75)', fontSize: 13.5, lineHeight: 1.75 }}>
              Upload, organise, and serve files across all your microservices from a single control plane.
            </Typography>
          </Box>

          {/* Feature cards */}
          <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
            {FEATURES.map((f, i) => (
              <Stack key={f.label} direction="row" spacing={1.5} alignItems="flex-start"
                sx={{
                  p: 1.5, borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(6px)',
                  opacity: ready ? 1 : 0,
                  animation: ready ? `${fadeUp} 360ms ease ${i * 65 + 120}ms both` : 'none',
                }}
              >
                <Box sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.15, flexShrink: 0 }}>{f.icon}</Box>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{f.label}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5, mt: 0.25 }}>{f.desc}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          <Typography sx={{ mt: 3, color: 'rgba(255,255,255,0.4)', fontSize: 12, position: 'relative', zIndex: 1 }}>
            © {new Date().getFullYear()} {APP_BRAND} · Microservice infrastructure
          </Typography>
        </Box>
      )}

      {/* ── Right: login form ── */}
      <Box
        ref={panelRef}
        sx={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          p: { xs: 3, sm: 5 },
          bgcolor: PAGE_BG,
        }}
      >
        <Box sx={{
          width: '100%', maxWidth: 420,
          bgcolor: CARD_BG,
          borderRadius: 3,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          p: { xs: 3, sm: 4 },
          opacity: ready ? 1 : 0,
          animation: ready ? `${fadeUp} 400ms ease 60ms both` : 'none',
        }}>
          {/* Mobile brand */}
          {!mdUp && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3.5, justifyContent: 'center' }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                background: GRADIENT,
                display: 'grid', placeItems: 'center',
                boxShadow: `0 4px 16px ${alpha(ACCENT, 0.35)}`,
              }}>
                <CloudUploadRoundedIcon sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: TEXT_PRI }}>
                {APP_BRAND}
              </Typography>
            </Stack>
          )}

          {/* Brand mark on desktop inside card */}
          {mdUp && (
            <Box sx={{
              width: 44, height: 44, borderRadius: 2, mb: 2.5,
              background: GRADIENT,
              display: 'grid', placeItems: 'center',
              boxShadow: `0 4px 16px ${alpha(ACCENT, 0.3)}`,
            }}>
              <CloudUploadRoundedIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
          )}

          <Typography sx={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: TEXT_PRI, mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography sx={{ fontSize: 14, color: TEXT_SEC, mb: 3 }}>
            Sign in to {APP_BRAND}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth size="small" type="email"
                id="emailId" name="emailId" label="Email address"
                value={formData.emailId} onChange={handleChange}
                placeholder="you@example.com" required disabled={loading}
                autoComplete="email" sx={inputSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon sx={{ color: TEXT_SEC, fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth size="small"
                type={showPassword ? 'text' : 'password'}
                id="password" name="password" label="Password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••••" required disabled={loading}
                autoComplete="current-password" sx={inputSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon sx={{ color: TEXT_SEC, fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading} edge="end" size="small"
                          sx={{ color: TEXT_SEC }}
                        >
                          {showPassword
                            ? <VisibilityOff sx={{ fontSize: 18 }} />
                            : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: -1 }}>
                <Link component={RouterLink} to={AUTH_PATHS.FORGOT_PASSWORD} underline="hover"
                  sx={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>
                  Forgot password?
                </Link>
              </Stack>

              <Button
                fullWidth type="submit" variant="contained" disabled={loading}
                endIcon={loading ? undefined : <ArrowForwardRoundedIcon />}
                sx={{
                  py: 1.25, borderRadius: 1.5, textTransform: 'none',
                  fontWeight: 700, fontSize: 14,
                  background: GRADIENT,
                  boxShadow: `0 4px 18px ${alpha(ACCENT, 0.35)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${ACCENT_ALT} 0%, #5b21b6 100%)`,
                    boxShadow: `0 6px 24px ${alpha(ACCENT, 0.45)}`,
                  },
                  '&.Mui-disabled': { background: alpha(ACCENT, 0.3), color: '#fff' },
                }}
              >
                {loading ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={18} sx={{ color: '#fff' }} />
                    <span>Signing in…</span>
                  </Stack>
                ) : 'Sign in'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 3.5, pt: 3, borderTop: `1px solid ${BORDER}` }}>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1}>
              {['Asset storage', 'Multi-provider', 'API-first'].map(tag => (
                <Stack key={tag} direction="row" alignItems="center" spacing={0.6}>
                  <Box sx={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: GRADIENT,
                    animation: `${pulse} 2.2s ease-in-out infinite`,
                  }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: TEXT_SEC }}>{tag}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
