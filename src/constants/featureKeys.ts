/** Must match seeded `Feature.key` in the database. */
export const FEATURE_KEYS = {
    NOTIFICATIONS: 'notifications',
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];
