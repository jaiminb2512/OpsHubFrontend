/** Matches planned `LimitEnforcement` enum in Prisma schema. */
export type LimitEnforcement = 'max' | 'renewable';

export const LIMIT_ENFORCEMENT = {
    MAX: 'max' as const,
    RENEWABLE: 'renewable' as const,
};

export const LIMIT_ENFORCEMENT_LABELS: Record<LimitEnforcement, string> = {
    max: 'Max',
    renewable: 'Renewable',
};

export const LIMIT_ENFORCEMENT_HINTS: Record<LimitEnforcement, string> = {
    max: 'Hard cap — counts live records (e.g. total customers)',
    renewable: 'Quota per period — resets daily / weekly / monthly',
};
