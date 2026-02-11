// src/modules/issues/issueUtils.js
// Utility functions for issue components

import { RESOLVED_STATUSES, MAX_DESCRIPTION_LENGTH } from './constants';

/**
 * Check if a status indicates the issue is resolved
 * @param {string} status - The issue status to check
 * @returns {boolean} True if status is in resolved states
 */
export const isResolvedStatus = (status) => {
    return RESOLVED_STATUSES.includes(status);
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text or em dash if empty
 */
export const truncateText = (text, maxLength = MAX_DESCRIPTION_LENGTH) => {
    if (!text) return '—';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}…`;
};

/**
 * Extract navigation flow data from issue object
 * Handles both array format and object with .flow property
 * @param {Array|Object} navigationFlow - Navigation flow data
 * @returns {Array|null} Flow array or null if invalid
 */
export const getNavigationFlow = (navigationFlow) => {
    if (!navigationFlow) return null;
    return Array.isArray(navigationFlow) ? navigationFlow : navigationFlow.flow;
};

/**
 * Safely parse date string and return valid Date object
 * Returns epoch date (1970-01-01) for invalid dates to maintain sort order
 * @param {string} dateString - ISO date string
 * @returns {Date} Valid Date object
 */
export const getSafeDate = (dateString) => {
    if (!dateString) return new Date(0);
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date(0) : date;
};

/**
 * Get safe timestamp for sorting operations
 * @param {string} dateString - ISO date string
 * @returns {number} Unix timestamp in milliseconds
 */
export const getSafeTimestamp = (dateString) => {
    return getSafeDate(dateString).getTime();
};

/**
 * Filter issues by status type
 * Centralizes filter logic used in multiple components
 * @param {Array} issues - Array of issues to filter
 * @param {string} filter - Filter type ('all', 'Open', 'Fixed', 'Closed', etc.)
 * @returns {Array} Filtered issues
 */
export const filterIssuesByStatus = (issues, filter) => {
    if (filter === 'all') return issues;

    if (filter === 'Open') {
        return issues.filter(i => i.status === 'Open' || i.status === 'New');
    }

    if (filter === 'Fixed') {
        return issues.filter(i => i.status === 'Fixed');
    }

    if (filter === 'Closed') {
        return issues.filter(i => i.status === 'Closed');
    }

    // Default: exact match
    return issues.filter(i => i.status === filter);
};
