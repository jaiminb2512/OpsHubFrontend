/** Matches Plan.isPublic + Plan.companyId in schema (UI / local storage until API wired). */
export type PlanCatalogItem = {
    id: string;
    name: string;
    description?: string;
    price?: string | number | null;
    durationDays?: string | number | null;
    isPublic: boolean;
    companyId: string | null;
    companyName?: string;
    isActive?: boolean;
};

export type PlanVisibilityDraft = {
    isPublic: boolean;
    companyId: string;
};

export type CompanyOption = {
    id: string;
    name: string;
};
