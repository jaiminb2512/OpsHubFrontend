import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export type AssetType = 'image' | 'video' | 'document' | 'audio' | 'other';
export type AssetAccessType = 'public' | 'private';

export interface AssetItem {
    assetId: string;
    assetType: AssetType;
    accessType: AssetAccessType;
    mimeType: string | null;
    fileName: string | null;
    sizeBytes: number | null;
    provider: string | null;
    entityType: string | null;
    entityId: string | null;
    projectId?: string | null;
    isActive?: boolean;
    createdAt: string;
    uploadedBy?: { userId: string; fullName: string } | null;
    url?: string; // only for public assets
}

export interface SignedUrlResponse {
    assetId: string;
    signedUrl: string;
    expiresInSeconds: number;
    expiresAt: string;
}

export interface UploadAssetParams {
    file: File;
    accessType?: AssetAccessType;
    entityType?: string;
    entityId?: string;
    projectId?: string;
}

/**
 * Upload a single file (image, video, document, audio, etc.)
 * Provider is decided by OpsHub — do NOT pass imageProvider from frontend
 */
export const uploadAssetService = async (
    params: UploadAssetParams
): Promise<ApiResponse<AssetItem>> => {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.accessType) formData.append('accessType', params.accessType);
    if (params.entityType) formData.append('entityType', params.entityType);
    if (params.entityId) formData.append('entityId', params.entityId);
    if (params.projectId) formData.append('projectId', params.projectId);

    const response = await apiInstance.post<ApiResponse<AssetItem>>(
        getApiUrl('uploadAsset'),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

/**
 * List assets with optional filters
 */
export const listAssetsService = async (params?: {
    assetType?: AssetType;
    accessType?: AssetAccessType;
    entityType?: string;
    entityId?: string;
    projectId?: string;
}): Promise<ApiResponse<AssetItem[]>> => {
    const response = await apiInstance.get<ApiResponse<AssetItem[]>>(
        getApiUrl('listAssets'),
        { params }
    );
    return response.data;
};

/**
 * Get asset metadata by ID
 */
export const getAssetService = async (id: string): Promise<ApiResponse<AssetItem>> => {
    const response = await apiInstance.get<ApiResponse<AssetItem>>(
        getApiUrl('getAsset', { id })
    );
    return response.data;
};

/**
 * Get a time-limited signed URL for a private asset
 */
export const getAssetSignedUrlService = async (
    id: string
): Promise<ApiResponse<SignedUrlResponse>> => {
    const response = await apiInstance.get<ApiResponse<SignedUrlResponse>>(
        getApiUrl('getAssetSignedUrl', { id })
    );
    return response.data;
};

/**
 * Soft-delete an asset record
 */
export const deleteAssetService = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiInstance.delete<ApiResponse<null>>(
        getApiUrl('deleteAsset', { id })
    );
    return response.data;
};

export type AnalyticsGroupBy = 'project' | 'provider' | 'account' | 'apiKey' | 'assetType' | 'action' | 'status';

export interface AnalyticsRow {
    projectId?: string | null;
    providerId?: string | null;
    providerAccountId?: string | null;
    apiKeyId?: string | null;
    assetType?: string | null;
    action?: string | null;
    status?: string | null;
    totalEvents: number;
    totalSizeBytes: number;
}

export interface AnalyticsFilters {
    groupBy?: AnalyticsGroupBy[];
    from?: string;
    to?: string;
    projectId?: string;
    providerId?: string;
    providerAccountId?: string;
    apiKeyId?: string;
}

/**
 * Asset usage analytics — group by any combination of dimensions
 */
export const getAssetUsageAnalyticsService = async (
    filters: AnalyticsFilters
): Promise<ApiResponse<AnalyticsRow[]>> => {
    const params: Record<string, string> = {};
    if (filters.groupBy?.length) params.groupBy = filters.groupBy.join(',');
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.projectId) params.projectId = filters.projectId;
    if (filters.providerId) params.providerId = filters.providerId;
    if (filters.providerAccountId) params.providerAccountId = filters.providerAccountId;
    if (filters.apiKeyId) params.apiKeyId = filters.apiKeyId;

    const response = await apiInstance.get<ApiResponse<AnalyticsRow[]>>(
        getApiUrl('getAssetUsageAnalytics'),
        { params }
    );
    return response.data;
};
