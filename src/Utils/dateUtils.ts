// Date formatting utilities — display only, no timezone conversion needed here.
// For time conversion (UTC ↔ local) use timeUtils.ts

/**
 * Formats a UTC date value to 'DD/MM/YYYY' in the user's LOCAL timezone.
 */
export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
};

/**
 * Formats a UTC date value to 'DD/MM/YYYY HH:MM AM/PM' in the user's LOCAL timezone.
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    const datePart = formatDate(d);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${datePart} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

// Re-export time utilities so callers only need one import
export {
    toLocalDateString,
    localDateTimeToUtcIso,
    currentLocalTimeInput,
    utcToLocalTimeInput,
    formatUtcToLocalTime,
    formatUtcToLocalDateTime,
    utcToLocalDateString,
} from './timeUtils';
