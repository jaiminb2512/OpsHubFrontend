import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

// Type Definitions
export interface Notification {
    id: string;
    title: string;
    message: string;
    link?: string;
    type: 'info' | 'success' | 'warning' | 'error';
    targetType: 'user' | 'role' | 'everyone';
    targetId?: string;
    isRead: boolean; // Computed from recipient record in backend
    receivedAt: string;
    createdAt: string;
}

export interface NotificationsPaginatedData {
    notifications: Notification[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
    };
}

// Get My Notifications
export const getMyNotificationsService = async (page = 1, limit = 10, unreadOnly = false): Promise<ApiResponse<NotificationsPaginatedData>> => {
    const response = await apiInstance.get<ApiResponse<NotificationsPaginatedData>>(
        getApiUrl('getNotifications'),
        { params: { page, limit, unreadOnly } }
    );
    return response.data;
};

// Mark as Read
export const markNotificationAsReadService = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiInstance.patch<ApiResponse<null>>(
        getApiUrl('markNotificationRead', { id })
    );
    return response.data;
};

// Mark as Unread
export const markNotificationAsUnreadService = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiInstance.patch<ApiResponse<null>>(
        getApiUrl('markNotificationUnread', { id })
    );
    return response.data;
};


// Mark All as Read
export const markAllNotificationsAsReadService = async (): Promise<ApiResponse<null>> => {
    const response = await apiInstance.patch<ApiResponse<null>>(
        getApiUrl('markAllNotificationsRead')
    );
    return response.data;
};

// Delete Notification
export const deleteNotificationService = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiInstance.delete<ApiResponse<null>>(
        getApiUrl('deleteNotification', { id })
    );
    return response.data;
};

// Create Notification (Manual)
export interface CreateNotificationPayload {
    targetType: 'user' | 'role' | 'everyone';
    targetId?: string; // roleId if targetType is role
    recipientIds?: string[]; // userIds if targetType is user
    title: string;
    message: string;
    link?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}

export const createNotificationService = async (data: CreateNotificationPayload): Promise<ApiResponse<Notification>> => {
    const response = await apiInstance.post<ApiResponse<Notification>>(
        getApiUrl('createNotification'),
        data
    );
    return response.data;
};
