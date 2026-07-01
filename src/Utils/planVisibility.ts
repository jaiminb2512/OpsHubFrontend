import type { PlanCatalogItem } from '../types/planTypes';

const STORAGE_KEY = 'PlanSetupWizardData';

export function normalizeCompanyId(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

/** Private plan created before any company exists. */
export function isUnassignedPrivatePlan(plan: Pick<PlanCatalogItem, 'isPublic' | 'companyId'>): boolean {
    return !plan.isPublic && normalizeCompanyId(plan.companyId) == null;
}

/** Plans saved from the plan wizard (local) merged with optional seed list. */
export function loadPlanCatalog(seedPlans: PlanCatalogItem[] = []): PlanCatalogItem[] {
    const byId = new Map<string, PlanCatalogItem>();

    for (const p of seedPlans) {
        byId.set(p.id, {
            ...p,
            companyId: p.isPublic ? null : normalizeCompanyId(p.companyId),
        });
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const rows = JSON.parse(raw) as Array<{
                plan?: {
                    name?: string;
                    description?: string;
                    price?: string;
                    durationDays?: string;
                    isActive?: boolean;
                    isPublic?: boolean;
                    companyId?: string;
                };
                id?: string;
            }>;
            for (const row of rows) {
                const id = row.id ?? '';
                const p = row.plan;
                if (!id || !p?.name) continue;
                const isPublic = p.isPublic === true;
                byId.set(id, {
                    id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    durationDays: p.durationDays,
                    isActive: p.isActive,
                    isPublic,
                    companyId: isPublic ? null : normalizeCompanyId(p.companyId),
                });
            }
        }
    } catch {
        /* ignore parse errors */
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Plans a company may pick when subscribing.
 * - Public plans: always included.
 * - Private plans: only when `plan.companyId` matches (unassigned private plans are excluded).
 */
export function filterPlansForCompany(
    plans: PlanCatalogItem[],
    companyId: string | null | undefined
): PlanCatalogItem[] {
    const cid = normalizeCompanyId(companyId ?? null);
    return plans.filter((p) => {
        if (p.isActive === false) return false;
        if (p.isPublic) return true;
        if (!cid) return false;
        return normalizeCompanyId(p.companyId) === cid;
    });
}

export function resolveCompanyName(
    companyId: string | null | undefined,
    companies: { id: string; name: string }[]
): string {
    const cid = normalizeCompanyId(companyId);
    if (!cid) return '—';
    return companies.find((c) => c.id === cid)?.name ?? cid;
}

export function planVisibilityLabel(
    plan: Pick<PlanCatalogItem, 'isPublic' | 'companyName' | 'companyId'>
): string {
    if (plan.isPublic) return 'Public';
    if (isUnassignedPrivatePlan(plan)) return 'Private · Unassigned';
    return plan.companyName ? `Private · ${plan.companyName}` : 'Private';
}
