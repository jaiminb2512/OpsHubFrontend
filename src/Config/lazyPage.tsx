import { lazy, Suspense, type ComponentType } from 'react';
import { Box, CircularProgress } from '@mui/material';

export function RouteLoadingFallback() {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 280,
                width: '100%',
            }}
        >
            <CircularProgress />
        </Box>
    );
}

/** Lazy-load a page component with a shared Suspense fallback (route-level code splitting). */
export function lazyPage(factory: () => Promise<{ default: ComponentType }>) {
    const LazyComponent = lazy(factory);
    return function LazyPage() {
        return (
            <Suspense fallback={<RouteLoadingFallback />}>
                <LazyComponent />
            </Suspense>
        );
    };
}
