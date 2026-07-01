import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HEADER_HEIGHT } from './DashboardLayout';
import { AUTH_PATHS } from '../../Path';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Button,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  BusinessCenter as ProjectIcon,
  VpnKey as ApiKeyIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { DASHBOARD_PATHS, PROJECT_PATHS } from '../../Path';
import { getUserInfo, type LoginResponse } from '../../Services/ApiServices';
import { useAuth } from '../../Context/AuthContext';

const APP_BRAND =
  (typeof import.meta.env.VITE_APP_BRAND_NAME === 'string' && import.meta.env.VITE_APP_BRAND_NAME.trim()) ||
  'OpsHub';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const NAV_ITEMS = [
  { label: 'Projects', path: PROJECT_PATHS.LIST, icon: ProjectIcon },
  { label: 'API Keys', path: PROJECT_PATHS.API_KEYS, icon: ApiKeyIcon },
  { label: 'Images', path: `${DASHBOARD_PATHS.HOME}/images`, icon: ImageIcon },
];

const Sidebar = ({ isOpen, toggleSidebar, isMobile }: SidebarProps) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const userInfo: LoginResponse | null = getUserInfo();

  const userInitial =
    userInfo?.fullName?.trim()?.charAt(0)?.toUpperCase() ||
    userInfo?.emailId?.charAt(0)?.toUpperCase() ||
    '?';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate(AUTH_PATHS.LOGIN);
  };

  const handleMenuItemClick = () => {
    if (isMobile) toggleSidebar();
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? isOpen : true}
      onClose={isMobile ? toggleSidebar : undefined}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isOpen ? 260 : 80,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? 260 : isOpen ? 260 : 80,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: 'none',
        },
      }}
    >
      {/* Brand row */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: !isMobile && !isOpen ? 'center' : 'space-between',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: 'primary.main',
            letterSpacing: '-0.02em',
            fontSize: '1.1rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
            display: isMobile || isOpen ? 'block' : 'none',
          }}
        >
          {APP_BRAND}
        </Typography>
        {!isMobile && (
          <IconButton
            onClick={toggleSidebar}
            size="small"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            {isOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* User profile */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        {userInfo && (isMobile || isOpen) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ width: 44, height: 44, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, fontSize: '1rem' }}
              src={userInfo.imageUrl || undefined}
            >
              {!userInfo.imageUrl ? userInitial : null}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                {userInfo.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {userInfo.emailId}
              </Typography>
            </Box>
          </Box>
        )}
        {userInfo && !isMobile && !isOpen && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }} src={userInfo.imageUrl || undefined}>
              {!userInfo.imageUrl ? userInitial : null}
            </Avatar>
          </Box>
        )}
      </Box>

      {/* Nav items */}
      <List sx={{ py: 1.5, px: 1, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const IconComponent = item.icon;
          return (
            <ListItem key={item.path} disablePadding sx={{ margin: '1px' }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={active}
                onClick={handleMenuItemClick}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: isOpen || isMobile ? 2 : 1,
                  gap: 1.5,
                  minHeight: 48,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'common.white',
                    '&:hover': { backgroundColor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'common.white' },
                  },
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
                  '&:not(.Mui-selected):hover': { color: 'text.primary' },
                }}
              >
                <ListItemIcon sx={{ color: active ? 'inherit' : 'text.secondary', minWidth: 36, justifyContent: 'center' }}>
                  <IconComponent />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.9375rem',
                      fontWeight: active ? 600 : 500,
                      whiteSpace: 'nowrap',
                      opacity: isMobile || isOpen ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                    },
                    flex: 1,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout */}
      <Box
        sx={{
          mt: 'auto',
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 1.5,
          py: 1.5,
          bgcolor: 'grey.50',
        }}
      >
        <Button
          onClick={handleLogout}
          startIcon={<LogoutIcon sx={{ color: 'error.main' }} />}
          sx={{
            width: '100%',
            py: 1,
            px: 1.5,
            justifyContent: isMobile || isOpen ? 'flex-start' : 'center',
            color: 'error.main',
            bgcolor: 'transparent',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
          }}
        >
          {(isMobile || isOpen) && 'Logout'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
