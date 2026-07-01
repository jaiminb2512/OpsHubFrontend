import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { AUTH_PATHS } from '../Path';
import { resolvePostLoginPath } from '../Utils/postLoginNavigation';
import { loginService, isAuthenticated, getUserInfo } from '../Services/ApiServices';
import { getRoleContextsList } from '../Utils/roleContextStorage';
import { useToast } from '../Utils/ToastContext';

const APP_BRAND =
  (typeof import.meta.env.VITE_APP_BRAND_NAME === 'string' && import.meta.env.VITE_APP_BRAND_NAME.trim()) ||
  'RBAS';

const floatSlow = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -14px, 0); }
  100% { transform: translate3d(0, 0, 0); }
`;

const floatAlt = keyframes`
  0% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(0, 16px, 0) rotate(6deg); }
  100% { transform: translate3d(0, 0, 0) rotate(0deg); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-60%); opacity: 0; }
  20% { opacity: 1; }
  60% { opacity: 1; }
  100% { transform: translateX(60%); opacity: 0; }
`;

const fadeUp = keyframes`
  0% { opacity: 0; transform: translate3d(0, 20px, 0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const tiltIn = keyframes`
  0% { opacity: 0; transform: perspective(1200px) rotateX(8deg) translate3d(0, 20px, 0); }
  100% { opacity: 1; transform: perspective(1200px) rotateX(0deg) translate3d(0, 0, 0); }
`;

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { checkAuth, login, isLoading: authLoading } = useAuth();
  const { showError, showSuccess } = useToast();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [formData, setFormData] = useState({ emailId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(reducedMotion);

  const heroAreaRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !reducedMotion) {
      requestAnimationFrame(() => setMounted(true));
    }
  }, [reducedMotion]);

  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [reducedMotion]
  );

  useEffect(() => {
    if (reducedMotion) setMounted(true);
  }, [reducedMotion]);

  useEffect(() => {
    if (isAuthenticated()) {
      checkAuth().then(() => {
        const contexts = getRoleContextsList();
        const needReset = getUserInfo()?.needToResetPassword === true;
        navigate(resolvePostLoginPath(contexts, { needToResetPassword: needReset }), {
          replace: true,
        });
      });
    }
  }, [navigate, checkAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginService(formData);

      if (response.success === 200 && response.data) {
        login(response.data.token, response.data);
        showSuccess('Login successful! Redirecting...', 'Success');
        navigate(
          resolvePostLoginPath(response.data.roleContexts ?? [], {
            needToResetPassword: response.data.needToResetPassword,
          }),
          { replace: true }
        );
      } else {
        showError(response.message || 'Login failed', 'Login Failed');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
        showError(errorMsg, 'Login Failed');
      } else {
        showError('An unexpected error occurred. Please try again.', 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;
  const primaryGradient = `linear-gradient(135deg, ${primary}, ${primaryDark})`;
  const primaryGradientSoft = (a: number, b: number) =>
    `linear-gradient(135deg, ${alpha(primary, a)}, ${alpha(primaryDark, b)})`;

  const highlights = [
    { icon: <SpeedRoundedIcon fontSize="small" />, label: 'Centralized access control' },
    { icon: <SettingsRoundedIcon fontSize="small" />, label: 'Multi-project management' },
    { icon: <InsightsRoundedIcon fontSize="small" />, label: 'Plan & feature governance' },
  ];

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      bgcolor: alpha(theme.palette.background.paper, 0.6),
      transition: 'box-shadow 200ms ease, border-color 200ms ease',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(theme.palette.primary.main, 0.5),
      },
      '&.Mui-focused': {
        boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: 'primary.main',
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'primary.main',
      fontWeight: 700,
    },
  };

  return (
    <Box
      ref={heroAreaRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse(null)}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background layers */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(1100px 560px at 15% 0%, ${alpha(primary, 0.18)} 0%, transparent 55%), radial-gradient(900px 480px at 85% 100%, ${alpha(primary, 0.1)} 0%, transparent 55%)`,
        }}
      />
      {mouse && !reducedMotion && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: mouse.x - 200,
            top: mouse.y - 200,
            width: 400,
            height: 400,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: `radial-gradient(closest-side, ${alpha(theme.palette.primary.main, 0.16)}, transparent 70%)`,
            filter: 'blur(6px)',
            transition: 'left 80ms ease-out, top 80ms ease-out',
          }}
        />
      )}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: { xs: 200, md: 280 },
          height: { xs: 200, md: 280 },
          left: { xs: -60, md: '8%' },
          top: { xs: -60, md: '12%' },
          borderRadius: '50%',
          filter: 'blur(48px)',
          opacity: 0.7,
          background: primaryGradientSoft(0.5, 0.32),
          animation: reducedMotion ? undefined : `${floatSlow} 8s ease-in-out infinite`,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: { xs: 180, md: 260 },
          height: { xs: 180, md: 260 },
          right: { xs: -70, md: '6%' },
          bottom: { xs: '20%', md: '18%' },
          borderRadius: '50%',
          filter: 'blur(48px)',
          opacity: 0.65,
          background: primaryGradientSoft(0.38, 0.45),
          animation: reducedMotion ? undefined : `${floatAlt} 9s ease-in-out infinite`,
        }}
      />

      {/* Top bar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          position: 'relative',
          zIndex: 2,
          px: { xs: 2, md: 4 },
          py: 2,
        }}
      >
        <Box />
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'grid',
              placeItems: 'center',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.28)}`,
            }}
          >
            <AdminPanelSettingsRoundedIcon sx={{ color: 'primary.contrastText', fontSize: 17 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
            {APP_BRAND}
          </Typography>
        </Stack>
      </Stack>

      {/* Main content */}
      <Grid
        container
        spacing={{ xs: 3, md: 5 }}
        sx={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 4, md: 6 },
          alignItems: 'center',
          maxWidth: 1160,
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* Branding panel — desktop */}
        {mdUp && (
          <Grid
            size={{ md: 6 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pr: { md: 2 },
            }}
          >
            <Box
              sx={{
                opacity: mounted ? 1 : 0,
                animation: !reducedMotion && mounted ? `${fadeUp} 700ms cubic-bezier(.2,.75,.2,1)` : 'none',
                maxWidth: 480,
                width: '100%',
              }}
            >
              <Chip
                icon={<AutoAwesomeRoundedIcon />}
                label="Secure workspace access"
                sx={{
                  mb: 2.5,
                  fontWeight: 800,
                  bgcolor: alpha(primary, 0.1),
                  color: 'primary.dark',
                  '& .MuiChip-icon': { color: 'primary.main' },
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 950,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.08,
                  fontSize: { md: '2.5rem', lg: '3rem' },
                }}
              >
                Welcome back to{' '}
                <Box
                  component="span"
                  sx={{
                    background: primaryGradient,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {APP_BRAND}
                </Box>
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary', fontWeight: 520, lineHeight: 1.55 }}>
                Sign in to manage roles, permissions, plans, and projects — all from one dashboard.
              </Typography>

              <Stack spacing={1.5} sx={{ mt: 3.5 }}>
                {[
                  {
                    icon: <CheckCircleRoundedIcon sx={{ color: 'primary.main' }} />,
                    title: 'Role-based access',
                    desc: 'Your permissions follow you — see only what you need.',
                  },
                  {
                    icon: <SecurityRoundedIcon sx={{ color: 'primary.main' }} />,
                    title: 'Server-validated auth',
                    desc: 'Every sensitive action is checked on the backend.',
                  },
                  {
                    icon: <SpeedRoundedIcon sx={{ color: 'primary.main' }} />,
                    title: 'Multi-project ready',
                    desc: 'Manage access across all your microservices.',
                  },
                ].map((item, i) => (
                  <Stack
                    key={item.title}
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                    sx={{
                      p: 1.75,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.divider, 0.9),
                      bgcolor: alpha(theme.palette.background.paper, 0.55),
                      backdropFilter: 'blur(10px)',
                      transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                      animation:
                        !reducedMotion && mounted
                          ? `${fadeUp} 560ms cubic-bezier(.2,.75,.2,1) ${200 + i * 90}ms both`
                          : 'none',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        borderColor: alpha(theme.palette.primary.main, 0.35),
                        boxShadow: `0 12px 36px ${alpha(theme.palette.common.black, 0.08)}`,
                      },
                    }}
                  >
                    <Box sx={{ mt: 0.25 }}>{item.icon}</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 850, letterSpacing: '-0.02em' }}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.desc}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
                {highlights.map((h) => (
                  <Chip
                    key={h.label}
                    icon={h.icon}
                    label={h.label}
                    variant="outlined"
                    sx={{
                      fontWeight: 700,
                      borderColor: alpha(theme.palette.divider, 0.8),
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                    }}
                  />
                ))}
              </Stack>

              <Grid container spacing={1.5} sx={{ mt: 3 }}>
                {[
                  { value: '500+', label: 'Teams managed' },
                  { value: '99.9%', label: 'Uptime' },
                  { value: '4.9★', label: 'Avg. rating' },
                ].map((stat, i) => (
                  <Grid size={{ xs: 4 }} key={stat.label}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: alpha(theme.palette.divider, 0.85),
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        animation:
                          !reducedMotion && mounted
                            ? `${fadeUp} 500ms cubic-bezier(.2,.75,.2,1) ${500 + i * 80}ms both`
                            : 'none',
                      }}
                    >
                      <Typography sx={{ fontWeight: 950, fontSize: '1.1rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2.5 }}>
                <Stack direction="row" spacing={0.25}>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <StarRoundedIcon key={s} sx={{ color: 'primary.main', fontSize: 18 }} />
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 650 }}>
                  Trusted by teams across projects
                </Typography>
              </Stack>
            </Box>
          </Grid>
        )}

        {/* Login form panel */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', md: 'flex-start' },
            pl: { md: 2 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 420,
              opacity: mounted ? 1 : 0,
              animation: !reducedMotion && mounted ? `${tiltIn} 750ms cubic-bezier(.2,.75,.2,1) 120ms both` : 'none',
            }}
          >
            {/* Mobile-only header */}
            {!mdUp && (
              <Stack alignItems="center" spacing={1} sx={{ mb: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    bgcolor: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: `0 14px 40px ${alpha(theme.palette.primary.main, 0.32)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': reducedMotion
                      ? undefined
                      : {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          background: `linear-gradient(120deg, transparent 35%, ${alpha('#fff', 0.35)} 50%, transparent 65%)`,
                          animation: `${shimmer} 3.6s ease-in-out infinite`,
                        },
                  }}
                >
                  <AdminPanelSettingsRoundedIcon sx={{ color: 'primary.contrastText', fontSize: 26, position: 'relative' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: '-0.03em' }}>
                  Sign in to {APP_BRAND}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Your access management workspace awaits
                </Typography>
              </Stack>
            )}

            <Box
              sx={{
                position: 'relative',
                borderRadius: 4,
                p: '1px',
                background: `linear-gradient(135deg, ${alpha(primary, 0.35)}, ${alpha(primaryDark, 0.2)})`,
                boxShadow: `0 32px 90px ${alpha(theme.palette.common.black, 0.14)}`,
              }}
            >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                position: 'relative',
                p: { xs: 3, sm: 4 },
                borderRadius: 3.75,
                bgcolor: alpha(theme.palette.background.paper, 0.92),
                backdropFilter: 'blur(16px)',
                overflow: 'hidden',
              }}
            >
              {!reducedMotion && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '-30%',
                      left: 0,
                      width: '100%',
                      height: '160%',
                      background: `linear-gradient(90deg, transparent, ${alpha(
                        theme.palette.common.white,
                        theme.palette.mode === 'dark' ? 0.05 : 0.18
                      )}, transparent)`,
                      transform: 'translateX(-60%)',
                      animation: `${shimmer} 4.5s ease-in-out infinite`,
                    },
                  }}
                />
              )}

              {mdUp && (
                <>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 950,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.15,
                      position: 'relative',
                    }}
                  >
                    Sign in
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 3, fontWeight: 600, position: 'relative' }}>
                    Enter your credentials to continue
                  </Typography>
                </>
              )}

              <Stack spacing={2.25} sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  type="email"
                  id="emailId"
                  name="emailId"
                  label="Email address"
                  value={formData.emailId}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  sx={inputSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  sx={inputSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                            edge="end"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            sx={{
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: -0.5 }}>
                  <Link
                    component={RouterLink}
                    to={AUTH_PATHS.FORGOT_PASSWORD}
                    variant="body2"
                    underline="hover"
                    sx={{ fontWeight: 700, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                  >
                    Forgot password?
                  </Link>
                </Stack>

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  disabled={loading}
                  type="submit"
                  endIcon={loading ? undefined : <ArrowForwardRoundedIcon />}
                  sx={{
                    mt: 0.5,
                    py: 1.35,
                    textTransform: 'none',
                    fontWeight: 850,
                    fontSize: '1rem',
                    borderRadius: 999,
                    bgcolor: 'primary.main',
                    boxShadow: `0 18px 50px ${alpha(primary, 0.28)}`,
                    transition: 'transform 160ms ease, box-shadow 200ms ease, background-color 200ms ease',
                    '&:hover': {
                      transform: reducedMotion ? 'none' : 'translateY(-2px)',
                      bgcolor: 'primary.dark',
                      boxShadow: `0 24px 60px ${alpha(primary, 0.36)}`,
                    },
                    '&.Mui-disabled': {
                      bgcolor: alpha(primary, 0.5),
                      color: alpha(theme.palette.primary.contrastText, 0.9),
                    },
                  }}
                >
                  {loading ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={22} color="inherit" />
                      <span>Signing in…</span>
                    </Stack>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </Stack>

              <DividerWithText sx={{ mt: 3, mb: 2 }} />

              <Typography
                variant="caption"
                align="center"
                display="block"
                sx={{ color: 'text.secondary', fontWeight: 650, lineHeight: 1.6 }}
              >
                Protected by role-based permissions.
              </Typography>
            </Box>
            </Box>

            <Typography
              variant="caption"
              align="center"
              display="block"
              sx={{ mt: 2.5, color: 'text.secondary', fontWeight: 650 }}
            >
              © {new Date().getFullYear()} {APP_BRAND}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

function DividerWithText({ sx }: { sx?: object }) {
  const theme = useTheme();
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={sx}>
      <Box sx={{ flex: 1, height: 1, bgcolor: alpha(theme.palette.divider, 0.9) }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, whiteSpace: 'nowrap' }}>
        Secure login
      </Typography>
      <Box sx={{ flex: 1, height: 1, bgcolor: alpha(theme.palette.divider, 0.9) }} />
    </Stack>
  );
}

export default Login;
