// ============================================
// COMMON API TYPES
// ============================================

/**
 * Common pagination metadata interface used across all paginated responses
 */
export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

