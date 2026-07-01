import { useEffect, useState } from 'react';

export type UseWizardMockDataResult<T> = {
    data: T | null;
    loading: boolean;
    error: Error | null;
};

/**
 * Dynamically loads wizard mock JSON only when `enabled` is true (`VITE_USE_API` false).
 * Pass a stable loader from `wizardMockLoaders.ts`.
 */
export function useWizardMockData<T>(
    enabled: boolean,
    loader: () => Promise<T>
): UseWizardMockDataResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        loader()
            .then((result) => {
                if (!cancelled) {
                    setData(result);
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setData(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, loader]);

    return { data, loading, error };
}
