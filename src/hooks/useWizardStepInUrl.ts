import { useCallback, useEffect, useMemo, useState, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';

export const WIZARD_STEP_QUERY_KEY = 'step';

/** Parse `?step=` (1-based in URL) into a 0-based wizard index. */
export function parseWizardStepFromSearchParams(
    searchParams: URLSearchParams,
    stepCount: number
): number {
    if (stepCount <= 0) return 0;

    const raw = searchParams.get(WIZARD_STEP_QUERY_KEY);
    if (raw === null || raw === '') return 0;

    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return 0;

    const index = parsed >= 1 ? parsed - 1 : parsed;
    return Math.max(0, Math.min(stepCount - 1, index));
}

/**
 * Syncs wizard active step with `?step=` in the URL (1-based: step=1 is the first step).
 * Browser back/forward updates the visible step; other query params are preserved.
 */
export function useWizardStepInUrl(stepCount: number, syncUrl: boolean = true) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [localStep, setLocalStep] = useState(0);

    const activeStep = useMemo(() => {
        if (!syncUrl) return localStep;
        return parseWizardStepFromSearchParams(searchParams, stepCount);
    }, [searchParams, stepCount, syncUrl, localStep]);

    const setActiveStep = useCallback(
        (value: SetStateAction<number>) => {
            if (!syncUrl) {
                setLocalStep((prev) => {
                    const nextIndex = typeof value === 'function' ? value(prev) : value;
                    return Math.max(0, Math.min(stepCount - 1, nextIndex));
                });
                return;
            }
            setSearchParams(
                (prev) => {
                    const current = parseWizardStepFromSearchParams(prev, stepCount);
                    const nextIndex = typeof value === 'function' ? value(current) : value;
                    const clamped = Math.max(0, Math.min(stepCount - 1, nextIndex));
                    const next = new URLSearchParams(prev);
                    next.set(WIZARD_STEP_QUERY_KEY, String(clamped + 1));
                    return next;
                },
                { replace: false }
            );
        },
        [setSearchParams, stepCount, syncUrl]
    );

    useEffect(() => {
        if (!syncUrl) return;
        if (stepCount <= 0 || searchParams.has(WIZARD_STEP_QUERY_KEY)) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set(WIZARD_STEP_QUERY_KEY, '1');
                return next;
            },
            { replace: true }
        );
    }, [stepCount, searchParams, setSearchParams, syncUrl]);

    return { activeStep, setActiveStep };
}
