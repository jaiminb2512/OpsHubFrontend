export interface CompanyOption {
    id: string;
    name: string;
}

export interface PlanCatalogItem {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    companyId: string | null;
    companyName?: string;
    isActive: boolean;
}
