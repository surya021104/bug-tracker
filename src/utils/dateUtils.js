/**
 * Centralized date/time formatting utilities for the bug tracker
 * Ensures consistent date display across all components
 * All dates displayed in IST (Asia/Kolkata) timezone
 */

const TIMEZONE = 'Asia/Kolkata';
const LOCALE = 'en-IN';

/**
 * Format ISO timestamp to human-readable date and time
 * Example: "10 Feb 2026, 10:08 AM"
 */
export const formatDateTime = (isoString) => {
    if (!isoString) return "—";

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Invalid date";

        return date.toLocaleString(LOCALE, {
            timeZone: TIMEZONE,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Date formatting error:', error, isoString);
        return "Invalid date";
    }
};

/**
 * Format ISO timestamp to date only
 * Example: "10 Feb 2026"
 */
export const formatDateOnly = (isoString) => {
    if (!isoString) return "—";

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Invalid date";

        return date.toLocaleString(LOCALE, {
            timeZone: TIMEZONE,
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error, isoString);
        return "Invalid date";
    }
};

/**
 * Format ISO timestamp to time only
 * Example: "10:08 AM"
 */
export const formatTimeOnly = (isoString) => {
    if (!isoString) return "—";

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Invalid time";

        return date.toLocaleString(LOCALE, {
            timeZone: TIMEZONE,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Time formatting error:', error, isoString);
        return "Invalid time";
    }
};

/**
 * Format ISO timestamp to short date + time (for cards)
 * Example: "Feb 10, 10:08 AM"
 */
export const formatShortDateTime = (isoString) => {
    if (!isoString) return "";

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "";

        return date.toLocaleString(LOCALE, {
            timeZone: TIMEZONE,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        return "";
    }
};

/**
 * Format for chart axis labels
 * Example: "Feb 10"
 */
export const formatChartDate = (isoString) => {
    if (!isoString) return "";

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "";

        return date.toLocaleString(LOCALE, {
            timeZone: TIMEZONE,
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return "";
    }
};

/**
 * Get relative time from ISO timestamp
 * Example: "2 hours ago", "Just now", "Yesterday"
 */
export const getRelativeTime = (isoString) => {
    if (!isoString) return "—";

    try {
        const now = new Date();
        const date = new Date(isoString);

        if (isNaN(date.getTime())) return "—";

        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 10) return "Just now";
        if (diffSecs < 60) return `${diffSecs}s ago`;
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
        return `${Math.floor(diffDays / 365)}y ago`;
    } catch (error) {
        console.error('Relative time error:', error, isoString);
        return "—";
    }
};

/**
 * Check if ISO timestamp is today (IST)
 */
export const isToday = (isoString) => {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const today = new Date();

        // Compare in IST by formatting both
        const dateStr = date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
        const todayStr = today.toLocaleDateString(LOCALE, { timeZone: TIMEZONE });

        return dateStr === todayStr;
    } catch (error) {
        return false;
    }
};

/**
 * Check if ISO timestamp is within the current week (IST)
 */
export const isThisWeek = (isoString) => {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const now = new Date();

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        return date >= weekStart && date < weekEnd;
    } catch (error) {
        return false;
    }
};

/**
 * Format full date for accessibility (ARIA labels)
 * Example: "Monday, 10 February 2026 at 10:08 AM"
 */
export const formatFullDate = (isoString) => {
    if (!isoString) return "No date";

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Invalid date";

        return date.toLocaleString(LOCALE, {
            timeZone: TIMEZONE,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        return "Invalid date";
    }
};

/**
 * Get current timestamp in ISO format
 * Always uses the system clock (which reflects actual local time)
 */
export const nowISO = () => new Date().toISOString();
