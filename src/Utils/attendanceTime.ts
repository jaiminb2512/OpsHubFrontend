const pad = (value: number) => String(value).padStart(2, '0');

export const utcToLocalTimeInput = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatUtcToLocalTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const localDateTimeToUtcIso = (dateStr: string, timeStr?: string | null) => {
    if (!dateStr || !timeStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    if ([year, month, day, hours, minutes].some(Number.isNaN)) return null;
    return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
};
