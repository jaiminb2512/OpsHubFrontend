// ─────────────────────────────────────────────────────────────────────────────
// Time zone utility — single source of truth for all time handling
//
// Rule: DB always stores UTC. Browser works in local time.
//   - Before sending to API  → convert local → UTC  (localToUtcIso)
//   - After receiving from API → convert UTC → local  (utcToLocal*)
// ─────────────────────────────────────────────────────────────────────────────

const pad = (value: number): string => String(value).padStart(2, '0');

// ── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns today's date as a YYYY-MM-DD string in the user's LOCAL timezone.
 * Never use `new Date().toISOString().slice(0,10)` — that returns UTC date,
 * which can be yesterday or tomorrow depending on the user's timezone.
 */
export const toLocalDateString = (date: Date = new Date()): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// ── local → UTC (before sending to API) ──────────────────────────────────────

/**
 * Converts a local date + local time string (HH:MM) to a UTC ISO string.
 * Uses the browser's own timezone via the Date constructor.
 *
 * @param dateStr  - Local date, e.g. "2026-07-03"
 * @param timeStr  - Local time from <input type="time">, e.g. "09:30"
 * @returns UTC ISO string like "2026-07-03T04:00:00.000Z", or null if invalid
 */
export const localDateTimeToUtcIso = (dateStr: string, timeStr: string): string | null => {
    if (!dateStr || !timeStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    if ([year, month, day, hours, minutes].some(Number.isNaN)) return null;
    // new Date(y, m-1, d, h, min) interprets as LOCAL time → .toISOString() converts to UTC
    return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
};

/**
 * Returns the current local time as HH:MM for use as the default value
 * in <input type="time">. Uses local clock, not UTC.
 */
export const currentLocalTimeInput = (): string => {
    const date = new Date();
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ── UTC → local (after receiving from API) ────────────────────────────────────

/**
 * Converts a UTC ISO string from the API into HH:MM in the user's LOCAL timezone.
 * Use this to populate <input type="time"> with an existing check-in/check-out value.
 *
 * @param utcValue - ISO string from DB, e.g. "2026-07-03T04:00:00.000Z"
 * @returns "09:30" in local time, or "" if invalid/null
 */
export const utcToLocalTimeInput = (utcValue: string | null | undefined): string => {
    if (!utcValue) return '';
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) return '';
    // .getHours() / .getMinutes() return LOCAL time automatically
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Converts a UTC ISO string from the API into a human-readable local time string.
 * Use this for display only (tooltips, table cells, labels).
 *
 * @param utcValue - ISO string from DB
 * @returns e.g. "09:30 AM" in local time, or ""
 */
export const formatUtcToLocalTime = (utcValue: string | null | undefined): string => {
    if (!utcValue) return '';
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Converts a UTC ISO string into a full local date+time display string.
 * e.g. "03/07/2026 09:30 AM"
 */
export const formatUtcToLocalDateTime = (utcValue: string | null | undefined): string => {
    if (!utcValue) return '';
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) return '';
    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = date.getFullYear();
    return `${d}/${m}/${y} ${formatUtcToLocalTime(utcValue)}`;
};

/**
 * Converts a UTC ISO string to a YYYY-MM-DD date string in LOCAL timezone.
 * Useful when you need to compare or display the date part only.
 *
 * @returns e.g. "2026-07-03", or ""
 */
export const utcToLocalDateString = (utcValue: string | null | undefined): string => {
    if (!utcValue) return '';
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) return '';
    return toLocalDateString(date);
};
