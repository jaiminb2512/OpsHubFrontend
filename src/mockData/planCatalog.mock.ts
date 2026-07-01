import type { CompanyOption } from '../types/planTypes';
import type { PlanCatalogItem } from '../types/planTypes';

export const MOCK_COMPANIES: CompanyOption[] = [
    { id: 'co-alpha', name: 'Alpha Tailors' },
    { id: 'co-beta', name: 'Beta Stitchers' },
];

export const SEED_PLAN_CATALOG: PlanCatalogItem[] = [
    {
        id: 'plan-basic',
        name: 'Basic',
        description: 'Public starter plan',
        isPublic: true,
        companyId: null,
        isActive: true,
    },
    {
        id: 'plan-pro',
        name: 'Pro',
        description: 'Public plan with more limits',
        isPublic: true,
        companyId: null,
        isActive: true,
    },
    {
        id: 'plan-alpha-private',
        name: 'Alpha Enterprise',
        description: 'Custom plan for Alpha Tailors only',
        isPublic: false,
        companyId: 'co-alpha',
        companyName: 'Alpha Tailors',
        isActive: true,
    },
    {
        id: 'plan-draft-private',
        name: 'Draft Private Template',
        description: 'Created before company exists — assign company later',
        isPublic: false,
        companyId: null,
        isActive: true,
    },
];
