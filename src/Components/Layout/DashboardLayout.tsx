import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, useMediaQuery, useTheme, IconButton, Typography } from '@mui/material';
import { Menu as MenuIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';
import ChangePasswordDialog from '../Dialogs/ChangePasswordDialog';
import { useAuth } from '../../Context/AuthContext';
import { PageTitleProvider, usePageTitleContext } from '../../Context/PageTitleContext';
import WizardTitleBar from '../Common/WizardTitleBar';

export const HEADER_HEIGHT = 62;

const TitleBarRow = ({ isMobile, toggleSidebar }: { isMobile: boolean; toggleSidebar: () => void }) => {
  const theme = useTheme();
  const { titleState, actionsRef, wizardHeaderRef, wizardVersion, actionsVersion } = usePageTitleContext();
  const navigate = useNavigate();
  const { title, showBack } = titleState;
  const actions = actionsRef.current;
  const wizardHeader = wizardHeaderRef.current;

  // wizardVersion/actionsVersion keep this row in sync when wizard step/loading
  // or header action closures change.
  void wizardVersion;
  void actionsVersion;

  if (wizardHeader) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: HEADER_HEIGHT,
          flexShrink: 0,
          px: { xs: 1, sm: 2 },
          gap: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {isMobile && (
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <WizardTitleBar {...wizardHeader} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: HEADER_HEIGHT,
        flexShrink: 0,
        px: { xs: 1, sm: 2 },
        gap: { xs: 1, sm: 1.5 },
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, minWidth: 0, flexShrink: 1 }}>
        {isMobile && (
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {showBack && (
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        {title && (
          <Typography
            variant="h6"
            fontWeight={700}
            color="text.primary"
            noWrap
            sx={{ fontSize: { xs: '0.95rem', sm: '1.125rem' }, minWidth: 0 }}
          >
            {title}
          </Typography>
        )}
      </Box>

      {actions && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            maxWidth: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            py: 0.5,
            '& .MuiButton-root': {
              flexShrink: 0,
            },
            [theme.breakpoints.down('sm')]: {
              '& .MuiButton-root': {
                minWidth: 0,
                px: 1,
              },
              '& .MuiButton-startIcon': {
                margin: 0,
              },
              '& .MuiButton-endIcon': {
                margin: 0,
              },
              '& .MuiButton-root > span:not(.MuiButton-startIcon):not(.MuiButton-endIcon):not(.MuiTouchRipple-root)': {
                display: 'none',
              },
            },
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
};

const DashboardInner = () => {
  const theme = useTheme();
  const { needToResetPassword, checkAuth } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (needToResetPassword) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <ChangePasswordDialog
          open={true}
          onClose={checkAuth}
          isForced={true}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TitleBarRow isMobile={isMobile} toggleSidebar={toggleSidebar} />
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Outlet />
        </Box>
      </Box>

      <ChangePasswordDialog open={false} onClose={() => { }} isForced={false} />
    </Box>
  );
};

const DashboardLayout = () => (
  <PageTitleProvider>
    <DashboardInner />
  </PageTitleProvider>
);

export default DashboardLayout;
