import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PROJECT_PATHS, DASHBOARD_PATHS } from './Path';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ToastProvider } from './Utils/ToastContext';
import { ConfirmDialogProvider } from './Utils/ConfirmDialogContext';
import ToastDisplay from './Components/Common/ToastProvider';
import { getAllRoutes } from './Config/routes';
import { RouteLoadingFallback } from './Config/lazyPage';
import { useAuth } from './Context/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import { AUTH_PATHS } from './Path';

const Login = lazy(() => import('./Pages/Login'));
const DashboardLayout = lazy(() => import('./Components/Layout/DashboardLayout'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to={AUTH_PATHS.LOGIN} replace />;
};

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ConfirmDialogProvider>
          <Router>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to={AUTH_PATHS.LOGIN} replace />} />
                <Route path="/dashboard" element={<Navigate to={DASHBOARD_PATHS.STATS} replace />} />
                <Route path={AUTH_PATHS.LOGIN} element={<Login />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {getAllRoutes().map((route) => (
                    <Route key={route.path} path={route.path} element={route.component()} />
                  ))}
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <ToastDisplay />
          </Router>
        </ConfirmDialogProvider>
      </ToastProvider>
    </Provider>
  );
}

export default App;
