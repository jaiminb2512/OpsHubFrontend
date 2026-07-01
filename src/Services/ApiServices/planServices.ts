import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';
import type { PlanCatalogItem } from '../../types/planTypes';

export type ApiPlanRecord = {
    id: string;
    name: string;
    description?: string | null;
    price?: string | number | null;
    duration?: number | null;
    billingModel?: string;
    isPublic: boolean;
    companyId?: string | null;
    isActive: boolean;
    ownedByCompany?: { id: string; name: string } | null;
};

function unwrapListPayload<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    return [];
}

export function mapApiPlanToCatalogItem(plan: ApiPlanRecord): PlanCatalogItem {
    return {
        id: plan.id,
        name: plan.name,
        description: plan.description ?? undefined,
        price: plan.price != null ? String(plan.price) : null,
        durationDays: plan.duration ?? null,
        isPublic: plan.isPublic,
        companyId: plan.companyId ?? null,
        companyName: plan.ownedByCompany?.name,
        isActive: plan.isActive,
    };
}

export const getPlansService = async (params?: {
    isActive?: boolean;
    projectId?: string | null;
}): Promise<ApiResponse<PlanCatalogItem[]>> => {
    const response = await apiInstance.get<ApiResponse<ApiPlanRecord[]>>(getApiUrl('getPlans'), {
        params: {
            ...(params?.isActive !== undefined ? { isActive: String(params.isActive) } : {}),
            ...(params?.projectId !== undefined ? { projectId: params.projectId === null ? 'null' : params.projectId } : {}),
        },
    });
    const body = response.data;
    const rows = unwrapListPayload<ApiPlanRecord>(body.data);
    return {
        ...body,
        data: rows.map(mapApiPlanToCatalogItem),
    };
};
