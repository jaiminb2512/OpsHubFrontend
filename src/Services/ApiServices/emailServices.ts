import apiInstance from '../../Utils/ApiUtils';
import type { ApiResponse } from '../../Utils/ApiUtils';

const BASE = import.meta.env.VITE_NODEJS_BASE_URL;

const emailUrl = (projectId: string, tail = '') =>
    `${BASE}/projects/${projectId}/email${tail}`;

// ── Types ──────────────────────────────────────────────────────────────────────

export type EmailStatus = 'pending' | 'sent' | 'failed';
export type EmailBodyType = 'html' | 'text';

export type EmailAttachment = {
    filename: string;
    content: string;       // Base64 string for v1
    contentType?: string;
};

export type SendEmailPayload = {
    to: string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: EmailAttachment[];
    entityType?: string;
    entityId?: string;
};

export type EmailLog = {
    id: string;
    projectId: string;
    providerName: string;
    providerLabel: string;
    providerMessageId: string | null;
    to: string[];
    cc: string[];
    bcc: string[];
    from: string;
    replyTo: string | null;
    subject: string;
    bodyType: EmailBodyType;
    hasAttachments: boolean;
    status: EmailStatus;
    errorMessage: string | null;
    sentAt: string | null;
    entityType: string | null;
    entityId: string | null;
    createdBy: string | null;
    createdAt: string;
};

export type SendEmailResult = {
    logId: string;
    messageId: string;
    status: EmailStatus;
};

// ── Services ───────────────────────────────────────────────────────────────────

export const sendEmailService = async (
    projectId: string,
    payload: SendEmailPayload
): Promise<ApiResponse<SendEmailResult>> => {
    const res = await apiInstance.post<ApiResponse<SendEmailResult>>(
        emailUrl(projectId, '/send'),
        payload
    );
    return res.data;
};

export const getEmailLogsService = async (
    projectId: string,
    params?: { status?: EmailStatus; page?: number; limit?: number }
): Promise<ApiResponse<EmailLog[]>> => {
    const res = await apiInstance.get<ApiResponse<EmailLog[]>>(
        emailUrl(projectId, '/logs'),
        { params }
    );
    return res.data;
};

export const getEmailLogByIdService = async (
    projectId: string,
    logId: string
): Promise<ApiResponse<EmailLog>> => {
    const res = await apiInstance.get<ApiResponse<EmailLog>>(
        emailUrl(projectId, `/logs/${logId}`)
    );
    return res.data;
};
