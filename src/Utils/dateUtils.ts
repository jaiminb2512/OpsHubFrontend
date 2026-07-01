/**
 * Formats a date string or Date object to 'DD/MM/YYYY' format.
 * @param date - The date to format (string or Date object).
 * @returns The formatted date string.
 */
export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Formats a date string or Date object to 'DD/MM/YYYY HH:MM AM/PM' format.
 * @param date - The date to format (string or Date object).
 * @returns The formatted date time string.
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const datePart = formatDate(d);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${datePart} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};
