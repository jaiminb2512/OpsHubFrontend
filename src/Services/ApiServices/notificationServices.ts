import apiInstance from '../../Utils/ApiUtils';
import { getApiUrl } from '../../Utils/api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export const getMyNotificationsService = async (
    page?: number,
    limit?: number,
    unreadOnly?: boolean,
): Promise<unknown> => {
    const res = await apiInstance.get(getApiUrl('getNotifications'), {
        params: { page, limit, unreadOnly },
    });
    return res.data;
};

export const markNotificationAsReadService = async (id: string): Promise<void> => {
    await apiInstance.patch(getApiUrl('markNotificationRead', { id }));
};

export const markNotificationAsUnreadService = async (id: string): Promise<void> => {
    await apiInstance.patch(getApiUrl('markNotificationUnread', { id }));
};

export const markAllNotificationsAsReadService = async (): Promise<void> => {
    await apiInstance.patch(getApiUrl('markAllNotificationsRead'));
};
