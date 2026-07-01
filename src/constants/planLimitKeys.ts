/** Stable limit keys — must match seeded `Limit.key` in the database. */
export const PLAN_LIMIT_KEYS = {
    MAX_USERS: 'max_users',
    MAX_CUSTOMERS: 'max_customers',
    MAX_STORES: 'max_stores',
    MAX_WAREHOUSES: 'max_warehouses',
    MAX_ORDERS: 'max_orders',
    CUSTOMERS_PER_MONTH: 'customers_per_month',
    ORDERS_PER_MONTH: 'orders_per_month',
    SEND_NOTIFICATION: 'send_notification',
} as const;

export type PlanLimitKey = (typeof PLAN_LIMIT_KEYS)[keyof typeof PLAN_LIMIT_KEYS];

export const CAPACITY_LIMIT_KEYS: PlanLimitKey[] = [
    PLAN_LIMIT_KEYS.MAX_USERS,
    PLAN_LIMIT_KEYS.MAX_CUSTOMERS,
    PLAN_LIMIT_KEYS.MAX_STORES,
    PLAN_LIMIT_KEYS.MAX_WAREHOUSES,
];

export const RENEWABLE_LIMIT_KEYS: PlanLimitKey[] = [
    PLAN_LIMIT_KEYS.CUSTOMERS_PER_MONTH,
    PLAN_LIMIT_KEYS.ORDERS_PER_MONTH,
    PLAN_LIMIT_KEYS.SEND_NOTIFICATION,
];
